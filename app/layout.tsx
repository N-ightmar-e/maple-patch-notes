import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '메이플 패치 위키 | 직업·스킬·변경 이력',
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.svg` },
  description:
    '메이플스토리 직업·차수별 스킬 문서, 변경 이력과 수치 비교, AI 사전 분석을 공식 출처와 함께 확인하세요.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_ORIGIN ||
      'https://maple-patch-206.allisonkim7.chatgpt.site',
  ),
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
