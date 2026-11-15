/**
 * "Design your agent". Shows one step at a time, keeps the visitor's answers on their own device,
 * plays the example, and builds the summary that travels to Calendly, WhatsApp or email.
 * Nothing leaves the browser unless the visitor chooses one of those three.
 */
import { track } from './track';
import { estimate, roundNice, type Assumptions } from '@/lib/estimate';

const STORAGE_KEY = 'lz-design';
const STEP_MS = 1000;
type Saved = Record<string, string | string[]>;

const root = document.querySelector<HTMLElement>('[data-builder]');
const form = root?.querySelector<HTMLFormElement>('[data-builder-form]');

if (root && form) {
  const motion = document.documentElement.classList.contains('motion');
  const openedAt = Date.now();
  const $ = <T extends Element>(selector: string): T | null => root.querySelector<T>(selector);
  const $$ = <T extends Element>(selector: string): T[] => [...root.querySelectorAll<T>(selector)];

  const steps = $$<HTMLElement>('[data-step]');
  const questionSteps = steps.filter((s) => !s.hasAttribute('data-result'));
  const progress = $<HTMLElement>('[data-progress]');
  const back = $<HTMLButtonElement>('[data-back]');
  const next = $<HTMLButtonElement>('[data-next]');
  const stepError = $<HTMLElement>('[data-step-error]');
  const select = $<HTMLSelectElement>('select[name="system"]');
  let current = 0;

  // ---------- Reading and remembering answers ----------
  const checked = (name: string): HTMLInputElement | null => form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  const systemNumber = (): string => select?.value ?? '1';
  const chosenFeatures = (): HTMLInputElement[] =>
    $$<HTMLInputElement>(`[data-features-for="${systemNumber()}"] input:checked`);

  const read = (): Saved => {
    const values: Saved = { system: systemNumber(), features: chosenFeatures().map((f) => f.value) };
    for (const name of ['type', 'size', 'problem', 'messages', 'staff', 'afterHours', 'salary']) {
      const input = checked(name);
      if (input) values[name] = input.value;
    }
    const currency = form.querySelector<HTMLSelectElement>('select[name="currency"]');
    if (currency) values['currency'] = currency.value;
    return values;
  };
  const save = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(read()));
    } catch {
      /* Private mode: answers last for this visit only. */
    }
  };
  const restore = (): void => {
    let saved: Saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Saved;
    } catch {
      return;
    }
    for (const [name, value] of Object.entries(saved)) {
      if (typeof value !== 'string') continue;
      if (name === 'system' || name === 'currency') {
        const field = form.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
        if (field && [...field.options].some((o) => o.value === value)) field.value = value;
      } else {
        const input = form.querySelector<HTMLInputElement>(`input[name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`);
        if (input) input.checked = true;
      }
    }
    const features = Array.isArray(saved['features']) ? saved['features'] : [];
    for (const input of $$<HTMLInputElement>(`[data-features-for="${systemNumber()}"] input`)) {
      input.checked = features.includes(input.value);
    }
  };

  // ---------- The example board ----------
  const playButton = $<HTMLButtonElement>('[data-play]');
  const mood = $<HTMLElement>('[data-mood]');
  const compare = $<HTMLElement>('[data-compare]');
  const extrasBox = $<HTMLElement>('[data-extras-box]');
  const extrasList = $<HTMLElement>('[data-extras]');
  let showWithout = false;
  let timer: number | undefined;
  let playing = false;
  let shown = 0;

  const boardKey = (): string => (showWithout && systemNumber() === '1' ? 'without' : systemNumber());
  const boardSteps = (): HTMLElement[] => $$<HTMLElement>(`[data-board-for="${boardKey()}"] .step`);

  const setMood = (count: number): void => {
    if (!mood) return;
    const all = boardSteps();
    const hasCustomer = all.some((s) => s.classList.contains('customer'));
    mood.hidden = !hasCustomer;
    if (!hasCustomer) return;
    const visible = all.slice(0, count);
    let kind = 'waiting';
    if (boardKey() === 'without') kind = count >= all.length ? 'lost' : 'waiting';
    else if (count >= all.length) kind = 'done';
    else if (visible.some((s) => s.classList.contains('system') || s.classList.contains('team'))) kind = 'answered';
    mood.dataset['kind'] = kind;
    for (const text of mood.querySelectorAll<HTMLElement>('[data-mood-text]')) text.hidden = text.dataset['moodText'] !== kind;
  };
  const setPlayLabel = (): void => {
    if (playButton) playButton.textContent = (playing ? root.dataset['pause'] : root.dataset['play']) ?? '';
  };
  const stop = (): void => {
    window.clearTimeout(timer);
    playing = false;
    setPlayLabel();
  };
  const showAll = (): void => {
    stop();
    const all = boardSteps();
    all.forEach((s) => s.classList.remove('pending', 'entering'));
    shown = all.length;
    setMood(shown);
  };
  const tick = (): void => {
    const all = boardSteps();
    if (shown >= all.length) {
      stop();
      return;
    }
    const step = all[shown];
    step?.classList.remove('pending');
    step?.classList.add('entering');
    shown++;
    setMood(shown);
    timer = window.setTimeout(tick, STEP_MS);
  };
  const play = (fromStart: boolean): void => {
    if (!motion) {
      showAll();
      return;
    }
    window.clearTimeout(timer);
    const all = boardSteps();
    if (fromStart || shown >= all.length) {
      all.forEach((s) => {
        s.classList.add('pending');
        s.classList.remove('entering');
      });
      shown = 0;
      setMood(0);
    }
    playing = true;
    setPlayLabel();
    timer = window.setTimeout(tick, 350);
  };

  const showBoard = (): void => {
    const key = boardKey();
    for (const board of $$<HTMLElement>('[data-board-for]')) board.hidden = board.dataset['boardFor'] !== key;
    if (compare) {
      compare.hidden = systemNumber() !== '1';
      $<HTMLElement>('[data-compare-with]')?.setAttribute('aria-pressed', String(!showWithout));
      $<HTMLElement>('[data-compare-without]')?.setAttribute('aria-pressed', String(showWithout));
    }
    showAll();
  };
  const showExtras = (): void => {
    if (!extrasBox || !extrasList) return;
    const features = showWithout ? [] : chosenFeatures();
    extrasList.replaceChildren(
      ...features.map((f) => {
        const item = document.createElement('li');
        item.textContent = f.dataset['text'] ?? '';
        return item;
      }),
    );
    extrasBox.hidden = features.length === 0;
  };

  // ---------- System and features follow the choices ----------
  const showSystem = (): void => {
    const n = systemNumber();
    for (const info of $$<HTMLElement>('[data-system-info]')) info.hidden = info.dataset['systemInfo'] !== n;
    for (const group of $$<HTMLElement>('[data-features-for]')) {
      const mine = group.dataset['featuresFor'] === n;
      group.hidden = !mine;
      // Extras belong to one system. Choosing another system starts its extras empty.
      if (!mine) group.querySelectorAll<HTMLInputElement>('input').forEach((i) => (i.checked = false));
    }
    if (n !== '1') showWithout = false;
    showBoard();
    showExtras();
  };

  // ---------- Money ranges and the estimate (only when the owner has set the assumptions) ----------
  const assumptions = root.dataset['assumptions'] ? (JSON.parse(root.dataset['assumptions']) as Assumptions) : undefined;
  const currency = (): { code: string; rate: number } => {
    const field = form.querySelector<HTMLSelectElement>('select[name="currency"]');
    const option = field?.selectedOptions[0];
    return { code: option?.value ?? 'USD', rate: Number(option?.dataset['rate'] ?? 1) };
  };
  const money = (usd: number): string => roundNice(usd * currency().rate).toLocaleString('en-US');
  const showMoneyLabels = (): void => {
    for (const input of $$<HTMLInputElement>('input[data-money]')) {
      const label = input.nextElementSibling;
      const text = `${money(Number(input.dataset['low']))} – ${money(Number(input.dataset['high']))} ${currency().code}`;
      if (label) label.textContent = text;
      input.dataset['text'] = text;
    }
  };
  const range = (name: string): { low: number; high: number } | undefined => {
    const input = checked(name);
    return input ? { low: Number(input.dataset['low']), high: Number(input.dataset['high']) } : undefined;
  };
  const fillTemplate = (el: HTMLElement | null, values: Record<string, string>): void => {
    if (!el) return;
    el.textContent = Object.entries(values).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, v), el.dataset['template'] ?? '');
  };
  const showEstimate = (): void => {
    if (!assumptions) return;
    const hoursEl = $<HTMLElement>('[data-estimate-hours]');
    const costEl = $<HTMLElement>('[data-estimate-cost]');
    const messages = range('messages');
    const staff = range('staff');
    const stepEl = steps.find((s) => s.dataset['step'] === 'estimate');
    // Without the two answers it needs, there is nothing honest to show: the step is skipped.
    if (stepEl) stepEl.toggleAttribute('data-skip', !messages || !staff);
    if (!messages || !staff) return;
    const result = estimate({ messagesPerDay: messages, staff, salaryUsd: range('salary') }, assumptions);
    fillTemplate(hoursEl, { low: String(roundNice(result.hoursPerWeek.low)), high: String(roundNice(result.hoursPerWeek.high)) });
    if (costEl) {
      costEl.hidden = !result.costPerMonthUsd;
      if (result.costPerMonthUsd) {
        fillTemplate(costEl, { low: money(result.costPerMonthUsd.low), high: money(result.costPerMonthUsd.high), currency: currency().code });
      }
    }
    fillTemplate($<HTMLElement>('[data-estimate-how]'), {
      share: String(Math.round(assumptions.routineShare * 100)),
      minutes: String(assumptions.minutesPerReply),
      hours: String(assumptions.workHoursPerMonth),
    });
  };

  // ---------- The summary that travels with the visitor ----------
  const summary = (): Array<[string, string]> => {
    const rows: Array<[string, string]> = [];
    for (const row of $$<HTMLElement>('[data-summary] [data-row]')) {
      const name = row.dataset['row'] ?? '';
      let value = '';
      if (name === 'system') value = select?.selectedOptions[0]?.dataset['text'] ?? '';
      else if (name === 'features') value = chosenFeatures().map((f) => f.dataset['text']).join(', ') || (root.dataset['none'] ?? '');
      else value = checked(name)?.dataset['text'] ?? '';
      const cell = row.querySelector('dd');
      if (cell) cell.textContent = value;
      row.hidden = value === '';
      if (value) rows.push([row.querySelector('dt')?.textContent ?? name, value]);
    }
    return rows;
  };
  const showSummary = (): void => {
    const rows = summary();
    const text = [root.dataset['summaryTitle'] ?? '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n');
    const bookLink = $<HTMLAnchorElement>('[data-design-book]');
    if (bookLink) bookLink.dataset['bookPrefill'] = text;
    const whatsapp = $<HTMLAnchorElement>('[data-design-whatsapp]');
    if (whatsapp) whatsapp.href = `https://wa.me/${root.dataset['whatsapp'] ?? ''}?text=${encodeURIComponent(text)}`;
  };

  // ---------- Moving between steps ----------
  const visibleSteps = (): HTMLElement[] => steps.filter((s) => !s.hasAttribute('data-skip'));
  const show = (index: number, focus: boolean): void => {
    const list = visibleSteps();
    current = Math.max(0, Math.min(index, list.length - 1));
    const active = list[current];
    for (const step of steps) step.hidden = step !== active;
    if (stepError) stepError.hidden = true;
    const isResult = active?.hasAttribute('data-result') ?? false;
    const isLast = current === list.length - 1;
    if (back) back.hidden = current === 0;
    if (next) {
      next.hidden = isLast;
      next.textContent = (active?.hasAttribute('data-optional') ? root.dataset['skipOrNext'] : root.dataset['next']) ?? '';
    }
    if (progress) {
      const position = active ? questionSteps.indexOf(active) : -1;
      progress.textContent =
        isResult || position < 0
          ? ''
          : (root.dataset['progressText'] ?? '').replace('{n}', String(position + 1)).replace('{total}', String(questionSteps.length));
    }
    if (isLast) showSummary();
    if (focus) {
      const heading = active?.querySelector<HTMLElement>('h2');
      heading?.focus({ preventScroll: true });
      active?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      const top = root.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 90, behavior: 'auto' });
    }
    track('design-step', { step: active?.dataset['step'] ?? '' });
  };
  const complete = (step: HTMLElement | undefined): boolean => {
    if (!step) return true;
    const names = new Set([...step.querySelectorAll<HTMLInputElement>('input[required]')].map((i) => i.name));
    return [...names].every((name) => checked(name) !== null);
  };

  next?.addEventListener('click', () => {
    const active = visibleSteps()[current];
    if (!complete(active)) {
      if (stepError) stepError.hidden = false;
      const missing = [...(active?.querySelectorAll<HTMLInputElement>('input[required]') ?? [])].find((i) => checked(i.name) === null);
      missing?.focus();
      return;
    }
    showEstimate();
    show(current + 1, true);
  });
  back?.addEventListener('click', () => show(current - 1, true));
  form.addEventListener('submit', (event) => event.preventDefault());

  form.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (stepError) stepError.hidden = true;
    if (target.name === 'problem' && select) {
      // The chosen problem suggests a system. The visitor can change it in the next step.
      select.value = (target as HTMLInputElement).dataset['system'] ?? select.value;
      showSystem();
    }
    if (target.name === 'system') showSystem();
    if (target.name === 'feature') {
      showExtras();
      play(true);
      track('design-feature', { system: systemNumber(), feature: target.value });
    }
    if (target.name === 'currency') showMoneyLabels();
    save();
  });

  playButton?.addEventListener('click', () => {
    if (playing) stop();
    else play(false);
  });
  $<HTMLButtonElement>('[data-replay]')?.addEventListener('click', () => play(true));
  for (const [selector, without] of [['[data-compare-with]', false], ['[data-compare-without]', true]] as const) {
    $<HTMLButtonElement>(selector)?.addEventListener('click', () => {
      showWithout = without;
      showBoard();
      showExtras();
      play(true);
    });
  }

  // ---------- Clear my answers ----------
  $<HTMLButtonElement>('[data-clear]')?.addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Nothing was stored. */
    }
    form.reset();
    const emailForm = $<HTMLFormElement>('[data-email-form]');
    emailForm?.reset();
    showWithout = false;
    showSystem();
    showMoneyLabels();
    show(0, true);
    const status = $<HTMLElement>('[data-clear-status]');
    if (status) status.textContent = status.dataset['text'] ?? '';
  });

  // ---------- Email me my design ----------
  const emailForm = $<HTMLFormElement>('[data-email-form]');
  if (emailForm) {
    const input = emailForm.querySelector<HTMLInputElement>('input[name="email"]');
    const errorEl = emailForm.querySelector<HTMLElement>('[data-email-error]');
    const statusEl = emailForm.querySelector<HTMLElement>('[data-email-status]');
    const text = emailForm.querySelector<HTMLElement>('[data-email-text]')?.dataset ?? {};
    const button = emailForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    let token = '';
    let widgetStarted = false;

    const fail = (message: string | undefined): void => {
      if (statusEl) statusEl.textContent = '';
      if (errorEl) {
        errorEl.textContent = message ?? '';
        errorEl.hidden = false;
      }
      input?.setAttribute('aria-invalid', 'true');
    };
    // The human check (Cloudflare Turnstile) loads only when the visitor starts using this form.
    const startCheck = (): void => {
      const sitekey = emailForm.dataset['sitekey'];
      const holder = emailForm.querySelector<HTMLElement>('[data-turnstile]');
      if (widgetStarted || !sitekey || !holder) return;
      widgetStarted = true;
      const render = (): void => {
        const api = (window as unknown as { turnstile?: { render: (el: HTMLElement, options: Record<string, unknown>) => void } }).turnstile;
        api?.render(holder, {
          sitekey,
          language: root.dataset['lang'] ?? 'en',
          callback: (value: string) => (token = value),
          'expired-callback': () => (token = ''),
          'error-callback': () => (token = ''),
        });
      };
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.addEventListener('load', render);
      document.head.append(script);
    };
    input?.addEventListener('focus', startCheck);

    emailForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      startCheck();
      if (errorEl) errorEl.hidden = true;
      input?.removeAttribute('aria-invalid');
      const email = input?.value.trim() ?? '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
        fail(text['errorEmail']);
        input?.focus();
        return;
      }
      if (!token) {
        fail(text['errorCheck']);
        return;
      }
      if (statusEl) statusEl.textContent = text['sending'] ?? '';
      if (button) button.disabled = true;
      try {
        const response = await fetch(emailForm.dataset['endpoint'] ?? '/api/design', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email,
            lang: root.dataset['lang'] ?? 'en',
            design: read(),
            company: emailForm.querySelector<HTMLInputElement>('input[name="company"]')?.value ?? '',
            elapsed: Date.now() - openedAt,
            token,
          }),
        });
        if (response.ok) {
          if (statusEl) statusEl.textContent = text['sent'] ?? '';
          emailForm.reset();
          track('design-email');
        } else {
          fail(response.status === 429 ? text['errorToomany'] : text['errorFailed']);
        }
      } catch {
        fail(text['errorFailed']);
      } finally {
        if (button) button.disabled = false;
        token = '';
        widgetStarted = false;
        emailForm.querySelector<HTMLElement>('[data-turnstile]')?.replaceChildren();
      }
    });
  }

  $<HTMLAnchorElement>('[data-design-whatsapp]')?.addEventListener('click', () => track('design-whatsapp', { system: systemNumber() }));

  restore();
  showSystem();
  showMoneyLabels();
  show(0, false);
}

export {};
