"""FAISS index management for similarity search."""

from .index_manager import (
    load_index,
    save_index,
    query_neighbors,
    upsert_embedding,
    Neighbor,
    IndexManager,
)

__all__ = [
    "load_index",
    "save_index",
    "query_neighbors",
    "upsert_embedding",
    "Neighbor",
    "IndexManager",
]

