import type { Metadata } from "next";
import {
  HandCamera,
  HandTrackingProvider,
} from "@/components/hand-camera";
import { ScreenTransitionProvider } from "@/components/screen-transition";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZOMBIE JUTSU DUNGEON",
  description: "Enter the dungeon.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ScreenTransitionProvider>
          <HandTrackingProvider>
            {children}
            <HandCamera />
          </HandTrackingProvider>
        </ScreenTransitionProvider>
      </body>
    </html>
  );
}
