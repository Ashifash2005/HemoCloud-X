import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from config.aws_clients import get_dynamodb_client, get_sns_client
from routes.donor import donor_bp

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")


def create_app():
    app = Flask(__name__)

    cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    allowed_origins = [o.strip() for o in cors_origin.split(",") if o.strip()]
    CORS(
        app,
        resources={r"/*": {"origins": allowed_origins or ["http://localhost:5173"]}},
        supports_credentials=True,
    )

    # Initialize optional AWS clients in lazy-credentials mode.
    get_dynamodb_client()
    get_sns_client()

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok"})

    app.register_blueprint(donor_bp)
    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("NODE_ENV") == "development")
