"""FAISS-based experience pool for similarity search."""

import os
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
import sys
from pathlib import Path
import faiss

# Import from parent directory
_parent_dir = Path(__file__).parent.parent
if str(_parent_dir) not in sys.path:
    sys.path.insert(0, str(_parent_dir))

from config import settings
from logging_config import get_logger

logger = get_logger(__name__)


class FAISSPool:
    """FAISS index for storing and querying experience embeddings."""

    def __init__(self, dimension: Optional[int] = None, index_path: Optional[str] = None):
        """
        Initialize FAISS index.

        Args:
            dimension: Embedding dimension (defaults to config)
            index_path: Path to persisted index (defaults to config)
        """
        self.dimension = dimension or settings.faiss_dimension
        self.index_path = index_path or settings.experience_index_path
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict[str, Any]] = []

        self._initialize_index()

    def _initialize_index(self):
        """Initialize or load FAISS index."""
        if os.path.exists(self.index_path):
            try:
                logger.info(f"Loading FAISS index from {self.index_path}")
                self.index = faiss.read_index(self.index_path)
                logger.info(f"Loaded index with {self.index.ntotal} vectors")
            except Exception as e:
                logger.warning(f"Failed to load index: {e}. Creating new index.")
                self._create_new_index()
        else:
            logger.info("Creating new FAISS index")
            self._create_new_index()

    def _create_new_index(self):
        """Create a new FAISS index."""
        # Use L2 distance (Euclidean) - can be changed to cosine similarity if needed
        self.index = faiss.IndexFlatL2(self.dimension)

    def add_experience(
        self,
        embedding: np.ndarray,
        metadata: Dict[str, Any],
    ) -> None:
        """
        Add experience to the pool.

        Args:
            embedding: Embedding vector (1D array of shape (dimension,))
            metadata: Metadata associated with this experience
        """
        if embedding.shape != (self.dimension,):
            raise ValueError(
                f"Embedding shape {embedding.shape} does not match dimension {self.dimension}"
            )

        # Ensure embedding is float32 and contiguous
        embedding = np.ascontiguousarray(embedding.astype(np.float32)).reshape(1, -1)

        self.index.add(embedding)
        self.metadata.append(metadata)
        logger.debug(f"Added experience to pool. Total: {self.index.ntotal}")

    def query_similar(
        self,
        embedding: np.ndarray,
        k: int = 10,
    ) -> List[Tuple[Dict[str, Any], float]]:
        """
        Query for similar experiences.

        Args:
            embedding: Query embedding vector
            k: Number of similar experiences to return

        Returns:
            List of (metadata, distance) tuples, sorted by distance
        """
        if self.index.ntotal == 0:
            return []

        # Ensure embedding is float32 and contiguous
        embedding = np.ascontiguousarray(embedding.astype(np.float32)).reshape(1, -1)

        k = min(k, self.index.ntotal)
        distances, indices = self.index.search(embedding, k)

        results = []
        for i, (idx, dist) in enumerate(zip(indices[0], distances[0])):
            if idx < len(self.metadata):
                results.append((self.metadata[idx], float(dist)))

        return results

    def save(self, path: Optional[str] = None) -> None:
        """
        Save index to disk.

        Args:
            path: Optional path to save to (defaults to config path)
        """
        save_path = path or self.index_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        faiss.write_index(self.index, save_path)
        logger.info(f"Saved FAISS index to {save_path}")

    def get_size(self) -> int:
        """Get number of experiences in the pool."""
        return self.index.ntotal

