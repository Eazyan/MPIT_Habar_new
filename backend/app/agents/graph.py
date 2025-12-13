from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.analyzer import analyzer_node
from app.agents.writer import writer_node
from app.rag.store import rag_store

def context_node(state: AgentState) -> AgentState:
    """Retrieves context from RAG for the current user."""
    print("--- CONTEXT AGENT ---")
    # Query RAG based on summary (cleaner, Russian language)
    # Analyzer runs before Context, so analysis is available
    analysis = state.get('analysis')
    user_id = state.get('user_id')
    query = analysis.summary if analysis else (state['input'].text[:200] if state['input'].text else "News")
    
    print(f"DEBUG: RAG Query (User {user_id}): {query[:100]}...")
    context = rag_store.query(query, user_id=user_id)
    if context:
        print(f"--- RAG FOUND {len(context)} RELEVANT CASES ---")
        print(context)
    else:
        print("--- RAG: NO RELEVANT CASES FOUND ---")
        
    return {"context": context}

from app.agents.visual import visual_node

# Define Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("analyzer", analyzer_node)
workflow.add_node("context", context_node)
workflow.add_node("writer", writer_node)
workflow.add_node("visual", visual_node)

# Set Entry Point
workflow.set_entry_point("analyzer")

# Add Edges
workflow.add_edge("analyzer", "context")
workflow.add_edge("context", "writer")
workflow.add_edge("writer", "visual")
workflow.add_edge("visual", END)

# Compile
app = workflow.compile()
