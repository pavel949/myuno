export type ProjectPlanDocument = { category: string; title: string; file_url: string };
export type HostedProjectPlan = { title: string; url: string; isImage: boolean; isMasterplan: boolean };

// Project-level floor plans are explicitly published documents, not inventory photos.
// Only approved static copies served by this application are promoted into the gallery.
const hostedPlanPath = /^\/catalog\/[a-z0-9]+(?:-[a-z0-9]+)*\/floor-plans\/([a-z0-9]+(?:-[a-z0-9]+)*)\.(avif|jpe?g|pdf|png|webp)$/;

function hostedPlanParts(doc: ProjectPlanDocument) {
  return doc.category === 'floor_plans' ? hostedPlanPath.exec(doc.file_url) : null;
}

export function isHostedProjectPlan(doc: ProjectPlanDocument): boolean {
  return !!hostedPlanParts(doc);
}

export function collectHostedProjectPlans(docs: readonly ProjectPlanDocument[]): HostedProjectPlan[] {
  const plans = new Map<string, HostedProjectPlan>();
  for (const doc of docs) {
    const { title, file_url: url } = doc;
    const match = hostedPlanParts(doc);
    if (!match || plans.has(url)) continue;
    plans.set(url, { title: title.trim(), url, isImage: match[2] !== 'pdf', isMasterplan: match[1] === 'masterplan' });
  }
  return [...plans.values()];
}
