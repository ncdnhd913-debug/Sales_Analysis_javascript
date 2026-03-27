import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '매출 차이 분석 | Variance Analysis Dashboard',
  description: 'ERP 매출 데이터 기반 차이 분석 대시보드 - 수량, 단가, 환율 요인 분해',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
