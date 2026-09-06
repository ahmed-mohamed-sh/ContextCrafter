import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ContextCrafter" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('cc_theme_mode') || 'dark-obsidian';
                  document.documentElement.setAttribute('data-theme', saved);
                  if (saved === 'cyber-blue') {
                    document.documentElement.style.backgroundColor = '#040b17';
                  } else if (saved === 'deep-violet') {
                    document.documentElement.style.backgroundColor = '#090314';
                  } else {
                    document.documentElement.style.backgroundColor = '#0b1326';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background min-h-screen antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
