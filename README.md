# Smurf-Proof: AML Risk Scoring for Ethereum-like Transaction Graphs
**Detailed Formulas and Rules**

1) Feature extraction formulas (see `feature_extractor.py`)

- Total inflow / outflow per node:
  - `total_inflow = sum(amount_uv for (u->v))`
  - `total_outflow = sum(amount_vw for (v->w))`

- Transaction count:
  - `tx_count = in_degree + out_degree`

- Active time span (seconds):
  - `active_time_span = max(timestamps) - min(timestamps)`

- Flow imbalance (normalized absolute difference):
  - `flow_imbalance = abs(total_inflow - total_outflow) / (total_inflow + total_outflow + 1e-9)`

- Edge peeling ratio (how much a forwarded edge passes through relative to largest incoming):
  - `peeling_ratio_(u,v) = amount_uv / (max(amount_xu for (x->u)) + 1e-9)`

2) Normalization (see `normalizer.py`)

- Min–max normalization applied per feature across nodes/edges:
  - For a feature value `v`, with observed values `v_min` and `v_max`:
    - If `v_max == v_min` then `v_norm = 0`
    - Otherwise `v_norm = (v - v_min) / (v_max - v_min)`

3) Rule-based pattern detectors (see `pattern_detector.py`)

- Fan-out (splitting / smurfing): flagged if
  - `out_degree >= out_thresh` and `in_degree <= in_thresh` (defaults: `out_thresh=0.6`, `in_thresh=0.2`)

- Fan-in (aggregation): symmetric rule with swapped thresholds (defaults: `in_thresh=0.6`, `out_thresh=0.2`).

- Multi-hop convergence: node is considered converging if it reaches many endpoints within a small hop limit and those endpoints collapse to the same downstream wallet (see code logic with `max_hops=3`).

- Peeling chains: an edge contributes to peeling if `peeling_ratio >= peel_thresh` (default `peel_thresh=0.8`). Repeated occurrences mark the source node.

- Mule / pass-through wallets: flagged when all of the following hold:
  - `flow_imbalance <= imbalance_thresh`
  - `active_time_span <= time_thresh`
  - `tx_count >= degree_thresh`
  (defaults: `imbalance_thresh=0.2`, `time_thresh=0.3`, `degree_thresh=0.2`)

4) Base risk computation (see `risk_scorer.py`)

- Individual component rules (gating thresholds):
  - Structural risk `S`: returns `1.0` if either `out_degree >= FAN_OUT_THRESHOLD` or `in_degree >= FAN_IN_THRESHOLD`, else `0.0`. (Constants: `FAN_OUT_THRESHOLD=3`, `FAN_IN_THRESHOLD=3`)
  - Flow risk `F`: returns `1.0` if `incoming >= 2`, `outgoing >= 1`, and `flow_imbalance <= LOW_IMBALANCE_THRESHOLD` (default `LOW_IMBALANCE_THRESHOLD=0.2`), else `0.0`.
  - Temporal risk `T`: requires at least `MIN_TX_TEMPORAL` transactions (default `3`); if `time_span <= 0.3` then `T = 1.0`, else `0.0`.
  - Proximity risk `P`: for a wallet `w`, consider the set of suspicious wallets `S` (from pattern detector). Compute shortest path distance `d(w,s)`; if `d <= max_hops` then contribution is `1/(d+1)`; if `w` in `S` returns `1.0`. Otherwise `0.0`.

- Hard gating: if both `S == 0` and `F == 0` then the wallet's `base_risk` is forced to `0.0` (no structural OR flow anomaly → no base risk).

- Weighted aggregation into raw base risk:
  - Let weights `w_S, w_F, w_T, w_P` (defaults: `(0.4, 0.3, 0.2, 0.1)`). Compute:
    - `raw = w_S * S + w_F * F + w_T * T + w_P * P`

- Final safety clamp and rounding:
  - `base_risk = round(clip(raw, 0, 1), 3)`

5) Optional GNN refinement (see `gnn_preparer.py` and `gnn_cpu.py`)

- Input node vector `x_v` includes extracted features and the base risk.
- Message passing implemented (CPU-only toy GNN): aggregated message for node `v` is the mean of incoming node features:
  - `m_v = sum(x_u for (u->v)) / deg(v)`

- A linear projection followed by a sigmoid produces a refined risk:
  - `r_v = sigmoid(W @ m_v + b)`
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