import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OptionMan - US Market Intelligence",
  description: "A timestamped US stock and options research dashboard for movers, timing, and risk.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
