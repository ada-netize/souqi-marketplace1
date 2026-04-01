import "./globals.css";

export const metadata = {
  title: "سوقي - لوحة الأدمن",
  description: "لوحة إدارة احترافية لسوقي",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
