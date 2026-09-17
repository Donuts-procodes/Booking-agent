from fastapi import APIRouter, Depends

from app.api.deps import verify_admin_key
from app.api.v1.endpoints import (
    admin,
    auth,
    bookings,
    catalog,
    chat,
    config,
    feedback,
    staff,
)

api_v1_router = APIRouter()

# ── 1. Customer / Public User Routes ──
user_router = APIRouter(prefix="/user", tags=["User / Customer"])
user_router.include_router(chat.router, prefix="/chat")
user_router.include_router(catalog.router, prefix="/catalog")
user_router.include_router(bookings.router, prefix="/bookings")
user_router.include_router(feedback.router, prefix="/feedback")

# ── 2. Staff Operator Routes ──
staff_portal_router = APIRouter(prefix="/staff", tags=["Staff Portal"])
staff_portal_router.include_router(auth.router, prefix="/auth")
staff_portal_router.include_router(staff.router, prefix="")

# ── 3. Merchant Administrator Routes (Locked down with verify_admin_key) ──
admin_portal_router = APIRouter(
    prefix="/admin",
    tags=["Merchant Admin"],
    dependencies=[Depends(verify_admin_key)],
)
admin_portal_router.include_router(admin.router, prefix="")
admin_portal_router.include_router(config.router, prefix="/config")

# Include segregated route domains
api_v1_router.include_router(user_router)
api_v1_router.include_router(staff_portal_router)
api_v1_router.include_router(admin_portal_router)

# Backward-compatibility routes for existing API clients
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Auth (Legacy)"])
api_v1_router.include_router(catalog.router, prefix="/categories", tags=["Catalog (Legacy)"])
api_v1_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings (Legacy)"])
api_v1_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback (Legacy)"])
api_v1_router.include_router(chat.router, prefix="/chat", tags=["AI Chat (Customer)"])
api_v1_router.include_router(config.router, prefix="/config", tags=["Config (Legacy)"])
