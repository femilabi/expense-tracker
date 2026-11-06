/** Long enough for any real email address or name. */
const MAX_LENGTH = 320;

/**
 * Reads back what was typed into the named fields, so a form can show it
 * again after a failed submit. React clears a form once its action finishes,
 * and the form fills the fields from these values.
 *
 * Only pass fields that are safe to send back. Passwords never are.
 */
export function keepFormValues<Name extends string>(
  formData: FormData,
  names: readonly Name[],
): Partial<Record<Name, string>> {
  const values: Partial<Record<Name, string>> = {};

  for (const name of names) {
    const value = formData.get(name);
    if (typeof value === "string") {
      values[name] = value.slice(0, MAX_LENGTH);
    }
  }

  return values;
}
