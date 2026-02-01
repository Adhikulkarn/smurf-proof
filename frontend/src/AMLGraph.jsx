import { useEffect, useRef } from "react";
import * as d3 from "d3";

const BASE_URL = "http://127.0.0.1:8000/api";

export default function AMLGraph() {
  const svgRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/graph/`).then(r => r.json()),
      fetch(`${BASE_URL}/final-risk/`).then(r => r.json()),
      fetch(`${BASE_URL}/risk-scores/`).then(r => r.json())
    ])
      .then(([graph, finalRisk, riskScores]) => {

        /* ============================
           📊 CONSOLE LOGGING (DEBUG / JUDGES)
        ============================ */
        console.group("📊 API RESPONSE — /api/graph");
        console.log("Timestamp:", new Date().toISOString());
        console.log(graph);
        console.groupEnd();

        console.group("🎯 API RESPONSE — /api/final-risk");
        console.log("Timestamp:", new Date().toISOString());
        console.log(finalRisk);
        console.groupEnd();

        console.group("🔥 API RESPONSE — /api/risk-scores");
        console.log("Timestamp:", new Date().toISOString());
        console.log(riskScores);
        console.groupEnd();

        renderGraph(graph, finalRisk, riskScores);
      })
      .catch(err => {
        console.group("❌ API ERROR");
        console.error(err);
        console.groupEnd();
      });
  }, []);

  const renderGraph = (graph, finalRisk, riskScores) => {
    if (!svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    /* ============================
       RISK MAPS
    ============================ */
    const riskMap = {};
    (finalRisk?.wallets || []).forEach(w => {
      riskMap[w.id] = w;
    });

    const riskScoresMap = {};
    (riskScores?.wallets || []).forEach(w => {
      riskScoresMap[w.id] = w;
    });

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#0f172a");

    svg.selectAll("*").remove();

    const container = svg.append("g");

    svg.call(
      d3.zoom()
        .scaleExtent([0.3, 4])
        .on("zoom", e => container.attr("transform", e.transform))
    );

    /* ============================
       DEFINITIONS (Glow + Arrow)
    ============================ */
    const defs = svg.append("defs");

    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#ef4444");

    defs.append("filter")
      .attr("id", "glow")
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");

    /* ============================
       DEGREE → NODE SIZE
    ============================ */
    const degree = {};
    graph.edges.forEach(e => {
      degree[e.source] = (degree[e.source] || 0) + 1;
      degree[e.target] = (degree[e.target] || 0) + 1;
    });

    const radius = d3.scaleLinear()
      .domain(d3.extent(Object.values(degree)))
      .range([8, 26]);

    /* ============================
       FORCE SIMULATION
    ============================ */
    const sim = d3.forceSimulation(graph.nodes)
      .force("link", d3.forceLink(graph.edges).id(d => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-420))
      .force("center", d3.forceCenter(width / 2, height / 2));

    /* ============================
       TOOLTIP
    ============================ */
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "linear-gradient(135deg, rgba(30, 58, 138, 0.95), rgba(15, 23, 42, 0.95))")
      .style("backdrop-filter", "blur(12px)")
      .style("border", "1px solid rgba(59, 130, 246, 0.3)")
      .style("padding", "12px 16px")
      .style("border-radius", "12px")
      .style("font-size", "13px")
      .style("color", "#e5e7eb")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("box-shadow", "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)")
      .style("font-family", "system-ui, -apple-system, sans-serif");

    /* ============================
       LINKS
    ============================ */
    const link = container.append("g")
      .selectAll("line")
      .data(graph.edges)
      .enter()
      .append("line")
      .attr("stroke", d =>
        d.pattern === "smurfing" ? "#ef4444" :
        d.pattern === "peeling" ? "#a855f7" :
        "#64748b"
      )
      .attr("stroke-width", d =>
        d.pattern === "smurfing" ? 4 :
        d.pattern === "peeling" ? 3 : 1.2
      )
      .attr("stroke-dasharray", d =>
        d.pattern === "peeling" ? "6 6" : "4 6"
      )
      .attr("marker-end", d => d.pattern ? "url(#arrow)" : null);

    /* Animated flow */
    let dash = 0;
    d3.timer(() => {
      dash -= 0.8;
      link.attr("stroke-dashoffset", dash);
    });

    /* ============================
       NODES
    ============================ */
    const node = container.append("g")
      .selectAll("circle")
      .data(graph.nodes)
      .enter()
      .append("circle")
      .attr("r", d => radius(degree[d.id] || 1))
      .attr("fill", d => {
        const r = riskMap[d.id]?.final_risk ?? 0;
        if (r >= 0.85) return "#dc2626";
        if (r >= 0.6) return "#f97316";
        if (r >= 0.3) return "#22c55e";
        return "#2563eb";
      })
      .attr("filter", d =>
        riskMap[d.id]?.final_risk >= 0.85 ? "url(#glow)" : null
      )
      .on("mouseover", (e, d) => {
        const info = riskMap[d.id];
        const base = riskScoresMap[d.id]?.base_risk;
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #60a5fa;">${d.id}</div>
            <div style="margin-bottom: 4px;"><span style="color: #94a3b8;">Final Risk:</span> <span style="font-weight: 600; color: ${info?.final_risk >= 0.85 ? '#ef4444' : info?.final_risk >= 0.6 ? '#f97316' : '#22c55e'};">${(info?.final_risk * 100).toFixed(1)}%</span></div>
            <div style="margin-bottom: 8px;"><span style="color: #94a3b8;">Base Risk:</span> <span style="font-weight: 600;">${(base * 100).toFixed(1)}%</span></div>
            ${info?.reasons?.length ? `<div style="border-top: 1px solid rgba(59, 130, 246, 0.2); padding-top: 8px; margin-top: 8px;">${info.reasons.map(r => `<div style="margin: 4px 0; color: #cbd5e1;">• ${r}</div>`).join("")}</div>` : ""}
          `);
      })
      .on("mousemove", e => {
        tooltip
          .style("left", e.pageX + 12 + "px")
          .style("top", e.pageY + 12 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0))
      .call(
        d3.drag()
          .on("start", e => !e.active && sim.alphaTarget(0.3).restart())
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on("end", e => !e.active && sim.alphaTarget(0))
      );

    /* ============================
       SIM TICK
    ============================ */
    sim.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-950 overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 grid-background-graph" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-slate-950/60 to-slate-950/80 pointer-events-none" />
      
      {/* Radial glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slower pointer-events-none" />
      
      {/* Legend */}
      <div className="absolute top-6 right-6 bg-gradient-to-br from-blue-900/60 to-slate-900/60 backdrop-blur-xl border border-blue-400/20 rounded-xl p-4 shadow-lg shadow-blue-500/10 z-10">
        <div className="text-sm font-semibold text-zinc-100 mb-3">Risk Levels</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg shadow-red-500/30"></div>
            <span className="text-zinc-300">Critical (≥85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-zinc-300">High (60-84%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-zinc-300">Medium (30-59%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-zinc-300">Low (&lt;30%)</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-400/20">
          <div className="text-sm font-semibold text-zinc-100 mb-3">Patterns</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span className="text-zinc-300">Smurfing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-purple-500" style={{borderTop: '2px dashed'}}></div>
              <span className="text-zinc-300">Peeling</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-slate-500"></div>
              <span className="text-zinc-300">Normal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => window.location.reload()}
        className="absolute top-6 left-6 z-10 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 backdrop-blur-xl border border-blue-400/30 text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
      >
        <span className="flex items-center gap-2">
          <span>←</span>
          <span className="bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">Back to Home</span>
        </span>
      </button>

      {/* Graph controls info */}
      <div className="absolute bottom-6 left-6 bg-gradient-to-br from-blue-900/60 to-slate-900/60 backdrop-blur-xl border border-blue-400/20 rounded-xl p-4 shadow-lg shadow-blue-500/10 z-10">
        <div className="text-xs text-zinc-400 space-y-1">
          <div><span className="text-blue-400 font-semibold">Drag</span> nodes to reposition</div>
          <div><span className="text-blue-400 font-semibold">Scroll</span> to zoom in/out</div>
          <div><span className="text-blue-400 font-semibold">Hover</span> over nodes for details</div>
        </div>
      </div>
      
      <svg ref={svgRef} className="relative w-full h-full z-0" />

      <style>{`
        .grid-background-graph {
          background-image: 
            linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridMove 25s linear infinite;
        }

        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 10s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}