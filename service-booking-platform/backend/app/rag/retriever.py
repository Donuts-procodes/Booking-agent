import logging
from typing import Any

from pymilvus import Collection

from app.rag.embeddings import generate_dense_embedding
from app.rag.milvus_collections import CATALOG_COLLECTION, KNOWLEDGE_COLLECTION

logger = logging.getLogger(__name__)


class VectorRetriever:
    """Performs semantic catalog lookup and disambiguation queries."""

    # Matches customer natural language inquiry to catalog services via cosine similarity and checks for ambiguity
    @staticmethod
    async def match_catalog_intent(
        merchant_id: str,
        user_query: str,
        score_threshold: float = 0.78,
        ambiguity_delta: float = 0.06,
    ) -> dict[str, Any]:
        collection = Collection(CATALOG_COLLECTION)
        collection.load()

        vector = await generate_dense_embedding(user_query)
        search_params = {"metric_type": "COSINE", "params": {"ef": 64}}
        results = collection.search(
            data=[vector],
            anns_field="vector",
            param=search_params,
            limit=3,
            expr=f'merchant_id == "{merchant_id}"',
            output_fields=["service_id", "category_id", "text"],
        )

        if not results or len(results[0]) == 0:
            return {"match_type": "NONE", "service_ids": []}

        top_hit = results[0][0]
        if top_hit.distance < score_threshold:
            return {"match_type": "LOW_CONFIDENCE", "service_ids": []}

        if len(results[0]) > 1:
            second_hit = results[0][1]
            if (top_hit.distance - second_hit.distance) < ambiguity_delta:
                return {
                    "match_type": "AMBIGUOUS",
                    "service_ids": [hit.entity.get("service_id") for hit in results[0][:3]],
                    "options": [hit.entity.get("text") for hit in results[0][:3]],
                }

        return {
            "match_type": "EXACT",
            "service_id": top_hit.entity.get("service_id"),
        }

    # Retrieves top-k semantically relevant policy/business knowledge chunks for RAG question answering
    @staticmethod
    async def search_knowledge_base(
        merchant_id: str,
        query: str,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        collection = Collection(KNOWLEDGE_COLLECTION)
        collection.load()

        vector = await generate_dense_embedding(query)
        search_params = {"metric_type": "COSINE", "params": {"ef": 64}}
        results = collection.search(
            data=[vector],
            anns_field="vector",
            param=search_params,
            limit=top_k,
            expr=f'merchant_id == "{merchant_id}"',
            output_fields=["chunk_text", "doc_id"],
        )

        if not results or len(results[0]) == 0:
            return []

        return [
            {
                "chunk_text": hit.entity.get("chunk_text"),
                "doc_id": hit.entity.get("doc_id"),
                "score": hit.distance,
            }
            for hit in results[0]
        ]
