from typing import Literal
from fastapi import APIRouter

router = APIRouter(prefix="/-")


@router.get("/alive/")
async def alive() -> Literal["ok"]:
    return "ok"
