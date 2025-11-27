"""AWS SageMaker deployment script for VARC service."""

import boto3
import sagemaker
from sagemaker.pytorch import PyTorchModel
from sagemaker.predictor import Predictor
import json
import os

def deploy_varc_service(
    role: str,
    instance_type: str = "ml.g4dn.xlarge",
    endpoint_name: str = "varc-service",
    model_artifact_uri: str = None,
):
    """
    Deploy VARC service to SageMaker endpoint.

    Args:
        role: IAM role ARN for SageMaker
        instance_type: EC2 instance type (must support GPU)
        endpoint_name: Name for the endpoint
        model_artifact_uri: S3 URI for model artifacts (optional)
    """
    session = sagemaker.Session()
    
    image_uri = "763104351884.dkr.ecr.us-east-1.amazonaws.com/pytorch-inference:2.3.0-gpu-py311-cu118-ubuntu20.04-sagemaker"

    model = PyTorchModel(
        model_data=model_artifact_uri,
        role=role,
        image_uri=image_uri,
        entry_point="services/varc_service/main.py",
        framework_version="2.3.0",
        py_version="py311",
        env={
            "VARC_MODEL_PATH": os.environ.get("VARC_MODEL_PATH", ""),
            "FAISS_INDEX_PATH": os.environ.get("FAISS_INDEX_PATH", "/opt/ml/model/faiss_index.bin"),
            "DATABASE_URL": os.environ.get("DATABASE_URL", ""),
            "REDIS_URL": os.environ.get("REDIS_URL", ""),
            "SENTRY_DSN": os.environ.get("SENTRY_DSN", ""),
            "DEVICE": "cuda",
            "LOG_LEVEL": "INFO",
        },
    )

    predictor = model.deploy(
        initial_instance_count=1,
        instance_type=instance_type,
        endpoint_name=endpoint_name,
        wait=True,
    )

    print(f"Deployed VARC service to endpoint: {endpoint_name}")
    print(f"Endpoint ARN: {predictor.endpoint_name}")

    return predictor


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--role", required=True, help="IAM role ARN for SageMaker")
    parser.add_argument("--instance-type", default="ml.g4dn.xlarge", help="Instance type")
    parser.add_argument("--endpoint-name", default="varc-service", help="Endpoint name")
    parser.add_argument("--model-uri", help="S3 URI for model artifacts")

    args = parser.parse_args()

    deploy_varc_service(
        role=args.role,
        instance_type=args.instance_type,
        endpoint_name=args.endpoint_name,
        model_artifact_uri=args.model_uri,
    )

