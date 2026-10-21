/**
 * EcosystemPage — secondary breadth page «/ecosystem».
 *
 * Houses the broad service catalogue that previously sat on the homepage:
 * audience entries + cluster grid. Reached from the new trust-first
 * Landing via «Explore the ecosystem» CTA.
 *
 * Renders WelcomeLanding as-is — that page already contains the entire
 * breadth narrative (audiences, clusters, communities, partners, developers).
 * Reusing it keeps a single source of truth and avoids content duplication.
 */
import React from 'react';
import WelcomeLanding from './WelcomeLanding';

export default function EcosystemPage() {
  return <WelcomeLanding />;
}
