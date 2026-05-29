"""
OpenTelemetry spans + Langfuse integration.
Call span() as a context manager around any timed operation.
"""
import os
import time
from contextlib import contextmanager
from typing import Generator, Any
import structlog

log = structlog.get_logger()

try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    provider = TracerProvider()
    if os.environ.get("OTLP_ENDPOINT"):
        provider.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(
                endpoint=os.environ["OTLP_ENDPOINT"]
            ))
        )
    trace.set_tracer_provider(provider)
    _tracer = trace.get_tracer("voxa")
    _otel_available = True
except ImportError:
    _otel_available = False

@contextmanager
def span(name: str, attributes: dict[str, Any] | None = None) -> Generator:
    """Context manager that times the block and emits an OTel span if configured."""
    t0 = time.perf_counter()
    if _otel_available:
        with _tracer.start_as_current_span(name) as s:
            if attributes:
                for k, v in attributes.items():
                    s.set_attribute(k, str(v))
            yield s
    else:
        yield None
    elapsed_ms = (time.perf_counter() - t0) * 1000
    log.debug("span", name=name, elapsed_ms=round(elapsed_ms, 1), **(attributes or {}))
