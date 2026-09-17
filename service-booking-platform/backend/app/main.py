import logging
import time
from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.config import settings
from app.core.logging import setup_logging

logger = logging.getLogger("app.api")


# Middleware logging every incoming HTTP request method, path, response status, and processing duration
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        client_host = request.client.host if request.client else "unknown"
        logger.info(
            "[HTTP_IN] %s %s (from %s)",
            request.method,
            request.url.path,
            client_host,
        )

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.info(
                "[HTTP_OUT] %s %s -> %d [took %sms]",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )
            return response
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.exception(
                "[HTTP_OUT] %s %s -> FAILED after %sms: %s",
                request.method,
                request.url.path,
                duration_ms,
                str(exc),
            )
            raise


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    logger.info("Starting %s [env=%s]", settings.PROJECT_NAME, settings.ENVIRONMENT)

    # Initialize Milvus vector DB connection & collections
    try:
        from app.rag.client import connect_milvus, disconnect_milvus
        from app.rag.milvus_collections import ensure_collections
        connect_milvus()
        ensure_collections()
    except Exception as exc:
        logger.warning("Milvus vector DB startup skipped: %s", exc)

    yield

    try:
        from app.rag.client import disconnect_milvus
        disconnect_milvus()
    except Exception:
        pass
    logger.info("Shutting down %s", settings.PROJECT_NAME)



from fastapi.responses import RedirectResponse

def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url="/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    application.add_middleware(RequestLoggingMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @application.get("/docs-redirect", include_in_schema=False)
    @application.get(f"{settings.API_V1_STR}/docs", include_in_schema=False)
    async def docs_redirect() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    from app.api.v1.router import api_v1_router

    application.include_router(api_v1_router, prefix=settings.API_V1_STR)

    return application


app = create_app()
