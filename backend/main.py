import os
import re
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import Cookie, Depends, FastAPI, File, Header, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
import pyotp

from cms import audit, get_or_create_site_content, revision
from database import BASE_DIR, get_db
from media import process_image
from models import (
    AuditLog,
    Category,
    Collection,
    ContentRevision,
    MediaAsset,
    Order,
    OrderItem as OrderItemModel,
    Product,
    SiteContent,
    User,
)
from security import create_session, delete_session, get_session_user, hash_password, verify_password
from seed import seed
from payments import (
    PaymentProviderError,
    create_checkout,
    get_payment,
    mercado_pago_configured,
    verify_webhook_signature,
)


UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
}
LOGIN_ATTEMPTS = defaultdict(deque)
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_ATTEMPTS = 5

app = FastAPI(title="Casa Mamulengo API", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.url.path.startswith(("/api/admin", "/api/auth")):
        response.headers["Cache-Control"] = "no-store"
    return response


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    otp: str = Field(default="", max_length=8)


class CategoryRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str = Field(default="", max_length=500)


class ProductRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category_id: int
    collection: str = Field(default="", max_length=100)
    price: Decimal = Field(gt=0, decimal_places=2)
    installments: int = Field(default=1, ge=1, le=12)
    material: str = Field(default="", max_length=100)
    dimensions: str = Field(default="", max_length=100)
    description: str = Field(default="", max_length=1500)
    image: str = Field(default="", max_length=500)
    tag: str = Field(default="", max_length=80)
    featured: bool = False
    active: bool = True
    stock: int = Field(default=0, ge=0)
    track_stock: bool = False


class SiteContentRequest(BaseModel):
    data: dict


class RestoreRequest(BaseModel):
    revision_id: int


class TwoFactorRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)


class UserRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str
    password: str = Field(min_length=12)
    role: Literal["admin", "editor"]


class CollectionRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=1000)
    image: str = Field(default="", max_length=500)
    featured: bool = False
    active: bool = True


class ShippingRequest(BaseModel):
    cep: str = Field(min_length=8, max_length=9)
    subtotal: Decimal = Field(gt=0)


class OrderItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=10)


class Customer(BaseModel):
    name: str = Field(min_length=3)
    email: str
    phone: str = Field(min_length=8)
    address: str = Field(default="", max_length=255)
    city: str = Field(default="", max_length=120)
    state: str = Field(default="", max_length=2)
    cep: str = Field(default="", max_length=9)


class OrderRequest(BaseModel):
    items: list[OrderItemRequest]
    customer: Customer
    payment_method: Literal["mercado_pago"]
    shipping_service: Literal["retirada", "economico", "expresso"]

    @model_validator(mode="after")
    def validate_delivery_address(self):
        if self.shipping_service != "retirada":
            digits = "".join(filter(str.isdigit, self.customer.cep))
            if (
                len(digits) != 8
                or len(self.customer.address.strip()) < 5
                or len(self.customer.city.strip()) < 2
                or len(self.customer.state.strip()) != 2
            ):
                raise ValueError("Preencha o endereço completo para entrega")
        return self


class OrderStatusRequest(BaseModel):
    status: Literal["confirmed", "preparing", "shipped", "completed", "cancelled"]


def validate_admin_origin(request: Request):
    origin = request.headers.get("origin")
    if request.method not in {"GET", "HEAD", "OPTIONS"} and origin and origin not in ALLOWED_ORIGINS:
        raise HTTPException(status_code=403, detail="Origem da requisição não autorizada")


def require_admin(
    request: Request,
    session: str | None = Cookie(default=None),
    database: Session = Depends(get_db),
) -> User:
    validate_admin_origin(request)
    user = get_session_user(database, session)
    if not user or user.role != "admin":
        raise HTTPException(status_code=401, detail="Acesso administrativo necessário")
    return user


def require_staff(
    request: Request,
    session: str | None = Cookie(default=None),
    database: Session = Depends(get_db),
) -> User:
    validate_admin_origin(request)
    user = get_session_user(database, session)
    if not user or user.role not in {"admin", "editor"}:
        raise HTTPException(status_code=401, detail="Acesso ao painel necessário")
    return user


def serialize_user(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "two_factor_enabled": user.two_factor_enabled,
    }


def serialize_product(product: Product):
    return {
        "id": product.id,
        "name": product.name,
        "category_id": product.category_id,
        "category": product.category.name,
        "collection": product.collection,
        "price": float(product.price),
        "installments": product.installments,
        "material": product.material,
        "dimensions": product.dimensions,
        "description": product.description,
        "image": product.image,
        "tag": product.tag,
        "featured": product.featured,
        "active": product.active,
        "stock": product.stock,
        "track_stock": product.track_stock,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


def apply_product_data(product: Product, payload: ProductRequest):
    for field, value in payload.model_dump().items():
        setattr(product, field, value)


def reject_html(value):
    if isinstance(value, dict):
        return {key: reject_html(item) for key, item in value.items()}
    if isinstance(value, list):
        return [reject_html(item) for item in value]
    if isinstance(value, str) and re.search(r"<[^>]+>", value):
        raise HTTPException(status_code=400, detail="HTML não é permitido nos campos de conteúdo")
    return value


def shipping_options(cep: str, subtotal: Decimal):
    digits = "".join(filter(str.isdigit, cep))
    if len(digits) != 8:
        raise HTTPException(status_code=400, detail="CEP inválido")
    base = Decimal("18.90") + Decimal(digits[0]) * Decimal("1.75")
    return {
        "economico": {
            "id": "economico",
            "name": "Entrega econômica",
            "days": "7 a 11 dias úteis",
            "price": Decimal("0") if subtotal >= Decimal("450") else base,
        },
        "expresso": {
            "id": "expresso",
            "name": "Entrega expressa",
            "days": "3 a 5 dias úteis",
            "price": base + Decimal("19.90"),
        },
    }


def release_order_stock(order: Order):
    if order.stock_released:
        return
    for item in order.items:
        if item.product and item.product.track_stock:
            item.product.stock += item.quantity
    order.stock_released = True


def serialize_order(order: Order, include_private=False):
    result = {
        "code": order.code,
        "status": order.status,
        "payment_status": order.payment_status,
        "payment_method": order.payment_method,
        "shipping_service": order.shipping_service,
        "subtotal": float(order.subtotal),
        "shipping_price": float(order.shipping_price),
        "total": float(order.total),
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product_name,
                "unit_price": float(item.unit_price),
                "quantity": item.quantity,
            }
            for item in order.items
        ],
    }
    if include_private:
        result.update(
            {
                "id": order.id,
                "customer_name": order.customer_name,
                "customer_email": order.customer_email,
                "customer_phone": order.customer_phone,
                "address": order.address,
                "city": order.city,
                "state": order.state,
                "cep": order.cep,
                "payment_provider": order.payment_provider,
                "payment_reference": order.payment_reference,
            }
        )
    return result


def validate_production_config():
    if os.getenv("APP_ENV", "development").lower() != "production":
        return
    required = ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "MERCADO_PAGO_ACCESS_TOKEN"]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError(f"Variáveis obrigatórias ausentes em produção: {', '.join(missing)}")
    if os.getenv("ADMIN_PASSWORD") == "Mamulengo@2026":
        raise RuntimeError("A senha administrativa padrão não pode ser usada em produção")
    if os.getenv("COOKIE_SECURE", "false").lower() != "true":
        raise RuntimeError("COOKIE_SECURE deve ser true em produção")
    if any("localhost" in origin or "127.0.0.1" in origin for origin in ALLOWED_ORIGINS):
        raise RuntimeError("ALLOWED_ORIGINS deve conter apenas os domínios públicos em produção")


@app.on_event("startup")
def startup():
    validate_production_config()
    seed()


@app.get("/api/health")
def health(database: Session = Depends(get_db)):
    database.execute(text("SELECT 1"))
    return {"status": "ok", "database": "postgresql"}


@app.post("/api/auth/login")
def login(
    credentials: LoginRequest,
    request: Request,
    response: Response,
    database: Session = Depends(get_db),
):
    client = request.client.host if request.client else "unknown"
    attempt_key = f"{client}:{credentials.email.lower().strip()}"
    attempts = LOGIN_ATTEMPTS[attempt_key]
    now = time.monotonic()
    while attempts and now - attempts[0] > LOGIN_WINDOW_SECONDS:
        attempts.popleft()
    if len(attempts) >= LOGIN_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.",
            headers={"Retry-After": str(LOGIN_WINDOW_SECONDS)},
        )
    user = database.scalar(
        select(User).where(func.lower(User.email) == credentials.email.lower().strip())
    )
    if not user or not verify_password(credentials.password, user.password_hash):
        attempts.append(now)
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    if user.two_factor_enabled:
        if not credentials.otp:
            raise HTTPException(status_code=428, detail="Código de autenticação necessário")
        if not pyotp.TOTP(user.totp_secret).verify(credentials.otp, valid_window=1):
            attempts.append(now)
            raise HTTPException(status_code=401, detail="Código de autenticação inválido")
    LOGIN_ATTEMPTS.pop(attempt_key, None)
    token = create_session(database, user.id)
    response.set_cookie(
        "session",
        token,
        httponly=True,
        samesite="lax",
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        max_age=43_200,
        path="/",
    )
    return serialize_user(user)


@app.get("/api/auth/me")
def current_user(user: User = Depends(require_staff)):
    return serialize_user(user)


@app.post("/api/auth/logout", status_code=204)
def logout(
    response: Response,
    session: str | None = Cookie(default=None),
    database: Session = Depends(get_db),
):
    delete_session(database, session)
    response.delete_cookie("session", path="/")


@app.get("/api/products")
def list_products(
    category: str | None = None,
    featured: bool | None = None,
    database: Session = Depends(get_db),
):
    statement = (
        select(Product)
        .options(joinedload(Product.category))
        .where(Product.active.is_(True))
        .order_by(Product.id.desc())
    )
    if category and category != "Todas":
        statement = statement.join(Product.category).where(
            func.lower(Category.name) == category.lower()
        )
    if featured is not None:
        statement = statement.where(Product.featured.is_(featured))
    return [serialize_product(product) for product in database.scalars(statement).all()]


@app.get("/api/categories")
def list_categories(database: Session = Depends(get_db)):
    statement = (
        select(
            Category.id,
            Category.name,
            Category.description,
            Category.created_at,
            func.count(Product.id).filter(Product.active.is_(True)).label("count"),
        )
        .outerjoin(Product)
        .group_by(Category.id)
        .order_by(Category.name)
    )
    return [dict(row._mapping) for row in database.execute(statement).all()]


@app.get("/api/admin/products")
def admin_products(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    products = database.scalars(
        select(Product).options(joinedload(Product.category)).order_by(Product.id.desc())
    ).all()
    return [serialize_product(product) for product in products]


@app.post("/api/admin/products", status_code=201)
def create_product(
    payload: ProductRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    payload = ProductRequest(**reject_html(payload.model_dump()))
    if not database.get(Category, payload.category_id):
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    product = Product()
    apply_product_data(product, payload)
    database.add(product)
    audit(database, user, "create", "product", "new", {"name": payload.name})
    database.commit()
    database.refresh(product)
    return {"id": product.id, "message": "Produto criado"}


@app.put("/api/admin/products/{product_id}")
def update_product(
    product_id: int,
    payload: ProductRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    payload = ProductRequest(**reject_html(payload.model_dump()))
    product = database.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    if not database.get(Category, payload.category_id):
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    apply_product_data(product, payload)
    audit(database, user, "update", "product", product.id, {"name": payload.name})
    database.commit()
    return {"message": "Produto atualizado"}


@app.delete("/api/admin/products/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    product = database.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    image = product.image
    audit(database, user, "delete", "product", product.id, {"name": product.name})
    database.delete(product)
    database.commit()
    if image.startswith("/uploads/"):
        (UPLOAD_DIR / Path(image).name).unlink(missing_ok=True)


@app.post("/api/admin/categories", status_code=201)
def create_category(
    payload: CategoryRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    payload = CategoryRequest(**reject_html(payload.model_dump()))
    category = Category(name=payload.name.strip(), description=payload.description.strip())
    database.add(category)
    audit(database, user, "create", "category", "new", {"name": payload.name})
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(status_code=409, detail="Essa categoria já existe")
    database.refresh(category)
    return {"id": category.id, "message": "Categoria criada"}


@app.delete("/api/admin/categories/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    category = database.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    if database.scalar(select(func.count(Product.id)).where(Product.category_id == category_id)):
        raise HTTPException(
            status_code=409, detail="Mova ou exclua os produtos desta categoria primeiro"
        )
    database.delete(category)
    audit(database, user, "delete", "category", category.id, {"name": category.name})
    database.commit()


@app.post("/api/admin/upload", status_code=201)
async def upload_image(
    image: UploadFile = File(...),
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    processed = process_image(image, UPLOAD_DIR)
    asset = MediaAsset(**processed, uploaded_by_id=user.id)
    database.add(asset)
    audit(database, user, "upload", "media", "new", {"name": processed["original_name"]})
    database.commit()
    database.refresh(asset)
    return {"id": asset.id, "url": asset.webp_url, **processed}


@app.get("/api/admin/orders")
def admin_orders(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    orders = database.scalars(
        select(Order).options(joinedload(Order.items)).order_by(Order.id.desc())
    ).unique().all()
    return [serialize_order(order, include_private=True) for order in orders]


@app.patch("/api/admin/orders/{order_id}")
def update_order_status(
    order_id: int,
    payload: OrderStatusRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    order = database.execute(
        select(Order).options(joinedload(Order.items).joinedload(OrderItemModel.product)).where(
            Order.id == order_id
        )
    ).unique().scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if order.status == "cancelled" and payload.status != "cancelled":
        raise HTTPException(
            status_code=409,
            detail="Pedidos cancelados não podem ser reabertos; crie um novo pedido",
        )
    if payload.status == "cancelled":
        release_order_stock(order)
        if order.payment_status == "pending":
            order.payment_status = "cancelled"
    order.status = payload.status
    audit(database, user, "update_status", "order", order.id, {"status": payload.status})
    database.commit()
    return serialize_order(order, include_private=True)


@app.get("/api/site-content")
def public_site_content(database: Session = Depends(get_db)):
    return get_or_create_site_content(database).published_data


@app.get("/api/admin/content")
def admin_content(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    content = get_or_create_site_content(database)
    return {
        "data": content.draft_data,
        "published_data": content.published_data,
        "status": content.status,
        "version": content.version,
        "updated_at": content.updated_at,
        "published_at": content.published_at,
    }


@app.get("/api/admin/content/preview")
def preview_content(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    return get_or_create_site_content(database).draft_data


@app.put("/api/admin/content")
def save_content_draft(
    payload: SiteContentRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    content = get_or_create_site_content(database)
    revision(database, content, user, "save_draft")
    content.version += 1
    content.draft_data = reject_html(payload.data)
    content.status = "draft"
    content.updated_by_id = user.id
    audit(database, user, "save_draft", "site_content", content.key, {"version": content.version})
    database.commit()
    return {"message": "Rascunho salvo", "version": content.version}


@app.post("/api/admin/content/publish")
def publish_content(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    content = get_or_create_site_content(database)
    revision(database, content, user, "publish")
    content.version += 1
    content.published_data = content.draft_data
    content.status = "published"
    content.updated_by_id = user.id
    content.published_at = datetime.now().astimezone()
    audit(database, user, "publish", "site_content", content.key, {"version": content.version})
    database.commit()
    return {"message": "Conteúdo publicado", "version": content.version}


@app.get("/api/admin/content/revisions")
def content_revisions(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    rows = database.scalars(
        select(ContentRevision).order_by(ContentRevision.id.desc()).limit(50)
    ).all()
    return [
        {
            "id": row.id,
            "version": row.version,
            "action": row.action,
            "user_id": row.user_id,
            "created_at": row.created_at,
        }
        for row in rows
    ]


@app.post("/api/admin/content/restore")
def restore_content(
    payload: RestoreRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    old = database.get(ContentRevision, payload.revision_id)
    if not old:
        raise HTTPException(status_code=404, detail="Versão não encontrada")
    content = get_or_create_site_content(database)
    revision(database, content, user, "before_restore")
    content.version += 1
    content.draft_data = old.data
    content.status = "draft"
    content.updated_by_id = user.id
    audit(database, user, "restore", "site_content", content.key, {"revision_id": old.id})
    database.commit()
    return {"message": "Versão restaurada como rascunho"}


@app.get("/api/admin/media")
def media_library(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    assets = database.scalars(select(MediaAsset).order_by(MediaAsset.id.desc())).all()
    return [
        {
            "id": asset.id,
            "original_name": asset.original_name,
            "url": asset.webp_url,
            "avif_url": asset.avif_url,
            "width": asset.width,
            "height": asset.height,
            "size_bytes": asset.size_bytes,
            "created_at": asset.created_at,
        }
        for asset in assets
    ]


@app.get("/api/admin/audit")
def audit_logs(
    user: User = Depends(require_admin),
    database: Session = Depends(get_db),
):
    logs = database.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(100)).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@app.get("/api/admin/collections")
def list_collections(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    return [
        {
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "image": item.image,
            "featured": item.featured,
            "active": item.active,
        }
        for item in database.scalars(select(Collection).order_by(Collection.name)).all()
    ]


@app.post("/api/admin/collections", status_code=201)
def create_collection(
    payload: CollectionRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    payload = CollectionRequest(**reject_html(payload.model_dump()))
    collection = Collection(**payload.model_dump())
    database.add(collection)
    audit(database, user, "create", "collection", "new", {"name": payload.name})
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(status_code=409, detail="Essa coleção já existe")
    return {"id": collection.id}


@app.put("/api/admin/collections/{collection_id}")
def update_collection(
    collection_id: int,
    payload: CollectionRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    collection = database.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Coleção não encontrada")
    payload = CollectionRequest(**reject_html(payload.model_dump()))
    for field, value in payload.model_dump().items():
        setattr(collection, field, value)
    audit(database, user, "update", "collection", collection.id, {"name": collection.name})
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(status_code=409, detail="Essa coleção já existe")
    return {"message": "Coleção atualizada"}


@app.get("/api/admin/users")
def list_users(
    user: User = Depends(require_admin),
    database: Session = Depends(get_db),
):
    return [serialize_user(item) for item in database.scalars(select(User).order_by(User.id)).all()]


@app.post("/api/admin/users", status_code=201)
def create_user(
    payload: UserRequest,
    user: User = Depends(require_admin),
    database: Session = Depends(get_db),
):
    if not re.search(r"[A-Z]", payload.password) or not re.search(r"\d", payload.password):
        raise HTTPException(
            status_code=400,
            detail="A senha precisa ter ao menos 12 caracteres, uma maiúscula e um número",
        )
    created = User(
        name=payload.name,
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    database.add(created)
    audit(database, user, "create", "user", "new", {"email": created.email, "role": created.role})
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(status_code=409, detail="Esse e-mail já está cadastrado")
    return {"id": created.id}


@app.post("/api/auth/2fa/setup")
def setup_two_factor(
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    secret = pyotp.random_base32()
    user.totp_secret = secret
    user.two_factor_enabled = False
    database.commit()
    return {
        "secret": secret,
        "otpauth_url": pyotp.TOTP(secret).provisioning_uri(
            name=user.email, issuer_name="Casa Mamulengo"
        ),
    }


@app.post("/api/auth/2fa/enable")
def enable_two_factor(
    payload: TwoFactorRequest,
    user: User = Depends(require_staff),
    database: Session = Depends(get_db),
):
    if not user.totp_secret or not pyotp.TOTP(user.totp_secret).verify(payload.code):
        raise HTTPException(status_code=400, detail="Código inválido")
    user.two_factor_enabled = True
    audit(database, user, "enable_2fa", "user", user.id)
    database.commit()
    return {"message": "Autenticação em duas etapas ativada"}


@app.post("/api/shipping")
def calculate_shipping(request: ShippingRequest):
    options = shipping_options(request.cep, request.subtotal)
    return {
        "destination": "Brasil",
        "options": [{**option, "price": float(option["price"])} for option in options.values()],
    }


@app.get("/api/checkout/config")
def checkout_config():
    return {
        "provider": "mercado_pago",
        "configured": mercado_pago_configured(),
        "message": (
            "Pagamento online disponível"
            if mercado_pago_configured()
            else "Ambiente local: pedido será criado aguardando configuração do Mercado Pago"
        ),
    }


@app.post("/api/orders", status_code=201)
def create_order(payload: OrderRequest, database: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="O carrinho está vazio")

    requested_quantities = {}
    for item in payload.items:
        requested_quantities[item.product_id] = (
            requested_quantities.get(item.product_id, 0) + item.quantity
        )
    product_ids = list(requested_quantities)
    products = database.scalars(
        select(Product)
        .where(Product.id.in_(product_ids), Product.active.is_(True))
        .with_for_update()
    ).all()
    product_map = {product.id: product for product in products}
    subtotal = Decimal("0")
    for product_id, quantity in requested_quantities.items():
        product = product_map.get(product_id)
        if not product:
            raise HTTPException(
                status_code=404, detail=f"Produto {product_id} não encontrado"
            )
        subtotal += product.price * quantity
        if product.track_stock and product.stock < quantity:
            raise HTTPException(
                status_code=409, detail=f"Estoque insuficiente para {product.name}"
            )

    if payload.shipping_service == "retirada":
        content = get_or_create_site_content(database).published_data
        contact = content.get("contact", {})
        if not contact.get("pickup_enabled", True):
            raise HTTPException(status_code=409, detail="Retirada local indisponível")
        shipping_price = Decimal("0")
        address = contact.get("pickup_address") or contact.get("address") or "Retirada na loja"
        city = contact.get("pickup_city") or "Retirada local"
        state = (contact.get("pickup_state") or "PE").upper()[:2]
        cep = "".join(filter(str.isdigit, contact.get("pickup_cep", ""))) or "00000000"
    else:
        selected_shipping = shipping_options(payload.customer.cep, subtotal)[payload.shipping_service]
        shipping_price = selected_shipping["price"]
        address = payload.customer.address
        city = payload.customer.city
        state = payload.customer.state.upper()
        cep = payload.customer.cep
    order = Order(
        code=f"CM-{uuid4().hex[:8].upper()}",
        customer_name=payload.customer.name,
        customer_email=payload.customer.email,
        customer_phone=payload.customer.phone,
        address=address,
        city=city,
        state=state,
        cep=cep,
        payment_method=payload.payment_method,
        shipping_service=payload.shipping_service,
        subtotal=subtotal,
        shipping_price=shipping_price,
        total=subtotal + shipping_price,
        status="awaiting_payment",
        payment_status="pending",
        payment_provider="mercado_pago",
        public_token=secrets.token_urlsafe(32),
    )
    order.items = [
        OrderItemModel(
            product_id=product_id,
            product_name=product_map[product_id].name,
            unit_price=product_map[product_id].price,
            quantity=quantity,
        )
        for product_id, quantity in requested_quantities.items()
    ]
    database.add(order)
    for product_id, quantity in requested_quantities.items():
        product = product_map[product_id]
        if product.track_stock:
            product.stock -= quantity
    database.commit()
    database.refresh(order)
    payment_error = ""
    if mercado_pago_configured():
        try:
            checkout = create_checkout(order, order.items)
            order.payment_reference = checkout["reference"]
            order.payment_url = checkout["url"]
            database.commit()
        except PaymentProviderError as error:
            payment_error = str(error)
    return {
        "order_id": order.code,
        "tracking_token": order.public_token,
        "status": order.status,
        "subtotal": float(order.subtotal),
        "shipping_price": float(order.shipping_price),
        "total": float(order.total),
        "payment_method": order.payment_method,
        "payment_url": order.payment_url,
        "payment_configured": mercado_pago_configured(),
        "payment_error": payment_error,
        "created_at": order.created_at or datetime.now(),
        "message": (
            "Pedido reservado. Continue no Mercado Pago para concluir."
            if order.payment_url
            else "Pedido reservado e aguardando configuração do pagamento."
        ),
    }


@app.get("/api/orders/{order_code}")
def public_order(
    order_code: str,
    token: str,
    database: Session = Depends(get_db),
):
    order = database.execute(
        select(Order).options(joinedload(Order.items)).where(
            Order.code == order_code,
            Order.public_token == token,
        )
    ).unique().scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return serialize_order(order)


@app.post("/api/payments/mercado-pago/webhook")
def mercado_pago_webhook(
    data_id: str = Query(default="", alias="data.id"),
    x_signature: str = Header(default=""),
    x_request_id: str = Header(default=""),
    database: Session = Depends(get_db),
):
    if not verify_webhook_signature(data_id, x_request_id, x_signature):
        raise HTTPException(status_code=401, detail="Assinatura de webhook inválida")
    try:
        payment = get_payment(data_id)
    except PaymentProviderError as error:
        raise HTTPException(status_code=502, detail=str(error))
    order_code = payment.get("external_reference") or payment.get("metadata", {}).get("order_code")
    order = database.execute(
        select(Order).options(joinedload(Order.items).joinedload(OrderItemModel.product)).where(
            Order.code == order_code
        )
    ).unique().scalar_one_or_none()
    if not order:
        return {"received": True}
    provider_status = payment.get("status", "pending")
    order.payment_reference = str(payment.get("id", data_id))
    if provider_status == "approved":
        order.payment_status = "paid"
        if order.status == "awaiting_payment":
            order.status = "confirmed"
    elif provider_status in {"rejected", "cancelled", "refunded", "charged_back"}:
        order.payment_status = provider_status
        order.status = "cancelled"
        release_order_stock(order)
    else:
        order.payment_status = provider_status
    database.commit()
    return {"received": True}
