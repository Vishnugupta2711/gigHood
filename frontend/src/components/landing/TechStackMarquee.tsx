'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  SiDocker,
  SiFastapi,
  SiFirebase,
  SiNextdotjs,
  SiPostgresql,
  SiPython,
  SiRazorpay,
  SiReact,
  SiRender,
  SiSupabase,
  SiTypescript,
  SiVercel,
} from '@icons-pack/react-simple-icons';

const techStack = [
  {
    name: 'Supabase',
    logo: <SiSupabase size={28} color="#3ECF8E" />,
  },
  {
    name: 'PostgreSQL',
    logo: <SiPostgresql size={28} color="#4169E1" />,
  },
  {
    name: 'Next.js',
    logo: <SiNextdotjs size={28} color="#111827" />,
  },
  {
    name: 'TypeScript',
    logo: <SiTypescript size={28} color="#3178C6" />,
  },
  {
    name: 'React',
    logo: <SiReact size={28} color="#61dafb" />,
  },
  {
    name: 'FastAPI',
    logo: <SiFastapi size={28} color="#009688" />,
  },
  {
    name: 'Python',
    logo: <SiPython size={28} color="#3776AB" />,
  },
  {
    name: 'Groq',
    logo: (
      <img
        src="https://cdn.simpleicons.org/groq/F55036"
        alt="Groq logo"
        width={28}
        height={28}
        className="project-tech-icon-image"
      />
    ),
  },
  {
    name: 'Docker',
    logo: <SiDocker size={28} color="#2496ED" />,
  },
  {
    name: 'Razorpay',
    logo: <SiRazorpay size={28} color="#0C2451" />,
  },
  {
    name: 'Firebase',
    logo: <SiFirebase size={28} color="#FFCA28" />,
  },
  {
    name: 'Vercel',
    logo: <SiVercel size={28} color="#111827" />,
  },
  {
    name: 'Render',
    logo: <SiRender size={28} color="#46E3B7" />,
  },
  {
    name: 'OpenRouter',
    logo: (
      <Image
        src="/tech/openrouter-logo.png"
        alt="OpenRouter logo"
        width={28}
        height={28}
        className="project-tech-icon-image"
      />
    ),
  },
];

export function TechStackMarquee() {
  return (
    <section className="project-tech-marquee">
      <div className="project-tech-header">
        <span className="project-tech-label">Powered by industry leaders and state-of-the-art open source</span>
      </div>

      <div className="project-tech-carousel">
        <div className="project-tech-fade-left" />
        <div className="project-tech-fade-right" />

        <div className="project-tech-inner-track">
          <motion.div
            className="project-tech-motion-track"
            animate={{ x: '-50%' }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 36 }}
          >
            {[...techStack, ...techStack].map((tech, idx) => (
              <div key={`${tech.name}-${idx}`} className="project-tech-item">
                <div className="project-tech-icon-shell">{tech.logo}</div>
                <span>{tech.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
