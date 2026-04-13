import "./globals.css";

export const metadata = {
  title: "TROOPOD: AI Landing Page Personalizer",
  description:
    "Upload an ad creative and a landing page URL. Get a personalized, CRO-optimized version of your page — powered by AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
