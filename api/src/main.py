from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth.router import router as auth_router
from core.router import router as core_router
from expenses.router import router as expenses_router
from groups.router import router as groups_router

app = FastAPI(
    title="FairShare API", description="Backend API for the FairShare expense splitting application", version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router)
app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(expenses_router)
