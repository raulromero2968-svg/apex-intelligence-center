"""FAISS index manager for similarity search and embedding storage."""

import os
import pickle
import json
from typing import List, Optional, Dict, Any
import numpy as np
import faiss
from dataclasses import dataclass


@dataclass
class Neighbor:
    """Represents a neighbor retrieved from FAISS index."""

    neighbor_id: str
    distance: float
    metadata: Dict[str, Any]


class IndexManager:
    """
    Manages FAISS index and associated metadata.

    Uses FAISS for efficient similarity search and a simple JSON-based
    metadata store for neighbor information.
    """

    def __init__(
        self,
        index_path: str,
        metadata_path: Optional[str] = None,
        dimension: int = 768,
    ):
        """
        Initialize index manager.

        Args:
            index_path: Path to FAISS index file
            metadata_path: Path to JSON metadata file (defaults to index_path + .meta.json)
            dimension: Embedding dimension (default 768)
        """
        self.index_path = index_path
        self.metadata_path = metadata_path or (index_path + ".meta.json")
        self.dimension = dimension

        self.index: Optional[faiss.Index] = None
        self.metadata_map: Dict[str, Dict[str, Any]] = {}
        self.id_to_index: Dict[str, int] = {}  # Maps card_id to FAISS index position
        self.index_to_id: Dict[int, str] = {}  # Reverse mapping

    def load(self):
        """Load index and metadata from disk."""
        # Load FAISS index
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            if self.index.d != self.dimension:
                raise ValueError(
                    f"Index dimension mismatch: expected {self.dimension}, got {self.index.d}"
                )
        else:
            # Create new index
            self.index = faiss.IndexFlatL2(self.dimension)

        # Load metadata
        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, "r") as f:
                data = json.load(f)
                self.metadata_map = data.get("metadata_map", {})
                self.id_to_index = data.get("id_to_index", {})
                self.index_to_id = data.get("index_to_id", {})

    def save(self):
        """Save index and metadata to disk."""
        # Save FAISS index
        os.makedirs(os.path.dirname(self.index_path) or ".", exist_ok=True)
        faiss.write_index(self.index, self.index_path)

        # Save metadata
        data = {
            "metadata_map": self.metadata_map,
            "id_to_index": self.id_to_index,
            "index_to_id": self.index_to_id,
        }
        os.makedirs(os.path.dirname(self.metadata_path) or ".", exist_ok=True)
        with open(self.metadata_path, "w") as f:
            json.dump(data, f, indent=2)

    def query(
        self, embedding: np.ndarray, k: int = 5
    ) -> List[Neighbor]:
        """
        Query index for nearest neighbors.

        Args:
            embedding: Query embedding of shape (dimension,)
            k: Number of neighbors to retrieve

        Returns:
            List of Neighbor objects sorted by distance (ascending)
        """
        if self.index is None:
            self.load()

        if self.index.ntotal == 0:
            return []

        # Reshape to (1, dimension) for FAISS
        query = embedding.reshape(1, -1).astype(np.float32)

        # Search
        distances, indices = self.index.search(query, min(k, self.index.ntotal))

        # Build neighbor list
        neighbors = []
        for i, (distance, idx) in enumerate(
            zip(distances[0], indices[0])
        ):
            if idx == -1:  # FAISS returns -1 for invalid results
                continue

            neighbor_id = self.index_to_id.get(idx, f"unknown_{idx}")
            metadata = self.metadata_map.get(neighbor_id, {})

            neighbors.append(
                Neighbor(
                    neighbor_id=neighbor_id,
                    distance=float(distance),
                    metadata=metadata,
                )
            )

        return neighbors

    def upsert(
        self,
        card_id: str,
        embedding: np.ndarray,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        Insert or update embedding in index.

        Args:
            card_id: Unique identifier for the card
            embedding: Embedding vector of shape (dimension,)
            metadata: Optional metadata dictionary
        """
        if self.index is None:
            self.load()

        embedding = embedding.reshape(1, -1).astype(np.float32)

        if embedding.shape[1] != self.dimension:
            raise ValueError(
                f"Embedding dimension mismatch: expected {self.dimension}, got {embedding.shape[1]}"
            )

        # If card_id already exists, remove old entry
        if card_id in self.id_to_index:
            old_idx = self.id_to_index[card_id]
            # FAISS doesn't support deletion easily, so we'll mark it
            # For simplicity, we'll just overwrite the metadata
            # In production, consider using IndexIDMap for proper deletion
            pass

        # Add to index
        idx = self.index.ntotal
        self.index.add(embedding)

        # Update mappings
        self.id_to_index[card_id] = idx
        self.index_to_id[idx] = card_id

        # Store metadata
        self.metadata_map[card_id] = metadata or {}


# Global index manager instance
_index_manager: Optional[IndexManager] = None


def load_index(
    index_path: str,
    metadata_path: Optional[str] = None,
    dimension: int = 768,
) -> faiss.Index:
    """
    Load FAISS index from disk.

    Args:
        index_path: Path to FAISS index file
        metadata_path: Path to metadata file (optional)
        dimension: Expected embedding dimension

    Returns:
        Loaded FAISS index
    """
    global _index_manager
    _index_manager = IndexManager(index_path, metadata_path, dimension)
    _index_manager.load()
    return _index_manager.index


def save_index(index: faiss.Index, index_path: str, metadata_path: Optional[str] = None):
    """
    Save FAISS index to disk.

    Args:
        index: FAISS index to save
        index_path: Path to save index
        metadata_path: Path to save metadata (optional)
    """
    global _index_manager
    if _index_manager is None:
        _index_manager = IndexManager(index_path, metadata_path)
        _index_manager.index = index
    _index_manager.save()


def query_neighbors(
    embedding: np.ndarray,
    k: int = 5,
    index_path: Optional[str] = None,
    dimension: int = 768,
) -> List[Neighbor]:
    """
    Query FAISS index for nearest neighbors.

    Args:
        embedding: Query embedding vector
        k: Number of neighbors to retrieve
        index_path: Path to index file (uses global instance if None)
        dimension: Embedding dimension

    Returns:
        List of Neighbor objects
    """
    global _index_manager
    if _index_manager is None:
        if index_path is None:
            raise ValueError("Index not initialized and index_path not provided")
        _index_manager = IndexManager(index_path, dimension=dimension)
        _index_manager.load()

    return _index_manager.query(embedding, k)


def upsert_embedding(
    card_id: str,
    embedding: np.ndarray,
    metadata: Optional[Dict[str, Any]] = None,
    index_path: Optional[str] = None,
    dimension: int = 768,
):
    """
    Insert or update embedding in index.

    Args:
        card_id: Unique identifier for the card
        embedding: Embedding vector
        metadata: Optional metadata dictionary
        index_path: Path to index file (uses global instance if None)
        dimension: Embedding dimension
    """
    global _index_manager
    if _index_manager is None:
        if index_path is None:
            raise ValueError("Index not initialized and index_path not provided")
        _index_manager = IndexManager(index_path, dimension=dimension)
        _index_manager.load()

    _index_manager.upsert(card_id, embedding, metadata)

