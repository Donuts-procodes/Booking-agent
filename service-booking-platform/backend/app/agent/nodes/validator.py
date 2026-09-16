from app.agent.state import AgentState


# Formats reservation confirmation summary for customer read-back verification before commit
def node_validator_readback(state: AgentState) -> dict[str, str]:
    """Generates the explicit read-back validation summary before executing writes."""
    slots = state.slots
    summary = (
        f"Please confirm your booking details:\n"
        f"• Service: {slots.service_name or 'Selected Service'}\n"
        f"• Name: {slots.customer_name}\n"
        f"• Phone: {slots.customer_phone}\n"
        f"• Special Request: {slots.note or 'None'}\n\n"
        f"Shall I confirm this reservation for you? (Reply 'Yes' to confirm or provide changes)"
    )
    return {"response_text": summary}
