'use client';

import { useEffect, useState } from 'react';
import { fetchFraudQueue, FraudQueueItem } from '@/lib/admin/adminClient';

export default function FraudQueue() {
  const [queue, setQueue] = useState<FraudQueueItem[]>([]);

  useEffect(() => {
    fetchFraudQueue().then(setQueue).catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="p-4 border-b border-gray-100 bg-[#F4F4F1]">
        <h3 className="font-bold text-[#0F172A]">Fraud Operations Queue</h3>
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F4F4F1] text-[#45464D] text-xs uppercase tracking-wider sticky top-0">
            <tr>
              <th className="p-3">Claim ID</th>
              <th className="p-3">Worker / City</th>
              <th className="p-3">Status</th>
              <th className="p-3">Fraud Score</th>
              <th className="p-3">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-transparent bg-[#FFFFFF]">
            {queue.map((item) => (
              <tr key={item.claim_id} className="hover:bg-[#F4F4F1] transition-colors border-b border-[#E2E3E0]">
                <td className="p-3 font-mono text-xs">{item.claim_id.split('-')[0]}</td>
                <td className="p-3">
                  <div className="font-medium text-[#0F172A]">{item.worker_name}</div>
                  <div className="text-xs text-gray-500">{item.city}</div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'paid' ? 'bg-[#22C55E] text-white' : item.status === 'denied' ? 'bg-[#EF4444] text-white' : 'bg-[#F4F4F1] text-[#0F172A]'}`}>
                    {item.status} {item.resolution_path ? `(${item.resolution_path})` : ''}
                  </span>
                </td>
                <td className="p-3">
                  <div className={`font-bold ${item.fraud_score > 70 ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                    {item.fraud_score}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap">
                    {item.flags.length === 0 ? (
                      <span className="px-2 py-1 rounded text-xs bg-[#22C55E] text-white">CLEAN</span>
                    ) : (
                      item.flags.map(flag => (
                        <span key={flag} className="px-2 py-1 rounded text-xs bg-[#EF4444] text-white">
                          {flag}
                        </span>
                      ))
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No claims found in the operations queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
