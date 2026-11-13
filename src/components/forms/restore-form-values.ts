/**
 * Restores the values of a form after React has reset it.
 *
 * React 19 resets an uncontrolled form once its server action resolves, so
 * everything the visitor typed disappears when the server asks for a
 * correction. Putting the values back touches only the fields that are
 * empty — a field the visitor has already typed into is left alone.
 */
export function restoreFormValues(
  form: HTMLFormElement | null,
  values: Record<string, unknown> | null,
) {
  if (!form || !values) return;

  for (const [name, value] of Object.entries(values)) {
    const field = form.elements.namedItem(name);

    if (!field || !("value" in field)) continue;

    const input = field as unknown as HTMLInputElement;

    if (input.value === "") {
      input.value = String(value ?? "");
    }
  }
}
