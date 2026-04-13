'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Public data types (API contract unchanged) ───────────────────────────────
export interface FraudNode {
  id: string;
  label: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  fraudScore: number;
  flags?: string[];
  zone?: string;
}

export interface FraudEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

export interface NetworkGraph {
  nodes: FraudNode[];
  edges: FraudEdge[];
}

// ─── Internal types ───────────────────────────────────────────────────────────
interface Position { x: number; y: number }

// ─── Design tokens ────────────────────────────────────────────────────────────
const RISK = {
  CRITICAL: { fill: '#DC2626', ring: '#FCA5A5', glow: 'rgba(220,38,38,0.65)', label: 'Critical', badge: '#DC2626' },
  HIGH:     { fill: '#D97706', ring: '#FCD34D', glow: 'rgba(217,119,6,0.55)',  label: 'High',     badge: '#D97706' },
  MEDIUM:   { fill: '#16A34A', ring: '#86EFAC', glow: 'rgba(22,163,74,0.45)', label: 'Medium',   badge: '#16A34A' },
  LOW:      { fill: '#475569', ring: '#CBD5E1', glow: 'rgba(71,85,105,0.3)',  label: 'Low',      badge: '#64748B' },
} as const;

// ─── AI Explanation Engine ────────────────────────────────────────────────────
function generateExplanation(node: FraudNode, clusterSize: number): { severity: string; reason: string; action: string } {
  if (node.fraudScore > 80) return {
    severity: 'CRITICAL THREAT',
    reason: `Score ${node.fraudScore}/100 — high-frequency anomalous claims, zone location spoofing, and connection to ${clusterSize} suspicious actors detected.`,
    action: 'Immediate freeze recommended. Escalate to Tier-2 investigation.',
  };
  if (node.fraudScore > 60) return {
    severity: 'ELEVATED RISK',
    reason: `Score ${node.fraudScore}/100 — claim cadence exceeds 3σ from zone baseline. Suspicious geographic pattern with ${clusterSize} shared-network nodes.`,
    action: 'Flag for manual review. Activate enhanced verification protocol.',
  };
  if (node.fraudScore > 40) return {
    severity: 'WATCH LIST',
    reason: `Score ${node.fraudScore}/100 — minor behavioral deviations detected. Low confidence in location consistency.`,
    action: 'Monitor for 7 days. No action required yet.',
  };
  return {
    severity: 'NOMINAL',
    reason: `Score ${node.fraudScore}/100 — activity within normal bounds. No suspicious pattern detected.`,
    action: 'No action required.',
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FraudNetworkGraph({ data }: { data: NetworkGraph }) {

  // ── State: all hooks BEFORE any early returns ────────────────────────────
  const [filter,       setFilter]       = useState<'ALL' | FraudNode['riskLevel']>('ALL');
  const [selectedNode, setSelectedNode] = useState<FraudNode | null>(null);
  const [hoveredNode,  setHoveredNode]  = useState<string | null>(null);
  const [mode,         setMode]         = useState<'NORMAL' | 'INVESTIGATE'>('NORMAL');
  const [pulse,        setPulse]        = useState(true);
  const [dashOffset,   setDashOffset]   = useState(0);
  const canvasRef = useRef<SVGSVGElement>(null);

  // ── Real-time pulse tick (1.2 s) ─────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(id);
  }, []);

  // ── Animated dash on selected edges ──────────────────────────────────────
  useEffect(() => {
    let frame: number;
    const tick = () => { setDashOffset(o => (o - 0.8) % 28); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // ── Fraud ring / cluster detection (DFS on high-risk nodes) ──────────────
  const fraudClusters = useMemo<string[][]>(() => {
    const clusters: string[][] = [];
    const visited = new Set<string>();
    data.nodes.forEach(node => {
      if (visited.has(node.id) || node.fraudScore < 60) return;
      const cluster: string[] = [];
      const stack = [node.id];
      while (stack.length) {
        const curr = stack.pop()!;
        if (visited.has(curr)) continue;
        visited.add(curr);
        cluster.push(curr);
        data.edges.forEach(e => {
          if (e.source === curr && !visited.has(e.target)) stack.push(e.target);
          if (e.target === curr && !visited.has(e.source)) stack.push(e.source);
        });
      }
      if (cluster.length >= 2) clusters.push(cluster);
    });
    return clusters;
  }, [data]);

  const clusterMap = useMemo(() => {
    const m = new Map<string, number>(); // nodeId → cluster index
    fraudClusters.forEach((c, i) => c.forEach(id => m.set(id, i)));
    return m;
  }, [fraudClusters]);

  // ── Layout: radial + investigate mode filter ──────────────────────────────
  const { visibleNodes, visibleEdges, positions, centerNodeId } = useMemo(() => {
    if (data.nodes.length === 0) return {
      visibleNodes: [] as FraudNode[],
      visibleEdges: [] as FraudEdge[],
      positions: new Map<string, Position>(),
      centerNodeId: null as string | null,
    };

    const degreeMap = new Map<string, number>();
    data.nodes.forEach(n => degreeMap.set(n.id, 0));
    data.edges.forEach(e => {
      degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
    });

    const centerNode = [...data.nodes].sort((a, b) =>
      (degreeMap.get(b.id) ?? 0) - (degreeMap.get(a.id) ?? 0))[0];

    // Investigate mode: only show selected + connected nodes
    const baseNodes = mode === 'INVESTIGATE' && selectedNode
      ? data.nodes.filter(n =>
          n.id === selectedNode.id ||
          data.edges.some(e =>
            (e.source === selectedNode.id && e.target === n.id) ||
            (e.target === selectedNode.id && e.source === n.id)
          )
        )
      : data.nodes.filter(n => filter === 'ALL' || n.riskLevel === filter || n.id === centerNode.id);

    const nodeIdSet    = new Set(baseNodes.map(n => n.id));
    const filteredEdges = data.edges.filter(e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target));

    const viewCenter   = { x: 490, y: 285 };
    const posMap       = new Map<string, Position>();
    posMap.set(centerNode.id, viewCenter);

    const ringNodes    = baseNodes.filter(n => n.id !== centerNode.id);
    const ringRadius   = Math.max(155, Math.min(235, 115 + ringNodes.length * 10));
    ringNodes.forEach((node, idx) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * idx) / Math.max(1, ringNodes.length);
      posMap.set(node.id, {
        x: viewCenter.x + ringRadius * Math.cos(angle),
        y: viewCenter.y + ringRadius * Math.sin(angle),
      });
    });

    return { visibleNodes: baseNodes, visibleEdges: filteredEdges, positions: posMap, centerNodeId: centerNode.id };
  }, [data, filter, mode, selectedNode]);

  // ── Connected edge/node sets for selected node ────────────────────────────
  const { connectedIds, connectedEdgeKeys } = useMemo(() => {
    if (!selectedNode) return { connectedIds: new Set<string>(), connectedEdgeKeys: new Set<string>() };
    const ids  = new Set<string>();
    const keys = new Set<string>();
    visibleEdges.forEach((e, i) => {
      if (e.source === selectedNode.id || e.target === selectedNode.id) {
        ids.add(e.source === selectedNode.id ? e.target : e.source);
        keys.add(`${e.source}-${e.target}-${i}`);
      }
    });
    return { connectedIds: ids, connectedEdgeKeys: keys };
  }, [selectedNode, visibleEdges]);

  const connectedNodeObjects = useMemo(() =>
    visibleNodes.filter(n => connectedIds.has(n.id)),
    [visibleNodes, connectedIds]);

  const selectedClusterSize = selectedNode ? (
    fraudClusters.find(c => c.includes(selectedNode.id))?.length ?? 0
  ) : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNodeClick = useCallback((node: FraudNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const handleCanvasClick = useCallback(() => setSelectedNode(null), []);

  // ── Node sizing / opacity helpers ─────────────────────────────────────────
  const nodeR = (node: FraudNode, isCenter: boolean) =>
    isCenter ? 44 : Math.max(17, Math.min(33, 14 + node.fraudScore / 5));

  const nodeOpacity = (node: FraudNode) => {
    if (!selectedNode) return pulse ? 1 : 0.82;
    if (node.id === selectedNode.id) return 1;
    if (connectedIds.has(node.id)) return 0.9;
    return 0.15;
  };

  const edgeKey = (e: FraudEdge, i: number) => `${e.source}-${e.target}-${i}`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div
        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-3">
          {/* Live pulse dot */}
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-70" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Fraud Intelligence Network
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {fraudClusters.length} ring{fraudClusters.length !== 1 ? 's' : ''} detected · {data.nodes.length} actors · {data.edges.length} connections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Investigate mode toggle */}
          <button
            onClick={() => setMode(m => m === 'NORMAL' ? 'INVESTIGATE' : 'NORMAL')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150"
            style={{
              background: mode === 'INVESTIGATE' ? '#DC2626' : 'rgba(220,38,38,0.12)',
              color: mode === 'INVESTIGATE' ? '#fff' : '#F87171',
              border: `1px solid ${mode === 'INVESTIGATE' ? '#DC2626' : 'rgba(220,38,38,0.25)'}`,
            }}
          >
            {mode === 'INVESTIGATE' ? '✕ Exit Investigate' : '🔍 Investigate Mode'}
          </button>

          {/* Risk filter chips */}
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(level => {
            const active = filter === level && mode !== 'INVESTIGATE';
            const meta   = level !== 'ALL' ? RISK[level] : null;
            return (
              <button
                key={level}
                type="button"
                onClick={() => { setFilter(level); setMode('NORMAL'); setSelectedNode(null); }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
                style={{
                  background: active ? (meta?.fill ?? '#334155') : 'rgba(255,255,255,0.05)',
                  color: active ? '#fff' : (meta?.fill ?? 'rgba(255,255,255,0.45)'),
                  border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fraud ring alert strip ───────────────────────────────────────── */}
      {fraudClusters.length > 0 && (
        <div
          className="px-6 py-2 flex items-center gap-3"
          style={{ background: 'rgba(220,38,38,0.08)', borderBottom: '1px solid rgba(220,38,38,0.15)' }}
        >
          <span className="text-red-400 text-xs font-bold tracking-wider uppercase">🚨 Fraud Rings Detected</span>
          <div className="flex gap-2">
            {fraudClusters.map((cluster, i) => (
              <span
                key={i}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(220,38,38,0.2)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.3)' }}
              >
                Ring {i + 1}: {cluster.length} actors
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Graph + side panel ───────────────────────────────────────────── */}
      <div className="relative flex">
        {/* SVG Canvas */}
        <svg
          ref={canvasRef}
          viewBox="0 0 980 560"
          className="flex-1 block"
          style={{ height: 560, minWidth: 0 }}
          onClick={handleCanvasClick}
        >
          <defs>
            {/* Glow filters per risk level */}
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(risk => (
              <filter key={risk} id={`g-${risk}`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation={risk === 'CRITICAL' ? 7 : risk === 'HIGH' ? 5 : 3} result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
            {/* Grid pattern for cyber background */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="980" height="560" fill="url(#grid)" />

          {/* ── Edges ───────────────────────────────────────────────────── */}
          {visibleEdges.map((edge, idx) => {
            const src = positions.get(edge.source);
            const tgt = positions.get(edge.target);
            if (!src || !tgt) return null;

            const key        = edgeKey(edge, idx);
            const isSelected = connectedEdgeKeys.has(key);
            const bothInRing = clusterMap.has(edge.source) &&
                               clusterMap.get(edge.source) === clusterMap.get(edge.target);
            const opacity    = !selectedNode ? (bothInRing ? 0.7 : 0.25) : (isSelected ? 1 : 0.04);
            const stroke     = isSelected ? '#EF4444' : bothInRing ? '#F87171' : '#4A5568';
            const sw         = isSelected ? 2.5 : bothInRing ? 1.8 : Math.max(0.8, edge.weight * 1.8);

            return (
              <g key={key}>
                <line
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeOpacity={opacity}
                  style={{ transition: 'stroke-opacity 0.3s, stroke 0.3s' }}
                />
                {/* Animated flowing dash on active edges */}
                {(isSelected || bothInRing) && (
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={isSelected ? '#FF6B6B' : 'rgba(248,113,113,0.6)'}
                    strokeWidth={isSelected ? 2 : 1.2}
                    strokeDasharray="6 8"
                    strokeDashoffset={dashOffset}
                    strokeOpacity={opacity * 0.8}
                    strokeLinecap="round"
                  />
                )}
                {/* Midpoint edge label on selected */}
                {isSelected && (
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#F87171"
                    fontWeight="700"
                    letterSpacing="0.04em"
                  >
                    {edge.label} ·{edge.weight.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Nodes ───────────────────────────────────────────────────── */}
          {visibleNodes.map(node => {
            const pos      = positions.get(node.id);
            if (!pos) return null;

            const isCenter   = node.id === centerNodeId;
            const isSelected = selectedNode?.id === node.id;
            const isHovered  = hoveredNode === node.id;
            const inCluster  = clusterMap.has(node.id);
            const meta       = RISK[node.riskLevel];
            const r          = nodeR(node, isCenter);
            const opacity    = nodeOpacity(node);
            const needsGlow  = inCluster || isSelected || isHovered || node.riskLevel === 'CRITICAL';

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer', opacity, transition: 'opacity 0.25s' }}
                filter={needsGlow ? `url(#g-${node.riskLevel})` : undefined}
                onClick={e => handleNodeClick(node, e)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Fraud ring halo (animated) */}
                {inCluster && (
                  <circle cx={pos.x} cy={pos.y} r={r + 14} fill="none" stroke="#DC2626" strokeWidth={1.5} strokeOpacity={0.25}>
                    <animate attributeName="r" values={`${r + 10};${r + 22};${r + 10}`} dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.35;0;0.35" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* CRITICAL pulse ring */}
                {node.riskLevel === 'CRITICAL' && !inCluster && (
                  <circle cx={pos.x} cy={pos.y} r={r + 9} fill="none" stroke={meta.fill} strokeWidth={1.2} strokeOpacity={0.3}>
                    <animate attributeName="r" values={`${r + 6};${r + 16};${r + 6}`} dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Selection ring */}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={r + 7} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeOpacity={0.85} />
                )}

                {/* Hover ring */}
                {isHovered && !isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={r + 5} fill="none" stroke={meta.fill} strokeWidth={1.5} strokeOpacity={0.5} />
                )}

                {/* Main node fill */}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={isCenter ? '#1E293B' : meta.fill}
                  fillOpacity={0.92}
                />

                {/* Inner rim */}
                <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke="#FFFFFF" strokeOpacity={isSelected ? 0.6 : 0.18} strokeWidth={1.2} />

                {/* Fraud ring badge top-right */}
                {inCluster && (
                  <g>
                    <circle cx={pos.x + r * 0.72} cy={pos.y - r * 0.72} r={6} fill="#1a0a0a" />
                    <circle cx={pos.x + r * 0.72} cy={pos.y - r * 0.72} r={5} fill="#DC2626" />
                    <text
                      x={pos.x + r * 0.72} y={pos.y - r * 0.72 + 3.5}
                      textAnchor="middle" fontSize="6" fill="#fff" fontWeight="900"
                    >!</text>
                  </g>
                )}

                {/* Score inside node */}
                <text
                  x={pos.x} y={pos.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={r > 28 ? 12 : 9}
                  fill="#FFFFFF" fontWeight="800"
                >
                  {node.fraudScore}
                </text>

                {/* Label below */}
                <text
                  x={pos.x} y={pos.y + r + 17}
                  textAnchor="middle" fontSize="11"
                  fill={isSelected ? meta.fill : 'rgba(255,255,255,0.7)'}
                  fontWeight={isSelected ? '700' : '400'}
                >
                  {node.label}
                </text>

                {/* Risk label */}
                <text
                  x={pos.x} y={pos.y + r + 29}
                  textAnchor="middle" fontSize="8"
                  fill={meta.fill}
                  fontWeight="700" letterSpacing="0.1em"
                >
                  {meta.label.toUpperCase()}
                </text>

                {/* Hover tooltip */}
                {isHovered && !isSelected && (
                  <g>
                    <rect x={pos.x - 66} y={pos.y - r - 48} width={132} height={38} rx={7} fill="#0F172A" fillOpacity={0.97} />
                    <text x={pos.x} y={pos.y - r - 33} textAnchor="middle" fontSize="11" fill="#F8FAFC" fontWeight="600">
                      {node.label}
                    </text>
                    <text x={pos.x} y={pos.y - r - 19} textAnchor="middle" fontSize="9.5" fill={meta.fill} fontWeight="500">
                      Score {node.fraudScore} · {meta.label}{inCluster ? ' · 🔴 Ring' : ''}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Fraud Insight Side Panel ─────────────────────────────────── */}
        {selectedNode && (() => {
          const meta   = RISK[selectedNode.riskLevel];
          const expl   = generateExplanation(selectedNode, selectedClusterSize);
          const inRing = clusterMap.has(selectedNode.id);
          const ringIdx = clusterMap.get(selectedNode.id);
          const zone   = selectedNode.zone ?? selectedNode.id.slice(0, 8).toUpperCase();
          const sevColor: Record<string, string> = {
            'CRITICAL THREAT': '#DC2626',
            'ELEVATED RISK':   '#D97706',
            'WATCH LIST':      '#F59E0B',
            'NOMINAL':         '#16A34A',
          };

          return (
            <div
              className="w-72 flex-shrink-0 flex flex-col overflow-y-auto"
              style={{
                background: '#080D14',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                maxHeight: 560,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Panel header */}
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${meta.fill}22`, color: meta.fill, border: `1px solid ${meta.fill}44` }}
                    >
                      {meta.label.toUpperCase()}
                    </span>
                    {inRing && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        RING {(ringIdx ?? 0) + 1}
                      </span>
                    )}
                    {selectedNode.id === centerNodeId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        HUB
                      </span>
                    )}
                  </div>
                  <button
                    className="text-xs transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#fff')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}
                    onClick={() => setSelectedNode(null)}
                  >✕</button>
                </div>

                <h4 className="text-white font-bold text-[15px] truncate">{selectedNode.label}</h4>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  📍 Zone: {zone} · ID: {selectedNode.id.slice(0, 10)}…
                </p>

                {/* Fraud score bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Fraud Score
                    </span>
                    <span className="font-black text-lg" style={{ color: meta.fill }}>
                      {selectedNode.fraudScore}<span className="text-[11px] font-normal" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${selectedNode.fraudScore}%`, background: `linear-gradient(90deg, ${meta.fill}88, ${meta.fill})` }}
                    />
                  </div>
                </div>
              </div>

              {/* AI Explanation */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  🧠 AI Analysis
                </p>
                <div
                  className="text-[10px] font-bold mb-1.5 tracking-wider"
                  style={{ color: sevColor[expl.severity] ?? '#94A3B8' }}
                >
                  {expl.severity}
                </div>
                <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {expl.reason}
                </p>
                <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  → {expl.action}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'Connections', value: connectedIds.size },
                  { label: 'Ring Size',   value: selectedClusterSize || '—' },
                  { label: 'Risk',        value: meta.label },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center py-3" style={{ background: '#080D14' }}>
                    <p className="text-[13px] font-black text-white">{value}</p>
                    <p className="text-[9px] tracking-wider uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Flags */}
              {selectedNode.flags && selectedNode.flags.length > 0 && (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Active Flags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.flags.map(flag => (
                      <span key={flag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(220,38,38,0.15)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.25)' }}>
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected nodes list */}
              {connectedNodeObjects.length > 0 && (
                <div className="px-4 py-3 flex-1">
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Connected Actors ({connectedNodeObjects.length})
                  </p>
                  <div className="space-y-1.5">
                    {connectedNodeObjects.map(n => {
                      const nm = RISK[n.riskLevel];
                      return (
                        <button
                          key={n.id}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)')}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}
                          onClick={() => setSelectedNode(n)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: nm.fill }} />
                            <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{n.label}</span>
                            {clusterMap.has(n.id) && (
                              <span className="text-[9px] font-bold px-1.5 rounded" style={{ background: 'rgba(220,38,38,0.2)', color: '#F87171' }}>RING</span>
                            )}
                          </div>
                          <span className="text-[11px] font-black" style={{ color: nm.fill }}>{n.fraudScore}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Investigate / Freeze actions */}
              <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white transition-all duration-150"
                  style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#F87171' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.3)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.15)')}
                  onClick={() => { setMode('INVESTIGATE'); }}
                >
                  🔍 Investigate Subnetwork
                </button>
                <button
                  className="w-full py-2 rounded-xl text-[12px] font-bold transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
                >
                  🚫 Flag for Freeze
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Legend + status bar ──────────────────────────────────────────── */}
      <div
        className="px-6 py-2.5 flex items-center gap-5 flex-wrap"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Risk</span>
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(risk => (
          <button
            key={risk}
            onClick={() => { setFilter(risk); setMode('NORMAL'); setSelectedNode(null); }}
            className="flex items-center gap-1.5 text-[11px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: RISK[risk].fill }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: RISK[risk].fill, boxShadow: `0 0 6px ${RISK[risk].glow}` }} />
            {RISK[risk].label}
          </button>
        ))}

        {/* Ring legend */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#DC2626' }} />
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Fraud Ring</span>
        </div>

        <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {mode === 'INVESTIGATE' ? '🔍 Investigate mode · click canvas to exit' :
           selectedNode ? '↗ Click canvas to deselect' : 'Click any node to investigate'}
        </span>
      </div>
    </div>
  );
}
