'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  fetchFraudQueue,
  FraudQueueItem,
} from '@/lib/admin/adminClient';

export default function Claims() {
  const [claimsData, setClaimsData] = useState<FraudQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔌 Fetch from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchFraudQueue();
        setClaimsData(data);
      } catch (err) {
        console.error('Error fetching claims:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // 🔴 OPTIONAL: Auto-refresh every 5s (live feel)
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🎨 Helpers
  const getFraudColor = (score: number) => {
    if (score < 20) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'approved' || status === 'paid')
      return 'bg-green-100 text-green-700';
    if (status === 'denied')
      return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  // ⏳ Loading UI
  if (loading) {
    return <div className="p-8 text-sm">Loading claims...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Claims Pipeline
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time parametric validation flow for gig-economy payouts.
          </p>
        </div>

        <div className="flex gap-3">
          <select className="px-4 py-2 border border-border rounded-lg bg-card text-foreground">
            <option>All Statuses</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Denied</option>
          </select>

          <select className="px-4 py-2 border border-border rounded-lg bg-card text-foreground">
            <option>All Paths</option>
            <option>Fast Track</option>
            <option>Soft Queue</option>
            <option>Active Verify</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-semibold">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase">CLAIM ID</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase">WORKER</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase">CITY</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase">FRAUD SCORE</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase">PATH</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase">STATUS</th>
              </tr>
            </thead>

            <tbody>
              {claimsData.map((claim) => (
                <tr
                  key={claim.claim_id}
                  className="border-b border-border hover:bg-background transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-foreground">
                    {claim.claim_id}
                  </td>

                  <td className="py-4 px-6 text-foreground">
                    {claim.worker_name}
                  </td>

                  <td className="py-4 px-6 text-foreground">
                    {claim.city}
                  </td>

                  <td className="py-4 px-6">
                    <span className={`font-bold ${getFraudColor(claim.fraud_score)}`}>
                      {claim.fraud_score}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-sm font-medium uppercase">
                    {claim.resolution_path}
                  </td>

                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}