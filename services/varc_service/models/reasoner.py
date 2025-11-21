"""Reasoning components for VARC: directional embeddings, cascaded decoder, cross-attention."""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional, Tuple, Any
import time


class DirectionalEmbeddingProjector(nn.Module):
    """
    Maps base embeddings into directional space (quality vs counterfeit axes).

    Projects 768-dim embeddings into a lower-dimensional directional space
    that emphasizes quality and authenticity signals.
    """

    def __init__(
        self,
        input_dim: int = 768,
        directional_dim: int = 256,
    ):
        super().__init__()
        self.input_dim = input_dim
        self.directional_dim = directional_dim

        # Quality axis projection
        self.quality_proj = nn.Sequential(
            nn.Linear(input_dim, directional_dim),
            nn.LayerNorm(directional_dim),
            nn.GELU(),
            nn.Linear(directional_dim, directional_dim),
        )

        # Counterfeit axis projection
        self.counterfeit_proj = nn.Sequential(
            nn.Linear(input_dim, directional_dim),
            nn.LayerNorm(directional_dim),
            nn.GELU(),
            nn.Linear(directional_dim, directional_dim),
        )

        # Combined projection
        self.combined_proj = nn.Linear(input_dim, directional_dim)

    def forward(
        self, embedding: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Project embedding into directional space.

        Args:
            embedding: Input embedding of shape (batch_size, input_dim)

        Returns:
            Tuple of (quality_axis, counterfeit_axis, combined)
        """
        quality_axis = self.quality_proj(embedding)
        counterfeit_axis = self.counterfeit_proj(embedding)
        combined = self.combined_proj(embedding)

        return quality_axis, counterfeit_axis, combined


class KnowledgeGuidedCrossAttention(nn.Module):
    """
    Cross-attention mechanism that refines query embedding using retrieved neighbors.

    Takes query embedding (current card) and key/value embeddings from FAISS neighbors
    to produce a refined, knowledge-enhanced embedding.
    """

    def __init__(
        self,
        embed_dim: int = 768,
        num_heads: int = 8,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads

        self.norm_query = nn.LayerNorm(embed_dim)
        self.norm_kv = nn.LayerNorm(embed_dim)

        self.cross_attn = nn.MultiheadAttention(
            embed_dim,
            num_heads,
            dropout=dropout,
            batch_first=True,
        )

        self.output_proj = nn.Sequential(
            nn.Linear(embed_dim, embed_dim),
            nn.LayerNorm(embed_dim),
            nn.Dropout(dropout),
        )

    def forward(
        self,
        query_embedding: torch.Tensor,
        neighbor_embeddings: Optional[torch.Tensor] = None,
        neighbor_metadata: Optional[List[Dict[str, Any]]] = None,
    ) -> torch.Tensor:
        """
        Refine query embedding using neighbor knowledge.

        Args:
            query_embedding: Query embedding of shape (batch_size, embed_dim)
            neighbor_embeddings: Optional neighbor embeddings (batch_size, num_neighbors, embed_dim)
            neighbor_metadata: Optional metadata for neighbors

        Returns:
            Refined embedding of shape (batch_size, embed_dim)
        """
        query_norm = self.norm_query(query_embedding)
        query_expanded = query_norm.unsqueeze(1)  # (B, 1, embed_dim)

        if neighbor_embeddings is not None and neighbor_embeddings.shape[1] > 0:
            # Use neighbors as keys/values
            kv_norm = self.norm_kv(neighbor_embeddings)
            attn_out, attn_weights = self.cross_attn(
                query_expanded, kv_norm, kv_norm
            )
            refined = attn_out.squeeze(1)  # (B, embed_dim)
        else:
            # No neighbors, return query as-is
            refined = query_norm

        # Output projection with residual
        output = self.output_proj(refined) + query_embedding

        return output


class CascadedDecoder(nn.Module):
    """
    Cascaded decoder that predicts grade, confidence, and counterfeit score.

    Takes refined embeddings (and optional neighbor info) and produces
    final predictions through a multi-stage MLP.
    """

    def __init__(
        self,
        input_dim: int = 768,
        hidden_dim: int = 512,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.input_dim = input_dim

        # Stage 1: Feature extraction
        self.feature_extractor = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.LayerNorm(hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout),
        )

        # Stage 2: Grade prediction
        self.grade_head = nn.Sequential(
            nn.Linear(hidden_dim // 2, hidden_dim // 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 4, 1),
            nn.Sigmoid(),  # Output 0-1, will scale to desired range
        )

        # Stage 3: Confidence prediction
        self.confidence_head = nn.Sequential(
            nn.Linear(hidden_dim // 2, hidden_dim // 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 4, 1),
            nn.Sigmoid(),  # 0-1 confidence
        )

        # Stage 4: Counterfeit detection
        self.counterfeit_head = nn.Sequential(
            nn.Linear(hidden_dim // 2, hidden_dim // 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 4, 1),
            nn.Sigmoid(),  # 0-1 counterfeit score
        )

    def forward(
        self, refined_embedding: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Predict grade, confidence, and counterfeit score.

        Args:
            refined_embedding: Refined embedding of shape (batch_size, input_dim)

        Returns:
            Tuple of (grade, confidence, counterfeit_score)
            All outputs are in [0, 1] range
        """
        features = self.feature_extractor(refined_embedding)

        grade = self.grade_head(features)  # (B, 1)
        confidence = self.confidence_head(features)  # (B, 1)
        counterfeit_score = self.counterfeit_head(features)  # (B, 1)

        return grade.squeeze(-1), confidence.squeeze(-1), counterfeit_score.squeeze(-1)


class VarcReasoner(nn.Module):
    """
    High-level VARC reasoner combining all components.

    Takes image embedding and optional neighbor information to produce
    final predictions with reasoning trace.
    """

    def __init__(
        self,
        embed_dim: int = 768,
        device: str = "cpu",
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.device = device

        self.directional_projector = DirectionalEmbeddingProjector(
            input_dim=embed_dim,
        )
        self.cross_attention = KnowledgeGuidedCrossAttention(
            embed_dim=embed_dim,
        )
        self.decoder = CascadedDecoder(
            input_dim=embed_dim,
        )

        self.to(device)
        self.eval()

    def infer(
        self,
        image_embedding: torch.Tensor,
        neighbor_embeddings: Optional[torch.Tensor] = None,
        neighbor_metadata: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Perform inference and return predictions with reasoning trace.

        Args:
            image_embedding: Base vision embedding of shape (batch_size, embed_dim)
            neighbor_embeddings: Optional neighbor embeddings (batch_size, num_neighbors, embed_dim)
            neighbor_metadata: Optional metadata for neighbors
            metadata: Optional additional metadata

        Returns:
            Dictionary with:
                - grade: float (0-10 range)
                - grade_confidence: float (0-1)
                - counterfeit_score: float (0-1)
                - embedding768: List[float] (original embedding)
                - embedding1536: Optional[List[float]]
                - reasoning_trace: Dict with detailed reasoning info
        """
        start_time = time.time()

        # Move to device
        image_embedding = image_embedding.to(self.device)
        if neighbor_embeddings is not None:
            neighbor_embeddings = neighbor_embeddings.to(self.device)

        # Step 1: Directional projection
        quality_axis, counterfeit_axis, combined = self.directional_projector(
            image_embedding
        )

        # Step 2: Knowledge-guided cross-attention
        refined_embedding = self.cross_attention(
            image_embedding,
            neighbor_embeddings,
            neighbor_metadata,
        )

        # Step 3: Cascaded decoding
        grade_raw, confidence_raw, counterfeit_raw = self.decoder(refined_embedding)

        # Convert to numpy/cpu for output
        image_embedding_cpu = image_embedding.detach().cpu()
        grade_raw_cpu = grade_raw.detach().cpu()
        confidence_raw_cpu = confidence_raw.detach().cpu()
        counterfeit_raw_cpu = counterfeit_raw.detach().cpu()

        # Scale grade to 0-10 range
        grade = float(grade_raw_cpu.item() * 10.0)
        grade_confidence = float(confidence_raw_cpu.item())
        counterfeit_score = float(counterfeit_raw_cpu.item())

        # Extract embeddings
        embedding768 = image_embedding_cpu.squeeze(0).tolist()

        # For embedding1536, we could project the refined embedding
        # For now, return None (can be extended later)
        embedding1536 = None

        # Build reasoning trace
        processing_time_ms = (time.time() - start_time) * 1000.0

        reasoning_trace = {
            "neighborIds": [],
            "neighborDistances": [],
            "neighbors": [],
            "intermediateScores": {
                "quality_axis_norm": float(
                    torch.norm(quality_axis).detach().cpu().item()
                ),
                "counterfeit_axis_norm": float(
                    torch.norm(counterfeit_axis).detach().cpu().item()
                ),
                "refined_embedding_norm": float(
                    torch.norm(refined_embedding).detach().cpu().item()
                ),
            },
            "mainFactors": self._extract_main_factors(
                grade, grade_confidence, counterfeit_score
            ),
            "processingTimeMs": processing_time_ms,
        }

        # Add neighbor info if available
        if neighbor_metadata:
            for neighbor in neighbor_metadata:
                reasoning_trace["neighborIds"].append(
                    neighbor.get("neighborId", "unknown")
                )
                reasoning_trace["neighborDistances"].append(
                    neighbor.get("distance", 0.0)
                )
                reasoning_trace["neighbors"].append(neighbor)

        return {
            "grade": grade,
            "grade_confidence": grade_confidence,
            "counterfeit_score": counterfeit_score,
            "embedding768": embedding768,
            "embedding1536": embedding1536,
            "reasoning_trace": reasoning_trace,
        }

    def _extract_main_factors(
        self, grade: float, confidence: float, counterfeit_score: float
    ) -> List[str]:
        """Extract main factors influencing the decision."""
        factors = []

        if grade >= 9.0:
            factors.append("high_grade_score")
        elif grade >= 7.0:
            factors.append("medium_grade_score")
        else:
            factors.append("low_grade_score")

        if confidence >= 0.8:
            factors.append("high_confidence")
        elif confidence >= 0.6:
            factors.append("medium_confidence")
        else:
            factors.append("low_confidence")

        if counterfeit_score < 0.2:
            factors.append("low_counterfeit_risk")
        elif counterfeit_score < 0.5:
            factors.append("medium_counterfeit_risk")
        else:
            factors.append("high_counterfeit_risk")

        return factors


def create_reasoner(
    embed_dim: int = 768,
    device: str = "cpu",
) -> VarcReasoner:
    """
    Create a VARC reasoner instance.

    Args:
        embed_dim: Embedding dimension (default 768)
        device: PyTorch device

    Returns:
        Initialized VarcReasoner
    """
    reasoner = VarcReasoner(embed_dim=embed_dim, device=device)
    return reasoner

