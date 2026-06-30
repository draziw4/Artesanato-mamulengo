import os
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
import pillow_avif


ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_BYTES = 8 * 1024 * 1024
MAX_PIXELS = 32_000_000


def cloudinary_configured() -> bool:
    return bool(
        os.getenv("CLOUDINARY_URL")
        or (
            os.getenv("CLOUDINARY_CLOUD_NAME")
            and os.getenv("CLOUDINARY_API_KEY")
            and os.getenv("CLOUDINARY_API_SECRET")
        )
    )


def _cloudinary_avif_url(url: str) -> str:
    if "/upload/" not in url:
        return ""
    return url.replace("/upload/", "/upload/f_avif,q_auto/")


def _upload_to_cloudinary(webp_bytes: bytes, identifier: str):
    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError as error:
        raise HTTPException(
            status_code=500,
            detail="Cloudinary configurado, mas dependência cloudinary não está instalada",
        ) from error

    if not os.getenv("CLOUDINARY_URL"):
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True,
        )

    folder = os.getenv("CLOUDINARY_FOLDER", "casa-mamulengo")
    try:
        result = cloudinary.uploader.upload(
            BytesIO(webp_bytes),
            folder=folder,
            public_id=identifier,
            resource_type="image",
            format="webp",
            overwrite=False,
        )
    except Exception as error:
        raise HTTPException(status_code=502, detail="Não foi possível enviar a imagem") from error

    secure_url = result.get("secure_url", "")
    if not secure_url:
        raise HTTPException(status_code=502, detail="Cloudinary não retornou URL da imagem")
    return secure_url


def process_image(upload: UploadFile, upload_dir: Path):
    raw = upload.file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="A imagem deve ter no máximo 8 MB")
    try:
        image = Image.open(BytesIO(raw))
        image.verify()
        image = Image.open(BytesIO(raw))
        image.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="O arquivo não é uma imagem válida")
    if image.format not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail="Envie uma imagem JPEG, PNG ou WebP")
    if image.width * image.height > MAX_PIXELS:
        raise HTTPException(status_code=400, detail="A resolução da imagem é muito alta")

    normalized = image.convert("RGBA" if image.mode in ("RGBA", "LA") else "RGB")
    identifier = uuid4().hex
    webp_buffer = BytesIO()
    normalized.save(webp_buffer, "WEBP", quality=86, method=6)
    webp_bytes = webp_buffer.getvalue()

    if cloudinary_configured():
        webp_url = _upload_to_cloudinary(webp_bytes, identifier)
        return {
            "original_name": Path(upload.filename or "imagem").name,
            "webp_url": webp_url,
            "avif_url": _cloudinary_avif_url(webp_url),
            "width": image.width,
            "height": image.height,
            "size_bytes": len(raw),
            "mime_type": "image/webp",
        }

    webp_name = f"{identifier}.webp"
    (upload_dir / webp_name).write_bytes(webp_bytes)
    avif_name = ""
    try:
        avif_name = f"{identifier}.avif"
        normalized.save(upload_dir / avif_name, "AVIF", quality=70)
    except (KeyError, OSError, ValueError):
        avif_name = ""
    return {
        "original_name": Path(upload.filename or "imagem").name,
        "webp_url": f"/uploads/{webp_name}",
        "avif_url": f"/uploads/{avif_name}" if avif_name else "",
        "width": image.width,
        "height": image.height,
        "size_bytes": len(raw),
        "mime_type": "image/webp",
    }
