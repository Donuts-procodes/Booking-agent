import logging

from pymilvus import Collection, CollectionSchema, DataType, FieldSchema, utility

logger = logging.getLogger(__name__)

CATALOG_COLLECTION = "catalog_semantic_idx"
KNOWLEDGE_COLLECTION = "merchant_knowledge_idx"
VECTOR_DIM = 384


# Idempotently initializes all required Milvus semantic vector collections and HNSW indices
def ensure_collections() -> None:
    """Creates Milvus collections if they do not exist."""
    _ensure_catalog_collection()
    _ensure_knowledge_collection()


# Defines schema and HNSW cosine index for catalog semantic search collection
def _ensure_catalog_collection() -> None:
    if utility.has_collection(CATALOG_COLLECTION):
        logger.info("Collection %s already exists", CATALOG_COLLECTION)
        return

    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="service_id", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="category_id", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="merchant_id", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=2048),
        FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=VECTOR_DIM),
    ]
    schema = CollectionSchema(fields=fields, description="Catalog semantic search index")
    collection = Collection(name=CATALOG_COLLECTION, schema=schema)
    collection.create_index(
        field_name="vector",
        index_params={"index_type": "HNSW", "metric_type": "COSINE", "params": {"M": 16, "efConstruction": 200}},
    )
    logger.info("Created collection %s with HNSW index", CATALOG_COLLECTION)


# Defines schema and HNSW cosine index for merchant knowledge base document chunk collection
def _ensure_knowledge_collection() -> None:
    if utility.has_collection(KNOWLEDGE_COLLECTION):
        logger.info("Collection %s already exists", KNOWLEDGE_COLLECTION)
        return

    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="doc_id", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="merchant_id", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="chunk_text", dtype=DataType.VARCHAR, max_length=4096),
        FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=VECTOR_DIM),
    ]
    schema = CollectionSchema(fields=fields, description="Merchant knowledge base chunks")
    collection = Collection(name=KNOWLEDGE_COLLECTION, schema=schema)
    collection.create_index(
        field_name="vector",
        index_params={"index_type": "HNSW", "metric_type": "COSINE", "params": {"M": 16, "efConstruction": 200}},
    )
    logger.info("Created collection %s with HNSW index", KNOWLEDGE_COLLECTION)
