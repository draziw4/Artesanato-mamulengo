from copy import deepcopy

from sqlalchemy import select
from sqlalchemy.orm import Session

from content_defaults import DEFAULT_SITE_CONTENT
from models import AuditLog, ContentRevision, SiteContent, User


def merge_defaults(defaults, current):
    if not isinstance(defaults, dict) or not isinstance(current, dict):
        return deepcopy(current)
    merged = deepcopy(defaults)
    for key, value in current.items():
        merged[key] = (
            merge_defaults(defaults[key], value)
            if key in defaults and isinstance(defaults[key], dict) and isinstance(value, dict)
            else deepcopy(value)
        )
    return merged


def get_or_create_site_content(database: Session) -> SiteContent:
    content = database.scalar(select(SiteContent).where(SiteContent.key == "homepage"))
    if content:
        draft = merge_defaults(DEFAULT_SITE_CONTENT, content.draft_data)
        published = merge_defaults(DEFAULT_SITE_CONTENT, content.published_data)
        if draft != content.draft_data or published != content.published_data:
            content.draft_data = draft
            content.published_data = published
            database.commit()
        return content
    content = SiteContent(
        key="homepage",
        draft_data=deepcopy(DEFAULT_SITE_CONTENT),
        published_data=deepcopy(DEFAULT_SITE_CONTENT),
        status="published",
        version=1,
    )
    database.add(content)
    database.commit()
    database.refresh(content)
    return content


def audit(database: Session, user: User, action: str, entity_type: str, entity_id, details=None):
    database.add(
        AuditLog(
            user_id=user.id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details or {},
        )
    )


def revision(database: Session, content: SiteContent, user: User, action: str):
    database.add(
        ContentRevision(
            content_key=content.key,
            version=content.version,
            data=deepcopy(content.draft_data),
            action=action,
            user_id=user.id,
        )
    )
