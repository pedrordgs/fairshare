from fastapi import FastAPI
import logging
from auth.router import router as auth_router
from core.router import router as core_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="FairShare API", description="Backend API for the FairShare expense splitting application", version="0.1.0"
)

app.include_router(core_router)
app.include_router(auth_router)
