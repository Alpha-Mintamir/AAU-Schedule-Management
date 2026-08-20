/**
 * Structured-data script tag. JSON is escaped so content can never break out
 * of the script element (e.g. via a "</script>" sequence in a title).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
