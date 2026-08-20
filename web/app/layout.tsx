import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "xAgent 评测定义台",
  description: "定义 Agent 评测的任务、数据、框架、测试方案与评价指标。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
