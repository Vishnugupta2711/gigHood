import FinancialKPIs from '@/components/admin/FinancialKPIs';
import LiveZoneMonitor from '@/components/admin/LiveZoneMonitor';
import RiskForecastPanel from '@/components/admin/RiskForecast';
import FraudQueue from '@/components/admin/FraudQueue';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans pb-12">
      <header className="bg-[#0F172A] p-4 text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide">gigHood <span className="font-light text-gray-400">Admin</span></h1>
          <div className="text-sm opacity-80">Command Center</div>
        </div>
      </header>

      <main className="max-w-[85rem] mx-auto p-4 sm:p-6 space-y-8 mt-4">
        {/* Top Tier: KPIs */}
        <section>
          <FinancialKPIs />
        </section>

        {/* Middle Tier: Live Zones & Risk */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveZoneMonitor />
          </div>
          <div className="lg:col-span-1">
            <RiskForecastPanel />
          </div>
        </section>

        {/* Bottom Tier: Fraud Queue */}
        <section>
          <FraudQueue />
        </section>
      </main>
    </div>
  );
}
