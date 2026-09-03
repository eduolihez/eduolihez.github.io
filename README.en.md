# Blue Team Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://github.com/eduolihez/eduolihez.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/eduolihez/eduolihez.github.io/actions/workflows/deploy.yml)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)

### [Versión en Español](README.md) · **[English version](README.en.md)**

A portal of cybersecurity tools, interactive playbooks and utilities for SOC
analysts, threat hunters and Blue Team people. Everything is static and runs
client-side: nothing you paste into these tools leaves your browser.

The site lives at [eduolihez.github.io](https://eduolihez.github.io) and works
as the interactive companion to my main wiki and portfolio,
[eduolihez.com](https://eduolihez.com).

## Design and stack

The project uses a glassmorphism look, with frosted backgrounds and gradients.
Underneath:

* **Astro** to generate the static pages and reusable components.
* **Tailwind CSS 4** for the responsive layout and the background effects.
* **TypeScript / JavaScript** for local data processing, with no backend.

## Tools

### IOC Defanger & Extractor

[/tools/defanger](https://eduolihez.github.io/tools/defanger)

Defangs and sanitises IP addresses, URLs and email addresses, or pulls IOCs
(hashes, emails, IPs, URLs) out of messy text.

### Email Header Analyzer

[/tools/email-analyzer](https://eduolihez.github.io/tools/email-analyzer)

Parses raw mail headers or `.eml` files to check SPF, DKIM and DMARC, and draws
the timeline of hops between servers with their delays.

### YARA rule generator

[/tools/yara-generator](https://eduolihez.github.io/tools/yara-generator)

A step-by-step assistant for building YARA detection rules with string
modifiers and an explicit condition. It has a built-in linter that validates
the syntax as you type.

### Interactive incident playbooks

[/tools/playbooks](https://eduolihez.github.io/tools/playbooks)

Decision trees to guide an analyst through phishing, malware and brute force
alerts. They return structured mitigation steps and SIEM queries
(Splunk/Sentinel) generated on the fly.

### Payload Decoder & Deobfuscator

[/tools/decoder](https://eduolihez.github.io/tools/decoder)

Decodes Base64 (UTF-8 and UTF-16LE), URL and Hex, and deobfuscates PowerShell
scripts by cleaning up concatenations and backticks. All locally.

### OSINT Hub

[/tools/osint-hub](https://eduolihez.github.io/tools/osint-hub)

Extracts IPs, domains and hashes from a block of text and links them against
external engines (VirusTotal, AbuseIPDB). It includes a resource directory.

### KEV Watch

[/tools/kev-watch](https://eduolihez.github.io/tools/kev-watch)

A watch over the
[CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
catalog, the one for vulnerabilities with confirmed active exploitation. This
is the only tool with a server-side part, and the data is not computed here:
[kev-digest](https://github.com/eduolihez/kev-digest) generates it, checking
the catalog every 3 hours and publishing the processed result. The
`.github/workflows/kev-watch.yml` workflow just downloads that JSON, validates
it, commits `src/data/kev.json` if it changed, and triggers a redeploy. The computation deliberately lives in
one place: two implementations of the same diff, in two languages, would end up
disagreeing.

## Repository structure

```text
├── src/
│   ├── components/       # Componentes globales (Header, Footer)
│   ├── layouts/          # Layout base del sitio con efectos de fondo y tipografías
│   ├── pages/            # Enrutamiento de páginas (Astro)
│   │   ├── index.astro   # Página de inicio del portal (Dashboard)
│   │   └── tools/        # Herramientas individuales (Astro)
│   │       ├── defanger.astro       # IOC Defanger & Extractor
│   │       ├── email-analyzer.astro # Email Header Analyzer
│   │       ├── playbooks.astro      # Playbooks Interactivos
│   │       ├── decoder.astro        # Payload Decoder & Deobfuscator
│   │       ├── osint-hub.astro      # OSINT Hub & Enlaces Externos
│   │       ├── yara-generator.astro # Generador de Reglas YARA
│   │       └── kev-watch.astro      # KEV Watch (vigilancia CISA KEV)
│   ├── data/
│   │   └── kev.json      # Copia del latest.json que publica kev-digest
│   └── styles/
│       └── global.css    # Hoja de estilos global e importación de Tailwind CSS
├── public/               # Recursos estáticos públicos (imágenes, favicon, .nojekyll)
├── .github/              # Configuraciones de GitHub (workflows: deploy.yml, kev-watch.yml)
├── astro.config.mjs      # Configuración de Astro e integraciones
└── package.json          # Archivo de dependencias y scripts de Node.js
```

## Local development

Install the dependencies:

```bash
npm install
```

Start the dev server and open
[http://localhost:4321](http://localhost:4321):

```bash
npm run dev
```

Build for production. This creates the `dist/` folder with the static HTML, CSS
and JS ready to serve:

```bash
npm run build
```

## Deployment

The pipeline lives in `.github/workflows/deploy.yml`. Every `git push` to `main`
installs dependencies, builds the site with `npm run build` and pushes the
generated files to the `gh-pages` branch. For any of that to be useful, the
repository has to be configured on GitHub to publish Pages from `gh-pages`.
