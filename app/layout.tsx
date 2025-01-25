// Ensure this is a client component

import "./globals.css";
import "./fonts.css";
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/Providers";
import { Toaster } from "react-hot-toast";
import React from "react";
import { Caveat, Kalam, Architects_Daughter, Indie_Flower, Shadows_Into_Light, Homemade_Apple, Patrick_Hand } from 'next/font/google';

const caveat = Caveat({ 
  subsets: ['latin'],
  variable: '--font-caveat',
});

const kalam = Kalam({ 
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-kalam',
});

const architectsDaughter = Architects_Daughter({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-architects-daughter',
});

const indieFlower = Indie_Flower({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-indie-flower',
});

const shadowsIntoLight = Shadows_Into_Light({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-shadows-into-light',
});

const homemadeApple = Homemade_Apple({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-homemade-apple',
});

const patrickHand = Patrick_Hand({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-patrick-hand',
});

export const metadata: Metadata = {
  title: "Notchy",
  description: "Your AI-powered study companion",
  icons: {
    icon: [
      
      {
        url: '/favicon-512x512.png',
        type: 'image/png',
        sizes: '512x512',
      }
    ]
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.className} ${caveat.variable} ${kalam.variable} ${architectsDaughter.variable} ${indieFlower.variable} ${shadowsIntoLight.variable} ${homemadeApple.variable} ${patrickHand.variable}`}>
      <ClerkProvider>
        <body>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </body>
      </ClerkProvider>
    </html>
  );
}