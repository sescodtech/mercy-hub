export function StructuredData({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function SiteStructuredData() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://mercyhomeessentials.com").replace(/\/$/, "");
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Mercy Home Essentials",
      url: baseUrl,
      logo: `${baseUrl}/android-chrome-512x512.png`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Mercy Home Essentials",
      url: baseUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/shop?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
  return <StructuredData data={data} />;
}
