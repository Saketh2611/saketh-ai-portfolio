import type { Metadata } from "next";
import { Bebas_Neue, Inter, IBM_Plex_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Saketh Vaddiparthi — AI Engineer",
  description:
    "AI Engineer building RAG pipelines, LLM agents, and production backend systems. Ask the chatbot below — it actually knows his work.",
  openGraph: {
    title: "Saketh Vaddiparthi — AI Engineer",
    description:
      "AI Engineer building RAG pipelines, LLM agents, and production backend systems. Ask the chatbot below — it actually knows his work.",
    url: SITE_URL,
    siteName: "Saketh Vaddiparthi",
    type: "website",
    images: [{ url: `${SITE_URL}/opengraph-image` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saketh Vaddiparthi — AI Engineer",
    description:
      "AI Engineer building RAG pipelines, LLM agents, and production backend systems. Ask the chatbot below — it actually knows his work.",
    images: [`${SITE_URL}/opengraph-image`],
  },
  verification: {
    google: "Q4lfruhPccMwhzcAt9MXywZOL7k2QWr6br9ORavoRmk",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
