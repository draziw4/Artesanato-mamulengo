import os
import smtplib
from email.message import EmailMessage


def email_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_FROM"))


def _send_email(to_address: str, subject: str, body: str):
    if not email_configured() or not to_address:
        return
    message = EmailMessage()
    message["From"] = os.getenv("SMTP_FROM", "")
    message["To"] = to_address
    message["Subject"] = subject
    message.set_content(body)

    host = os.getenv("SMTP_HOST", "")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    use_tls = os.getenv("SMTP_TLS", "true").lower() == "true"

    with smtplib.SMTP(host, port, timeout=12) as smtp:
        if use_tls:
            smtp.starttls()
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)


def notify_order_created(order):
    shop_email = os.getenv("SHOP_NOTIFICATION_EMAIL", "")
    customer_body = (
        f"Olá, {order['customer_name']}.\n\n"
        f"Recebemos seu pedido {order['code']} na Casa Mamulengo.\n"
        f"Status: {order['status'].replace('_', ' ')}\n"
        f"Total: R$ {order['total']:.2f}\n\n"
        "Assim que o pagamento for confirmado, continuaremos a preparação da sua peça.\n"
    )
    shop_body = (
        f"Novo pedido recebido: {order['code']}\n\n"
        f"Cliente: {order['customer_name']}\n"
        f"E-mail: {order['customer_email']}\n"
        f"Telefone: {order['customer_phone']}\n"
        f"Entrega: {order['shipping_service']}\n"
        f"Total: R$ {order['total']:.2f}\n"
    )
    _send_email(order["customer_email"], f"Pedido recebido {order['code']}", customer_body)
    if shop_email:
        _send_email(shop_email, f"Novo pedido {order['code']}", shop_body)


def notify_order_status_changed(order):
    body = (
        f"Olá, {order['customer_name']}.\n\n"
        f"O status do seu pedido {order['code']} foi atualizado para: "
        f"{order['status'].replace('_', ' ')}.\n\n"
        "Qualquer dúvida, fale conosco pelo WhatsApp da loja.\n"
    )
    _send_email(order["customer_email"], f"Atualização do pedido {order['code']}", body)
