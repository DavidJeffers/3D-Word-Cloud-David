import os
from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS_ORIGINS = [FRONTEND_URL]

GEMINI_MODEL = "gemini-2.5-flash"