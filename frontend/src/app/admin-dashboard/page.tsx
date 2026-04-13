'use client';

import { useEffect, useState } from 'react';
import FinancialKPIs from '@/components/admin/FinancialKPIs';
import FraudQueue from '@/components/admin/FraudQueue';
import LiveZoneMonitor from '@/components/admin/LiveZoneMonitor';
import RiskForecastPanel from '@/components/admin/RiskForecast';
import ThresholdDriftChart from '@/components/admin/ThresholdDriftChart';
import { fetchFraudQueue, fetchPayoutTrends, FraudQueueItem, MonthlyTrend } from '@/lib/admin/adminClient';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const defaultChartData: MonthlyTrend[] = [
  { month: 'Jan', payouts: 2400 },
  { month: 'Feb', payouts: 1398 },
  { month: 'Mar', payouts: 9800 },
  { month: 'Apr', payouts: 3908 },
  { month: 'May', payouts: 4800 },
  { month: 'Jun', payouts: 3800 },
];

export default function AdminOverviewPage() {
  const [chartData, setChartData] = useState<MonthlyTrend[]>([]);
  const [queue, setQueue] = useState<FraudQueueItem[]>([]);

  useEffect(() => {
    fetchPayoutTrends().then(setChartData).catch(console.error);
    fetchFraudQueue().then(setQueue).catch(console.error);
  }, []);
  return (
    <div className="p-8 space-y-8">

      {/* 🔹 KPI STRIP (REAL DATA) */}
      <FinancialKPIs />

      {/* 🔹 CHART + FORECAST */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-[#0F172A]">
            Payout Trends
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.length > 0 ? chartData : defaultChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
              <Bar dataKey="payouts" fill="#7C3AED" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Forecast */}
        <div className="col-span-12 lg:col-span-4">
          <RiskForecastPanel />
        </div>
      </div>

      {/* 🔹 CLAIMS + LIVE ZONES */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <FraudQueue />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <LiveZoneMonitor />
        </div>
      </div>

      {/* 🔹 THRESHOLD DRIFT */}
      <ThresholdDriftChart />

      {/* 🔹 FRAUD BREAKDOWN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
          Fraud Signal Breakdown
        </h2>

        <div className="space-y-4">
          {[
            { label: 'High risk claims', value: queue.filter((item) => item.fraud_score > 70).length },
            { label: 'Medium risk claims', value: queue.filter((item) => item.fraud_score > 30 && item.fraud_score <= 70).length },
            { label: 'Low risk claims', value: queue.filter((item) => item.fraud_score <= 30).length },
          ].map((item) => {
            const total = queue.length || 1;
            const percentage = Math.round((item.value / total) * 100);
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}