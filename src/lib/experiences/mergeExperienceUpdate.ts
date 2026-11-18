/** Preserve fields the admin form does not expose, including publication and provenance. */
export function mergeExperienceUpdate(
  existing: { attributes?: Record<string, unknown> },
  patch: Record<string, unknown> & { attributes?: Record<string, unknown> },
) {
  const defined = (value: Record<string, unknown>) => Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
  return {
    ...defined(patch),
    attributes: { ...existing.attributes, ...defined(patch.attributes ?? {}) },
  };
}
