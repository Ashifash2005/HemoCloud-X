# HemoCloud-X: Online Blood Bank System

HemoCloud-X is a modern, responsive, and secure city-wide donor coordination platform that connects blood donors with patients in need during planned medical procedures and urgent emergencies.

---

## 🎯 What Problem It Solves
Finding matching blood donors during critical hours is often a chaotic process involving disparate social media posts and unverified WhatsApp messages. HemoCloud-X provides a centralized, validated "Regional Emergency Network" where:
- **Receivers** can search for specific blood groups in their city in real-time.
- **Donors** can maintain an updated profile, keeping their availability and medical records on file.
- The platform ensures data persistence, medical proof uploads, and high availability, reducing the critical time-to-find during medical emergencies.

---

## 🌟 Features
- **Real-Time Donor Search**: Quickly locate eligible donors based on matching blood types, location (city), and current availability status.
- **Secure Medical Uploads**: File uploads for medical reports and profile pictures are securely pushed to AWS S3.
- **Donor Profiles**: Individual pages showcasing the donor's health status, contact information, and verified medical documentation.
- **Availability Tracking**: Automatic determination of "Available Now" status if a donor hasn't donated within their eligible resting period (e.g., 90 days).
- **Modern User Interface**: A beautifully crafted dark-themed interface built with React, Tailwind CSS, and glassmorphism elements.

---

## 🏗️ Architecture
The system uses a decoupled frontend-backend architecture integrated with scalable cloud storage solutions.

1. **Client / Frontend**: A Single Page Application (SPA) built using React.js that consumes standard REST APIs.
2. **REST API / Backend**: A Python Flask microservice that serves as the controller, handling request validation, routing, and communication with the cloud layer.
3. **Primary Database**: AWS DynamoDB acts as a highly scalable NoSQL data store, maintaining user records, search indexes, and metadata for files.
4. **Blob Storage**: AWS Simple Storage Service (S3) handles all binary data (images, PDF medical reports) leaving the database lightweight.

---

## 🛠️ Tools Used
- **Frontend Core**: React 18, React Router DOM, Vite
- **Frontend Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Backend Core**: Python 3.9, Flask 3.0, Flask-CORS
- **Cloud Integrations**: `boto3` (AWS SDK for Python)
- **Database**: AWS DynamoDB
- **Storage**: AWS S3
- **Configuration**: `python-dotenv` for backend, Vite environment variables for frontend

---

## ⚙️ How It Works (Working Mechanism)
1. **Donor Registration**: A user visits `/donor` and submits a `multipart/form-data` request containing their details and files.
2. **File Processing**: The Flask backend intercepts the request and securely uploads the medical report and profile picture directly into an AWS S3 Bucket, generating public or signed secure URLs.
3. **Database Insertion**: The backend maps the user details plus the S3 URLs into a JSON document and inserts it into the AWS DynamoDB `bloodbank-donors-dev` table.
4. **Search Mechanism**: A receiver queries `/receiver` with parameters like `O+` and `Chennai`. The backend queries DynamoDB with these parameters and filters active donors.
5. **Data Hydration**: The React frontend maps the JSON response and displays available Donors.

---

## 📂 Folder Structure
- `frontend/` - React + Tailwind UI application
- `backend/flask_api/` - Python Flask REST API + AWS client services
- `backend/.env` - Backend environment settings

---

## 🚀 Getting Started & Setup

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.9+
- An AWS account with an S3 bucket & DynamoDB table

### AWS S3 Setup
Ensure your S3 bucket permissions allow reading (`s3:GetObject`) if you opt to use public object URLs, and provide the backend an IAM user with `s3:PutObject` access.

### Environment variables

**Backend (`backend/.env`)**
Copy `backend/.env.example` to `backend/.env` and fill:
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `DYNAMODB_DONORS_TABLE`
- `CORS_ORIGIN=http://localhost:5173`

**Frontend (`frontend/.env`)**
Create `frontend/.env` and add:
`VITE_API_BASE_URL=http://localhost:5001` (Or whatever port your Flask app uses)

---

## 💻 Running Locally

### 1. Start the Flask Backend
```bash
cd backend/flask_api
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```
*(Backend runs on PORT=5001 by default as per `.env` configuration).*

### 2. Start the React Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend runs on `http://localhost:5173`).*

---

## 📡 REST API Endpoints

### 1) Register donor
`POST /api/donor/register` (Requires `multipart/form-data`)
Fields: `name`, `age`, `gender`, `bloodGroup`, `phone`, `email`, `location`, `lastDonationDate`, `healthStatus`, `medicalReport` (file), `profileImage` (file).

### 2) Search donors
`GET /api/donor/search?bloodGroup=O+&location=Chennai&availableNow=true`
Filters donors by blood group, location, and a 90-day availability threshold.

### 3) Get donor by ID
`GET /api/donor/:id`
Returns a specific donor for the `/donor/:id` profile views.
