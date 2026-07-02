import './globals.css';

export const metadata = {
  title: 'スケジュール管理',
  description: '個人用スケジュール管理アプリ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
