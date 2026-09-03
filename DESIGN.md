# Design System — Blue Team Hub

## Product Context
- **What this is:** Portal estático de herramientas de ciberseguridad (Astro + Tailwind CSS 4), 100% client-side.
- **Who it's for:** Analistas SOC, threat hunters, profesionales de Blue Team.
- **Space/industry:** Ciberseguridad / herramientas técnicas para operaciones de seguridad.
- **Project type:** Marketing + herramientas embebidas (dashboard-ligero híbrido con landing).
- **Lo único que debe recordarse:** rápido y sin fricción — entras, resuelves, sales.

## Aesthetic Direction
- **Direction:** Minimalismo suizo/internacional — blanco, negro, retícula estricta, un único rojo de acento reservado para lo urgente.
- **Decoration level:** minimal — tipografía y retícula hacen todo el trabajo. Sin glassmorphism, sin blur, sin gradientes, sin sombras.
- **Mood:** Informe técnico serio, no demo de producto SaaS. Claridad y velocidad de lectura ante todo.
- **Reference sites:** linear.app (disciplina tipográfica), greynoise.io (datos en monoespaciada como elemento visual principal) — usadas como investigación de referencia, no como calco directo.
- **Decisión de producto (no solo visual):** KEV Watch deja de ser una página de herramienta separada y se integra directamente en la portada (`/`), como una sección más de la landing. Mantener `/tools/kev-watch` como redirección a la sección embebida para no romper enlaces existentes.

## Typography
- **Display/Hero:** Geist (weight 700) — sans geométrico neutro, sin servir de "familia decorativa"; el minimalismo se refuerza usando UNA sola familia en toda la marca.
- **Body:** Geist (weight 400/500) — misma familia que el display, deliberado: cero pareo de fuentes.
- **UI/Labels:** Geist, mismos pesos que body.
- **Data/Tables:** Geist Mono, tabular-nums — requisito funcional para CVEs, hashes, IOCs, reglas YARA.
- **Code:** Geist Mono.
- **Loading:** Google Fonts — `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap`
- **Scale:** hero clamp(2.5rem, 6.2vw, 4.6rem) / h2 1.7rem / stat-number clamp(1.9rem, 4vw, 2.7rem) / body 1rem / small .82-.9rem / micro .68-.78rem

## Color
- **Approach:** restrained — blanco, negro y un único acento rojo. Nada de paleta expresiva.
- **Paper (fondo):** `#FDFDFB` — blanco cálido elegido, no `#FFFFFF` puro.
- **Ink (texto/elementos):** `#0B0B0A`
- **Ink soft (texto secundario fuerte):** `#3A3936`
- **Muted (texto terciario):** `#807E77`
- **Muted dim (texto cuaternario, timestamps):** `#AFACA3`
- **Rule (líneas estructurales fuertes):** `#0B0B0A` (2px, separadores de sección principales)
- **Rule faint (líneas de tabla/lista):** `#DEDCD4`
- **Stamp / urgente (único acento):** `#C1291B` — SOLO para: CVE crítico, flag de ransomware, plazos vencidos. Nunca decorativo, nunca como color de marca/CTA genérico.
- **Stamp tint (fondo de badge urgente):** `#FBEAE7`
- **En línea / éxito:** `#3E6B4F` — indicador "actualizado hace X" y estados resueltos.
- **Dark mode:** fuera de alcance de esta iteración — el sistema se diseñó deliberadamente como mundo único claro (ver nota de tema único en la sección Motion). Si se pide dark mode más adelante, no invertir mecánicamente: rediseñar superficies manteniendo blanco/negro/rojo como base conceptual.

## Spacing
- **Base unit:** 8px
- **Density:** híbrida — compacta en tablas de datos (KEV Watch, listas de herramientas), generosa en el masthead/hero.
- **Scale:** 2xs(4) xs(8) sm(12) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** grid-disciplinado — retícula estricta, alineación predecible, secciones numeradas (`01 —`, `02 —`, `03 —`) porque el contenido SÍ es una secuencia real (índice de herramientas → herramienta en vivo → especificación).
- **Max content width:** 1040px
- **Border radius:** 0 en casi todo — bloques rectangulares, líneas finas en vez de sombras/blur. Excepción única: `pip` de estado "en línea" (círculo, 6px).
- **Estructura de página (home):** masthead → franja de 3 estadísticas → 01 Herramientas (índice numerado, la entrada de KEV Watch apunta a un ancla en la misma página en vez de una URL externa) → 02 KEV Watch (tabla de CVEs embebida en línea, misma tipografía/retícula que el resto) → 03 Especificación (paleta + tipografía, estilo colofón de informe).

## Motion
- **Approach:** minimal-functional. Un solo momento de firma: el titular del hero se subraya con una línea negra que se traza al cargar (`scaleX` 0→1, ~0.9s, `cubic-bezier(.65,0,.15,1)`), respetando `prefers-reduced-motion`.
- **Easing:** enter `cubic-bezier(.2,.7,.2,1)` / trace `cubic-bezier(.65,0,.15,1)`
- **Duration:** micro (pip pulse, si se añade) 800-1200ms loop / entrada de secciones 600-900ms / trace del hero ~900ms

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-03 | Descartada la propuesta "industrial/terminal" (mono en titulares, ámbar) | El usuario la sintió como cliché hacker; no encajaba con el tono deseado. |
| 2026-09-03 | Descartada la propuesta "editorial refinado" (tinta cálida, serif Fraunces, rojo-sello sobre fondo oscuro) | El usuario pidió minimalismo explícito en blanco y negro en su lugar. |
| 2026-09-03 | Aprobada dirección "minimalismo suizo B/N + rojo único" | Coincide con "rápido y sin fricción": sin decoración que compita con la lectura de datos. |
| 2026-09-03 | KEV Watch se integra en la portada en vez de vivir solo en `/tools/kev-watch` | Petición explícita del usuario: no quiere que se sienta como una app externa/separada. |
