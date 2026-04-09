import os
from datetime import date, datetime
from uuid import uuid4

from flask import Blueprint, current_app, jsonify, request

from services.dynamodb_donor import (
    get_donor_item,
    put_donor_item,
    search_donor_items,
)
from services.storage import resolve_access_url, upload_file_or_fallback


donor_bp = Blueprint("donor", __name__)

ALLOWED_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
ALLOWED_GENDERS = {"Male", "Female", "Other"}
ALLOWED_MEDICAL_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_BYTES = int(float(os.getenv("MAX_FILE_BYTES", str(5 * 1024 * 1024))))


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() == "true"


def _to_iso(value):
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def _available_now(last_donation, threshold_days):
    if not last_donation:
        return True
    if isinstance(last_donation, str):
        try:
            parsed = datetime.fromisoformat(last_donation)
        except ValueError:
            return True
        last_dt = parsed
    else:
        last_dt = datetime.combine(last_donation, datetime.min.time())

    return (datetime.utcnow() - last_dt).days >= threshold_days


def _validate_payload(form, files):
    errors = []

    name = (form.get("name") or "").strip()
    age_raw = (form.get("age") or "").strip()
    gender = (form.get("gender") or "").strip()
    blood_group = (form.get("bloodGroup") or "").strip()
    phone = (form.get("phone") or "").strip()
    email = (form.get("email") or "").strip()
    location = (form.get("location") or "").strip()
    last_donation_raw = (form.get("lastDonationDate") or "").strip()
    health_status = (form.get("healthStatus") or "").strip()

    medical = files.get("medicalReport")
    profile = files.get("profileImage")

    if len(name) < 2 or len(name) > 120:
        errors.append("name must be 2-120 characters")

    try:
        age = int(age_raw)
        if age < 1 or age > 120:
            errors.append("age must be between 1 and 120")
    except ValueError:
        age = None
        errors.append("age must be a number")

    if gender not in ALLOWED_GENDERS:
        errors.append("Invalid gender")

    if blood_group not in ALLOWED_BLOOD_GROUPS:
        errors.append("Invalid blood group")

    if len(phone) < 8 or len(phone) > 20:
        errors.append("Invalid phone number")

    if "@" not in email or "." not in email:
        errors.append("Invalid email")

    if len(location) < 2 or len(location) > 120:
        errors.append("Invalid location")

    last_donation_date = None
    if last_donation_raw:
        try:
            last_donation_date = datetime.strptime(last_donation_raw, "%Y-%m-%d").date()
        except ValueError:
            errors.append("Invalid last donation date format")

    if len(health_status) < 2 or len(health_status) > 1000:
        errors.append("Invalid health status")

    if not medical:
        errors.append("Medical report file is required")
    if not profile:
        errors.append("Profile image file is required")

    if medical and medical.mimetype not in ALLOWED_MEDICAL_TYPES:
        errors.append("Unsupported medical report file type")
    if profile and profile.mimetype not in ALLOWED_IMAGE_TYPES:
        errors.append("Unsupported profile image file type")

    for file_obj, label in ((medical, "Medical report"), (profile, "Profile image")):
        if not file_obj:
            continue
        file_obj.stream.seek(0, 2)
        size = file_obj.stream.tell()
        file_obj.stream.seek(0)
        if size > MAX_FILE_BYTES:
            errors.append(f"{label} file is too large")

    if errors:
        return None, errors

    data = {
        "name": name,
        "age": age,
        "gender": gender,
        "bloodGroup": blood_group,
        "phone": phone,
        "email": email,
        "location": location,
        "lastDonationDate": last_donation_date,
        "healthStatus": health_status,
        "medical": medical,
        "profile": profile,
    }
    return data, None


def _build_donor(payload, profile_upload, medical_upload):
    now = datetime.utcnow().isoformat()
    return {
        "_id": uuid4().hex,
        "name": payload["name"],
        "age": payload["age"],
        "gender": payload["gender"],
        "bloodGroup": payload["bloodGroup"],
        "phone": payload["phone"],
        "email": payload["email"],
        "location": payload["location"],
        "lastDonationDate": _to_iso(payload["lastDonationDate"]) if payload["lastDonationDate"] else "",
        "healthStatus": payload["healthStatus"],
        "profileImageS3Key": profile_upload["s3Key"],
        "profileImageUrl": profile_upload["url"],
        "medicalReportS3Key": medical_upload["s3Key"],
        "medicalReportUrl": medical_upload["url"],
        "createdAt": now,
        "updatedAt": now,
    }


def _with_access_urls(donor):
    mapped = dict(donor)
    mapped["profileImageUrl"] = resolve_access_url(
        donor.get("profileImageS3Key", ""), donor.get("profileImageUrl", "")
    )
    mapped["medicalReportUrl"] = resolve_access_url(
        donor.get("medicalReportS3Key", ""), donor.get("medicalReportUrl", "")
    )
    return mapped


@donor_bp.post("/api/donor/register")
def register_donor():
    payload, errors = _validate_payload(request.form, request.files)
    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 400

    medical_upload = upload_file_or_fallback(payload["medical"], "medical-reports")
    profile_upload = upload_file_or_fallback(payload["profile"], "profile-images")

    donor = _build_donor(payload, profile_upload, medical_upload)

    try:
        put_donor_item(donor)
    except Exception as exc:
        current_app.logger.exception("DynamoDB write failed for donor id=%s", donor.get("_id"))
        return jsonify({"message": f"Failed to save donor in DynamoDB: {exc}"}), 500

    return jsonify({"message": "Donor registered successfully", "donor": _with_access_urls(donor)}), 201


@donor_bp.get("/api/donor/search")
def search_donors():
    blood_group = (request.args.get("bloodGroup") or "").strip()
    location = (request.args.get("location") or "").strip()
    available_now = _parse_bool(request.args.get("availableNow"))

    if not blood_group or not location:
        return jsonify({"message": "bloodGroup and location are required"}), 400

    threshold_days = int(os.getenv("AVAILABLE_NOW_THRESHOLD_DAYS", "90"))

    try:
        donors = search_donor_items(blood_group, location)
    except Exception as exc:
        current_app.logger.exception("DynamoDB search failed")
        return jsonify({"message": f"Failed to search donors in DynamoDB: [{type(exc).__name__}] {str(exc)}"}), 500

    if available_now:
        donors = [d for d in donors if _available_now(d["lastDonationDate"], threshold_days)]

    return jsonify({"count": len(donors), "donors": [_with_access_urls(d) for d in donors]})


@donor_bp.get("/api/donor/<donor_id>")
def get_donor_by_id(donor_id):
    donor_id = (donor_id or "").strip()
    if not donor_id:
        return jsonify({"message": "Invalid donor id"}), 400

    try:
        donor = get_donor_item(donor_id)
    except Exception as exc:
        current_app.logger.exception("DynamoDB get failed for donor id=%s", donor_id)
        return jsonify({"message": f"Failed to fetch donor from DynamoDB: {exc}"}), 500

    if not donor:
        return jsonify({"message": "Donor not found"}), 404

    return jsonify({"donor": _with_access_urls(donor)})
