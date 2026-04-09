import logging
import os
from decimal import Decimal
from pathlib import Path

import boto3
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from dotenv import load_dotenv

# Ensure .env is loaded even when this module is imported outside of Flask
# (e.g., under Gunicorn workers). This is a no-op if already loaded.
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path, override=False)

logger = logging.getLogger(__name__)


def _table_name():
    return (os.getenv("DYNAMODB_DONORS_TABLE") or "").strip()


def _region():
    return os.getenv("DYNAMODB_REGION") or os.getenv("AWS_REGION") or "us-east-1"


_cached_resource = None


def _get_resource():
    global _cached_resource
    if _cached_resource is None:
        _cached_resource = boto3.resource("dynamodb", region_name=_region())
    return _cached_resource


def _table():
    table = _table_name()
    if not table:
        raise RuntimeError(
            "Missing DYNAMODB_DONORS_TABLE env var. "
            "Check that backend/.env exists and contains DYNAMODB_DONORS_TABLE."
        )
    return _get_resource().Table(table)


def _key_names(table):
    key_schema = table.key_schema or []
    partition_key = None
    sort_key = None

    for key in key_schema:
        if key.get("KeyType") == "HASH":
            partition_key = key.get("AttributeName")
        elif key.get("KeyType") == "RANGE":
            sort_key = key.get("AttributeName")

    if not partition_key:
        raise RuntimeError("DynamoDB table is missing a HASH partition key")

    return partition_key, sort_key


def _decimal_to_native(value):
    if isinstance(value, list):
        return [_decimal_to_native(v) for v in value]
    if isinstance(value, dict):
        return {k: _decimal_to_native(v) for k, v in value.items()}
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    return value


def put_donor_item(donor):
    try:
        table = _table()
    except (NoCredentialsError, BotoCoreError) as exc:
        logger.error("AWS credentials error while accessing DynamoDB: %s", exc)
        raise RuntimeError(
            "AWS credentials are missing or invalid. "
            "Check AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in backend/.env"
        ) from exc

    partition_key, sort_key = _key_names(table)

    location = str(donor.get("location", "")).strip()
    item = {
        "donorId": str(donor.get("_id", "")),
        "name": str(donor.get("name", "")),
        "age": int(donor.get("age", 0)),
        "gender": str(donor.get("gender", "")),
        "bloodGroup": str(donor.get("bloodGroup", "")),
        "phone": str(donor.get("phone", "")),
        "email": str(donor.get("email", "")),
        "location": location,
        "locationNormalized": location.lower(),
        "lastDonationDate": str(donor.get("lastDonationDate", "")),
        "healthStatus": str(donor.get("healthStatus", "")),
        "profileImageS3Key": str(donor.get("profileImageS3Key", "")),
        "profileImageUrl": str(donor.get("profileImageUrl", "")),
        "medicalReportS3Key": str(donor.get("medicalReportS3Key", "")),
        "medicalReportUrl": str(donor.get("medicalReportUrl", "")),
        "createdAt": str(donor.get("createdAt", "")),
        "updatedAt": str(donor.get("updatedAt", "")),
    }

    if not item["donorId"]:
        raise ValueError("donorId is required for DynamoDB write")

    if partition_key not in item:
        item[partition_key] = item["donorId"]

    if sort_key and sort_key not in item:
        # Some tables were created with an extra placeholder sort key.
        item[sort_key] = os.getenv("DYNAMODB_DONORS_SORT_KEY_VALUE", "none")

    try:
        table.put_item(Item=item)
    except NoCredentialsError as exc:
        logger.error("No AWS credentials found when writing donor: %s", exc)
        raise
    except ClientError as exc:
        error_code = exc.response["Error"]["Code"]
        logger.error("DynamoDB ClientError on put_item (code=%s): %s", error_code, exc)
        if error_code == "ResourceNotFoundException":
            raise RuntimeError(
                f"DynamoDB table '{_table_name()}' does not exist in region '{_region()}'. "
                "Create it first or check DYNAMODB_DONORS_TABLE in .env"
            ) from exc
        raise


def get_donor_item(donor_id):
    table = _table()
    partition_key, _ = _key_names(table)
    resp = table.query(
        KeyConditionExpression=Key(partition_key).eq(str(donor_id)),
        Limit=1,
    )
    items = resp.get("Items", [])
    item = items[0] if items else None
    if not item:
        return None

    item = _decimal_to_native(item)
    return _to_api_donor(item)


def search_donor_items(blood_group, location):
    try:
        table = _table()
    except (NoCredentialsError, BotoCoreError) as exc:
        logger.error("AWS credentials error while accessing DynamoDB: %s", exc)
        raise RuntimeError(
            "AWS credentials are missing or invalid. "
            "Check AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in backend/.env"
        ) from exc

    location_normalized = (location or "").strip().lower()

    filters = Attr("bloodGroup").eq(blood_group) & Attr("locationNormalized").eq(location_normalized)

    results = []
    kwargs = {"FilterExpression": filters}

    try:
        while True:
            resp = table.scan(**kwargs)
            for raw in resp.get("Items", []):
                item = _decimal_to_native(raw)
                results.append(_to_api_donor(item))

            last_evaluated = resp.get("LastEvaluatedKey")
            if not last_evaluated:
                break
            kwargs["ExclusiveStartKey"] = last_evaluated
    except NoCredentialsError as exc:
        logger.error("No AWS credentials found when searching donors: %s", exc)
        raise
    except ClientError as exc:
        error_code = exc.response["Error"]["Code"]
        logger.error("DynamoDB ClientError on scan (code=%s): %s", error_code, exc)
        if error_code == "ResourceNotFoundException":
            raise RuntimeError(
                f"DynamoDB table '{_table_name()}' does not exist in region '{_region()}'. "
                "Create it first or check DYNAMODB_DONORS_TABLE in .env"
            ) from exc
        raise

    results.sort(key=lambda d: d.get("lastDonationDate", ""), reverse=True)
    return results


def _to_api_donor(item):
    return {
        "_id": str(item.get("donorId", "")),
        "name": item.get("name", ""),
        "age": item.get("age", 0),
        "gender": item.get("gender", ""),
        "bloodGroup": item.get("bloodGroup", ""),
        "phone": item.get("phone", ""),
        "email": item.get("email", ""),
        "location": item.get("location", ""),
        "lastDonationDate": item.get("lastDonationDate", ""),
        "healthStatus": item.get("healthStatus", ""),
        "profileImageS3Key": item.get("profileImageS3Key", ""),
        "profileImageUrl": item.get("profileImageUrl", ""),
        "medicalReportS3Key": item.get("medicalReportS3Key", ""),
        "medicalReportUrl": item.get("medicalReportUrl", ""),
        "createdAt": item.get("createdAt", ""),
        "updatedAt": item.get("updatedAt", ""),
    }