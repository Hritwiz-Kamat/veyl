"""API v1 router — registers all endpoint sub-routers."""
from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.analysis import router as analysis_router
from app.api.v1.endpoints.sessions import router as sessions_router
from app.api.v1.endpoints.handoff import router as handoff_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(analysis_router)
api_router.include_router(sessions_router)
api_router.include_router(handoff_router)
