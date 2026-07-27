# 🛡️ Blue Team Hub - Eduardo Olivares

Un portal de herramientas de ciberseguridad, playbooks interactivos y utilidades tácticas **100% estáticas y en el lado del cliente (Client-side)** diseñado para analistas de centros de operaciones de seguridad (SOC), cazadores de amenazas (Threat Hunters) y profesionales del Blue Team.

Este sitio web se aloja en [eduolihez.github.io](https://eduolihez.github.io) como complemento interactivo a mi wiki y portafolio principal [eduolihez.com](https://eduolihez.com).

---

## 🎯 Propósito del Proyecto

A diferencia de los recursos convencionales que requieren infraestructuras backend complejas, **Blue Team Hub** procesa todos los datos localmente en el navegador del analista. Esto garantiza:
1. **OpSec / Privacidad**: Los payloads, cabeceras de correo o IOCs analizados nunca salen de tu máquina local.
2. **Portabilidad y Rapidez**: Carga inmediata sin latencia de servidor.
3. **Costo Cero**: Ejecución e infraestructura gratuitas sobre GitHub Pages.

---

## 🛠️ Herramientas Disponibles e Ideas en Planificación

### 🧪 IOC Defanger & Extractor (Disponible)
* **Ubicación**: [tools/defanger.html](file:///c:/Users/eduol/Documents/GitHub/eduolihez.github.io/tools/defanger.html)
* **Descripción**: Permite desarmar (defang) e higienizar direcciones IP, URLs y correos electrónicos para compartirlos de forma segura en informes de incidentes, o bien realizar la operación inversa (refang). También incorpora un extractor automático de IOCs mediante expresiones regulares desde bloques de texto crudo.

### ✉️ Email Header Analyzer (Próximamente)
* **Descripción**: Analizador visual de cabeceras de correo sospechosas (`.eml` o texto crudo). Parseo de la ruta de saltos de red y validación de registros de autenticación SPF, DKIM y DMARC de forma 100% local.

### 🛡️ Generador de Reglas YARA (Próximamente)
* **Descripción**: Formulario interactivo que guía en la escritura y estructuración correcta de reglas YARA minimizando errores de sintaxis en metadatos, strings y lógica de condiciones.

### 🌿 Playbooks Interactivos (Próximamente)
* **Descripción**: Árboles de decisión dinámicos para guiar al analista paso a paso durante un incidente de seguridad (Phishing, Malware, Fuerza Bruta) e integrando comandos y queries SIEM (KQL, SPL) listos para usar.

---

## 📁 Estructura del Repositorio

```text
├── index.html           # Página de inicio del portal (landing page)
├── ideas.md             # Documento de ideas y planificación de contenidos
├── src/                 # Recursos de la aplicación (CSS, JS, imágenes)
│   └── css/
│       └── styles.css   # Estilos CSS generales (Dark Theme)
├── tools/               # Directorio con las herramientas individuales (HTML independiente)
│   └── defanger.html    # Código fuente de la herramienta Defanger
├── .github/             # Configuraciones específicas de GitHub (plantillas, etc.)
└── .gitignore           # Archivo de exclusión de Git
```

---

## 🚀 Cómo Ejecutar en Local

Dado que el sitio es completamente estático, no necesitas instalar dependencias de base de datos ni configurar servidores web complejos.

### Opción 1: Abrir directamente
Solo haz doble clic en [index.html](file:///c:/Users/eduol/Documents/GitHub/eduolihez.github.io/index.html) para abrirlo en cualquier navegador web.

### Opción 2: Usar un servidor web ligero
Si deseas simular un entorno de producción o evitar bloqueos de CORS en futuras integraciones:

**Usando Python 3:**
```bash
python -m http.server 8000
```
Luego navega a `http://localhost:8000`.

**Usando VS Code:**
Instala la extensión **Live Server**, abre el proyecto y haz clic en *Go Live*.

---

## 🤝 Contribuciones y Reporte de Problemas

¡Las contribuciones son bienvenidas! Si encuentras un fallo o deseas sugerir una nueva herramienta táctica:
1. Revisa nuestra política en [SECURITY.md](file:///c:/Users/eduol/Documents/GitHub/eduolihez.github.io/SECURITY.md) si encuentras algún problema de seguridad.
2. Abre un Issue utilizando nuestras plantillas en la pestaña correspondiente de GitHub.
3. Envía un Pull Request siguiendo la estructura solicitada.
