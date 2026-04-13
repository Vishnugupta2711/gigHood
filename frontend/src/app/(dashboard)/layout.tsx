'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wallet, Home, MessageSquare, User } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const normalizedPath = pathname.startsWith('/worker-app')
    ? pathname.slice('/worker-app'.length) || '/'
    : pathname;
  const isChatRoute = normalizedPath === '/chat';

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/');
    }
  }, [pathname, router]);

  const navItems = [
    { href: '/worker-app/home', matchPath: '/home', label: t('nav_home'), icon: Home },
    { href: '/worker-app/payouts', matchPath: '/payouts', label: t('nav_payouts'), icon: Wallet },
    { href: '/worker-app/chat', matchPath: '/chat', label: t('nav_copilot'), icon: MessageSquare },
    { href: '/worker-app/profile', matchPath: '/profile', label: t('nav_profile'), icon: User },
  ];

  useEffect(() => {
    router.prefetch('/worker-app/home');
    router.prefetch('/worker-app/payouts');
    router.prefetch('/worker-app/chat');
    router.prefetch('/worker-app/profile');
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main className={`page-content ${isChatRoute ? 'page-content-chat' : ''}`}>
        {children}
      </main>

      <nav className="glass-nav">
        {navItems.map((item) => {
          const isActive = normalizedPath === item.matchPath;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
