// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lajarana-org.luminari.agency',
  integrations: [react(), sitemap()],
  adapter: node({ mode: 'standalone' }),
  output: 'server',
});
