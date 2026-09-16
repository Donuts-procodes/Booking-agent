from typing import Any
from langgraph.graph import StateGraph, END
from app.agent.state import AgentState
from app.agent.nodes.intent_classifier import node_intent_classifier
from app.agent.nodes.slot_extractor import node_slot_extractor
from app.agent.nodes.validator import node_validator_readback


# Evaluates classified customer intent and determines next graph branch
def route_intent(state: AgentState) -> str:
    if state.current_intent == "FAQ":
        return "faq_node"
    elif state.current_intent == "STATUS_CHECK":
        return "status_node"
    elif state.current_intent == "CANCELLATION":
        return "cancel_node"
    elif state.current_intent == "BOOKING":
        return "extract_slots_node"
    return "general_node"


# Checks slot completeness and confirmation state to route between prompting, read-back, or commit
def route_booking_slots(state: AgentState) -> str:
    if state.missing_slots:
        return "prompt_missing_slot_node"
    if not state.slots.is_confirmed:
        return "readback_node"
    return "commit_booking_node"


# Constructs and compiles the LangGraph StateGraph governing stateful conversational booking turns
def create_agent_graph() -> Any:
    workflow = StateGraph(AgentState)

    # Register nodes
    workflow.add_node("classify_intent", node_intent_classifier)
    workflow.add_node("extract_slots_node", node_slot_extractor)
    workflow.add_node("readback_node", node_validator_readback)

    # Formulates conversational prompt asking for the next required missing reservation slot
    def node_prompt_missing(state: AgentState) -> dict[str, str]:
        next_slot = state.missing_slots[0] if state.missing_slots else "service_id"
        prompts = {
            "service_id": "Which service would you like to schedule today?",
            "customer_name": "Could you please provide your full name for the reservation?",
            "customer_phone": "What is the best phone number to reach you at?",
            "note": "Any special notes or requests? (Reply 'no' to skip)",
        }
        return {"response_text": prompts.get(next_slot, "Please provide the next detail.")}

    # Provides friendly fallback greeting and concierge capabilities overview
    def node_general(state: AgentState) -> dict[str, str]:
        return {"response_text": "Hello! I am your AI service concierge. How can I assist you with booking or answering questions today?"}

    # Answers merchant business hours, policies, and general FAQ queries
    def node_faq(state: AgentState) -> dict[str, str]:
        return {"response_text": "Our salon and wellness center is open Tuesday through Sunday from 9:00 AM to 7:00 PM. Would you like to view our services?"}

    # Instructs customer on identifying information needed to check reservation status
    def node_status(state: AgentState) -> dict[str, str]:
        return {"response_text": "To check your booking status, please provide your Booking ID (e.g. #BK7042) and registered phone number."}

    # Explains required details needed to authenticate and execute booking cancellation
    def node_cancel(state: AgentState) -> dict[str, str]:
        return {"response_text": "To cancel a booking, please provide your Booking Reference ID and phone number for verification."}

    # Marks booking dialogue as completed and signals runner to execute transactional write
    def node_commit(state: AgentState) -> dict[str, Any]:
        return {"response_text": "Executing reservation commit...", "is_completed": True}

    workflow.add_node("prompt_missing_slot_node", node_prompt_missing)
    workflow.add_node("general_node", node_general)
    workflow.add_node("faq_node", node_faq)
    workflow.add_node("status_node", node_status)
    workflow.add_node("cancel_node", node_cancel)
    workflow.add_node("commit_booking_node", node_commit)

    # Set entry point
    workflow.set_entry_point("classify_intent")

    # Conditional branching from intent
    workflow.add_conditional_edges(
        "classify_intent",
        route_intent,
        {
            "faq_node": "faq_node",
            "status_node": "status_node",
            "cancel_node": "cancel_node",
            "extract_slots_node": "extract_slots_node",
            "general_node": "general_node",
        },
    )

    # Conditional branching from slot extractor
    workflow.add_conditional_edges(
        "extract_slots_node",
        route_booking_slots,
        {
            "prompt_missing_slot_node": "prompt_missing_slot_node",
            "readback_node": "readback_node",
            "commit_booking_node": "commit_booking_node",
        },
    )

    # Terminate leaves
    workflow.add_edge("prompt_missing_slot_node", END)
    workflow.add_edge("readback_node", END)
    workflow.add_edge("general_node", END)
    workflow.add_edge("faq_node", END)
    workflow.add_edge("status_node", END)
    workflow.add_edge("cancel_node", END)
    workflow.add_edge("commit_booking_node", END)

    return workflow.compile()
