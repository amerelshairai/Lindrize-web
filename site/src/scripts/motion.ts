/**
 * Scroll motion for the whole site (SPEC 8). It runs only when the visitor has not asked for
 * reduced motion. Content is visible by default: this script hides what is below the screen only
 * after it has started, so a failed or blocked script can never leave anything hidden.
 */
const root = document.documentElement;

if (root.classList.contains('motion') && 'IntersectionObserver' in window) {
  // 1. Sections and rows slide in; the short line above each heading draws in.
  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal], [data-draw]')];
  const viewport = window.innerHeight;
  for (const el of targets) {
    // Anything already on screen stays as it is.
    if (el.getBoundingClientRect().top < viewport * 0.92) el.classList.add('shown');
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('shown');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  targets.filter((el) => !el.classList.contains('shown')).forEach((el) => observer.observe(el));
  root.classList.add('motion-ready');

  // 2. The statement lights up word by word, and the "Working with us" line fills.
  const statement = document.querySelector<HTMLElement>('[data-statement]');
  const words = statement ? [...statement.querySelectorAll<HTMLElement>('.word')] : [];
  statement?.setAttribute('data-armed', '');

  const process = document.querySelector<HTMLElement>('[data-process]');
  const fill = process?.querySelector<HTMLElement>('[data-process-fill]');
  const track = fill?.parentElement;
  const steps = process ? [...process.querySelectorAll<HTMLElement>('[data-process-step]')] : [];

  let queued = false;
  const update = (): void => {
    queued = false;
    const vh = window.innerHeight;

    if (statement) {
      const box = statement.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (vh * 0.85 - box.top) / (box.height + vh * 0.3)));
      const lit = Math.round(progress * words.length);
      words.forEach((word, i) => word.classList.toggle('lit', i < lit));
    }

    if (process && fill && track) {
      const box = track.getBoundingClientRect();
      const filled = Math.min(box.height, Math.max(0, vh * 0.6 - box.top));
      fill.style.height = `${filled}px`;
      const line = box.top + filled;
      steps.forEach((step) => {
        step.classList.toggle('reached', step.getBoundingClientRect().top + 26 <= line + 1);
      });
    }
  };
  const onScroll = (): void => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  };
  if (statement || process) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }
}

export {};
