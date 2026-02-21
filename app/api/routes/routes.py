from fastapi import APIRouter
from app.api.routes.patients import router as patients_router
from app.api.routes.vitals import router as vitals_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.assistant import router as assistant_router
from app.api.routes.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(patients_router)
api_router.include_router(vitals_router)
api_router.include_router(alerts_router)
api_router.include_router(assistant_router)
api_router.include_router(analytics_router)