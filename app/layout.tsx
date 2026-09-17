import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Pupotsan National High School | Magallanes',
  description: 'Discover Pupotsan National High School in Taod-oy, Magallanes. Find enrollment information, school announcements, and campus updates.',
  icons: { icon: '/school-logo.png', shortcut: '/school-logo.png' },
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
