import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models import AdminSession, User


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 310_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, expected = stored.split("$", 1)
    calculated = hash_password(password, salt).split("$", 1)[1]
    return secrets.compare_digest(calculated, expected)


def create_session(database: Session, user_id: int) -> str:
    now = datetime.now(timezone.utc)
    database.execute(delete(AdminSession).where(AdminSession.expires_at < now))
    token = secrets.token_urlsafe(36)
    database.add(
        AdminSession(
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            user_id=user_id,
            expires_at=now + timedelta(hours=12),
        )
    )
    database.commit()
    return token


def get_session_user(database: Session, token: str | None) -> User | None:
    if not token:
        return None
    statement = (
        select(User)
        .join(AdminSession)
        .where(
            AdminSession.token_hash == hashlib.sha256(token.encode()).hexdigest(),
            AdminSession.expires_at > datetime.now(timezone.utc),
        )
    )
    return database.scalar(statement)


def delete_session(database: Session, token: str | None):
    if not token:
        return
    database.execute(
        delete(AdminSession).where(
            AdminSession.token_hash == hashlib.sha256(token.encode()).hexdigest()
        )
    )
    database.commit()
