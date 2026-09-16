import logging
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.agent.graph import create_agent_graph
from app.agent.state import AgentState
from app.agent.tools.booking_tools import tool_commit_booking

logger = logging.getLogger("app.agent.runner")


# Turn orchestrator invoking LangGraph state transitions and executing transactional database commits
class AgentRunner:
    def __init__(self) -> None:
        logger.info("Compiling LangGraph workflow engine for AgentRunner")
        self.app = create_agent_graph()

    # Processes a single conversational turn, executes state graph nodes, and triggers write gates upon completion
    async def process_turn(
        self,
        db: AsyncSession,
        state: AgentState,
    ) -> AgentState:
        logger.info(
            "Agent turn initiated: merchant=%s, intent=%s, message_count=%d",
            state.merchant_id,
            state.current_intent,
            len(state.messages),
        )
        result = self.app.invoke(state.model_dump())
        updated_state = AgentState(**result)
        logger.info(
            "Graph step completed: next_intent=%s, missing_slots=%s, is_completed=%s",
            updated_state.current_intent,
            updated_state.missing_slots,
            updated_state.is_completed,
        )

        # Handle deterministic booking write on completion
        if updated_state.is_completed and updated_state.slots.service_id and not updated_state.booking_id:
            slots = updated_state.slots
            service_id = slots.service_id
            if service_id is not None:
                logger.info("Executing transactional booking commit for customer=%s", slots.customer_name)
                commit_res = await tool_commit_booking(
                    db=db,
                    merchant_id=updated_state.merchant_id,
                    service_id=service_id,
                    customer_name=slots.customer_name or "Guest Customer",
                    customer_phone=slots.customer_phone or "",
                    note=slots.note,
                )
                updated_state.booking_id = commit_res["booking_id"]
                updated_state.response_text = (
                    f"Your booking has been successfully confirmed! 🎉\n\n"
                    f"Booking Reference ID: {commit_res['booking_id']}\n"
                    f"A specialist will review your appointment shortly. Please save your reference ID."
                )
                logger.info("Booking transaction confirmed: booking_id=%s", commit_res["booking_id"])

        return updated_state
