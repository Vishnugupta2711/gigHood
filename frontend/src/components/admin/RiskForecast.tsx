'use client';

import { useEffect, useState } from 'react';
import { fetchRiskForecast, RiskForecast } from '@/lib/admin/adminClient';

export default function RiskForecastPanel() {
  const [forecast, setForecast] = useState<RiskForecast[]>([]);

  useEffect(() => {
    fetchRiskForecast().then(setForecast).catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-gray-100">
      <div className="p-4 border-b border-gray-100 bg-[#F4F4F1]">
        <h3 className="font-bold text-[#0F172A]">7-Day Predictive Risk</h3>
      </div>
      <div className="p-4 flex-1">
        <div className="space-y-4">
          {forecast.map((item) => (
            <div key={item.city}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{item.city}</span>
                <span className="text-gray-500">{item.risk}%</span>
              </div>
              <div className="w-full bg-[#E2E3E0] rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${item.risk > 70 ? 'bg-[#EF4444]' : item.risk > 30 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'}`}
                  style={{ width: `${item.risk}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
