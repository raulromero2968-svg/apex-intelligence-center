"""Structured logging configuration for LAMP service."""

import logging
import sys
from typing import Optional
import json
from datetime import datetime


class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs structured JSON logs."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "service": getattr(record, "service", "lamp_sim"),
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add traceId if available
        trace_id = getattr(record, "traceId", None)
        if trace_id:
            log_data["traceId"] = trace_id

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add any extra fields
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)

        return json.dumps(log_data)


class TraceContextFilter(logging.Filter):
    """Filter that adds traceId from context when available."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Add traceId from context if not already present."""
        if not hasattr(record, "traceId"):
            pass
        return True


def setup_logging(
    service_name: str = "lamp_sim",
    log_level: str = "INFO",
    enable_structured: bool = True,
) -> logging.Logger:
    """
    Configure structured logging for the service.

    Args:
        service_name: Name of the service for log identification
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        enable_structured: Whether to use structured JSON logging

    Returns:
        Configured root logger
    """
    logger = logging.getLogger(service_name)
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Remove existing handlers
    logger.handlers.clear()

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    if enable_structured:
        formatter = StructuredFormatter()
        handler.setFormatter(formatter)
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)

    handler.addFilter(TraceContextFilter())
    logger.addHandler(handler)
    logger.propagate = False

    return logger


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance for the given name.

    Args:
        name: Logger name (defaults to 'lamp_sim')

    Returns:
        Logger instance
    """
    if name is None:
        name = "lamp_sim"
    return logging.getLogger(name)


class TraceLoggerAdapter(logging.LoggerAdapter):
    """Logger adapter that automatically includes traceId in logs."""

    def process(self, msg: str, kwargs: dict) -> tuple[str, dict]:
        """Process log message and add traceId to extra fields."""
        extra = kwargs.get("extra", {})
        trace_id = self.extra.get("traceId")
        if trace_id:
            extra["traceId"] = trace_id
            extra["service"] = self.extra.get("service", "lamp_sim")
            kwargs["extra"] = extra
        return msg, kwargs


def get_trace_logger(trace_id: Optional[str], service_name: str = "lamp_sim") -> TraceLoggerAdapter:
    """
    Get a trace-aware logger adapter.

    Args:
        trace_id: Trace ID to include in all logs
        service_name: Service name identifier

    Returns:
        Logger adapter with trace context
    """
    logger = get_logger(service_name)
    return TraceLoggerAdapter(logger, {"traceId": trace_id, "service": service_name})

