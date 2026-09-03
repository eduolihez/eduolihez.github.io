# Blue Team Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://github.com/eduolihez/eduolihez.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/eduolihez/eduolihez.github.io/actions/workflows/deploy.yml)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)

### **[Versión en Español](README.md)** · [English version](README.en.md)

Portal de herramientas de ciberseguridad, playbooks interactivos y utilidades
para analistas de SOC, threat hunters y gente de Blue Team. Todo es estático y
corre en el lado del cliente: nada de lo que pegues en estas herramientas sale
de tu navegador.

El sitio está en [eduolihez.github.io](https://eduolihez.github.io) y funciona
como complemento interactivo de mi wiki y portfolio principal,
[eduolihez.com](https://eduolihez.com).

## Diseño y stack

El proyecto usa una estética glassmorphism, con fondos esmerilados y gradientes.
Por debajo:

* **Astro** para generar páginas estáticas y componentes reutilizables.
* **Tailwind CSS 4** para el diseño responsivo y los efectos de fondo.
* **TypeScript / JavaScript** para el procesamiento de datos en local, sin backend.

## Herramientas

### IOC Defanger & Extractor

[/tools/defanger](https://eduolihez.github.io/tools/defanger)

Desarma (defang) e higieniza direcciones IP, URLs y correos, o extrae IOCs
(hashes, correos, IPs, URLs) de un texto sucio.

### Email Header Analyzer

[/tools/email-analyzer](https://eduolihez.github.io/tools/email-analyzer)

Analiza cabeceras de correo en crudo o archivos `.eml` para verificar SPF, DKIM
y DMARC, y dibuja la línea de tiempo de saltos entre servidores con sus
retardos.

### Generador de reglas YARA

[/tools/yara-generator](https://eduolihez.github.io/tools/yara-generator)

Asistente paso a paso para construir reglas de detección YARA con modificadores
de cadena y condición expresa. Lleva un linter integrado que valida la sintaxis
mientras escribes.

### Playbooks interactivos de incidentes

[/tools/playbooks](https://eduolihez.github.io/tools/playbooks)

Árboles de decisión para guiar al analista en alertas de phishing, malware y
fuerza bruta. Devuelven acciones de mitigación estructuradas y consultas SIEM
(Splunk/Sentinel) generadas sobre la marcha.

### Payload Decoder & Deobfuscator

[/tools/decoder](https://eduolihez.github.io/tools/decoder)

Decodifica Base64 (UTF-8 y UTF-16LE), URL y Hex, y desofusca scripts de
PowerShell limpiando concatenaciones y backticks. Todo en local.

### OSINT Hub

[/tools/osint-hub](https://eduolihez.github.io/tools/osint-hub)

Extrae IPs, dominios y hashes de un texto y los enlaza contra motores externos
(VirusTotal, AbuseIPDB). Incluye un directorio de recursos.

### KEV Watch

[/tools/kev-watch](https://eduolihez.github.io/tools/kev-watch)

Vigilancia del catálogo
[CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog), el de
vulnerabilidades con explotación activa confirmada. Esta es la única
herramienta con parte en servidor, y los datos no se calculan aquí: los genera
[kev-digest](https://github.com/eduolihez/kev-digest), que comprueba el
catálogo cada 3 horas y publica el resultado ya procesado. El workflow
`.github/workflows/kev-watch.yml` se limita a descargar ese JSON, validarlo,
comitear `src/data/kev.json` si ha cambiado y disparar un redespliegue. El cálculo vive en un solo sitio a
propósito: dos implementaciones del mismo diff, en dos lenguajes, acabarían
discrepando.

## Estructura del repositorio

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

## Desarrollo local

Instala las dependencias:

```bash
npm install
```

Levanta el servidor de desarrollo y abre
[http://localhost:4321](http://localhost:4321):

```bash
npm run dev
```

Compila para producción. Genera la carpeta `dist/` con el HTML, CSS y JS
estático listo para servir:

```bash
npm run build
```

## Despliegue

El pipeline vive en `.github/workflows/deploy.yml`. Cada `git push` a `main`
instala dependencias, compila el sitio con `npm run build` y empuja los
archivos generados a la rama `gh-pages`. Para que esto sirva de algo, el
repositorio tiene que estar configurado en GitHub para publicar Pages desde
`gh-pages`.
