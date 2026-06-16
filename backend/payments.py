import hashlib
import hmac
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


MERCADO_PAGO_API = "https://api.mercadopago.com"


class PaymentProviderError(RuntimeError):
    pass


def mercado_pago_configured() -> bool:
    return bool(os.getenv("MERCADO_PAGO_ACCESS_TOKEN"))


def _request(path: str, method: str = "GET", payload: dict | None = None, idempotency_key=""):
    token = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
    if not token:
        raise PaymentProviderError("Mercado Pago ainda não foi configurado")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if idempotency_key:
        headers["X-Idempotency-Key"] = idempotency_key
    request = Request(
        f"{MERCADO_PAGO_API}{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read())
    except HTTPError as error:
        detail = error.read().decode(errors="replace")
        raise PaymentProviderError(f"Mercado Pago recusou a solicitação: {detail}") from error
    except (URLError, TimeoutError) as error:
        raise PaymentProviderError("Não foi possível acessar o Mercado Pago") from error


def create_checkout(order, items):
    frontend_url = os.getenv("FRONTEND_PUBLIC_URL", "http://127.0.0.1:5173").rstrip("/")
    api_url = os.getenv("API_PUBLIC_URL", "").rstrip("/")
    return_url = (
        f"{frontend_url}/?pedido={order.code}&token={order.public_token}"
        "&pagamento={status}"
    )
    payload = {
        "items": [
            {
                "id": str(item.product_id or ""),
                "title": item.product_name,
                "quantity": item.quantity,
                "currency_id": "BRL",
                "unit_price": float(item.unit_price),
            }
            for item in items
        ],
        "payer": {
            "name": order.customer_name,
            "email": order.customer_email,
        },
        "shipments": {"cost": float(order.shipping_price)},
        "external_reference": order.code,
        "metadata": {"order_code": order.code},
        "back_urls": {
            "success": return_url.format(status="sucesso"),
            "pending": return_url.format(status="pendente"),
            "failure": return_url.format(status="falha"),
        },
        "auto_return": "approved",
        "statement_descriptor": "CASA MAMULENGO",
    }
    if api_url:
        payload["notification_url"] = f"{api_url}/api/payments/mercado-pago/webhook"
    result = _request(
        "/checkout/preferences",
        method="POST",
        payload=payload,
        idempotency_key=f"order-{order.code}",
    )
    return {
        "reference": result["id"],
        "url": result.get("init_point") or result.get("sandbox_init_point", ""),
    }


def get_payment(payment_id: str):
    return _request(f"/v1/payments/{payment_id}")


def verify_webhook_signature(
    data_id: str,
    request_id: str,
    signature: str,
) -> bool:
    secret = os.getenv("MERCADO_PAGO_WEBHOOK_SECRET")
    if not secret or not signature:
        return False
    parts = dict(
        part.strip().split("=", 1)
        for part in signature.split(",")
        if "=" in part
    )
    timestamp = parts.get("ts", "")
    received = parts.get("v1", "")
    if not timestamp or not received:
        return False
    manifest = f"id:{data_id.lower()};request-id:{request_id};ts:{timestamp};"
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, received)
