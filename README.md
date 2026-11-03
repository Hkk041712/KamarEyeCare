# Kamar Eye Care

A web application for managing day-to-day work at an optical and eye-care shop. It brings account access, a dashboard, patient records, product inventory, sales, and expenses into one interface.

> This is a software project, not a clinical decision tool. Use synthetic data for development and demonstrations.

## Features

- Account sign-in and email verification
- Dashboard for shop activity
- Patient record management
- Product inventory and sales management
- Expense tracking
- React frontend backed by a Django REST API

## Technology

- **Frontend:** React, Vite, Axios, and React Router
- **Backend:** Python, Django, Django REST Framework, and Simple JWT
- **Database:** PostgreSQL when `DATABASE_URL` is configured; SQLite for local development

## Repository layout

```text
backend/     Django project and API
frontend/    React application
.github/     GitHub Actions workflows
```

## Run locally

You’ll need Python 3.10 or newer, Node.js, and npm.

### 1. Start the backend

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API runs at `http://127.0.0.1:8000`.

Set `DJANGO_SECRET_KEY` in your environment before deployment. Set `DATABASE_URL` to use PostgreSQL; without it, Django uses a local SQLite file that is ignored by Git.

### 2. Start the frontend

In another terminal:

```powershell
cd frontend
npm ci
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000/api"
npm run dev
```

Open the local address printed by Vite, usually `http://localhost:5173`.

## Deployment

The frontend is configured for GitHub Pages, and the backend includes a Render build script. Configure deployment secrets and environment variables in the hosting services; never commit `.env` files, database files, or credentials.

## Data and credentials

The repository intentionally excludes local databases and user records. Start with an empty database and run migrations. Do not use real patient information in development or public demonstrations.
