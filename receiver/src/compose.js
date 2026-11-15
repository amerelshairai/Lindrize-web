/**
 * Builds the emails and the Telegram alert. All wording is fixed here. The design summary is
 * rebuilt from the catalog, so nothing a visitor types can appear in a message except their
 * own (validated) email address in the owner's copy.
 */
const ROWS = ['type', 'size', 'problem', 'system', 'features', 'messages', 'staff', 'afterHours'];

export function summaryLines(design, catalog, lang) {
  const system = catalog.systems[design.system];
  const value = {
    type: catalog.types[design.type]?.[lang],
    size: catalog.sizes[design.size]?.[lang],
    problem: catalog.problems[design.problem]?.[lang],
    system: system.name[lang],
    features: design.features.length ? design.features.map((id) => system.features[id][lang]).join(', ') : catalog.labels.none[lang],
    messages: design.messages ? catalog.messages[design.messages][lang] : undefined,
    staff: design.staff ? catalog.staff[design.staff][lang] : undefined,
    afterHours: design.afterHours ? catalog.afterHours[design.afterHours][lang] : undefined,
  };
  return ROWS.filter((row) => value[row] !== undefined).map((row) => `${catalog.labels[row][lang]}: ${value[row]}`);
}

const VISITOR = {
  en: {
    subject: 'Your Lindrize agent design',
    intro: 'Here is the design you made on lindrize.online.',
    next: 'To see how it would work for your agency, book a 15-minute call:',
    reply: 'You can also reply to this email with any question.',
    ignore: 'If you did not ask for this email, you can ignore it. We will not email you again.',
    sign: 'Amer El-shair\nLindrize, Amman, Jordan',
  },
  ar: {
    subject: 'تصميم مساعدك من Lindrize',
    intro: 'هذا هو التصميم الذي أعددته على lindrize.online.',
    next: 'لتعرف كيف سيعمل لمكتبك، احجز مكالمة مدتها 15 دقيقة:',
    reply: 'ويمكنك أيضاً الردّ على هذه الرسالة بأي سؤال.',
    ignore: 'إذا لم تطلب هذه الرسالة فتجاهلها، ولن نراسلك مجدداً.',
    sign: 'Amer El-shair\nLindrize، عمّان، الأردن',
  },
};

export function visitorEmail({ email, lang, design }, catalog, config) {
  const t = VISITOR[lang];
  const text = [
    t.intro,
    '',
    ...summaryLines(design, catalog, lang),
    '',
    t.next,
    config.bookingUrl,
    '',
    t.reply,
    '',
    t.sign,
    '',
    t.ignore,
  ].join('\n');
  return { from: config.mailFrom, to: email, replyTo: config.ownerEmail, subject: t.subject, text };
}

export function ownerEmail({ email, lang, design }, catalog, config) {
  const text = [
    'Someone emailed themselves a design from the website.',
    '',
    `Their email: ${email}`,
    `Page language: ${lang === 'ar' ? 'Arabic' : 'English'}`,
    '',
    ...summaryLines(design, catalog, 'en'),
    '',
    'Reply to this email to answer them directly.',
    'Keep this email for up to 12 months, then delete it unless they became a client (Privacy Policy).',
  ].join('\n');
  return { from: config.mailFrom, to: config.ownerEmail, replyTo: email, subject: 'New agent design from the website', text };
}

/** The alert carries the design but not the visitor's email address: that stays in the inbox. */
export function telegramText(design, catalog) {
  return ['New agent design emailed from the website. Their address is in your inbox.', '', ...summaryLines(design, catalog, 'en')].join('\n');
}
