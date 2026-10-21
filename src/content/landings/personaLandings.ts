/**
 * @module content/landings/personaLandings
 * @description Barrel for the 27 persona-landing configs (P1..P26 + P22 dual-slug).
 *
 * Wave 1.B cleanup (2026-04-29): the original 1689-line file was split into
 * per-persona modules under `./personas/`. This barrel preserves the public
 * API consumed by the rest of the codebase:
 *   - `PERSONA_LANDINGS` — canonical readonly list
 *   - `LIVE_PERSONA_SLUGS` — slugs marked `status: 'live'`
 *
 * Source of truth:
 *  - `docs/canonical/01-segmentation-framework.md` §4 (P1..P25)
 *  - `docs/canonical/IPP.md` PART II §11–§16 (IPP investor personas)
 *  - `docs/canonical/03-tone-of-voice.md` §14
 */

import type { PersonaLanding } from '@/lib/landings/types';

import { P1_TOURISTS } from './personas/P1_TOURISTS';
import { P2_CN_INVESTORS } from './personas/P2_CN_INVESTORS';
import { P3_EU_GUESTS } from './personas/P3_EU_GUESTS';
import { P4_DIGITAL_NOMADS } from './personas/P4_DIGITAL_NOMADS';
import { P5_SNOWBIRDS } from './personas/P5_SNOWBIRDS';
import { P6_RU_EXPATS } from './personas/P6_RU_EXPATS';
import { P7_FAMILIES } from './personas/P7_FAMILIES';
import { P8_PASSIVE_INVESTORS } from './personas/P8_PASSIVE_INVESTORS';
import { P9_HNW } from './personas/P9_HNW';
import { P10_OPERATORS } from './personas/P10_OPERATORS';
import { P11_MN_INVESTORS } from './personas/P11_MN_INVESTORS';
import { P12_BN_BUSINESS } from './personas/P12_BN_BUSINESS';
import { P13_PET_OWNERS } from './personas/P13_PET_OWNERS';
import { P14_MEDICAL } from './personas/P14_MEDICAL';
import { P15_WEDDINGS } from './personas/P15_WEDDINGS';
import { P16_ATHLETES } from './personas/P16_ATHLETES';
import { P17_HALAL } from './personas/P17_HALAL';
import { P18_LGBTQ } from './personas/P18_LGBTQ';
import { P19_ACCESSIBILITY } from './personas/P19_ACCESSIBILITY';
import { P20_RETIREES } from './personas/P20_RETIREES';
import { P21_PROVIDERS } from './personas/P21_PROVIDERS';
import { P22_FREELANCERS } from './personas/P22_FREELANCERS';
import { P22_DEVELOPER_PARTNER } from './personas/P22_DEVELOPER_PARTNER';
import { P23_SMB } from './personas/P23_SMB';
import { P24_CREATIVES } from './personas/P24_CREATIVES';
import { P25_STUDENTS } from './personas/P25_STUDENTS';
import { P26_CONSCIOUS_EATERS } from './personas/P26_CONSCIOUS_EATERS';

// Sprint C (orphan coverage — Master Taxonomy v1.0):
import { P03_LONG_STAY_TOURIST } from './personas/P03_LONG_STAY_TOURIST';
import { P08_RELOCATOR_FAMILY } from './personas/P08_RELOCATOR_FAMILY';
import { P09_RELOCATOR_SOLO } from './personas/P09_RELOCATOR_SOLO';
import { P10_RETURNEE } from './personas/P10_RETURNEE';
import { P13_EMPLOYEE_EXPAT } from './personas/P13_EMPLOYEE_EXPAT';
import { P23_PROPERTY_OWNER } from './personas/P23_PROPERTY_OWNER';

export const PERSONA_LANDINGS: readonly PersonaLanding[] = [
  P1_TOURISTS,
  P2_CN_INVESTORS,
  P3_EU_GUESTS,
  P4_DIGITAL_NOMADS,
  P5_SNOWBIRDS,
  P6_RU_EXPATS,
  P7_FAMILIES,
  P8_PASSIVE_INVESTORS,
  P9_HNW,
  P10_OPERATORS,
  P11_MN_INVESTORS,
  P12_BN_BUSINESS,
  P13_PET_OWNERS,
  P14_MEDICAL,
  P15_WEDDINGS,
  P16_ATHLETES,
  P17_HALAL,
  P18_LGBTQ,
  P19_ACCESSIBILITY,
  P20_RETIREES,
  P21_PROVIDERS,
  // P22 has two slugs (taxonomy conflict, см. m10b-completion.md):
  P22_FREELANCERS,
  P22_DEVELOPER_PARTNER,
  P23_SMB,
  P24_CREATIVES,
  P25_STUDENTS,
  P26_CONSCIOUS_EATERS,
  // Sprint C — orphan coverage closing Relocator segment gap (35% → 90%):
  P03_LONG_STAY_TOURIST,   // canonical P03
  P08_RELOCATOR_FAMILY,    // canonical P08
  P09_RELOCATOR_SOLO,      // canonical P09
  P10_RETURNEE,            // canonical P10
  P13_EMPLOYEE_EXPAT,      // canonical P13
  P23_PROPERTY_OWNER,      // canonical P23
] as const;

export const LIVE_PERSONA_SLUGS: readonly string[] = PERSONA_LANDINGS
  .filter((p) => p.status === 'live')
  .map((p) => p.slug);
