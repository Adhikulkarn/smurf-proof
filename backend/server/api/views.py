import os
import tempfile
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.pipeline import run_full_analysis

# In-memory session cache
ANALYSIS_CACHE = {}


@api_view(["GET"])
def health(request):
    return Response({"status": "API is running"})


@api_view(["POST"])
def upload_csv(request):
    file = request.FILES.get("file")

    if not file:
        return Response({"error": "CSV file required"}, status=400)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
    for chunk in file.chunks():
        tmp.write(chunk)
    tmp.close()

    # Reset cache on new upload
    ANALYSIS_CACHE.clear()
    ANALYSIS_CACHE["csv_path"] = tmp.name

    return Response({"message": "CSV uploaded successfully"})


@api_view(["POST"])
def analyze(request):
    csv_path = ANALYSIS_CACHE.get("csv_path")

    if not csv_path or not os.path.exists(csv_path):
        return Response(
            {"error": "No CSV uploaded. Upload CSV before analysis."},
            status=400
        )

    # Run full backend pipeline
    results = run_full_analysis(csv_path)

    # Cache results for read-only endpoints
    ANALYSIS_CACHE["results"] = results

    return Response({"message": "Analysis completed"})


@api_view(["GET"])
def get_graph(request):
    results = ANALYSIS_CACHE.get("results")

    if not results:
        return Response(
            {"error": "Run analysis before requesting graph."},
            status=400
        )

    G = results["graph"]
    base_risks = results["base_risks"]
    patterns = results["patterns"]

    # Wallets involved in any suspicious pattern (structural involvement)
    involved_wallets = {
        w for w, p in patterns.items()
        if any(v is True for k, v in p.items() if not k.endswith("_reason"))
    }

    # ----------------------
    # Nodes
    # ----------------------
    nodes = []
    for node in G.nodes():
        risk_info = base_risks.get(node, {})
        risk = risk_info.get("base_risk", 0.0)

        is_wallet = node.startswith("0x")
        is_risky = risk >= 0.5
        is_involved = node in involved_wallets

        nodes.append({
            "id": node,
            "risk": risk,
            "is_risky": is_risky,           # actor-level risk
            "is_involved": is_involved,     # involved in laundering paths
            "entity_type": "wallet" if is_wallet else "service",
            "reasons": risk_info.get("reasons", []),
        })

    # ----------------------
    # Edges
    # ----------------------
    edges = []
    for u, v, data in G.edges(data=True):
        is_smurf = patterns.get(u, {}).get("fan_out", False)
        is_peeling = patterns.get(u, {}).get("peeling_chain", False)

        edges.append({
            "source": u,
            "target": v,
            "amount": data.get("amount", 0.0),
            "is_suspicious": is_smurf or is_peeling,
            "pattern": (
                "smurfing" if is_smurf
                else "peeling" if is_peeling
                else None
            )
        })

    return Response({
        "nodes": nodes,
        "edges": edges
    })


@api_view(["GET"])
def get_risk_scores(request):
    results = ANALYSIS_CACHE.get("results")

    if not results:
        return Response(
            {"error": "Run analysis before requesting risk scores."},
            status=400
        )

    base_risks = results["base_risks"]
    patterns = results["patterns"]

    wallets = []

    for wallet, risk_info in base_risks.items():
        base_risk = risk_info.get("base_risk", 0.0)

        wallets.append({
            "id": wallet,
            "base_risk": base_risk,
            "structural_risk": risk_info.get("structural_risk", 0.0),
            "flow_risk": risk_info.get("flow_risk", 0.0),
            "temporal_risk": risk_info.get("temporal_risk", 0.0),
            "proximity_risk": risk_info.get("proximity_risk", 0.0),
            "is_risky": base_risk >= 0.5,
            "entity_type": (
                "wallet" if wallet.startswith("0x") else "service"
            ),
            "reasons": risk_info.get("reasons", []),
        })

    return Response({"wallets": wallets})

@api_view(["GET"])
def get_final_risk(request):
    results = ANALYSIS_CACHE.get("results")

    if not results:
        return Response(
            {"error": "Run analysis before requesting final risk."},
            status=400
        )

    base_risks = results.get("base_risks", {})
    gnn_risks = results.get("gnn_risks")

    # Graceful fallback if GNN is unavailable
    if not isinstance(gnn_risks, dict):
        gnn_risks = {}

    ALPHA = 0.6

    wallets = []

    for wallet, base_info in base_risks.items():
        base = base_info["base_risk"]
        gnn = gnn_risks.get(wallet, base)  # fallback to base risk

        final = round(ALPHA * base + (1 - ALPHA) * gnn, 3)

        wallets.append({
            "id": wallet,
            "base_risk": base,
            "gnn_risk": round(gnn, 3),
            "final_risk": final,
            "delta": round(final - base, 3),
            "reasons": base_info.get("reasons", []),
        })

    return Response({
        "alpha": ALPHA,
        "gnn_enabled": bool(gnn_risks),
        "wallets": wallets
    })
