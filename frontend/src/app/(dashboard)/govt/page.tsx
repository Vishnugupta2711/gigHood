'use client';

import { useEffect, useState } from 'react';

type Scheme = {
  id: number;
  name: string;
  benefit: string;
  detail: string;
  link: string;
  icon: string;
  tags: string[];
};

export default function GovtSchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/schemes')
      .then(res => res.json())
      .then(setSchemes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">

      {/* HEADER */}
      <div style={{ marginBottom: '20px' }}>
        <h2 className="gradient-text" style={{ fontSize: '22px' }}>
          🏛 Government Support
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Unlock benefits designed for gig workers
        </p>
      </div>

      {/* INFO BANNER */}
      <div className="glass-card" style={{
        padding: '12px',
        marginBottom: '16px',
        border: '1px solid rgba(250,204,21,0.2)',
        background: 'rgba(250,204,21,0.05)',
        fontSize: '12px'
      }}>
        💡 These are official government schemes — apply directly without agents.
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass-card skeleton" style={{ height: '140px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {schemes.map((s) => (
            <a
              key={s.id}
              href={s.link}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card interactive-card"
              style={{ padding: '14px', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                
                {/* ICON */}
                <div style={{ fontSize: '22px' }}>{s.icon}</div>

                {/* CONTENT */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>
                    {s.name}
                  </h4>

                  <p style={{
                    fontSize: '11px',
                    color: '#22C55E',
                    fontWeight: 600,
                    margin: '4px 0'
                  }}>
                    ✓ {s.benefit}
                  </p>

                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}>
                    {s.detail}
                  </p>

                  {/* TAGS */}
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {s.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: 'rgba(99,102,241,0.1)',
                        color: '#6366F1'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p style={{
                    fontSize: '11px',
                    marginTop: '6px',
                    color: '#6366F1',
                    fontWeight: 600
                  }}>
                    Apply now →
                  </p>
                </div>

              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
