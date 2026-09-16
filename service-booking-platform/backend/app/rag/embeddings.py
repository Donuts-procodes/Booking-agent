import asyncio
import logging
from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

_embedding_model: TextEmbedding | None = None


# Lazily initializes singleton TextEmbedding model for BAAI / all-MiniLM-L6-v2
def _get_embedding_model() -> TextEmbedding:
    """Lazily loads all-MiniLM-L6-v2 ONNX weights (384 dims, fast CPU execution)."""
    global _embedding_model
    if _embedding_model is None:
        logger.info("Initializing fastembed with model: sentence-transformers/all-MiniLM-L6-v2")
        _embedding_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _embedding_model


# Generates 384-dimensional dense vector embeddings using local all-MiniLM-L6-v2
async def generate_dense_embedding(text: str) -> list[float]:
    """Generates a 384-dimensional dense vector for the given text using local all-MiniLM-L6-v2."""
    model = _get_embedding_model()
    # FastEmbed run in thread pool to avoid blocking async event loop
    embeddings = await asyncio.to_thread(lambda: list(model.embed([text])))
    return embeddings[0].tolist()
