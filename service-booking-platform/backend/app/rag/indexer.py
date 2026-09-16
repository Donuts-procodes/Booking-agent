import logging
import uuid

from pymilvus import Collection

from app.rag.embeddings import generate_dense_embedding
from app.rag.milvus_collections import CATALOG_COLLECTION, KNOWLEDGE_COLLECTION

logger = logging.getLogger(__name__)

# Token window configuration for RAG document chunking (512 tokens with 10% sliding overlap)
CHUNK_SIZE = 512
CHUNK_OVERLAP_RATIO = 0.1


# Splits raw text documents into fixed-size overlapping sliding windows for dense vector embedding
def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap_ratio: float = CHUNK_OVERLAP_RATIO) -> list[str]:
    """Splits text into overlapping chunks by word count."""
    words = text.split()
    overlap = int(chunk_size * overlap_ratio)
    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap
    return chunks


# Generates a 1536-dim dense vector embedding for a service item and inserts it into Milvus catalog_semantic_idx
async def index_service_embedding(
    service_id: str,
    category_id: str,
    merchant_id: str,
    service_name: str,
    service_description: str,
) -> None:
    """Generates and upserts a service embedding into catalog_semantic_idx."""
    text = f"{service_name}: {service_description}"
    vector = await generate_dense_embedding(text)

    collection = Collection(CATALOG_COLLECTION)
    collection.insert([
        [service_id],
        [category_id],
        [merchant_id],
        [text[:2048]],
        [vector],
    ])
    collection.flush()
    logger.info("Indexed service %s into %s", service_id, CATALOG_COLLECTION)


# Ingests merchant knowledge docs (PDF/DOCX/TXT), splits into chunks, embeds, and writes to merchant_knowledge_idx
async def index_knowledge_document(
    merchant_id: str,
    doc_text: str,
) -> int:
    """Chunks a knowledge document, embeds each chunk, and inserts into merchant_knowledge_idx."""
    chunks = chunk_text(doc_text)
    doc_id = str(uuid.uuid4())
    collection = Collection(KNOWLEDGE_COLLECTION)

    for chunk in chunks:
        vector = await generate_dense_embedding(chunk)
        collection.insert([
            [doc_id],
            [merchant_id],
            [chunk[:4096]],
            [vector],
        ])

    collection.flush()
    logger.info("Indexed %d chunks for document %s into %s", len(chunks), doc_id, KNOWLEDGE_COLLECTION)
    return len(chunks)
