from fastapi import FastAPI
from routers import health

app = FastAPI(title="FairShare API")

app.include_router(health.router)
