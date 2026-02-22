from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from loguru import logger
import os

from app.api.routes import patients, vitals, alerts, assistant, analytics
from app.core.config import settings

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Smart Health – Chronic Care Platform",
    description=(
        "A unified prototype for remote patient monitoring, predictive risk scoring, "
        "automated alerting, and virtual health assistance. "
        "Solves the problem of chronic disease patients deteriorating silently between clinic visits."
    ),
    version="1.0.0",
    contact={"name": "Smart Health Team"},
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS – allow all origins for demo / local development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(patients.router)
app.include_router(vitals.router)
app.include_router(alerts.router)
app.include_router(assistant.router)
app.include_router(analytics.router)

# ---------------------------------------------------------------------------
# Static frontend (optional – served if frontend/ directory exists)
# ---------------------------------------------------------------------------
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/app", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
    logger.info(f"Frontend mounted from {FRONTEND_DIR}")


# ---------------------------------------------------------------------------
# Root & health check
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0",
    }


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(application):
    logger.info(f"🚀 {settings.APP_NAME} starting…")
    yield
    logger.info(f"🔴 {settings.APP_NAME} shutting down.")

# Attach lifespan to the app
app.router.lifespan_context = lifespan