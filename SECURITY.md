# 🛡️ Política de Seguridad (Security Policy)

## Versiones Soportadas

Actualmente, solo se proporciona soporte de seguridad para la última versión activa de la rama principal (`main` o `master`).

| Versión | Soportada |
| ------- | --------- |
| < 1.0.0 | No        |
| >= 1.0.0| Sí        |

---

## Reportar una Vulnerabilidad

Dado que **Blue Team Hub** es un sitio web de herramientas estáticas ejecutadas en el cliente, el principal vector de riesgo de seguridad consistiría en:
* Vulnerabilidades de **Cross-Site Scripting (XSS)** debido a un manejo inseguro de la entrada del usuario en las herramientas de parseo o desofuscación.
* Exposición accidental de datos sensibles si alguna dependencia externa hiciera peticiones de red inesperadas.

Si descubres alguna vulnerabilidad o comportamiento sospechoso en la seguridad del sitio:

1. **No abras un Issue público** para evitar la divulgación prematura de la vulnerabilidad.
2. Contacta directamente a través del formulario de contacto o detalles especificados en [eduolihez.com](https://eduolihez.com).
3. Alternativamente, puedes enviar un reporte de vulnerabilidad privado a través de las herramientas de seguridad nativas del repositorio en GitHub (si están habilitadas para el repositorio).

Se acusará recibo del reporte en un plazo de 48-72 horas y se trabajará en la resolución lo antes posible.
