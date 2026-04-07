import os
from datetime import datetime
from uuid import uuid4
from urllib.parse import quote

from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from werkzeug.utils import secure_filename

from config.aws_clients import get_s3_client


def _is_placeholder(value: str) -> bool:
    if not value:
        return True
    v = value.strip().lower()
    return v.startswith("your_") or v == "changeme"


def _is_s3_configured() -> bool:
    bucket = os.getenv("S3_BUCKET_NAME")
    region = os.getenv("AWS_REGION")
    key_id = os.getenv("AWS_ACCESS_KEY_ID")
    secret = os.getenv("AWS_SECRET_ACCESS_KEY")

    if _is_placeholder(bucket) or _is_placeholder(region):
        return False

    if not _is_placeholder(key_id) and not _is_placeholder(secret):
        return True

    # Allow role/profile-based credential resolution.
    return bool(os.getenv("AWS_PROFILE") or os.getenv("AWS_WEB_IDENTITY_TOKEN_FILE"))


def _fallback_url(label: str) -> str:
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="420">'
        '<rect width="100%" height="100%" fill="#111827"/>'
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" '
        'fill="#e5e7eb" font-size="28" font-family="Arial">'
        f"{label}</text></svg>"
    )
    return f"data:image/svg+xml;utf8,{quote(svg)}"


def _public_url(key: str) -> str:
    provided_base = (os.getenv("S3_PUBLIC_URL_BASE") or "").strip()
    if provided_base:
        base = provided_base[:-1] if provided_base.endswith("/") else provided_base
        return f"{base}/{key}"

    bucket = os.getenv("S3_BUCKET_NAME", "")
    region = os.getenv("AWS_REGION", "")
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"


def _extract_key_from_url(url: str):
    if not url:
        return None

    value = url.strip()
    if not value:
        return None

    bucket = os.getenv("S3_BUCKET_NAME", "").strip()
    region = os.getenv("AWS_REGION", "").strip()

    configured_base = (os.getenv("S3_PUBLIC_URL_BASE") or "").strip()
    prefixes = []

    if configured_base:
        normalized = configured_base[:-1] if configured_base.endswith("/") else configured_base
        prefixes.append(f"{normalized}/")

    if bucket and region:
        prefixes.append(f"https://{bucket}.s3.{region}.amazonaws.com/")

    for prefix in prefixes:
        if value.startswith(prefix):
            return value[len(prefix):]

    s3_prefix = f"s3://{bucket}/" if bucket else ""
    if s3_prefix and value.startswith(s3_prefix):
        return value[len(s3_prefix):]

    return None


def resolve_access_url(s3_key: str = "", fallback_url: str = "", expires_seconds: int = 3600):
    key = (s3_key or "").strip() or (_extract_key_from_url(fallback_url) or "")

    if key and not key.startswith("local/") and _is_s3_configured():
        bucket = os.getenv("S3_BUCKET_NAME", "").strip()
        s3 = get_s3_client()
        try:
            return s3.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=expires_seconds,
            )
        except (NoCredentialsError, BotoCoreError, ClientError):
            if fallback_url:
                return fallback_url
            return _public_url(key)

    if fallback_url:
        return fallback_url

    if key:
        return _public_url(key)

    return _fallback_url("File unavailable")


def upload_file_or_fallback(file_storage, folder: str):
    original_name = file_storage.filename or "file"
    safe_name = secure_filename(original_name) or "file"
    key = f"{folder}/{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid4().hex}_{safe_name}"

    if not _is_s3_configured():
        label = "S3 not configured yet"
        return {"s3Key": f"local/{key}", "url": _fallback_url(label)}

    bucket = os.getenv("S3_BUCKET_NAME", "")
    mime_type = file_storage.mimetype or "application/octet-stream"

    s3 = get_s3_client()
    try:
        file_storage.stream.seek(0)
        s3.upload_fileobj(
            Fileobj=file_storage.stream,
            Bucket=bucket,
            Key=key,
            ExtraArgs={"ContentType": mime_type},
        )
    except (NoCredentialsError, BotoCoreError):
        return {"s3Key": f"local/{key}", "url": _fallback_url("AWS credentials pending")}

    return {"s3Key": key, "url": _public_url(key)}
