"""
Pipeline orchestrator.
This file glues together all core phases.
NO business logic lives here.
"""

from core.graph_builder import (
    load_transactions,
    build_transaction_graph,
    graph_summary,
)

from core.feature_extractor import (
    extract_node_features,
    extract_edge_features,
)

from core.pattern_detector import detect_patterns

from core.risk_scorer import compute_base_risk

# Optional (already CPU-safe)
try:
    from core.gnn_cpu import run_gnn_refinement
    GNN_AVAILABLE = True
except ImportError:
    GNN_AVAILABLE = False


def run_full_analysis(csv_path: str) -> dict:
    """
    Runs the complete laundering detection pipeline.
    Returns a dictionary consumed by the API layer.
    """

    # -------- Phase 1: Graph construction --------
    df = load_transactions(csv_path)
    graph = build_transaction_graph(df)

    # -------- Phase 2: Feature extraction --------
    node_features = extract_node_features(graph)
    edge_features = extract_edge_features(graph)

    # -------- Phase 3: Pattern detection --------
    patterns = detect_patterns(graph, node_features, edge_features)

    # -------- Phase 4: Base risk scoring --------
    base_risks = compute_base_risk(
    graph,
    node_features,
    patterns,
    )


    # -------- Phase 7: GNN refinement (optional) --------
    gnn_risks = None
    if GNN_AVAILABLE:
        gnn_risks = run_gnn_refinement(
            graph=graph,
            node_features=node_features,
            base_risks=base_risks,
        )

    # -------- Final output --------
    return {
        "graph": graph,
        "graph_summary": graph_summary(graph),
        "node_features": node_features,
        "edge_features": edge_features,
        "patterns": patterns,
        "base_risks": base_risks,
        "gnn_risks": gnn_risks,
    }
