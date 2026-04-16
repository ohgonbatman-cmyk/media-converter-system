import React from 'react';

interface JsonLdProps {
  data: any;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export function getToolSchema(params: {
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": params.name,
    "description": params.description,
    "url": params.url,
    "applicationCategory": params.applicationCategory,
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
}
