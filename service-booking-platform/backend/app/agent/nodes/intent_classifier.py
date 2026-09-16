import re
from app.agent.state import AgentState


# Deterministically and semantically classifies user conversational turn into intent category
def node_intent_classifier(state: AgentState) -> dict[str, str]:
    """Deterministically and semantically classifies user query into workflow intents."""
    if not state.messages:
        return {"current_intent": "GENERAL"}

    latest_msg = str(state.messages[-1].get("content", "")).strip().lower()

    if re.search(r"\b(cancel|cancellation|terminate|stop booking)\b", latest_msg):
        return {"current_intent": "CANCELLATION"}
    elif re.search(r"\b(status|track|tracking|check booking|#bk\w+)\b", latest_msg):
        return {"current_intent": "STATUS_CHECK"}
    elif re.search(r"\b(hours?|open|policy|location|address|where|price list|cost|faq)\b", latest_msg):
        return {"current_intent": "FAQ"}
    elif re.search(r"\b(book|reserve|schedule|appointment|service|haircut|massage|facial)\b", latest_msg) or state.slots.service_id:
        return {"current_intent": "BOOKING"}
    else:
        return {"current_intent": "GENERAL"}
