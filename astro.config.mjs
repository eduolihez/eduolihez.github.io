// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://eduolihez.github.io',
  vite: {
    plugins: [tailwindcss()]
  },
  // KEV Watch moved from its own page into a section on the homepage
  // (see src/pages/index.astro#kev-watch) — this keeps old bookmarks/links alive.
  redirects: {
    '/tools/kev-watch': '/#kev-watch',
  },
});