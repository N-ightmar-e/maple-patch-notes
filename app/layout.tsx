import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '메이플 패치노트 | 테스트월드 1.2.206', description: '2026년 9월 10일 메이플스토리 테스트월드. 직업·스킬 색인, 변경 전후 수치와 하향 항목을 공식 원문과 함께 확인하세요.', metadataBase: new URL('https://maple-patch-206.allisonkim7.chatgpt.site') };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="ko"><body>{children}</body></html>}
