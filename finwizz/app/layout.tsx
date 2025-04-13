import { ClerkProvider } from "@clerk/nextjs";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css"; // Make sure you install & import Mantine styles

import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import { ReactNode } from "react";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Finwizz",
  description: "Custom Financial Health Analyser",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.className}>
        <body className="bg-gray-100 font-sans">
          <MantineProvider >
            <Navbar />
            <div className="mt-20">{children}</div>
          </MantineProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
