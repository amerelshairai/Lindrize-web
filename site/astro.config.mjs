// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// Fonts are read from the installed @fontsource packages and served from our own server.
// Only the Latin and Arabic character sets are included, so nothing extra is downloaded.
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const ARABIC =
  'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';

/** @param {string} pkg @param {string} subset @param {number[]} weights */
const variants = (pkg, subset, weights) =>
  /** @type {any} */ (
    weights.map((weight) => ({
      weight,
      style: 'normal',
      src: [`./node_modules/@fontsource/${pkg}/files/${pkg}-${subset}-${weight}-normal.woff2`],
    }))
  );

export default defineConfig({
  site: 'https://www.lindrize.online',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },

  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },

  // Start loading a page when its link is pointed at, focused or touched.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  security: {
    // Astro adds a hash for every script and style it emits, so nothing else can run.
    // The server adds the headers a <meta> tag cannot carry (frame-ancestors, HSTS) in Phase 5.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src https://calendly.com https://www.youtube-nocookie.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-plex-sans',
      fallbacks: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      unicodeRange: [LATIN],
      options: { variants: variants('ibm-plex-sans', 'latin', [400, 500]) },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Serif',
      cssVariable: '--font-plex-serif',
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
      unicodeRange: [LATIN],
      options: { variants: variants('ibm-plex-serif', 'latin', [400]) },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Sans Arabic',
      cssVariable: '--font-plex-arabic',
      fallbacks: ['Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
      unicodeRange: [ARABIC],
      options: { variants: variants('ibm-plex-sans-arabic', 'arabic', [400, 500]) },
    },
  ],
});
