import logging

from pymilvus import connections

from app.core.config import settings

logger = logging.getLogger(__name__)

milvus_client = None


# Establishes TCP connection to the standalone Milvus vector database service
def connect_milvus() -> None:
    global milvus_client
    try:
        connections.connect(
            alias="default",
            host=settings.MILVUS_HOST,
            port=settings.MILVUS_PORT,
        )
        milvus_client = "default"
        logger.info("Connected to Milvus at %s:%s", settings.MILVUS_HOST, settings.MILVUS_PORT)
    except Exception:
        logger.warning("Milvus connection failed — vector search will be unavailable", exc_info=True)


# Closes connection alias to Milvus vector database upon application shutdown
def disconnect_milvus() -> None:
    try:
        connections.disconnect("default")
        logger.info("Disconnected from Milvus")
    except Exception:
        logger.warning("Milvus disconnect error", exc_info=True)
