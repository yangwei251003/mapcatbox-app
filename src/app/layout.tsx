import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/components/AppProvider';
import BottomNav from '@/components/ui/BottomNav';
import NotificationBell from '@/components/ui/NotificationBell';
import { assetPath, cloudEnabled } from '@/lib/runtime-config';

export const metadata: Metadata = {
  title: '地图猫箱 · MapCatBox',
  description: '开发中的猫咪地图与养成原型；默认离线合成样例，非现实位置或真人账号。',
  manifest: assetPath('manifest.json'),
  appleWebApp: {
    capable: true,
    title: '地图猫箱',
    statusBarStyle: 'default',
  },
  icons: {
    icon: assetPath('cat-icon.svg'),
    apple: assetPath('cat-icon.svg'),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFBF5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-[100dvh] flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <AppProvider>
          <div className="flex-1 flex flex-col relative">
            {/* Header area */}
            <header className="fixed top-0 left-0 right-0 z-[900] px-4 py-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="text-xl">🐱</span>
                <span className="font-semibold text-[15px] text-[var(--color-text)]">地图猫箱</span>
              </div>
              <div className="pointer-events-auto">
                <NotificationBell />
              </div>
            </header>
            <aside role="note" className="fixed top-14 left-0 right-0 z-[800] min-h-10 px-4 py-2 text-[11px] text-center bg-orange-50 border-y border-orange-100">
              {cloudEnabled?'个人云模式：需自行核验后端权限；位置仅明确开启后共享。':'离线合成演示 · 非真实地点或账号 · 不请求位置、不连接云端'} · <a className="underline" href={assetPath('licenses/NPM_NOTICES.md')}>许可</a>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-hidden pt-24 pb-14">
              {children}
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
