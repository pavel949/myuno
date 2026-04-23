/**
 * @file JsonLd.tsx
 * @description Reusable JSON-LD injector for schema.org markup.
 *
 * Source of truth: `docs/canonical/10-semantic-core.md` §9.
 *
 * Accepts one or many schema objects (built by `src/lib/seo/schemaBuilders.ts`)
 * and emits one `<script type="application/ld+json">` per object inside Helmet.
 *
 * Usage:
 *   <JsonLd schemas={[buildOrganizationSchema('ru'), buildWebSiteSchema('ru')]} />
 */
import { Helmet } from 'react-helmet-async';

interface JsonLdProps {
  schemas: ReadonlyArray<Record<string, unknown> | null | undefined>;
}

const JsonLd = ({ schemas }: JsonLdProps) => {
  const cleaned = schemas.filter((s): s is Record<string, unknown> => Boolean(s));
  if (cleaned.length === 0) return null;
  return (
    <Helmet>
      {cleaned.map((schema, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default JsonLd;
