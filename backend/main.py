import core.config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.api import router

app = FastAPI(title="3D Word Cloud API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=core.config.CORS_ORIGINS, 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)