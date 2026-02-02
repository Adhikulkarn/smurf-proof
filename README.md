# Smurf-Proof: AML Risk Scoring for Ethereum-like Transaction Graphs

This repository implements a rule-based and learnable pipeline to detect suspicious transaction behavior (smurfing, pass-through/mule wallets, peeling chains, and multi-hop convergence) and compute per-wallet risk scores.

**Project Goals**
- **Detect** suspicious transaction patterns at graph scale.
- **Score** wallets with an interpretable base risk and optional GNN-based refinement.
- **Expose** results via a Django server and a lightweight React frontend.

**Where to look in the codebase**
- Core scoring and utilities: [backend/core/risk_scorer.py](backend/core/risk_scorer.py)
- Pattern detectors (rule-based): [backend/core/pattern_detector.py](backend/core/pattern_detector.py)
- Feature extraction: [backend/core/feature_extractor.py](backend/core/feature_extractor.py)
- Graph construction: [backend/core/graph_builder.py](backend/core/graph_builder.py)
- Normalization helper: [backend/core/normalizer.py](backend/core/normalizer.py)
- GNN preparation and CPU-only GNN: [backend/core/gnn_preparer.py](backend/core/gnn_preparer.py), [backend/core/gnn_cpu.py](backend/core/gnn_cpu.py)
- Pipeline orchestrator: [backend/core/pipeline.py](backend/core/pipeline.py)

**High-level Pipeline**
1. Load transaction CSV and build a directed graph ([`graph_builder.py`](backend/core/graph_builder.py)).
2. Extract node & edge features ([`feature_extractor.py`](backend/core/feature_extracto
r.py)).
3. Run rule-based pattern detectors ([`pattern_detector.py`](backend/core/pattern_detector.py)).
4. Compute interpretable base risk per wallet ([`risk_scorer.py`](backend/core/risk_scorer.py)).
5. Optionally prepare inputs and refine risks with a CPU GNN ([`gnn_preparer.py`](backend/core/gnn_preparer.py), [`gnn_cpu.py`](backend/core/gnn_cpu.py)).

**Detailed Formulas and Rules**

1) Feature extraction formulas (see `feature_extractor.py`)

- Total inflow / outflow per node:
  $$\text{total\_inflow} = \sum_{(u\rightarrow v)} \text{amount}_{uv}$$
  $$\text{total\_outflow} = \sum_{(v\rightarrow w)} \text{amount}_{vw}$$

- Transaction count:
  $$\text{tx\_count} = \text{in\_degree} + \text{out\_degree}$$

- Active time span (seconds):
  $$\text{active\_time\_span} = \max(\text{timestamps}) - \min(\text{timestamps})$$

- Flow imbalance (normalized absolute difference):
  $$\text{flow\_imbalance} = \frac{|\text{total\_inflow} - \text{total\_outflow}|}{\text{total\_inflow} + \text{total\_outflow} + 10^{-9}}$$

- Edge peeling ratio (how much a forwarded edge passes through relative to largest incoming):
  $$\text{peeling\_ratio}_{(u,v)} = \frac{\text{amount}_{uv}}{\max\_{(x\rightarrow u)}(\text{amount}_{xu}) + 10^{-9}}$$

2) Normalization (see `normalizer.py`)

- Min–max normalization applied per feature across nodes/edges:
  For a feature value $v$, across observed values $v_{min}, v_{max}$:
  $$v_{norm} = \begin{cases}0 &\text{if } v_{max}=v_{min} \\ \frac{v - v_{min}}{v_{max} - v_{min}} &\text{otherwise}\end{cases}$$

3) Rule-based pattern detectors (see `pattern_detector.py`)

- Fan-out (splitting / smurfing): flagged if
  $$\text{out\_degree} \geq \text{out\_thresh} \quad\text{and}\quad \text{in\_degree} \leq \text{in\_thresh}$$
  (defaults: `out_thresh=0.6`, `in_thresh=0.2` in code)

- Fan-in (aggregation): symmetric rule with swapped thresholds (defaults: `in_thresh=0.6`, `out_thresh=0.2`).

- Multi-hop convergence: node is considered converging if it reaches many endpoints within a small hop limit and those endpoints collapse to the same downstream wallet (see code logic with `max_hops=3`).

- Peeling chains: an edge contributes to peeling if $\text{peeling\_ratio} \geq \text{`peel_thresh`}$ (default 0.8). Repeated occurrences mark the source node.

- Mule / pass-through wallets: flagged when
  $$\text{flow\_imbalance} \leq \text{imbalance\_thresh} \ \wedge\ \text{active\_time\_span} \leq \text{time\_thresh} \ \wedge\ \text{tx\_count} \geq \text{degree\_thresh}$$
  (defaults: `imbalance_thresh=0.2`, `time_thresh=0.3`, `degree_thresh=0.2`)

4) Base risk computation (see `risk_scorer.py`)

- Individual component rules (gating thresholds):
  - Structural risk `S`: returns 1.0 if either `out_degree >= FAN_OUT_THRESHOLD` or `in_degree >= FAN_IN_THRESHOLD`, else 0.0. (Constants: `FAN_OUT_THRESHOLD=3`, `FAN_IN_THRESHOLD=3`)
  - Flow risk `F`: returns 1.0 if `incoming >= 2`, `outgoing >= 1`, and `flow_imbalance <= LOW_IMBALANCE_THRESHOLD` (default `LOW_IMBALANCE_THRESHOLD=0.2`), else 0.0.
  - Temporal risk `T`: requires at least `MIN_TX_TEMPORAL` transactions (default 3); if `time_span <= 0.3` → 1.0, else 0.0.
  - Proximity risk `P`: for a wallet $w$, consider a set of suspicious wallets $S$ (from pattern detector). Compute shortest path distance $d(w,s)$; if $d \leq \text{max\_hops}$ then contribution is $1/(d+1)$; if $w\in S$ returns 1.0. Otherwise 0.

- Hard gating: if both `S==0` and `F==0` then the wallet's `base_risk` is forced to 0.0 (no structural OR flow anomaly → no base risk).

- Weighted aggregation into raw base risk:
  Let weights $w_S,w_F,w_T,w_P$ (defaults: $(0.4,0.3,0.2,0.1)$). Compute
  $$\text{raw} = w_S\cdot S + w_F\cdot F + w_T\cdot T + w_P\cdot P$$

- Final safety clamp and rounding:
  $$\text{base\_risk} = \text{round}\big(\text{clip}(\text{raw},0,1),\;3\big)$$

5) Optional GNN refinement (see `gnn_preparer.py` and `gnn_cpu.py`)

- Input node vector $x_v$ includes extracted features and the base risk.
- Message passing implemented (CPU-only toy GNN): aggregated message for node $v$ is the mean of incoming node features:
  $$m_v = \frac{1}{\deg(v)}\sum_{(u\rightarrow v)} x_u$$

- A linear projection followed by a sigmoid produces a refined risk:
  $$r_v = \sigma\big(W m_v + b\big)\quad\text{(sigmoid)}$$

**Implementation safety notes**
- All numeric operations use small epsilon constants (e.g., $10^{-9}$) to avoid division-by-zero.
- `safe(...)` sanitizes NaN / None values and final `base_risk` is clamped to $[0,1]$ and rounded to 3 decimals.

**Technologies & Libraries**
- Backend: **Python 3.x**, **Django** ([server/manage.py](server/manage.py)), **Django REST Framework**.
- Data & computation: **pandas**, **numpy**, **networkx**, **sympy** (present in requirements), **mpmath**.
- Machine learning: **PyTorch (CPU)** (optional CPU-only GNN implementation).
- Persistence: **SQLite** (bundled DB files under `backend/db.sqlite3` and `server/db.sqlite3`).
- Frontend: **React** (JSX), **Vite**, **Tailwind CSS**, **D3** for visualization. See `frontend/package.json`.
- Linting & tooling: **ESLint**, Node + npm/Yarn for frontend dev commands.

**Files of interest (quick links)**
- Graph building: [backend/core/graph_builder.py](backend/core/graph_builder.py)
- Features: [backend/core/feature_extractor.py](backend/core/feature_extractor.py)
- Patterns: [backend/core/pattern_detector.py](backend/core/pattern_detector.py)
- Scoring: [backend/core/risk_scorer.py](backend/core/risk_scorer.py)
- Normalizer: [backend/core/normalizer.py](backend/core/normalizer.py)
- GNN prep & CPU model: [backend/core/gnn_preparer.py](backend/core/gnn_preparer.py), [backend/core/gnn_cpu.py](backend/core/gnn_cpu.py)

**Requirements**
- See `backend/requirements.txt` for pinned Python packages and versions used during development.

### How to Run

**Backend**

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
4.  Run the Django development server:
    ```bash
    python manage.py runserver
    ```
    The backend API will be available at `http://127.0.0.1:8000/api/`.

**Frontend**

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the required Node.js packages:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`.

### API Endpoints

The backend provides the following API endpoints under the `/api/` prefix:

*   `GET /health/`: Health check endpoint.
*   `POST /upload-csv/`: Upload a CSV file with transaction data.
*   `POST /analyze/`: Trigger the analysis of the uploaded CSV file.
*   `GET /graph/`: Retrieve the transaction graph data (nodes and edges).
*   `GET /risk-scores/`: Retrieve the calculated base risk scores for each wallet.
*   `GET /final-risk/`: Retrieve the final risk scores, which is a fusion of the base risk and the GNN-based risk.

### Testing

To run the backend tests, navigate to the `backend/server` directory and run:

```bash
python manage.py test
```

---
If you want, I can:
- run a one-shot analysis on `data/Refined_Ethereum_Transactions.csv` and attach a sample output; or
- add an examples directory with small CSV fixtures and a quick CLI runner.
# smurf-proof-