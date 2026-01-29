export const metadata = {
  title: "Pastebin Lite Backend",
  description: "API service for Pastebin Lite"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

