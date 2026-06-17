import os
from decimal import Decimal

from sqlalchemy import select

from database import SessionLocal
from content_defaults import DEFAULT_SITE_CONTENT
from models import Category, Collection, Product, SiteContent, User
from security import hash_password


SEED_PRODUCTS = [
    ("São Francisco do Sertão", "Esculturas", "Obras de Fé", "289.00", 3, "Cedro", "38 × 12 cm", "Figura talhada à mão, marcada pelo veio natural do cedro e por um acabamento em cera de carnaúba.", "/images/santo.png", "Peça única", True),
    ("Travessa Folhagem", "Casa & Mesa", "Raízes da Casa", "198.00", 3, "Imburana", "42 × 24 cm", "Travessa oval com baixo-relevo botânico, esculpida lentamente para preservar as curvas da madeira.", "/images/travessa.png", "Mais querida", True),
    ("Pássaro Cantador", "Esculturas", "Bichos do Brasil", "149.00", 2, "Cajá", "22 × 18 cm", "Pequena escultura de pássaro com marcas de ferramenta aparentes e base em galho reaproveitado.", "/images/passaro.png", "Novo", True),
    ("Caixa de Memórias", "Utilitários", "Raízes da Casa", "169.00", 2, "Freijó", "20 × 14 cm", "Caixa de encaixe tradicional para guardar cartas, fotografias e pequenos afetos.", "/images/caixa.png", "Edição limitada", False),
    ("Mamulengo Benedito", "Brinquedos", "Mestres do Riso", "235.00", 3, "Mulungu", "46 × 13 cm", "Boneco de luva esculpido e pintado à mão, inspirado na tradição popular do teatro de mamulengos.", "/images/mamulengo.png", "Autoral", False),
    ("Banco Sertanejo", "Mobiliário", "Ofício Antigo", "490.00", 5, "Madeira de demolição", "48 × 32 × 28 cm", "Banco compacto montado com encaixes aparentes, sem parafusos e com acabamento natural.", "/images/banco.png", "Sob encomenda", False),
]


def seed():
    with SessionLocal() as database:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@casamamulengo.com").lower()
        admin_password = os.getenv("ADMIN_PASSWORD", "TroqueEstaSenha@2026")
        if not database.scalar(select(User).where(User.email == admin_email)):
            database.add(
                User(
                    name="Administrador",
                    email=admin_email,
                    password_hash=hash_password(admin_password),
                    role="admin",
                )
            )

        if not database.scalar(select(Product.id).limit(1)):
            categories = {}
            for category_name in sorted({product[1] for product in SEED_PRODUCTS}):
                category = Category(name=category_name)
                database.add(category)
                categories[category_name] = category
            database.flush()
            for item in SEED_PRODUCTS:
                database.add(
                    Product(
                        name=item[0],
                        category=categories[item[1]],
                        collection=item[2],
                        price=Decimal(item[3]),
                        installments=item[4],
                        material=item[5],
                        dimensions=item[6],
                        description=item[7],
                        image=item[8],
                        tag=item[9],
                        featured=item[10],
                    )
                )
        if not database.scalar(select(Collection.id).limit(1)):
            for name in sorted({product[2] for product in SEED_PRODUCTS}):
                database.add(
                    Collection(
                        name=name,
                        description=f"Seleção autoral da coleção {name}.",
                        featured=name == "Obras de Fé",
                    )
                )
        if not database.scalar(select(SiteContent.id).limit(1)):
            database.add(
                SiteContent(
                    key="homepage",
                    draft_data=DEFAULT_SITE_CONTENT,
                    published_data=DEFAULT_SITE_CONTENT,
                    status="published",
                    version=1,
                )
            )
        database.commit()


if __name__ == "__main__":
    seed()
