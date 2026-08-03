import ApolloWrapper from "../../components/ApolloProvider";
import {
  ColorSchemeScript,
  MantineProvider,
  createTheme,
  type MantineColorsTuple,
} from "@mantine/core";
import "@mantine/core/styles.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/Navbar/Navbar";
import ThemedToaster from "@/components/ThemedToaster/ThemedToaster";
import Providers from "../../components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flipbook — create and share page-flip books",
  description:
    "Turn a folder of images into a flipbook you can share with a link. No install, no plugin.",
};

/* Brand accent — violet, mirroring --primary in globals.css. Shade 5 is the
   dark-mode accent, shade 6 the light-mode one. */
const brand: MantineColorsTuple = [
  "#f5f3ff",
  "#ede9fe",
  "#ddd6fe",
  "#c4b5fd",
  "#a78bfa",
  "#8b5cf6",
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
  "#4c1d95",
];

const flipbookTheme = createTheme({
  fontFamily: "var(--font-sans)",
  fontFamilyMonospace: "var(--font-mono)",

  headings: {
    fontFamily: "var(--font-sans)",
    fontWeight: "600",
  },

  primaryColor: "brand",
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: "md",

  colors: { brand },

  // Default props for consistent look
  components: {
    Button: {
      defaultProps: {
        radius: "md",
        size: "sm",
      },
    },
    Card: {
      defaultProps: {
        shadow: "sm",
        radius: "md",
        padding: "md",
        withBorder: true,
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
        size: "sm",
      },
    },
    NumberInput: {
      defaultProps: {
        radius: "md",
        size: "sm",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
        size: "sm",
      },
    },
    Textarea: {
      defaultProps: {
        radius: "md",
        size: "sm",
        autosize: true,
        minRows: 3,
      },
    },
    Switch: {
      defaultProps: {
        radius: "xl",
        size: "lg",
        color: "brand",
      },
    },
    Accordion: {
      defaultProps: {
        radius: "md",
        variant: "contained",
      },
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-mantine-color-scheme="dark"
      suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ApolloWrapper>
          <MantineProvider defaultColorScheme="dark" theme={flipbookTheme}>
            <Providers>
              <NavBar />
              {children}
            </Providers>
            <ThemedToaster />
          </MantineProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
