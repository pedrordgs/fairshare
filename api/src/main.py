from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlmodel import SQLModel

from core.dependencies import engine
from auth.router import router as auth_router
from core.router import router as core_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - creates database tables on startup."""
    # Import models to ensure they are registered with SQLModel
    import auth.models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(
    title="FairShare API",
    description="Backend API for the FairShare expense splitting application",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(core_router)
app.include_router(auth_router)
