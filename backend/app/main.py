"""
AI Privacy Layer — FastAPI application entry point.
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.storage.session_store import SessionStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Background periodic session & temp file cleanup task
    async def cleanup_loop():
        while True:
            try:
                await asyncio.sleep(300)  # Every 5 minutes
                store = SessionStore.get_instance()
                store.cleanup_expired()
                store.cleanup_stale_disk_files()
            except asyncio.CancelledError:
                break
            except Exception:
                pass

    cleaner_task = asyncio.create_task(cleanup_loop())
    yield
    cleaner_task.cancel()
    try:
        await cleaner_task
    except asyncio.CancelledError:
        pass
    SessionStore.get_instance().cleanup_expired()


app = FastAPI(
    title="AI Privacy Layer API",
    description="Privacy-processing pipeline — detects and sanitizes PII before AI handoff.",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Restricted to the Vite dev-server origin during development.
# Update CORS_ORIGIN in .env before any multi-user or public deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Accept"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")

