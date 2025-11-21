"""Modal deployment script for VARC service."""

import modal
import os

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("build-essential", "curl", "git")
    .pip_install(
        "fastapi>=0.104.1",
        "uvicorn[standard]>=0.24.0",
        "pydantic>=2.5.0",
        "torch>=2.1.0",
        "faiss-cpu>=1.7.4",
        "numpy>=1.24.0",
        "httpx>=0.25.0",
        "python-dotenv>=1.0.0",
        "sentry-sdk>=1.38.0",
        "pillow>=10.1.0",
    )
)

app = modal.App("varc-service")


@app.function(
    image=image,
    gpu=modal.gpu.T4(count=1),
    secrets=[
        modal.Secret.from_name("varc-secrets"),
    ],
    container_idle_timeout=300,
    timeout=600,
)
@modal.asgi_app()
def fastapi_app():
    import sys
    import os

    sys.path.insert(0, "/root")
    os.environ["PYTHONPATH"] = "/root"

    from services.varc_service.main import app

    return app


if __name__ == "__main__":
    app.deploy("varc-service")

