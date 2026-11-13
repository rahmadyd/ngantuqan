/**
 * Fills the placeholders in a translated string.
 *
 * The dictionary keeps the placeholders in the same place in both languages,
 * so the wording can move around them without breaking anything.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
