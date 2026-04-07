import os

import boto3


def _region(service_name: str) -> str:
    if service_name == "dynamodb":
        return os.getenv("DYNAMODB_REGION") or os.getenv("AWS_REGION") or "us-east-1"
    if service_name == "sns":
        return os.getenv("SNS_REGION") or os.getenv("AWS_REGION") or "us-east-1"
    return os.getenv("AWS_REGION") or "us-east-1"


def get_dynamodb_client():
    # Lazy credentials: no explicit keys required here.
    return boto3.client("dynamodb", region_name=_region("dynamodb"))


def get_sns_client():
    # Lazy credentials: no explicit keys required here.
    return boto3.client("sns", region_name=_region("sns"))


def get_s3_client():
    # Lazy credentials: boto3 picks up env/profile/role at call time.
    return boto3.client("s3", region_name=_region("s3"))
