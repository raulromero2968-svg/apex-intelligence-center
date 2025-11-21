"""FastAPI application for VARC inference service."""

import io
import time
from typing import Optional
import numpy as np
import torch
from PIL import Image
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from config import settings
from logging_config import setup_logging, get_trace_logger
from schemas.requests import JobEnvelope
from schemas.responses import VarcInferenceResult, Embeddings, ReasoningTrace, NeighborInfo
from models.vision_model import create_vision_model
from models.reasoner import create_reasoner
from faiss_index.index_manager import IndexManager, query_neighbors


# Initialize logging
logger = setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    enable_structured=True,
)

# Initialize Sentry
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[
            FastApiIntegration(),
            LoggingIntegration(level=None, event_level=None),
        ],
        traces_sample_rate=0.1,
        environment="production",
        release=f"{settings.service_name}@1.0.0",
        before_send=lambda event, hint: {
            **event,
            "tags": {
                **event.get("tags", {}),
                "service": settings.service_name,
            },
        },
    )

app = FastAPI(
    title="VARC Inference Service",
    description="Vision-Aware Reasoning and Classification inference service",
    version="1.0.0",
)

# Global model instances (loaded at startup)
vision_model: Optional[torch.nn.Module] = None
reasoner: Optional[object] = None
index_manager: Optional[IndexManager] = None


def preprocess_image(image: Image.Image) -> torch.Tensor:
    """
    Preprocess PIL image for vision model.

    Args:
        image: PIL Image instance

    Returns:
        Preprocessed tensor of shape (1, 3, 224, 224)
    """
    # Resize to model input size
    image = image.resize((224, 224), Image.Resampling.LANCZOS)

    # Convert to RGB if needed
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Convert to tensor and normalize
    img_array = np.array(image).astype(np.float32) / 255.0
    img_array = img_array.transpose(2, 0, 1)  # HWC -> CHW

    # Normalize with ImageNet stats
    mean = np.array([0.485, 0.456, 0.406]).reshape(3, 1, 1)
    std = np.array([0.229, 0.224, 0.225]).reshape(3, 1, 1)
    img_array = (img_array - mean) / std

    # Convert to tensor and add batch dimension
    tensor = torch.from_numpy(img_array).unsqueeze(0)

    return tensor


async def download_image(image_url: str, timeout: int = 30) -> Image.Image:
    """
    Download image from URL.

    Args:
        image_url: URL of the image
        timeout: Request timeout in seconds

    Returns:
        PIL Image instance

    Raises:
        HTTPException: If download fails
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            max_size_bytes = settings.max_image_size_mb * 1024 * 1024
            response = await client.get(
                image_url,
                follow_redirects=True,
                headers={"User-Agent": "VARC-Service/1.0"},
            )
            response.raise_for_status()

            if len(response.content) > max_size_bytes:
                raise ValueError(
                    f"Image size {len(response.content)} bytes exceeds maximum {max_size_bytes} bytes"
                )

            image = Image.open(io.BytesIO(response.content))
            image.load()  # Load into memory

            return image

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download image: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}",
        )


@app.on_event("startup")
async def startup_event():
    """Initialize models and index on startup."""
    global vision_model, reasoner, index_manager

    logger.info("Starting VARC inference service...")

    try:
        # Load vision model
        logger.info(f"Loading vision model (device: {settings.device})...")
        vision_model = create_vision_model(
            embed_dim=768,
            device=settings.device,
            weights_path=settings.varc_model_path,
        )
        logger.info("Vision model loaded successfully")

        # Load reasoner
        logger.info("Loading reasoner...")
        reasoner = create_reasoner(
            embed_dim=768,
            device=settings.device,
        )
        logger.info("Reasoner loaded successfully")

        # Load FAISS index
        logger.info(f"Loading FAISS index from {settings.faiss_index_path}...")
        index_manager = IndexManager(
            index_path=settings.faiss_index_path,
            dimension=768,
        )
        index_manager.load()
        logger.info(f"FAISS index loaded: {index_manager.index.ntotal} vectors")

    except Exception as e:
        logger.error(f"Failed to initialize models: {e}", exc_info=True)
        if settings.sentry_dsn:
            sentry_sdk.capture_exception(e)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Save index on shutdown."""
    global index_manager

    if index_manager:
        try:
            logger.info("Saving FAISS index...")
            index_manager.save()
            logger.info("FAISS index saved successfully")
        except Exception as e:
            logger.error(f"Failed to save index: {e}", exc_info=True)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        model_loaded = vision_model is not None
        reasoner_loaded = reasoner is not None
        index_loaded = index_manager is not None and index_manager.index is not None

        status = {
            "status": "healthy" if (model_loaded and reasoner_loaded and index_loaded) else "degraded",
            "service": settings.service_name,
            "models": {
                "vision_model": model_loaded,
                "reasoner": reasoner_loaded,
                "faiss_index": index_loaded,
                "index_size": index_manager.index.ntotal if index_loaded else 0,
            },
        }

        status_code = 200 if status["status"] == "healthy" else 503
        return JSONResponse(content=status, status_code=status_code)

    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e),
            },
            status_code=503,
        )


@app.post("/infer", response_model=VarcInferenceResult)
async def infer(job: JobEnvelope):
    """
    Perform VARC inference on card image.

    Args:
        job: Job envelope containing image URL and metadata

    Returns:
        VarcInferenceResult with grade, confidence, embeddings, and reasoning trace
    """
    trace_logger = get_trace_logger(job.trace_id, settings.service_name)

    try:
        trace_logger.info(
            f"Processing inference job {job.job_id}",
            extra={"jobId": job.job_id, "imageUrl": str(job.payload.image_url)},
        )

        # Download image
        trace_logger.info("Downloading image...")
        image = await download_image(
            str(job.payload.image_url),
            timeout=settings.image_timeout_seconds,
        )

        # Preprocess image
        trace_logger.info("Preprocessing image...")
        image_tensor = preprocess_image(image)
        image_tensor = image_tensor.to(settings.device)

        # Extract vision embedding
        trace_logger.info("Extracting vision embedding...")
        with torch.no_grad():
            vision_embedding = vision_model(image_tensor)  # (1, 768)

        # Query FAISS index for neighbors
        trace_logger.info("Querying FAISS index for neighbors...")
        embedding_np = vision_embedding.cpu().numpy().squeeze(0)
        neighbors = index_manager.query(embedding_np, k=5)

        # Prepare neighbor embeddings if available
        neighbor_embeddings = None
        neighbor_metadata = []

        if neighbors:
            # For now, we'll use the query embedding itself as a placeholder
            # In production, you'd retrieve actual neighbor embeddings from the index
            # This requires storing embeddings alongside the index
            trace_logger.info(f"Found {len(neighbors)} neighbors")

            for neighbor in neighbors:
                neighbor_metadata.append({
                    "neighborId": neighbor.neighbor_id,
                    "distance": neighbor.distance,
                    "metadata": neighbor.metadata,
                })

        # Run reasoner
        trace_logger.info("Running reasoner...")
        with torch.no_grad():
            result = reasoner.infer(
                vision_embedding,
                neighbor_embeddings=neighbor_embeddings,
                neighbor_metadata=neighbor_metadata if neighbor_metadata else None,
                metadata=job.payload.extra_metadata,
            )

        # Build response
        response = VarcInferenceResult(
            jobId=job.job_id,
            traceId=job.trace_id,
            status="ok",
            grade=result["grade"],
            gradeConfidence=result["grade_confidence"],
            counterfeitScore=result["counterfeit_score"],
            embeddings=Embeddings(
                vision768=result["embedding768"],
                vision1536=result["embedding1536"],
            ),
            reasoningTrace=ReasoningTrace(
                neighborIds=[n["neighborId"] for n in neighbor_metadata],
                neighborDistances=[n["distance"] for n in neighbor_metadata],
                neighbors=[
                    NeighborInfo(
                        neighborId=n["neighborId"],
                        distance=n["distance"],
                        metadata=n["metadata"],
                    )
                    for n in neighbor_metadata
                ],
                intermediateScores=result["reasoning_trace"]["intermediateScores"],
                mainFactors=result["reasoning_trace"]["mainFactors"],
                processingTimeMs=result["reasoning_trace"]["processingTimeMs"],
            ),
            error=None,
        )

        trace_logger.info(
            f"Inference completed: grade={result['grade']:.2f}, "
            f"confidence={result['grade_confidence']:.2f}",
        )

        # Optionally update index with new embedding
        if job.payload.card_id:
            trace_logger.info(f"Upserting embedding for card {job.payload.card_id}")
            try:
                index_manager.upsert(
                    card_id=job.payload.card_id,
                    embedding=embedding_np,
                    metadata={
                        "grade": result["grade"],
                        "confidence": result["grade_confidence"],
                        "counterfeit_score": result["counterfeit_score"],
                        **job.payload.extra_metadata,
                    },
                )
            except Exception as e:
                trace_logger.warning(f"Failed to upsert embedding: {e}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        trace_logger.error(f"Inference failed: {error_msg}", exc_info=True)

        if settings.sentry_dsn:
            sentry_sdk.set_context("job", {
                "job_id": job.job_id,
                "trace_id": job.trace_id,
                "user_id": job.user_id,
            })
            sentry_sdk.capture_exception(e)

        return VarcInferenceResult(
            jobId=job.job_id,
            traceId=job.trace_id,
            status="error",
            grade=None,
            gradeConfidence=None,
            counterfeitScore=None,
            embeddings=None,
            reasoningTrace=None,
            error=error_msg,
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_config=None,  # Use our custom logging
        access_log=False,
    )

