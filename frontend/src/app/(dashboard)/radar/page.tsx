'use client';

import dynamic from 'next/dynamic';
import useGeolocation from '@/hooks/useGeolocation';
import { useLanguageStore } from '@/store/languageStore';
import { t } from '@/lib/i18n';

// 🔥 VERY IMPORTANT (Leaflet fix)
const SafetyRadar = dynamic(() => import('@/components/SafetyRadar'), {
  ssr: false,
});

export default function RadarPage() {
  const language = useLanguageStore((s) => s.language);
  const { coords, error } = useGeolocation(true);

  return (
    <div className="page-content" style={{ padding: "20px" }}>

      {/* HEADER */}
      <div style={{ marginBottom: '16px' }}>
        <h2 className="gradient-text" style={{ fontSize: "24px", fontWeight: "bold" }}>🗺 Safety Radar</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {t(language, 'radar.subtitle')}
        </p>
      </div>

      {/* GPS STATUS */}
      {error && (
        <div className="glass-card" style={{ padding: '10px', marginBottom: '12px', color: "#EF4444" }}>
          {t(language, 'radar.enable_location')}
        </div>
      )}

      {/* MAP */}
      <div className="glass-card" style={{ padding: '10px' }}>
        <SafetyRadar compact={false} userCoords={coords} />
      </div>

    </div>
  );
}
