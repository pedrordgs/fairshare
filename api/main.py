from fastapi import FastAPI

from routers import health

app = FastAPI(
    title="FairShare API", description="Backend API for the FairShare expense splitting application", version="0.1.0"
)

app.include_router(health.router)
