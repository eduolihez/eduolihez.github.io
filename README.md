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
* **Descripción**: Permite desarmar (defang) e higienizar direcciones IP, URLs y correos electrónicos, o extraer IOCs (hashes MD5/SHA256, correos, IPs, URLs) de texto sucio. Toda la lógica se ejecuta localmente en el navegador.

---

## 📁 Estructura del Repositorio

```text
├── src/
│   ├── components/       # Componentes globales (Header, Footer)
│   ├── layouts/          # Layout base del sitio con efectos de fondo y tipografías
│   ├── pages/            # Enrutamiento de páginas (Astro)
│   │   ├── index.astro   # Página de inicio del portal (Dashboard)
│   │   └── tools/        # Herramientas individuales
│   │       └── defanger.astro # IOC Defanger & Extractor
│   └── styles/
│       └── global.css    # Hoja de estilos global e importación de Tailwind CSS
├── public/               # Recursos estáticos públicos (imágenes, favicon)
├── .github/              # Configuraciones de GitHub (workflows, templates)
├── astro.config.mjs      # Configuración de Astro e integraciones
├── package.json          # Archivo de dependencias y scripts de Node.js
└── tailwind.config.mjs   # Configuración de diseño y estilos de Tailwind
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
