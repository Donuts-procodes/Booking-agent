import re
from app.agent.state import AgentState, BookingSlots


# Extracts booking slots (service, customer name, phone, note, confirmation) from conversation turns
def node_slot_extractor(state: AgentState) -> dict[str, BookingSlots | list[str]]:
    """Extracts customer slots (name, phone, note, confirmation) from conversation turns."""
    slots = state.slots.model_copy()
    latest_msg = str(state.messages[-1].get("content", "")).strip()

    # Confirmation detection
    if re.search(r"^(yes|confirm|correct|proceed|yep|sure|sounds good)$", latest_msg, re.IGNORECASE):
        slots.is_confirmed = True

    # Phone number extraction (7-15 digits with optional symbols)
    phone_match = re.search(r"(\+?\d[\d\-\s\(\)]{7,}\d)", latest_msg)
    if phone_match and not slots.customer_phone:
        slots.customer_phone = phone_match.group(1).strip()

    # Name extraction heuristic (if awaiting name and not phone/confirmation)
    if not slots.customer_name and "customer_name" in state.missing_slots:
        if not phone_match and len(latest_msg.split()) <= 4 and not slots.is_confirmed:
            cleaned_name = re.sub(r"^(my name is|i am|i'm|this is)\s+", "", latest_msg, flags=re.IGNORECASE)
            slots.customer_name = cleaned_name.strip()

    # Note extraction
    if "note" in state.missing_slots and not slots.note:
        if latest_msg.lower() not in ("no", "none", "skip", "n/a"):
            slots.note = latest_msg

    # Evaluate missing required slots
    missing = []
    if not slots.service_id:
        missing.append("service_id")
    if not slots.customer_name:
        missing.append("customer_name")
    if not slots.customer_phone:
        missing.append("customer_phone")

    return {"slots": slots, "missing_slots": missing}
