# Spa Ceylon Backend

This is the FastAPI backend for the Spa Ceylon project.

## 1. Setup Environment

Open a terminal in the `backend` directory and run:

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

## 2. Database Configuration

1. Create a PostgreSQL database named `spa_ceylon_db`.
2. Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

3. Open `.env` and update the `DATABASE_URL` with your PostgreSQL credentials:
`DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/spa_ceylon_db`

## 3. Database Migrations

Run definitions to create tables:

```powershell
# Generate migration script
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## 4. Run Server

```powershell
uvicorn app.main:app --reload --port 8000
```

## 5. API Documentation

Open your browser and navigate to:
http://localhost:8000/docs
