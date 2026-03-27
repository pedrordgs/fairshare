from pathlib import Path
import sys

# Ensure absolute imports like "from auth.router import ..." resolve on Vercel.
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from main import app  # noqa: E402, F401
