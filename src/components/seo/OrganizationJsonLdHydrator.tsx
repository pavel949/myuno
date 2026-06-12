import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeWhatsapp } from "@/lib/seo/normalizeWhatsapp";

/**
 * OrganizationJsonLdHydrator
 *
 * Sitewide Organization + LocalBusiness JSON-LD lives statically in
 * `index.html` (so non-JS social crawlers can read it).  At runtime we
 * pull canonical contact fields from `public.system_settings` and
 * merge them INTO the existing <script type="application/ld+json"> tag
 * instead of appending a second one — this guarantees no duplicate
 * Organization node ships to Googlebot.
 *
 * Recognised system_settings keys (all optional — fall back to static
 * values when missing or empty):
 *   - admin_whatsapp        (string, E.164)        → telephone / wa.me sameAs
 *   - admin_emails          (string[] JSON)        → email / contactPoint.email
 *   - org_telephone         (string)               → overrides admin_whatsapp for telephone
 *   - org_email             (string)               → overrides admin_emails[0]
 *   - org_street_address    (string)
 *   - org_postal_code       (string)
 *   - org_locality          (string)               → defaults to "Phuket"
 *   - org_region            (string)               → defaults to "Phuket"
 *   - org_country           (string ISO-2)         → defaults to "TH"
 *   - org_latitude          (number string)
 *   - org_longitude         (number string)
 *   - org_opening_hours     (string, schema.org openingHours format)
 */
export const OrganizationJsonLdHydrator = () => {
  useEffect(() => {
    let cancelled = false;

    const keys = [
      "admin_whatsapp",
      "admin_emails",
      "org_telephone",
      "org_email",
      "org_street_address",
      "org_postal_code",
      "org_locality",
      "org_region",
      "org_country",
      "org_latitude",
      "org_longitude",
      "org_opening_hours",
    ] as const;

    const parse = (raw: unknown): unknown => {
      if (typeof raw !== "string") return raw;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    };

    const findOrgScript = (): HTMLScriptElement | null => {
      const scripts = document.head.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      );
      for (const el of Array.from(scripts)) {
        try {
          const json = JSON.parse(el.textContent ?? "null");
          const graph = json?.["@graph"];
          if (
            Array.isArray(graph) &&
            graph.some(
              (n: { "@id"?: string }) =>
                n?.["@id"] === "https://www.myuno.app/#organization",
            )
          ) {
            return el;
          }
        } catch {
          // not our node
        }
      }
      return null;
    };

    (async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("key, value")
          .in("key", keys as unknown as string[]);

        if (cancelled || error || !data) return;

        const settings = new Map<string, unknown>();
        for (const row of data) {
          settings.set(row.key, parse(row.value));
        }

        const script = findOrgScript();
        if (!script || !script.textContent) return;

        let payload: {
          "@graph"?: Array<Record<string, unknown>>;
        };
        try {
          payload = JSON.parse(script.textContent);
        } catch {
          return;
        }
        const graph = payload["@graph"];
        if (!Array.isArray(graph)) return;

        const org = graph.find(
          (n) => n["@id"] === "https://www.myuno.app/#organization",
        ) as Record<string, unknown> | undefined;
        if (!org) return;

        const adminEmails = settings.get("admin_emails");
        const primaryEmail =
          (settings.get("org_email") as string | undefined) ||
          (Array.isArray(adminEmails) && typeof adminEmails[0] === "string"
            ? (adminEmails[0] as string)
            : undefined);

        const telephone =
          (settings.get("org_telephone") as string | undefined) ||
          (settings.get("admin_whatsapp") as string | undefined);

        const streetAddress = settings.get("org_street_address") as
          | string
          | undefined;
        const postalCode = settings.get("org_postal_code") as string | undefined;
        const locality =
          (settings.get("org_locality") as string | undefined) || "Phuket";
        const region =
          (settings.get("org_region") as string | undefined) || "Phuket";
        const country =
          (settings.get("org_country") as string | undefined) || "TH";

        const latitude = Number(settings.get("org_latitude"));
        const longitude = Number(settings.get("org_longitude"));
        const openingHours = settings.get("org_opening_hours") as
          | string
          | undefined;

        let mutated = false;

        if (telephone) {
          org.telephone = telephone;
          mutated = true;
        }
        if (primaryEmail) {
          org.email = primaryEmail;
          mutated = true;
        }

        if (streetAddress || postalCode || locality || region || country) {
          org.address = {
            "@type": "PostalAddress",
            ...(streetAddress ? { streetAddress } : {}),
            ...(postalCode ? { postalCode } : {}),
            addressLocality: locality,
            addressRegion: region,
            addressCountry: country,
          };
          mutated = true;
        }

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          org.geo = {
            "@type": "GeoCoordinates",
            latitude,
            longitude,
          };
          mutated = true;
        }

        if (openingHours) {
          org.openingHours = openingHours;
          mutated = true;
        }

        if (telephone || primaryEmail) {
          org.contactPoint = [
            {
              "@type": "ContactPoint",
              contactType: "customer support",
              ...(telephone ? { telephone } : {}),
              ...(primaryEmail ? { email: primaryEmail } : {}),
              availableLanguage: ["ru", "en", "th"],
              areaServed: "TH",
            },
          ];

          const sameAs = Array.isArray(org.sameAs) ? [...(org.sameAs as string[])] : [];
          if (telephone) {
            const waUrl = `https://wa.me/${telephone.replace(/[^\d]/g, "")}`;
            if (!sameAs.includes(waUrl)) sameAs.unshift(waUrl);
          }
          org.sameAs = sameAs;
          mutated = true;
        }

        if (!mutated) return;

        script.textContent = JSON.stringify(payload);
      } catch {
        // swallow — static fallback in index.html stays valid
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

export default OrganizationJsonLdHydrator;
