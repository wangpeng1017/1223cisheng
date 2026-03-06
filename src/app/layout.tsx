import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import zhCN from "antd/locale/zh_CN";
import { AppLayout } from "@/components/app-layout";

export const metadata: Metadata = {
  title: "宁波磁声 NPI 研发协同平台",
  description: "Next-generation R&D collaboration platform for NPI process",
};

// antd 主题配置，对标当前设计风格
const theme = {
  token: {
    colorPrimary: "#2563eb",
    borderRadius: 8,
    colorBgContainer: "#ffffff",
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AntdRegistry>
          <ConfigProvider locale={zhCN} theme={theme}>
            <App>
              <AppLayout>{children}</AppLayout>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
