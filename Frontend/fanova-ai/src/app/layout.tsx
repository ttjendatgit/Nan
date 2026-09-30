import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono, EB_Garamond } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";

// Body font. Static (not variable) on Google Fonts, so only the weights the UI actually uses:
// 300 font-light (auth inputs), 400 default, 500 font-medium, 600 font-semibold, 700 font-bold
// and <strong>/<h*> defaults.
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

// Kept only for MetaStat. next/font does not accept a "vietnamese" subset for Geist Mono (its font
// metadata lists only latin/latin-ext/cyrillic), but Google's CSS still ships the Vietnamese face
// (unicode-range U+1EA0-1EF9), which the browser fetches on demand; `subsets` only controls
// preloading. See docs/redesign/DECISIONS.md.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Italic is loaded for the SectionTitle eyebrow and MetaLine (R2a), so the browser uses the real
// italic face instead of slanting the upright one.
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Nan — Di sản trong từng nếp quạt",
  description:
    "Thiết kế quạt giấy cá nhân hóa, kết hợp tinh thần thủ công Việt Nam với trải nghiệm công nghệ hiện đại.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className={`${beVietnamPro.variable} ${geistMono.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0D131F] overflow-x-hidden">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
