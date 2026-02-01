import { useEffect, useRef, useState } from "react";
import AMLGraph from "./AMLGraph";
import hackuuuImage from "/image1.jpeg";
import hackuuuImage2 from "/image2.jpeg";
import hackuuuImage3 from "/image3.jpeg";


const BASE_URL = "http://127.0.0.1:8000/api";

/* ================= HOW IT WORKS COMPONENT ================= */
function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 px-6 bg-blue-950 border-t border-white/5"
    >

      <div className="max-w-5xl mx-auto text-center py-30">
        <h2 className="text-3xl md:text-4xl font-semibold text-zinc-100">
          How Sumrf-Proof Works
        </h2>

        <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
          From raw transactions to intelligent graph-based AML insights.
        </p>
        <div className="text-left mt-16">
          <h2 className="text-xl mx-3 font-bold ">User Flow</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-4 text-left">
          <div className="bg-blue-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-zinc-100 mb-2">
              1. Upload Transactions
            </h3>
            <p className="text-sm text-zinc-400">
              Upload a CSV containing transaction relationships. The system
              validates structure and prepares graph nodes & edges.
            </p>
          </div>

          <div className="bg-blue-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-2">
              2. Analyze Graph
            </h3>
            <p className="text-sm text-zinc-400">
              Transactions are converted into a graph and analyzed using AML
              heuristics to detect suspicious patterns and clusters.
            </p>
          </div>

          <div className="bg-blue-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-zinc-100 mb-2">
              3. Investigate Visually
            </h3>
            <p className="text-sm text-zinc-400">
              Explore an interactive live graph to identify risky wallets,
              abnormal flows, and hidden connections instantly.
            </p>
          </div>
        </div>
        <div className="text-left mt-16">
          <h2 className="font-bold text-xl mx-3">How it works behind the scene</h2>
        </div>

        <div className="flex flex-row gap-6 mt-4 text-left">
          <div className="w-140 h-66 border border-blue-500 border-5 mt-6  overflow-hidden rounded-xl">
            <img src={hackuuuImage} alt="404" />
          </div>
          <div className="bg-blue-900/60 backdrop-blur-xl w-90 h-66 mt-6 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-zinc-100 ">
              Core Ideas
            </h3>
            <p className="text-sm text-zinc-400">
              The fundamental idea of the system is to represent blockchain transactions as a directed weighted graph
              We model blockchain transactions as a temporal directed graph and apply hybrid intelligence:<br />
              1.	Graph Construction<br />
              Wallets → nodes<br />
              Transactions → directed edges (amount + time)<br />
              2.	Rule-Based Graph Pattern Detection
            </p>
          </div>
        </div>
        <div>
          <div className="bg-blue-900/60 backdrop-blur-xl w-235 mt-6 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-zinc-100 ">

            </h3>
            <p className="text-sm text-zinc-400">
              We model the transaction network as a graph and run a lightweight, CPU-based graph neural propagation to spread suspicion across connected wallets, then fuse this with rule-driven risk signals derived from transaction structure, flow behavior, timing, and proximity to compute an interpretable laundering risk score for each wallet.
            </p>
          </div>
        </div>
        <div className="flex flex-row gap-6 mt-4 text-left">
          <div className="w-140 h-187 border object-contain border-blue-500 border-5 mt-6  overflow-hidden rounded-xl">
            <img src={hackuuuImage2} alt="404" />
          </div>
          <div className="pt-4">
            <div className="bg-blue-900/60 backdrop-blur-xl h-45 mt-3 border w-90 border-white/10 rounded-2xl p-6">

              <p className="text-sm text-zinc-400">
                R(w)=αS(w)+βF(w)+γT(w)+δP(w)
                where:<br />
                S(w)= Structural Risk<br />
                F(w)= Flow Risk<br />
                T(w)= Temporal Risk<br />
                P(w)= Proximity Risk<br />
                α,β,γ,δare weighting coefficients such that
                α+β+γ+δ=1
              </p>
            </div>

            <div className="bg-blue-900/60 backdrop-blur-xl h-30 mt-3 border w-90 border-white/10 rounded-2xl p-6">

              <p className="text-sm text-zinc-400">
                In structural Risk<br />
                "fan_in"(w)= normalized in-degree of wallet w<br />
                "fan_out"(w)= normalized out-degree of wallet w

              </p>
            </div>

            <div className="bg-blue-900/60 backdrop-blur-xl h-30 mt-3 border w-90 border-white/10 rounded-2xl p-6">

              <p className="text-sm text-zinc-400">
                In Flow Risk<br />
                ε is a small threshold<br />
                "inflow"(w)and "outflow"(w)represent total transaction value
              </p>
            </div>

            <div className="bg-blue-900/60 backdrop-blur-xl h-30 mt-3 border w-90 border-white/10 rounded-2xl p-6">

              <p className="text-sm text-zinc-400">
                In Temproal Risk<br />
                Δt=t_2-t_1is a short time window<br />
                High temporal risk indicates rapid fund movement
              </p>
            </div>

            <div className="bg-blue-900/60 backdrop-blur-xl h-40 mt-3 border w-90 border-white/10 rounded-2xl p-6">

              <p className="text-sm text-zinc-400">
                In Proximity Risk<br />
                Proximity risk captures the influence of nearby suspicious wallets in the transaction graph. Wallets closer to high-risk entities are assigned to higher risk.<br />
                P(w)=1/(d(w)+1)
              </p>
            </div>

          </div>



        </div>
        <div className="flex flex-row gap-6 mt-9 text-left">
          <div>
            <h3 className="text-xl font-bold">Risk Computation by CPU based GNN Computation</h3>
            <div className="w-140 h-94 border border-blue-500 overflow-hidden border-5 mt-6 rounded-xl">
              <img src={hackuuuImage3} alt="404" />
            </div>

          </div>
          <div className="bg-blue-900/60 backdrop-blur-xl h-94  mt-12 border w-90 border-white/10 rounded-2xl p-6">

            <p className="text-sm text-zinc-400">
              The wallet whose risk representation is being updated<br />

              N(v): All wallets that have directly interacted with wallet v<br />

              hᵤ(l): Current feature representation of a neighboring wallet u<br />

              mean( ): Averages neighbor information to keep computation stable and CPU-efficient<br />

              W: Learnable weight that controls how much neighbor behavior influences risk<br />

              σ: Non-linear activation that helps capture complex laundering patterns<br />

              hᵥ(l+1): Updated wallet representation after aggregating neighbor information<br />
            </p>
          </div>
        </div>
        <div className="bg-blue-900/60 backdrop-blur-xl   mt-12 border w-240 border-white/10 rounded-2xl p-6">
          <h3>Conclusion:</h3>
          <p className="text-sm text-zinc-400">

            We combine rule-based AML signals with a graph neural network–based propagation approach to compute a final risk score for each wallet. The rule engine captures explicit laundering behaviors such as fan-in, fan-out, pass-through flow, and suspicious timing, ensuring interpretability and regulatory alignment. The CPU-based GNN then propagates this risk through the transaction graph, allowing indirect and hidden relationships to influence wallet suspicion. By fusing both perspectives, the final risk score balances explainable rule violations with relational intelligence from the network structure, resulting in a more robust, scalable, and realistic money-laundering detection system.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function GraphGuardHome() {
  const csvInputRef = useRef(null);
  const howItWorksRef = useRef(null);

  const [canAnalyze, setCanAnalyze] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [showGraph, setShowGraph] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    const csvInput = csvInputRef.current;
    if (!csvInput) return;

    const onFileChange = () => {
      const file = csvInput.files[0];
      setCanAnalyze(false);

      if (!file || !file.name.endsWith(".csv")) {
        showError("Please upload a valid CSV file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target.result;
        const lines = text.split("\n");

        if (lines.length < 2 || !lines[0].includes(",")) {
          showError("Invalid CSV structure.");
          return;
        }

        showSuccess("Valid CSV detected. Ready to upload.");
      };

      reader.readAsText(file);
    };

    csvInput.addEventListener("change", onFileChange);
    return () => csvInput.removeEventListener("change", onFileChange);
  }, []);

  const showSuccess = msg => {
    setPopupType("success");
    setPopupMessage(msg);
    setShowPopup(true);
  };

  const showError = msg => {
    setPopupType("error");
    setPopupMessage(msg);
    setShowPopup(true);
  };

  const uploadCsv = async () => {
    const file = csvInputRef.current.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BASE_URL}/upload-csv/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      setCanAnalyze(true);
      showSuccess("CSV uploaded successfully.");
    } catch {
      showError("CSV upload failed.");
    }
  };

  const analyze = async () => {
    try {
      const res = await fetch(`${BASE_URL}/analyze/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error();

      showSuccess("Analysis started. Rendering graph…");
      setShowGraph(true);
    } catch {
      showError("Analysis failed.");
    }
  };

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-blue-950 text-zinc-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-blue-950" />

      {showPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-blue-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-[360px] shadow-2xl text-center animate-popup">
            <h3 className="text-base font-medium text-zinc-100 mb-2">
              {popupType === "success" ? "Status" : "Error"}
            </h3>
            <p className="text-zinc-400 mb-6 text-sm">{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!showGraph && (
        <>
          <main className="relative min-h-screen flex items-center justify-center px-6">
            <div className="max-w-3xl w-full text-center animate-fadein">
              <h1 className="text-4xl md:text-5xl font-semibold text-zinc-100">
                Smurf-Proof
              </h1>
              <p className="text-zinc-400 mt-4 max-w-xl mx-auto">
                The “Smurfing” Hunter: Detecting Money Laundering Circles in Blockchain Graphs.
              </p>

              {!showUploader && (
                <>
                  <div className="mt-10 flex justify-center gap-4">
                    <button
                      onClick={() => setShowUploader(true)}
                      className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20  font-medium transition-all"
                    >
                      Explore Live Graph
                    </button>

                    <button
                      onClick={scrollToHowItWorks}
                      className="px-8 py-3 rounded-xl font-medium border border-white/15 hover:bg-white/5 transition-all"
                    >
                      How it Works
                    </button>
                  </div>

                  <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 font-medium">
                    <div className="bg-blue-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-sm text-zinc-400 hover:bg-blue-900/80 transition">
                      $2 trillion laundered annually, with 5-10% of global GDP involved.
                    </div>

                    <div className="bg-blue-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-sm text-zinc-400 hover:bg-blue-900/80 transition">
                      90% of Crypto mixing goes undetected due to complex transaction webs.
                    </div>

                    <div className="bg-blue-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-sm text-zinc-400 hover:bg-blue-900/80 transition">
                      Smurfing networks evade detection by staying under arbitary thresholds.
                    </div>
                  </div>
                </>
              )}

              {showUploader && (
                <div className="mt-12 max-w-xl mx-auto bg-blue-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-slideup">
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    className="w-full text-sm text-zinc-300 border border-white/20 rounded-lg px-3 py-2 bg-blue-950/40 hover:border-white/40 transition"
                  />

                  <button
                    onClick={uploadCsv}
                    className="mt-6 w-full px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
                  >
                    Upload Transactions
                  </button>

                  <button
                    disabled={!canAnalyze}
                    onClick={analyze}
                    className={`mt-4 w-full px-6 py-3 rounded-xl transition ${canAnalyze
                        ? "bg-white text-black hover:opacity-90"
                        : "bg-white/5 text-zinc-500 font-medium cursor-not-allowed"
                      }`}
                  >
                    Analyze Transactions
                  </button>
                </div>
              )}
            </div>
          </main>

          <div ref={howItWorksRef}>
            <HowItWorks />
          </div>

        </>
      )}

      {showGraph && <AMLGraph />}

      <style>{`
        .animate-fadein { animation: fadein 0.4s ease-out }
        .animate-slideup { animation: slideup 0.35s ease-out }
        .animate-popup { animation: popup 0.25s ease-out }
        .animate-logo { animation: logoPulse 3s ease-in-out infinite }

        @keyframes fadein {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideup {
          from { opacity: 0; transform: translateY(14px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes popup {
          from { opacity: 0; transform: scale(0.96) }
          to { opacity: 1; transform: scale(1) }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); }
          50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  );
}