import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/spa_ceylon_db")
    PROJECT_NAME: str = "Spa Ceylon Backend"
    
    # JWT Configuration
    JWT_SECRET_KEY: str | None = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Admin Seeding Configuration
    # SECURITY: These MUST be set in environment variables
    # Application will fail to start if these are not provided
    ADMIN_EMAIL: str | None = os.getenv("ADMIN_EMAIL")
    ADMIN_PASSWORD: str | None = os.getenv("ADMIN_PASSWORD")
    ADMIN_FULL_NAME: str = os.getenv("ADMIN_FULL_NAME", "Spa Ceylon Admin")

settings = Settings()
