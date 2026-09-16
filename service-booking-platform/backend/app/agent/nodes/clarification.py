from app.agent.state import AgentState


# Generates focused disambiguation question when catalog similarity scores are closely tied
def node_clarification(state: AgentState, close_candidates: list[dict[str, str]]) -> dict[str, str]:
    """Generates focused single clarification question when vector scores are closely tied."""
    options = ", ".join([f"'{c.get('name')}'" for c in close_candidates[:2]])
    prompt = f"We have multiple options matching your request, such as {options}. Which of these would you prefer?"
    return {"response_text": prompt}
