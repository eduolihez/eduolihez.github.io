# 💡 Ideas de Contenido y Proyectos para eduolihez.github.io

Este directorio temporal (`.temp/eduolihez.github.io/`) sirve como espacio de trabajo para estructurar el contenido de tu nuevo sitio en GitHub Pages. Dado que GitHub Pages sirve contenido estático, todas las ideas están diseñadas para funcionar de forma **100% estática en el cliente (Browser-side)**, garantizando rendimiento, privacidad y costo cero de infraestructura.

---

## 🎯 Enfoque General: Blue Team & Operaciones de Seguridad (SOC)

Como **Analista SOC y profesional del Blue Team**, tu GitHub Pages es la plataforma ideal para hospedar herramientas interactivas, guías visuales y utilidades que otros analistas puedan usar en su día a día. A diferencia de tu web principal `eduolihez.com` (que actúa como tu portfolio/wiki formal con backend), `eduolihez.github.io` puede convertirse en un **Playground de herramientas tácticas e interactividad**.

A continuación, se detalla un listado de ideas agrupadas por categorías, con su stack sugerido y valor estratégico:

---

## 🛠️ Categoría 1: Herramientas Tácticas para el Analista SOC (Web Apps Estáticas)

Estas herramientas procesan datos de forma local en el navegador del usuario, lo que es ideal para analizar payloads sin que salgan de la máquina local (privacidad/opsec).

### 1.1. Defang/Refang & Sanitizador de IOCs
* **Descripción**: Una utilidad rápida para "desarmar" (defang) enlaces, direcciones IP y correos electrónicos para que se puedan compartir en informes de seguridad sin riesgo de clic accidental (ej. transformar `http://malicious.com` en `hxxps[://]malicious[.]com`), y viceversa (refang).
* **Funciones Clave**:
  - Procesamiento por lotes (múltiples IPs/URLs a la vez).
  - Copiado rápido al portapapeles.
  - Extractor automático de IOCs desde texto sucio usando regex (URLs, IPs, hashes MD5/SHA256, emails).
* **Stack**: HTML5, Vanilla CSS / Tailwind, JavaScript.

### 1.2. Analizador de Cabeceras de Correo (Email Header Analyzer)
* **Descripción**: Permite arrastrar un archivo `.eml` o pegar las cabeceras crudas de un correo sospechoso para analizarlas en local.
* **Funciones Clave**:
  - Parseo de la ruta de saltos de red (`Received:` headers) y representación en una línea de tiempo.
  - Comprobación visual del estado de seguridad de los registros: **SPF, DKIM y DMARC**.
  - Extracción de adjuntos y enlaces sospechosos ocultos.
* **Stack**: JavaScript (ej. librería `mailparser` adaptada para cliente o parser regex propio).

### 1.3. Decodificador y Formateador de Payloads (PS/Bash/Hex)
* **Descripción**: Un mini-CyberChef simplificado y especializado en desofuscar comandos comunes que usan los atacantes.
* **Funciones Clave**:
  - Decodificador Base64 inteligente (detecta si el resultado es UTF-16LE, común en PowerShell).
  - Formateador y visor de JSON/XML/Hex.
  - Conversión de XOR simple.
* **Stack**: JavaScript, librerías de renderizado de código (como PrismJS o Monaco Editor básico).

---

## 📖 Categoría 2: Playbooks Interactivos y Cheat Sheets de Respuesta a Incidentes

En lugar de PDFs estáticos, puedes ofrecer guías interactivas paso a paso para la investigación de incidentes.

### 2.1. Árbol de Decisión de Incidentes (Interactive IR Flowcharts)
* **Descripción**: Un recomendador interactivo que guía al analista sobre qué hacer dependiendo de la alerta (ej. Phishing detectado, Tráfico baliza C2, Fuerza bruta en AD).
* **Funciones Clave**:
  - Cuestionario paso a paso ("¿Se ha ejecutado el adjunto?", "¿Hay persistencia detectada?").
  - Generador de comandos de consola listos para usar según las respuestas (ej. comandos de Powershell, queries de KQL para Sentinel, Splunk SPL).
  - Diagrama dinámico interactivo usando Mermaid.js o vis.js.
* **Stack**: HTML/JS, Mermaid.js.

### 2.2. Cheat Sheet interactivo de Sysmon & Windows Event Logs
* **Descripción**: Una tabla interactiva para filtrar y buscar rápidamente IDs de eventos de Windows (Event IDs) y tácticas de MITRE ATT&CK asociadas.
* **Funciones Clave**:
  - Filtrado por Event ID (ej. Event ID 1: Process Creation, Event ID 3: Network Connection).
  - Queries de ejemplo para SIEM (KQL / SPL / Logql) asociadas a cada evento.
  - Recomendaciones de configuración de Sysmon.
* **Stack**: HTML/JS.

---

## 🔍 Categoría 3: Dashboard OSINT y Ciberinteligencia en el Navegador

Herramientas para recopilar información de fuentes abiertas utilizando APIs públicas directamente desde el navegador de forma segura.

### 3.1. OSINT Aggregator con LocalStorage
* **Descripción**: Un panel de búsqueda donde introduces una IP, Dominio o Hash y consulta múltiples fuentes públicas abiertas simultáneamente (VirusTotal, HaveIBeenPwned, Shodan, URLVoid, AbuseIPDB).
* **Funciones Clave**:
  - **OPSEC Seguro**: Dado que no tienes backend, el usuario introduce sus propias API Keys, las cuales se guardan en el `localStorage` de su navegador de forma local y privada.
  - Agrupación de resultados en tarjetas visuales claras.
* **Stack**: HTML, JS (Fetch API).

### 3.2. Visualizador de Grafos de FollowGuard (Mockup/Demo)
* **Descripción**: Al hilo de tu proyecto **FollowGuard** (análisis de bots en redes sociales), podrías hospedar una interfaz estática que permita cargar un JSON exportado por la herramienta y renderizar un grafo interactivo de relaciones.
* **Funciones Clave**:
  - Visualización interactiva de nodos y aristas (seguidores/seguidos).
  - Marcado en color de perfiles sospechosos de ser bots/falsos.
  - Filtros por puntuación de autenticidad.
* **Stack**: Sigma.js, vis.js o D3.js.

---

## 🛡️ Categoría 4: Repositorio e Interactive Generator de Reglas de Detección

Un espacio para compartir y generar reglas de detección de amenazas.

### 4.1. Generador y Validador de Reglas YARA
* **Descripción**: Un formulario que facilita escribir reglas YARA válidas reduciendo los errores de sintaxis comunes.
* **Funciones Clave**:
  - Formulario estructurado: Metadatos, Strings (Texto, Hex, RegEx con modificadores como `nocase`, `wide`, `ascii`), y Condición.
  - Generación de la regla formateada en tiempo real.
  - Validador básico de sintaxis en el cliente.
* **Stack**: HTML, JS.

### 4.2. Repositorio de Reglas Sigma/YARA de Eduardo (Static Site)
* **Descripción**: Un catálogo limpio y ordenado de tus propias reglas de detección organizadas por categorías de MITRE ATT&CK y plataformas afectadas.
* **Funciones Clave**:
  - Buscador rápido por etiquetas (tags), fecha o técnica.
  - Botón de copiar rápido y descarga directa.
  - Integración opcional con un parser que convierta Sigma a queries de Splunk/Elasticsearch.
* **Stack**: Jekyll, Astro (compilado estático) o pure HTML.

---

## 📂 Estructura Inicial del Directorio Temporal

Para empezar a trabajar en estas ideas, podemos estructurar este directorio temporal `.temp/eduolihez.github.io/` de la siguiente forma:

```text
.temp/eduolihez.github.io/
├── ideas.md                 # Este documento con las ideas
├── src/                     # Código fuente de las herramientas/contenidos
│   ├── css/                 # Estilos (Vanilla CSS)
│   ├── js/                  # Lógica del cliente
│   │   ├── defanger.js      # Script de la herramienta Defang/Refang
│   │   └── analyzer.js      # Script del analizador de cabeceras de correo
│   └── index.html           # Página de inicio del portal/playground
└── tools/
    ├── defanger.html        # Herramienta interactiva de Defang/Refang
    └── email-analyzer.html  # Analizador interactivo de cabeceras
```

¿Qué te parece esta dirección? ¿Hay alguna de estas ideas que te llame especialmente la atención para que empecemos a sentar las bases del código y diseño en este directorio temporal?
