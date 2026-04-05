'use client';

import { useEffect, useState } from 'react';
import {
  fetchFraudQueue,
  FraudQueueItem,
} from '@/lib/admin/adminClient';

export default function ClaimsPipelinePage() {
  const [claimsData, setClaimsData] = useState<FraudQueueItem[]>([]);
  const [selectedClaim, setSelectedClaim] =
    useState<FraudQueueItem | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔌 Fetch data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchFraudQueue();
        setClaimsData(data);
        if (data.length > 0) setSelectedClaim(data[0]);
      } catch (err) {
        console.error('Failed to fetch claims:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 🎨 Helpers
  const getFraudColor = (score: number) => {
    if (score < 20) return 'text-green-600';
    if (score < 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'approved' || status === 'paid')
      return 'bg-green-100 text-green-700';
    if (status === 'denied')
      return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  // ⏳ Loading state
  if (loading) {
    return <div className="p-8 text-sm">Loading claims...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER */}
      <section className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#0F172A]">
            Claims Pipeline
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time parametric validation flow for payouts.
          </p>
        </div>

        <button className="h-10 px-4 bg-[#0F172A] text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition">
          Export CSV
        </button>
      </section>

      {/* MAIN LAYOUT */}
      <section className="flex gap-6">
        
        {/* TABLE */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-left">
              
              <thead className="sticky top-0 bg-white border-b">
                <tr>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase">Worker</th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase">City</th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase">Fraud</th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase">Path</th>
                </tr>
              </thead>

              <tbody>
                {claimsData.map((claim) => (
                  <tr
                    key={claim.claim_id}
                    onClick={() => setSelectedClaim(claim)}
                    className={`cursor-pointer border-b hover:bg-slate-50 transition ${
                      selectedClaim?.claim_id === claim.claim_id
                        ? 'bg-slate-100'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-sm">
                      {claim.claim_id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {claim.worker_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {claim.city}
                    </td>
                    <td className={`px-4 py-3 font-bold ${getFraudColor(claim.fraud_score)}`}>
                      {claim.fraud_score}
                    </td>
                    <td className="px-4 py-3 text-xs uppercase text-slate-500">
                      {claim.resolution_path}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="w-[35%] bg-[#0F172A] text-white p-6 rounded-2xl">
          
          {selectedClaim ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {selectedClaim.claim_id}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                    selectedClaim.status
                  )}`}
                >
                  {selectedClaim.status}
                </span>
              </div>

              <div className="space-y-5">
                
                <div>
                  <p className="text-sm text-slate-400">Worker</p>
                  <p className="font-semibold">{selectedClaim.worker_name}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">City</p>
                  <p>{selectedClaim.city}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Fraud Score</p>
                  <p className={getFraudColor(selectedClaim.fraud_score)}>
                    {selectedClaim.fraud_score}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Resolution Path</p>
                  <p className="uppercase text-sm">
                    {selectedClaim.resolution_path}
                  </p>
                </div>

                {/* 🚨 FRAUD FLAGS (BIG FEATURE) */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">Fraud Flags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClaim.flags?.length > 0 ? (
                      selectedClaim.flags.map((flag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                        >
                          {flag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">
                        No flags detected
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              No claim selected
            </p>
          )}
        </div>
      </section>
    </div>
  );
}