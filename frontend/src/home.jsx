import { useEffect, useRef, useState } from "react";
import AMLGraph from "./AMLGraph";

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

        <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
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

      <button
        onClick={() => (window.location.href = "/")}
        className="fixed top-6 left-6 z-50 px-4 py-2 rounded-xl bg-blue-900/60 backdrop-blur-xl border border-white/10 text-sm font-medium animate-logo hover:scale-110 transition"
      >
        Smurf-Proof
      </button>

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
                    className={`mt-4 w-full px-6 py-3 rounded-xl transition ${
                      canAnalyze
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

          <footer className="relative py-6 text-center text-sm text-zinc-500 border-t border-white/5">
            © {new Date().getFullYear()} GraphGuard AML. All rights reserved.
          </footer>
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