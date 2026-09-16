import pytest
from app.agent.state import AgentState, BookingSlots
from app.agent.nodes.intent_classifier import node_intent_classifier
from app.agent.nodes.slot_extractor import node_slot_extractor
from app.agent.nodes.validator import node_validator_readback
from app.agent.graph import create_agent_graph


def test_intent_classification():
    state_booking = AgentState(
        merchant_id="00000000-0000-0000-0000-000000000001",
        messages=[{"role": "user", "content": "I want to schedule a haircut appointment"}],
    )
    res = node_intent_classifier(state_booking)
    assert res["current_intent"] == "BOOKING"

    state_cancel = AgentState(
        merchant_id="00000000-0000-0000-0000-000000000001",
        messages=[{"role": "user", "content": "Please cancel my appointment #BK1029"}],
    )
    res_cancel = node_intent_classifier(state_cancel)
    assert res_cancel["current_intent"] == "CANCELLATION"


def test_slot_extractor_phone_and_confirmation():
    state = AgentState(
        merchant_id="00000000-0000-0000-0000-000000000001",
        slots=BookingSlots(service_id="svc-1", customer_name="Alice Smith"),
        missing_slots=["customer_phone"],
        messages=[{"role": "user", "content": "My phone number is +1 555-019-2834"}],
    )
    res = node_slot_extractor(state)
    slots = res["slots"]
    assert isinstance(slots, BookingSlots)
    assert "555-019-2834" in (slots.customer_phone or "")
    assert "customer_phone" not in res["missing_slots"]


def test_validator_readback():
    state = AgentState(
        merchant_id="00000000-0000-0000-0000-000000000001",
        slots=BookingSlots(
            service_id="svc-1",
            service_name="Deep Tissue Massage",
            customer_name="Bob Jones",
            customer_phone="+15551234567",
        ),
    )
    res = node_validator_readback(state)
    assert "Deep Tissue Massage" in res["response_text"]
    assert "Bob Jones" in res["response_text"]
    assert "+15551234567" in res["response_text"]


def test_agent_graph_compilation_and_execution():
    graph = create_agent_graph()
    initial_state = AgentState(
        merchant_id="00000000-0000-0000-0000-000000000001",
        messages=[{"role": "user", "content": "Hello!"}],
    )
    out = graph.invoke(initial_state.model_dump())
    assert out["current_intent"] == "GENERAL"
    assert len(out["response_text"]) > 0
