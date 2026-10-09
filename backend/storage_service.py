"""S3-compatible object storage helpers for off-chain evidence files."""

import os

import boto3
from botocore.config import Config

APP_NAME = "tala"

S3_BUCKET = os.environ.get("S3_BUCKET")
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL") or None
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
S3_ADDRESSING_STYLE = os.environ.get("S3_ADDRESSING_STYLE", "auto")

_s3_client = None


def init_storage(force: bool = False):
    """Initialize and return the S3-compatible storage client.

    `force` is accepted for compatibility with the previous storage helper.
    """
    global _s3_client

    if not S3_BUCKET:
        raise RuntimeError("S3_BUCKET must be configured")

    if _s3_client is None or force:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=S3_ENDPOINT_URL,
            region_name=AWS_REGION,
            config=Config(
                s3={"addressing_style": S3_ADDRESSING_STYLE},
            ),
        )

    return _s3_client


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload an evidence file and return its storage path and size."""
    client = init_storage()
    client.put_object(
        Bucket=S3_BUCKET,
        Key=path,
        Body=data,
        ContentType=content_type,
    )
    return {"path": path, "size": len(data)}


def get_object(path: str):
    """Return the evidence file contents and stored content type."""
    client = init_storage()
    response = client.get_object(Bucket=S3_BUCKET, Key=path)
    return response["Body"].read(), response.get(
        "ContentType", "application/octet-stream"
    )


def mime_for(filename: str) -> str:
    """Guess a content type from a filename."""
    mime_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
        "pdf": "application/pdf",
        "json": "application/json",
        "csv": "text/csv",
        "txt": "text/plain",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    return mime_types.get(extension, "application/octet-stream")
