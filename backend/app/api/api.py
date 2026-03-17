from fastapi import APIRouter
from app.api.endpoints import auth, services, availability, clinic, appointments, conversations, simulator, webhooks

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(availability.router, prefix="/availability", tags=["availability"])
api_router.include_router(clinic.router, prefix="/clinic", tags=["clinic"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["simulator"])
api_router.include_router(webhooks.router, prefix="/webhooks/meta", tags=["webhooks"])
