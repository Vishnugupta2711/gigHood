import {
  fetchAdminStats,
  fetchHexZones,
  fetchClaims,
  fetchTriggerEvents,
  HexZone,
  Claim,
  TriggerEvent,
} from "../lib/api";

function statusColor(status: string): string {
  if (status === "DISRUPTED") return "bg-red-500";
  if (status === "ELEVATED") return "bg-amber-400";
  return "bg-green-500";
}

function statusTextColor(status: string): string {
  if (status === "DISRUPTED") return "text-red-600";
  if (status === "ELEVATED") return "text-amber-600";
  return "text-green-600";
}

function pathLabel(path: string): string {
  const map: Record<string, string> = {
    fast_track: "Path 1 — Fast Track",
    soft_queue: "Path 2 — Soft Queue",
    active_verify: "Path 3 — Active Verify",
    denied: "Path 4 — Denied",
  };
  return map[path] ?? path;
}

function claimStatusBadge(status: string): string {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "denied") return "bg-red-100 text-red-700";
  if (status === "under_review") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

export default async function AdminDashboard() {
  let stats = null;
  let zones: HexZone[] = [];
  let claims: Claim[] = [];
  let events: TriggerEvent[] = [];
  let error: string | null = null;

  try {
    [stats, zones, claims, events] = await Promise.all([
      fetchAdminStats(),
      fetchHexZones(),
      fetchClaims(),
      fetchTriggerEvents(),
    ]);
  } catch (e) {
    error = "Backend API unavailable. Showing placeholder layout.";
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            g
          </div>
          <span className="text-xl font-bold text-gray-900">
            gigHood Admin Dashboard
          </span>
        </div>
        <span className="text-sm text-gray-400">
          Live — Bengaluru Region
        </span>
      </header>

      <main className="px-8 py-6 space-y-8">
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Stats Summary ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              label="Active Policies"
              value={stats?.active_policies?.toLocaleString() ?? "—"}
            />
            <StatCard
              label="Pending Claims"
              value={stats?.pending_claims?.toString() ?? "—"}
              accent="text-amber-600"
            />
            <StatCard
              label="Total Payouts (INR)"
              value={
                stats
                  ? `₹${stats.total_payouts_inr.toLocaleString()}`
                  : "—"
              }
            />
            <StatCard
              label="Avg Fraud Score"
              value={stats ? `${(stats.avg_fraud_score * 100).toFixed(1)}%` : "—"}
              accent={
                stats && stats.avg_fraud_score > 0.3
                  ? "text-red-600"
                  : "text-green-600"
              }
            />
            <StatCard
              label="Loss Ratio"
              value={stats ? `${(stats.loss_ratio * 100).toFixed(0)}%` : "—"}
            />
          </div>
        </section>

        {/* ── Fraud Metrics ── */}
        {stats && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Fraud Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                label="Zone-Hop Rate"
                value={`${(stats.zone_hop_rate * 100).toFixed(1)}%`}
              />
              <StatCard
                label="Mock-Location Networks"
                value={stats.mock_location_network_count.toString()}
                accent={
                  stats.mock_location_network_count > 0
                    ? "text-red-600"
                    : "text-green-600"
                }
              />
              <StatCard
                label="Avg Payout (INR)"
                value={`₹${stats.avg_payout_inr}`}
              />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Live Hex Map (DCI Status) ── */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Live H3 Hex Map — DCI Status
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
              DISRUPTED (&gt;0.85)
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mx-1 ml-2" />
              ELEVATED (0.65–0.85)
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mx-1 ml-2" />
              NORMAL (≤0.65)
            </p>
            {zones.length === 0 ? (
              <p className="text-sm text-gray-400">No zone data available.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {zones.map((zone) => (
                  <li
                    key={zone.hex_id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3 h-3 rounded-full ${statusColor(
                          zone.dci_status
                        )}`}
                      />
                      <span className="font-mono text-xs text-gray-500">
                        {zone.hex_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={`font-semibold ${statusTextColor(
                          zone.dci_status
                        )}`}
                      >
                        DCI {zone.current_dci.toFixed(2)}
                      </span>
                      <span className="text-gray-400">
                        {zone.active_worker_count} workers
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Trigger Event Log ── */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Trigger Event Log
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-gray-400">No trigger events logged.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {events.map((event) => (
                  <li key={event.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-gray-500">
                        {event.hex_id}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          event.is_active
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {event.is_active ? "ACTIVE" : "CLOSED"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>DCI peak: {event.dci_peak.toFixed(2)}</span>
                      <span>{event.duration_minutes} min</span>
                      <span>{event.affected_worker_count} workers</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Started: {new Date(event.started_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Claims Table ── */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Claims — Resolution Paths
          </h2>
          {claims.length === 0 ? (
            <p className="text-sm text-gray-400">No claims data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-2 pr-4">Claim ID</th>
                    <th className="pb-2 pr-4">Worker</th>
                    <th className="pb-2 pr-4">Hex Zone</th>
                    <th className="pb-2 pr-4">Resolution Path</th>
                    <th className="pb-2 pr-4">Fraud Score</th>
                    <th className="pb-2 pr-4">Payout (INR)</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <td className="py-2 pr-4 font-mono text-xs text-gray-500">
                        {claim.id}
                      </td>
                      <td className="py-2 pr-4 text-gray-700">
                        {claim.worker_id}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-gray-400">
                        {claim.hex_id.slice(0, 12)}…
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {pathLabel(claim.resolution_path)}
                      </td>
                      <td
                        className={`py-2 pr-4 font-semibold ${
                          claim.fraud_score > 80
                            ? "text-red-600"
                            : claim.fraud_score > 40
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {claim.fraud_score}
                      </td>
                      <td className="py-2 pr-4 font-medium text-gray-800">
                        {claim.payout_amount > 0
                          ? `₹${claim.payout_amount}`
                          : "—"}
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${claimStatusBadge(
                            claim.status
                          )}`}
                        >
                          {claim.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Payout Summary ── */}
        {stats && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Payout Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-700">
                  ₹{stats.total_payouts_inr.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total Disbursed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-700">
                  ₹{stats.avg_payout_inr}
                </p>
                <p className="text-sm text-gray-500 mt-1">Average Payout</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-700">
                  {(stats.loss_ratio * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Loss Ratio</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "text-gray-900",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}
