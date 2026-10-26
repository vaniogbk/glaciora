import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mon compte', robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="container py-10">{children}</div>;
}
