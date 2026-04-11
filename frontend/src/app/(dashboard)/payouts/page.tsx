"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CloudLightning,
  Car,
  Smartphone,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Umbrella,
} from "lucide-react";
import { workerApi, type Claim } from "@/lib/worker";
import { useLanguageStore } from "@/store/languageStore";
import { t } from "@/lib/i18n";

// ── Helpers ────────────────────────────────────────────────

function resolutionLabel(path: string): string {
  switch (path) {
    case "fast_track":
      return "Fast Track";
    case "soft_queue":
      return "Soft Queue";
    case "active_verify":
      return "Active Verify";
    case "denied":
      return "Denied";
    default:
      return path;
  }
}

function resolutionColor(path: string): string {
  switch (path) {
    case "fast_track":
      return "#34D399"; // green
    case "soft_queue":
      return "#60A5FA"; // blue
    case "active_verify":
      return "#FBBF24"; // amber
    case "denied":
      return "#F87171"; // red
    default:
      return "#94A3B8";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "paid":
      return "#34D399";
    case "processing":
      return "#FBBF24";
    case "approved":
      return "#34D399";
    case "denied":
      return "#F87171";
    default:
      return "#94A3B8";
  }
}

// Infer disruption type from resolution path / hours (no type field in API)
function disruptionIcon(claim: Claim) {
  if (claim.resolution_path === "denied")
    return <XCircle size={18} color="#F87171" />;
  if (claim.disrupted_hours > 3)
    return <CloudLightning size={18} color="#60A5FA" />;
  if (claim.disrupted_hours > 1.5) return <Car size={18} color="#FBBF24" />;
  return <Smartphone size={18} color="#A78BFA" />;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
}

// ── Component ──────────────────────────────────────────────

export default function PayoutsPage() {
  const language = useLanguageStore((s) => s.language);
  const {
    data: claims,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["claims"],
    queryFn: workerApi.getClaims,
    staleTime: 30000,
  });

  // ── Summary stats ──
  const paidClaims =
    claims?.filter((c) => c.status === "paid" || c.status === "approved") ?? [];
  const totalPaidOut = paidClaims.reduce(
    (s, c) => s + (c.payout_amount ?? 0),
    0,
  );

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // start of this week
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = paidClaims
    .filter((c) => new Date(c.created_at) >= weekStart)
    .reduce((s, c) => s + (c.payout_amount ?? 0), 0);

  const totalClaims = claims?.length ?? 0;

  return (
    <div
      style={{
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        paddingBottom: "32px",
      }}
    >
      {/* 1. Header */}
      <header
        className="stagger-1"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              marginBottom: "4px",
            }}
          >
            {t(language, "payouts_title")}
          </h2>
          <p className="label-micro">{t(language, "claim_settlements")}</p>
        </div>
        <button
          onClick={() => {
            navigator.vibrate?.(10);
            refetch();
          }}
          disabled={isFetching}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border-glass)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isFetching ? 0.5 : 1,
            transition: "all 0.2s",
          }}
          title="Refresh"
        >
          <RefreshCw
            size={16}
            color="var(--text-secondary)"
            style={{
              animation: isFetching ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>
      </header>

      {/* 2. Summary Card */}
      <section
        className="stagger-2 glass-panel interactive-card"
        style={{ padding: "20px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              paddingRight: "16px",
              borderRight: "1px solid var(--border-glass)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              Total
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.3px",
                color: "var(--success)",
                lineHeight: 1.1,
              }}
            >
              ₹{totalPaidOut.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              paid out
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              paddingLeft: "16px",
              paddingRight: "16px",
              borderRight: "1px solid var(--border-glass)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              This Week
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.3px",
                color: "var(--text-primary)",
                lineHeight: 1.1,
              }}
            >
              ₹{thisWeek.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              settled
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              paddingLeft: "16px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              Claims
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.3px",
                color: "var(--text-primary)",
                lineHeight: 1.1,
              }}
            >
              {totalClaims}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              all time
            </span>
          </div>
        </div>
      </section>

      {/* 3. Claims List */}
      <section className="stagger-3">
        <h3 className="label-micro" style={{ marginBottom: "14px" }}>
          {t(language, "recent_claims")}
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card" style={{ padding: "16px" }}>
                <div
                  className="skeleton"
                  style={{ height: "14px", width: "40%", marginBottom: "10px" }}
                />
                <div
                  className="skeleton"
                  style={{ height: "20px", width: "60%", marginBottom: "8px" }}
                />
                <div
                  className="skeleton"
                  style={{ height: "12px", width: "30%" }}
                />
              </div>
            ))}
          </div>
        ) : !claims || claims.length === 0 ? (
          /* 4. Empty State */
          <div
            className="glass-panel interactive-card"
            style={{
              padding: "40px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Umbrella size={30} color="#60A5FA" strokeWidth={1.5} />
            </div>
            <div>
              <h4
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                You&apos;re fully protected ✨
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  maxWidth: "240px",
                }}
              >
                No disruptions detected yet. We&apos;ll automatically pay you if
                anything affects your earnings.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Vertical timeline line */}
            <div
              style={{
                position: "absolute",
                left: "18px",
                top: 0,
                bottom: 0,
                width: "2px",
                background: "rgba(255,255,255,0.06)",
              }}
            />

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {claims.map((claim, index) => {
                const disruptedHours = Number.isFinite(
                  claim.disrupted_hours as number,
                )
                  ? Number(claim.disrupted_hours)
                  : 0;
                const payoutAmount = Number.isFinite(
                  claim.payout_amount as number,
                )
                  ? Number(claim.payout_amount)
                  : 0;
                const hasResolvedAmount =
                  typeof claim.payout_amount === "number" &&
                  Number.isFinite(claim.payout_amount);
                const amtColor = statusColor(claim.status);
                const resBg = `${resolutionColor(claim.resolution_path)}18`;
                const resBorder = `${resolutionColor(claim.resolution_path)}35`;

                return (
                  <div key={claim.id} style={{ display: "flex", gap: "12px" }}>
                    {/* Timeline Dot */}
                    <div
                      style={{
                        width: "36px",
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "6px",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: amtColor,
                          boxShadow: `0 0 10px ${amtColor}`,
                        }}
                      />
                    </div>

                    {/* Existing card */}
                    <div
                      className="glass-panel interactive-card"
                      style={{
                        flex: 1,
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        animation: `slideUpFade 0.5s cubic-bezier(0.16,1,0.3,1) both`,
                        animationDelay: `${0.1 + index * 0.07}s`,
                      }}
                    >
                      {/* Top row: icon + date + payout amount */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid var(--border-glass)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {disruptionIcon(claim)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                              marginBottom: "2px",
                            }}
                          >
                            {formatDate(claim.created_at)}
                          </p>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Disruption:{" "}
                            <strong style={{ color: "var(--text-primary)" }}>
                              {disruptedHours.toFixed(1)} hrs
                            </strong>
                          </p>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div
                            className="tabular-nums"
                            style={{
                              fontSize: "24px",
                              fontWeight: 800,
                              letterSpacing: "-0.3px",
                              color: amtColor,
                              lineHeight: 1,
                            }}
                          >
                            {claim.status === "pending" && !hasResolvedAmount
                              ? "TBD"
                              : `₹${payoutAmount.toLocaleString("en-IN")}`}
                          </div>
                          <div style={{ marginTop: "6px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "8px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: `${amtColor}20`,
                                color: amtColor,
                                border: `1px solid ${amtColor}40`,
                              }}
                            >
                              {claim.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Resolution path badge */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "99px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: resBg,
                            color: resolutionColor(claim.resolution_path),
                            border: `1px solid ${resBorder}`,
                            letterSpacing: "0.3px",
                          }}
                        >
                          {resolutionLabel(claim.resolution_path)}
                        </span>

                        {/* Fraud score warning (only if > 0) */}
                        {claim.fraud_score > 0 && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "99px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: "rgba(245, 158, 11, 0.1)",
                              color: "#F59E0B",
                              border: "1px solid rgba(245, 158, 11, 0.25)",
                            }}
                          >
                            <AlertTriangle size={11} />
                            Fraud Score{" "}
                            {Math.min(
                              100,
                              Math.max(0, claim.fraud_score),
                            ).toFixed(0)}
                            /100
                          </span>
                        )}
                      </div>

                      {/* Razorpay payment ID (muted, only when present) */}
                      {claim.decision_explanation && (
                        <div
                          style={{
                            borderTop: "1px solid var(--border-glass)",
                            paddingTop: "10px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#E2E8F0",
                              fontWeight: 600,
                            }}
                          >
                            {claim.decision_explanation.title}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "var(--text-secondary)",
                              lineHeight: 1.45,
                              marginTop: "4px",
                            }}
                          >
                            {claim.decision_explanation.message}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#93C5FD",
                              lineHeight: 1.45,
                              marginTop: "4px",
                            }}
                          >
                            Tip: {claim.decision_explanation.worker_tip}
                          </p>
                        </div>
                      )}

                      {claim.razorpay_payment_id && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            fontFamily: "monospace",
                            borderTop: "1px solid var(--border-glass)",
                            paddingTop: "10px",
                            letterSpacing: "0.3px",
                          }}
                        >
                          Ref: {claim.razorpay_payment_id}
                        </p>
                      )}

                      {claim.status === "paid" && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--success)",
                            fontWeight: 600,
                            marginTop: claim.razorpay_payment_id ? "4px" : "0",
                            paddingTop: claim.razorpay_payment_id
                              ? "0"
                              : "10px",
                            borderTop: claim.razorpay_payment_id
                              ? "none"
                              : "1px solid var(--border-glass)",
                          }}
                        >
                          ✔ Payment credited to your account
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
