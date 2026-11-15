/**
 * Checks everything a visitor sends. The design arrives as option ids only, never as free text,
 * and every id must exist in the catalog exported from the website. The only free text is the
 * email address, which is checked strictly so it cannot carry extra headers or content.
 */
const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]{0,183}[A-Za-z0-9])?\.[A-Za-z]{2,24}$/;
const DESIGN_KEYS = ['type', 'size', 'problem', 'system', 'features', 'messages', 'staff', 'afterHours', 'salary', 'currency'];
const BODY_KEYS = ['email', 'lang', 'design', 'company', 'elapsed', 'token'];
/** A person needs at least this long to complete the steps. Faster is a script. */
export const MIN_ELAPSED_MS = 3000;

const fail = (reason) => ({ ok: false, reason });
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

export function validate(body, catalog) {
  if (!isPlainObject(body)) return fail('body');
  if (Object.keys(body).some((key) => !BODY_KEYS.includes(key))) return fail('body');

  const { email, lang, design, company, elapsed, token } = body;
  if (typeof email !== 'string' || email.length > 254 || !EMAIL.test(email) || email.includes('..')) return fail('email');
  if (lang !== 'en' && lang !== 'ar') return fail('lang');
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return fail('token');

  // The trap field is invisible to people. A filled one, or an impossibly fast send, is a script.
  // These are accepted silently so the script learns nothing.
  if (typeof company !== 'string' || company !== '') return { ok: true, silent: true };
  if (typeof elapsed !== 'number' || !Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) return { ok: true, silent: true };

  if (!isPlainObject(design)) return fail('design');
  if (Object.keys(design).some((key) => !DESIGN_KEYS.includes(key))) return fail('design');

  const pick = (key, table, isRequired) => {
    const value = design[key];
    if (value === undefined) return isRequired ? null : undefined;
    return typeof value === 'string' && Object.hasOwn(table, value) ? value : null;
  };
  const clean = {
    type: pick('type', catalog.types, true),
    size: pick('size', catalog.sizes, true),
    problem: pick('problem', catalog.problems, true),
    system: pick('system', catalog.systems, true),
    messages: pick('messages', catalog.messages, false),
    staff: pick('staff', catalog.staff, false),
    afterHours: pick('afterHours', catalog.afterHours, false),
    salary: pick('salary', catalog.salary, false),
    currency: pick('currency', catalog.currencies, false),
  };
  if (Object.values(clean).some((value) => value === null)) return fail('design');

  const features = design.features ?? [];
  const allowed = catalog.systems[clean.system].features;
  if (!Array.isArray(features) || features.length > Object.keys(allowed).length) return fail('design');
  if (features.some((id) => typeof id !== 'string' || !Object.hasOwn(allowed, id))) return fail('design');
  if (new Set(features).size !== features.length) return fail('design');

  return { ok: true, silent: false, email, lang, design: { ...clean, features } };
}
