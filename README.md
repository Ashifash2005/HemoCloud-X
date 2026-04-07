# Online Blood Bank System (React + Flask + DynamoDB + AWS)

## What this includes
1. `Donor` registration form (`/donor`) with medical report + profile image upload to **AWS S3**
2. `Receiver` search (`/receiver`) by `bloodGroup` + `location` (+ optional `availableNow`)
3. Donor profile page (`/donor/:id`) showing profile image, health status, and medical report link
4. Backend REST APIs + DynamoDB data model
5. Optional AWS integration: S3 now, SNS later

---

## Folder structure
- `frontend/` - React + Tailwind UI
- `backend/` - backend configuration files
- `backend/flask_api/` - Python Flask REST API + DynamoDB + optional AWS clients

---

## Prerequisites
- Node.js (v18+ recommended)
- An AWS account with an S3 bucket
- A DynamoDB table for donors

---

## AWS S3 setup

### 1) Create an S3 bucket
Example: `my-blood-bank-bucket`

### 2) IAM credentials for the backend
Create an IAM access key for the backend with permissions like:
- `s3:PutObject` on `arn:aws:s3:::YOUR_BUCKET_NAME/*`
- `s3:GetObject` on `arn:aws:s3:::YOUR_BUCKET_NAME/*`

The backend uses these environment variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### 3) How object URLs work in this code
This implementation saves **public S3 URLs** with donor records in DynamoDB and renders them directly.

That means your bucket/object must be readable via public URLs.
You can do either:
- Make the bucket objects public for reading (`s3:GetObject` public), OR
- Keep the bucket private and update the backend to generate **signed URLs** at read-time.

If you keep it public, ensure your S3 bucket policy allows `s3:GetObject` for reads.

### 4) (Optional) Custom URL base
If you are fronting S3 with CloudFront or want a custom URL domain, set:
`S3_PUBLIC_URL_BASE=https://your-cdn-or-base-domain`

---

## Environment variables

### Backend (`backend/.env`)
Copy from `backend/.env.example` and fill:
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `DYNAMODB_DONORS_TABLE`
- `CORS_ORIGIN` (should match your frontend)

### Frontend (`frontend/.env`)
Copy from `frontend/.env.example`:
- `VITE_API_BASE_URL=http://localhost:5000`

---

## Install dependencies
Run these from the project root:

### Backend
```bash
cd backend
npm install
```

### Flask API (Python backend)
```bash
cd backend/flask_api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd ../frontend
npm install
```

---

## Run locally

### 1) Start the backend
```bash
cd backend
npm run dev
```
Backend runs on `PORT=5000` by default.

### Flask alternative (same API endpoints)
```bash
cd backend/flask_api
.venv\Scripts\activate
python app.py
```
Flask API also runs on `PORT=5000` by default.

### 2) Start the frontend
In a second terminal:
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## REST API endpoints

### 1) Register donor
`POST /api/donor/register`
- `multipart/form-data`
- Fields:
  - `name`
  - `age`
  - `gender`
  - `bloodGroup`
  - `phone`
  - `email`
  - `location`
  - `lastDonationDate` (YYYY-MM-DD)
  - `healthStatus`
  - `medicalReport` (file)
  - `profileImage` (file)

### 2) Search donors
`GET /api/donor/search?bloodGroup=O+&location=Chennai&availableNow=true`
- `bloodGroup` and `location` are required
- optional `availableNow=true` filters donors whose last donation is older than `AVAILABLE_NOW_THRESHOLD_DAYS` (default `90`)

### 3) Get donor by id
`GET /api/donor/:id`

---

## Deployment readiness
- Backend uses environment variables only (no hard-coded secrets)
- REST APIs are separated under `/api`
- S3 upload is done server-side (not exposed to the browser)

