from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
import pillow_avif


ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_BYTES = 8 * 1024 * 1024
MAX_PIXELS = 32_000_000


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
    webp_name = f"{identifier}.webp"
    normalized.save(upload_dir / webp_name, "WEBP", quality=86, method=6)
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
