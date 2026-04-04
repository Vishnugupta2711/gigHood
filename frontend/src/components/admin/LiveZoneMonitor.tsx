'use client';

import { useEffect, useState } from 'react';
import { fetchLiveZones, HexZone } from '@/lib/admin/adminClient';

export default function LiveZoneMonitor() {
  const [zones, setZones] = useState<HexZone[]>([]);

  useEffect(() => {
    fetchLiveZones().then(setZones).catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-gray-100">
      <div className="p-4 border-b border-gray-100 bg-[#F4F4F1]">
        <h3 className="font-bold text-[#0F172A]">Live Zone Monitor</h3>
      </div>
      <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
        {zones.length === 0 ? (
          <div className="text-sm text-gray-500">No active zones to display.</div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone, idx) => (
              <div key={zone.h3_index || idx} className="flex items-center justify-between p-3 bg-[#F4F4F1] rounded-lg">
                <div>
                  <div className="font-medium text-sm text-[#0F172A]">{zone.city}</div>
                  <div className="text-xs text-gray-500 font-mono">{zone.h3_index}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold">{zone.dci_score.toFixed(3)}</div>
                  <div className={`w-2 h-2 rounded-full ${zone.status === 'disrupted' ? 'bg-[#EF4444] animate-pulse' : 'bg-[#22C55E]'}`}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
