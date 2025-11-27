"""Vision Transformer model for card image feature extraction."""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Optional


class PatchEmbedding(nn.Module):
    """Patch embedding layer that converts image patches to tokens."""

    def __init__(
        self,
        img_size: int = 224,
        patch_size: int = 16,
        in_channels: int = 3,
        embed_dim: int = 768,
    ):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.n_patches = (img_size // patch_size) ** 2

        self.projection = nn.Conv2d(
            in_channels,
            embed_dim,
            kernel_size=patch_size,
            stride=patch_size,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass: convert image to patch embeddings.

        Args:
            x: Input tensor of shape (batch_size, channels, height, width)

        Returns:
            Patch embeddings of shape (batch_size, n_patches, embed_dim)
        """
        x = self.projection(x)  # (B, embed_dim, H', W')
        B, C, H, W = x.shape
        x = x.flatten(2).transpose(1, 2)  # (B, n_patches, embed_dim)
        return x


class TransformerEncoderBlock(nn.Module):
    """Single transformer encoder block with self-attention and feedforward."""

    def __init__(
        self,
        embed_dim: int = 768,
        num_heads: int = 12,
        mlp_ratio: float = 4.0,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads

        # Self-attention
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = nn.MultiheadAttention(
            embed_dim,
            num_heads,
            dropout=dropout,
            batch_first=True,
        )

        # Feedforward
        self.norm2 = nn.LayerNorm(embed_dim)
        mlp_hidden_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden_dim, embed_dim),
            nn.Dropout(dropout),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through transformer encoder block.

        Args:
            x: Input tensor of shape (batch_size, seq_len, embed_dim)

        Returns:
            Output tensor of same shape
        """
        # Self-attention with residual
        x_norm = self.norm1(x)
        attn_out, _ = self.attn(x_norm, x_norm, x_norm)
        x = x + attn_out

        # Feedforward with residual
        x = x + self.mlp(self.norm2(x))

        return x


class VisionTransformer(nn.Module):
    """
    Compact Vision Transformer for card image feature extraction.

    Produces 768-dimensional embeddings suitable for FAISS indexing.
    """

    def __init__(
        self,
        img_size: int = 224,
        patch_size: int = 16,
        in_channels: int = 3,
        embed_dim: int = 768,
        num_layers: int = 6,
        num_heads: int = 12,
        mlp_ratio: float = 4.0,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.img_size = img_size
        self.patch_size = patch_size

        # Patch embedding
        self.patch_embed = PatchEmbedding(
            img_size, patch_size, in_channels, embed_dim
        )
        num_patches = self.patch_embed.n_patches

        # Class token and position embedding
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(
            torch.randn(1, num_patches + 1, embed_dim)
        )
        self.dropout = nn.Dropout(dropout)

        # Transformer encoder blocks
        self.blocks = nn.ModuleList([
            TransformerEncoderBlock(
                embed_dim, num_heads, mlp_ratio, dropout
            )
            for _ in range(num_layers)
        ])

        # Final layer norm
        self.norm = nn.LayerNorm(embed_dim)

        # Initialize weights
        self._init_weights()

    def _init_weights(self):
        """Initialize model weights."""
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

        for block in self.blocks:
            for module in block.modules():
                if isinstance(module, nn.Linear):
                    nn.init.trunc_normal_(module.weight, std=0.02)
                    if module.bias is not None:
                        nn.init.constant_(module.bias, 0)
                elif isinstance(module, nn.LayerNorm):
                    nn.init.constant_(module.bias, 0)
                    nn.init.constant_(module.weight, 1.0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass: extract 768-dimensional embedding from image.

        Args:
            x: Input tensor of shape (batch_size, channels, height, width)
               Expected to be preprocessed and normalized.

        Returns:
            Embedding tensor of shape (batch_size, embed_dim)
        """
        B = x.shape[0]

        # Patch embedding
        x = self.patch_embed(x)  # (B, n_patches, embed_dim)

        # Add class token
        cls_tokens = self.cls_token.expand(B, -1, -1)  # (B, 1, embed_dim)
        x = torch.cat([cls_tokens, x], dim=1)  # (B, n_patches + 1, embed_dim)

        # Add position embedding
        x = x + self.pos_embed
        x = self.dropout(x)

        # Apply transformer blocks
        for block in self.blocks:
            x = block(x)

        # Final layer norm
        x = self.norm(x)

        # Extract class token as global embedding
        embedding = x[:, 0]  # (B, embed_dim)

        return embedding

    def load_weights(self, weights_path: str):
        """Load model weights from file."""
        state_dict = torch.load(weights_path, map_location="cpu")
        self.load_state_dict(state_dict, strict=False)


def create_vision_model(
    embed_dim: int = 768,
    device: str = "cpu",
    weights_path: Optional[str] = None,
) -> VisionTransformer:
    """
    Create and optionally load a vision transformer model.

    Args:
        embed_dim: Embedding dimension (default 768)
        device: PyTorch device
        weights_path: Optional path to pretrained weights

    Returns:
        Initialized VisionTransformer model
    """
    model = VisionTransformer(embed_dim=embed_dim)
    model = model.to(device)
    model.eval()

    if weights_path:
        model.load_weights(weights_path)

    return model

