# 🛡️ Blue Team Hub - Eduardo Olivares

Un portal de herramientas de ciberseguridad, playbooks interactivos y utilidades tácticas **100% estáticas y en el lado del cliente (Client-side)** diseñado para analistas de centros de operaciones de seguridad (SOC), cazadores de amenazas (Threat Hunters) y profesionales del Blue Team.

Este sitio web se aloja en [eduolihez.github.io](https://eduolihez.github.io) como complemento interactivo a mi wiki y portafolio principal [eduolihez.com](https://eduolihez.com).

---

## 🎨 Diseño y Stack Tecnológico

El proyecto ha sido completamente rediseñado bajo una estética premium **SaaS Glassmorphism de estilo Apple** utilizando:

* **Astro**: Para compilación de páginas estáticas ultrarrápidas y componentes reutilizables.
* **Tailwind CSS (v4)**: Para un diseño fluido, moderno y responsivo con efectos esmerilados y fondos con destellos (gradients glow).
* **TypeScript / JavaScript**: Para el procesamiento interactivo de datos locales (sin backend).

---

## 🛠️ Herramientas Disponibles

### 🧪 IOC Defanger & Extractor
* **Ubicación**: [/tools/defanger](https://eduolihez.github.io/tools/defanger)
* **Descripción**: Permite desarmar (defang) e higienizar direcciones IP, URLs y correos electrónicos, o extraer IOCs (hashes, correos, IPs, URLs) de texto sucio.

### ✉️ Email Header Analyzer
* **Ubicación**: [/tools/email-analyzer](https://eduolihez.github.io/tools/email-analyzer)
* **Descripción**: Permite analizar cabeceras de correo en crudo o cargar archivos `.eml` para verificar el estado de SPF, DKIM, DMARC y representar gráficamente la línea de tiempo de saltos de red entre servidores con sus retardos correspondientes.

### 🛡️ Generador de Reglas YARA
* **Ubicación**: [/tools/yara-generator](https://eduolihez.github.io/tools/yara-generator)
* **Descripción**: Asistente interactivo paso a paso para construir reglas de detección YARA con modificadores de cadena y condición expresa, acompañado de un analizador sintáctico (linter) integrado en tiempo real.

### 🌿 Playbooks Interactivos de Incidentes
* **Ubicación**: [/tools/playbooks](https://eduolihez.github.io/tools/playbooks)
* **Descripción**: Árboles de decisión interactivos para guiar a los analistas en la resolución de alertas de Phishing, Malware y Fuerza Bruta, proveyendo acciones de mitigación estructuradas y consultas de búsqueda SIEM (Splunk/Sentinel) generadas dinámicamente.

### ⚡ Payload Decoder & Deobfuscator
* **Ubicación**: [/tools/decoder](https://eduolihez.github.io/tools/decoder)
* **Descripción**: Decodifica Base64 (UTF-8/UTF-16LE), URL, Hex y desofusca scripts de PowerShell limpiando concatenaciones y backticks de forma local.

### 🌐 OSINT Hub & Enlaces Externos
* **Ubicación**: [/tools/osint-hub](https://eduolihez.github.io/tools/osint-hub)
* **Descripción**: Genera consultas rápidas OSINT extrayendo y vinculando IPs, dominios y hashes a motores externos (VirusTotal, AbuseIPDB) con directorio de recursos.

---

## 📁 Estructura del Repositorio

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
│   │       └── yara-generator.astro # Generador de Reglas YARA
│   └── styles/
│       └── global.css    # Hoja de estilos global e importación de Tailwind CSS
├── public/               # Recursos estáticos públicos (imágenes, favicon, .nojekyll)
├── .github/              # Configuraciones de GitHub (workflows, templates)
├── astro.config.mjs      # Configuración de Astro e integraciones
└── package.json          # Archivo de dependencias y scripts de Node.js
```

---

## 🚀 Desarrollo Local

Para correr el proyecto localmente y realizar cambios:

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

3. **Compilar para Producción**:
   ```bash
   npm run build
   ```
   Genera la carpeta `dist/` con el HTML/CSS/JS estático listo para servir.

---

## 🚀 Despliegue Automatizado

El repositorio cuenta con un pipeline de CI/CD configurado con **GitHub Actions** en `.github/workflows/deploy.yml`:

- Cada vez que haces `git push` a la rama `main`, el workflow instala dependencias, compila el sitio de Astro (`npm run build`) y empuja los archivos generados a la rama `gh-pages`.
- Asegúrate de tener configurado tu repositorio en GitHub para servir Pages desde la rama `gh-pages`.
