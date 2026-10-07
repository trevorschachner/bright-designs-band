/**
 * Server-rendered JSON-LD. One `<script type="application/ld+json">` per
 * schema, in the initial HTML, so crawlers see every schema on the page.
 *
 * Not `next/script`: that injects on the client and dedupes by `id`, so only
 * the first schema on a page ever appeared.
 */

export type JsonLdSchema = Record<string, unknown>

interface JsonLdProps {
  data: JsonLdSchema | JsonLdSchema[]
}

/**
 * JSON for an inline script. `<` is escaped so content (a show title, an FAQ
 * answer) can never close the script tag and inject markup.
 */
export function serializeJsonLd(schema: JsonLdSchema): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}

export function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data]
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`${String(schema['@type'] ?? 'schema')}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
    </>
  )
}

export default JsonLd
