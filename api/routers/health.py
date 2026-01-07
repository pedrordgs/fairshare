from typing import Literal
from fastapi import APIRouter

router = APIRouter(prefix="/health")


@router.get("/alive/")
async def alive() -> Literal["ok"]:
    return "ok"
