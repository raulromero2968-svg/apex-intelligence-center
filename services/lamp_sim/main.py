"""FastAPI application for LAMP simulation service."""

import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from config import settings
from logging_config import setup_logging, get_trace_logger
from schemas.requests import JobEnvelope
from schemas.responses import LampSimulationResult, SimulationStep, AgentMessage, SimulationSummary
from lamp_core import create_lamp_graph, TCGMarketEnvironment, RLlibPolicyManager
from experience import FAISSPool, PostgresPool


logger = setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    enable_structured=True,
)

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
    title="LAMP Simulation Service",
    description="LangGraph + Multi-Agent Policy simulation service with SSE streaming",
    version="1.0.0",
)

faiss_pool: Optional[FAISSPool] = None
pg_pool: Optional[PostgresPool] = None
policy_manager: Optional[RLlibPolicyManager] = None


@app.on_event("startup")
async def startup_event():
    """Initialize models and services on startup."""
    global faiss_pool, pg_pool, policy_manager
    
    logger.info("Starting LAMP simulation service...")

    try:
        logger.info(f"Initializing policy manager (model_dir: {settings.lamp_model_dir})...")
        policy_manager = RLlibPolicyManager(
            model_dir=settings.lamp_model_dir,
            num_agents=settings.num_agents,
        )
        logger.info("Policy manager initialized successfully")

        faiss_pool = FAISSPool()
        logger.info("FAISS pool initialized")

        if settings.database_url:
            logger.info("Initializing Postgres pool...")
            pg_pool = PostgresPool(database_url=settings.database_url)
            logger.info("Postgres pool initialized successfully")
        else:
            logger.warning("No database URL provided, Postgres pool disabled")
            pg_pool = None

    except Exception as e:
        logger.error(f"Failed to initialize service: {e}", exc_info=True)
        if settings.sentry_dsn:
            sentry_sdk.capture_exception(e)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Save pools on shutdown."""
    if faiss_pool:
        try:
            faiss_pool.save()
            logger.info("FAISS pool saved")
        except Exception as e:
            logger.error(f"Failed to save FAISS pool: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check RLlib checkpoint load
        rllib_ok = policy_manager is not None and policy_manager._initialized
        
        # Check LangGraph wiring
        graph_ok = True
        try:
            test_graph = create_lamp_graph()
        except Exception:
            graph_ok = False
        
        # Check FAISS index
        faiss_ok = faiss_pool is not None and faiss_pool.index is not None
        
        # Check Postgres (optional)
        pg_ok = pg_pool is None or pg_pool.is_available()
        
        all_ok = rllib_ok and graph_ok and faiss_ok and pg_ok
        
        status = {
            "status": "healthy" if all_ok else "degraded",
            "service": settings.service_name,
            "checks": {
                "rllib": rllib_ok,
                "langgraph": graph_ok,
                "faiss": faiss_ok,
                "postgres": pg_ok,
            },
            "config": {
                "num_agents": settings.num_agents,
                "max_steps": settings.max_simulation_steps,
                "model_dir": settings.lamp_model_dir,
            },
        }
        return JSONResponse(content=status, status_code=200 if all_ok else 503)
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e),
            },
            status_code=503,
        )


async def run_simulation(envelope: JobEnvelope) -> LampSimulationResult:
    """Run simulation and return complete result."""
    trace_logger = get_trace_logger(envelope.trace_id, settings.service_name)
    simulation_id = str(uuid.uuid4())

    try:
        trace_logger.info(
            f"Starting simulation {simulation_id}",
            extra={
                "jobId": envelope.job_id,
                "scenarioId": envelope.payload.scenario_id,
            },
        )

        env = TCGMarketEnvironment(
            num_agents=settings.num_agents,
            num_cards=10,
            initial_cash=10000.0,
            scenario_id=envelope.payload.scenario_id,
            scenario_params=envelope.payload.parameters,
        )

        initial_state = env.reset()
        graph = create_lamp_graph()

        if policy_manager is None:
            raise RuntimeError("Policy manager not initialized. Service startup failed.")

        graph_state = {
            "step": 0,
            "state": initial_state,
            "agent_messages": [],
            "agent_thoughts": {},
            "historical_messages": [],
            "scenario_id": envelope.payload.scenario_id,
            "scenario_params": envelope.payload.parameters,
            "environment": env,
            "policy_manager": policy_manager,
        }

        steps = []
        current_state = graph_state
        step_count = 0
        initial_portfolio_values = {
            i: env.get_portfolio_value(i) for i in range(settings.num_agents)
        }

        while step_count < settings.max_simulation_steps:
            result = graph.invoke(current_state)

            step_state = result.get("state", {})
            agent_messages_data = result.get("agent_messages", [])

            agent_messages = [
                AgentMessage(
                    agentId=f"agent_{i}",
                    role=settings.agent_roles[i] if i < len(settings.agent_roles) else f"Agent_{i}",
                    think=result.get("agent_thoughts", {}).get(f"agent_{i}", ""),
                    speak=msg.get("speak", "") if isinstance(msg, dict) else "",
                    decide=msg.get("decide", {}) if isinstance(msg, dict) else {},
                )
                for i, msg in enumerate(agent_messages_data[:settings.num_agents])
            ]

            step = SimulationStep(
                t=step_count,
                state=step_state,
                agentMessages=agent_messages,
            )
            steps.append(step)

            # Log experience to pools
            if pg_pool and pg_pool.is_available():
                pg_pool.log_experience(
                    simulation_id=simulation_id,
                    step=step_count,
                    state=step_state,
                    agent_messages=[msg.dict(by_alias=True) for msg in agent_messages],
                    reward_signals={
                        f"agent_{i}": env.compute_rewards(i)
                        for i in range(settings.num_agents)
                    },
                )

            if result.get("step", 0) >= settings.max_simulation_steps:
                break

            current_state = result
            step_count = result.get("step", step_count + 1)

            if step_count >= settings.max_simulation_steps:
                break

        final_state = current_state.get("state", initial_state)
        final_portfolio_values = {
            i: env.get_portfolio_value(i) for i in range(settings.num_agents)
        }

        total_trades = sum(
            1
            for step in steps
            for msg in step.agentMessages
            if msg.decide.get("type") in ["buy", "sell"]
        )

        avg_portfolio_change = sum(
            (final_portfolio_values[i] - initial_portfolio_values[i]) / initial_portfolio_values[i] * 100
            for i in range(settings.num_agents)
        ) / settings.num_agents

        summary = SimulationSummary(
            totalSteps=len(steps),
            finalState=final_state,
            totalTrades=total_trades,
            portfolioValueChange=avg_portfolio_change,
            scenarioMetadata={
                "scenarioId": envelope.payload.scenario_id,
                "horizonDays": envelope.payload.horizon_days,
            },
        )

        result = LampSimulationResult(
            jobId=envelope.job_id,
            traceId=envelope.trace_id,
            simulationId=simulation_id,
            status="ok",
            steps=steps,
            summary=summary,
            error=None,
        )

        trace_logger.info(
            f"Simulation completed: {simulation_id}",
            extra={"jobId": envelope.job_id, "totalSteps": len(steps)},
        )

        return result

    except Exception as e:
        error_msg = str(e)
        trace_logger.error(f"Simulation failed: {error_msg}", exc_info=True)

        if settings.sentry_dsn:
            sentry_sdk.set_context("job", {
                "job_id": envelope.job_id,
                "trace_id": envelope.trace_id,
                "scenario_id": envelope.payload.scenario_id,
            })
            sentry_sdk.capture_exception(e)

        return LampSimulationResult(
            jobId=envelope.job_id,
            traceId=envelope.trace_id,
            simulationId=simulation_id,
            status="error",
            steps=[],
            summary=SimulationSummary(
                totalSteps=0,
                finalState={},
                totalTrades=0,
                portfolioValueChange=0.0,
                scenarioMetadata={},
            ),
            error=error_msg,
        )


@app.post("/simulate", response_model=LampSimulationResult)
async def simulate(job: JobEnvelope):
    """
    Run LAMP simulation.

    Args:
        job: Job envelope containing scenario parameters

    Returns:
        LampSimulationResult with complete simulation data
    """
    return await run_simulation(job)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_config=None,
        access_log=False,
    )

