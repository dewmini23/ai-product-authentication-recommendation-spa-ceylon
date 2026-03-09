from dotenv import load_dotenv
load_dotenv()  # loads variables from backend/.env into environment BEFORE settings is imported

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.routers import auth
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(api_router, prefix="/api")

# Mount static directories for file uploads
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles

BACKEND_DIR = Path(__file__).parent.parent  # points to backend/
UPLOAD_DIR = BACKEND_DIR / "uploads" / "products"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(BACKEND_DIR / "uploads")), name="uploads")

# Register Tags Router
from app.api.routers import tags
app.include_router(tags.router, prefix="/api")

# Register Recommendations Router
from app.api.routers import recommendations
app.include_router(recommendations.router, prefix="/api", tags=["recommendations"])

# Register ML Router
from app.api.routers import ml_routes
app.include_router(ml_routes.router, prefix="/api/ml", tags=["machine_learning"])

# Register Product Authentication Router (isolated — does not affect recommendation routes)
from app.api.routers import product_authentication
app.include_router(product_authentication.router, prefix="/api/authentication", tags=["product_authentication"])


@app.on_event("startup")
def load_ml_models():
    """Load machine learning models into memory."""
    from app.services.concern_classifier import concern_classifier
    logger.info("Initializing ML models...")
    concern_classifier.load_model()

@app.on_event("startup")
def test_database_connection():
    """Test database connection on startup."""
    from app.db.session import SessionLocal
    from sqlalchemy.exc import OperationalError
    from sqlalchemy import text
    import re

    try:
        db = SessionLocal()
        # Simple connection test
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection successful")
    except OperationalError as e:
        # Parse DATABASE_URL to show helpful info without password
        db_url = settings.DATABASE_URL
        # Extract components without password
        # Format: postgresql+psycopg2://user:pass@host:port/dbname
        match = re.match(r'postgresql\+psycopg2://([^:]+):[^@]+@([^:]+):(\d+)/(.+)', db_url)
        if match:
            user, host, port, dbname = match.groups()
            error_msg = (
                f"Database connection failed.\n"
                f"  Host: {host}\n"
                f"  Port: {port}\n"
                f"  Database: {dbname}\n"
                f"  User: {user}\n"
                f"Please check your DATABASE_URL credentials and ensure PostgreSQL is running."
            )
        else:
            error_msg = "Database connection failed. Check DATABASE_URL format and credentials."

        raise RuntimeError(error_msg) from e
    except Exception as e:
        raise RuntimeError(f"Database connection test failed: {str(e)}") from e


@app.on_event("startup")
def seed_admin_user():
    """Create admin user on startup if not exists."""
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.utils.security import hash_password

    # SECURITY: Fail fast if admin credentials are not provided
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        raise RuntimeError(
            "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables. "
            "The application cannot start without secure admin credentials."
        )

    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()

        if not admin:
            admin = User(
                full_name=settings.ADMIN_FULL_NAME,
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role=User.ROLE_ADMIN
            )
            db.add(admin)
            db.commit()
            logger.info(f"Admin user created: {settings.ADMIN_EMAIL}")
        else:
            logger.info(f"Admin user already exists: {settings.ADMIN_EMAIL}")
    except Exception as e:
        logger.error(f"Error seeding admin: {e}")
        db.rollback()
        raise  # Re-raise to prevent app from starting with broken admin setup
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "Welcome to Spa Ceylon Backend"}
