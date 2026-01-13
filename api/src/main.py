from fastapi import FastAPI
from auth.router import router as auth_router
from core.router import router as core_router
from expenses.router import router as expenses_router
from groups.router import router as groups_router

app = FastAPI(
    title="FairShare API", description="Backend API for the FairShare expense splitting application", version="0.1.0"
)

app.include_router(core_router)
app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(expenses_router)
