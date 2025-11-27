"""Modal deployment script for LAMP simulation service."""

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
        "python-dotenv>=1.0.0",
        "sentry-sdk>=1.38.0",
        "langgraph>=0.0.20",
        "langchain>=0.1.0",
        "ray[rllib]>=2.9.0",
        "pgvector>=0.2.0",
        "psycopg2-binary>=2.9.9",
    )
)

app = modal.App("lamp-sim")


@app.function(
    image=image,
    gpu=modal.gpu.T4(count=1),
    secrets=[
        modal.Secret.from_name("lamp-secrets"),
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

    from services.lamp_sim.main import app

    return app


if __name__ == "__main__":
    app.deploy("lamp-sim")

