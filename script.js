// script.js

// --- 1. DATOS DEL PORTFOLIO & COMANDOS ---

const LAST_UPDATE_DATE = "14 de Diciembre de 2025"; 

const portfolioData = {
    user: "Eduardo Olivares",
    alias: "eduolihez",
    location: "Badalona, Barcelona",
    role: "Técnico de Sistemas, SysAdmin & Ciberseguridad",
    summary: "Técnico de Sistemas con experiencia en Soporte IT Nivel 1 y 2. Enfocado en Ciberseguridad (SecOps) y automatización con Python. Logré una reducción de más del 15% en los tiempos de respuesta de tickets (SLA).", 
    skills: {
        'Desarrollo & Scripting': [
            'Python (Automatización, TDD, APIs)', 
            'JavaScript (Frontend, DOM)', 
            'PHP (Backend, MVC)', 
            'Bash (Scripting y SysAdmin)', 
            'HTML5 / CSS3 (Diseño Responsivo)'
        ],
        'Sistemas & Infraestructura': [
            'Linux Server (Admin, SSH, LAMP)', 
            'Windows Server (Active Directory, GPOs)', 
            'MySQL (Bases de Datos, Queries)',
            'Git (Control de Versiones, CI/CD Básico)'
        ],
        'IoT & Hardware': [
            'Raspberry Pi (Home Lab, Servidor Local)', 
            'Arduino (Robótica Básica)'
        ]
    },
    certs: [ 
        { name: "IT Specialist: Python Programming", link: "https://www.credly.com/badges/6ea9eebb-bf6b-4369-82ee-845195fc8652/public_url" },
        { name: "IC3 Digital Literacy", link: "https://www.credly.com/badges/cc7885f6-f69b-473a-ab89-e3a07f7a49a3/public_url" },
        { name: "B2 First Certificate (Cambridge)", link: "src/First_Certificate.jpg" }
    ],
    projects: [
        { 
            id: 1, 
            slug: "mes-badalona", 
            title: "Més Badalona", 
            desc: "Plataforma de reporte de incidencias ciudadanas.", 
            longDesc: "Plataforma completa de participación ciudadana diseñada para permitir a los usuarios reportar incidencias (baches, problemas de iluminación, etc.) en su área. Incluye un backend robusto basado en PHP para la gestión de la base de datos MySQL, un sistema de autenticación de administradores, y paneles para visualizar estadísticas de reportes en tiempo real. **Arquitectura:** Cliente/Servidor, API RESTful.",
            tags: "PHP, MySQL, HTML, CSS", 
            link: "https://mesbadalona.eduolihez.com", 
            repo: "N/A" 
        }, 
        { 
            id: 2, 
            slug: "followguard", 
            title: "FollowGuard", 
            desc: "Herramienta de análisis y gestión de comunidad en Instagram.", 
            longDesc: "Aplicación de análisis social enfocada en Instagram. Su principal funcionalidad es identificar 'unfollowers' y proporcionar métricas avanzadas sobre el crecimiento y la interacción de la comunidad. El proyecto maneja grandes volúmenes de datos a través de APIs, y está desarrollado en dos versiones (Standard y Orion) para demostrar diferentes enfoques de diseño y rendimiento.",
            tags: "API, Analytics, Seguridad, JS", 
            link: "https://followguard.eduolihez.com", 
            repo: "N/A" 
        }, 
        { 
            id: 3, 
            slug: "passwd-centinel", 
            title: "Passwd Centinel", 
            desc: "Extensión de Chrome para auditoría de contraseñas.", 
            longDesc: "Extensión ligera para el navegador Google Chrome con foco en la ciberseguridad personal. Realiza una auditoría local de las contraseñas guardadas para detectar patrones débiles o repeticiones, y ofrece consejos de seguridad en tiempo real. Utiliza las API de Chrome para la gestión de datos sensibles, asegurando que la información nunca salga del dispositivo del usuario.",
            tags: "JS, Sec, Chrome API", 
            link: "https://passwdcentinel.eduolihez.com", 
            repo: "N/A" 
        },
        { 
            id: 4, 
            slug: "guardianes-digitales", 
            title: "Guardianes Digitales", 
            desc: "Curso interactivo de concienciación sobre ciberseguridad.", 
            longDesc: "Proyecto educativo diseñado para concienciar sobre las amenazas digitales comunes. El curso se estructura en 6 módulos interactivos que cubren temas desde el phishing hasta la seguridad en redes sociales. Incorpora JavaScript para la interactividad y pruebas de conocimiento, proporcionando una experiencia de aprendizaje gamificada.",
            tags: "Educación, JS, Ciberseguridad", 
            link: "https://eduolihez.com/guardianes-digitales/index.html", 
            repo: "N/A" 
        }
    ],
    cv_link: "src/Edu_Olivares_CV.pdf",
    contact: { 
        Email: "eduolihez@gmail.com",
        LinkedIn: "https://www.linkedin.com/in/eduolihez",
        GitHub: "https://github.com/eduolihez",
        Medium: "https://medium.com/@eduolihez",
        Twitter: "https://twitter.com/eduolihez" 
    }
};

const commandsList = [
    { command: 'whoami', desc: 'Muestra mi perfil, rol y experiencia.' },
    { command: 'skills', desc: 'Lista mi stack tecnológico. (Soporta | grep)' },
    { command: 'projects', desc: 'Muestra mis proyectos. (Soporta | grep y -i <id>)' },
    { command: 'certs', desc: 'Muestra mis certificaciones y logros.' },
    { command: 'contact', desc: 'Muestra mis redes sociales y email de contacto.' },
    { command: 'cv', desc: 'Descarga/Ver CV (PDF).' }, 
    { command: 'help', desc: 'Muestra este manual de comandos.' },
    { command: 'clear', desc: 'Limpia la pantalla.' },
];
const validCommands = commandsList.map(c => c.command);


// --- 2. LÓGICA DEL TERMINAL & ESTADO ---

const input = document.getElementById('command-input');
const output = document.getElementById('output');
const terminal = document.getElementById('terminal'); 
const sidebar = document.getElementById('sidebar'); 
const promptElement = document.getElementById('prompt');

// Elementos de Audio
const soundKey = document.getElementById('sound-key');
const soundSuccess = document.getElementById('sound-success');
const soundError = document.getElementById('sound-error');

// Estilo de Error
const ERROR_STYLE = `style="color:var(--color-error, #ff3232); font-weight: bold;"`;


// Estado y Persistencia
let history = [];
let historyIndex = -1;
const HISTORY_STORAGE_KEY = 'terminalHistory';

// Nuevo: Elementos del Modal
const modalOverlay = document.getElementById('disclaimer-modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalContentDiv = document.getElementById('modal-content');
const btnVisitOfficial = document.getElementById('visit-official');
const btnCloseModal = document.getElementById('close-modal');


function updatePrompt() {
    promptElement.innerHTML = `eduolihez@github:~$ `; 
}

function loadHistory() {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
        history = JSON.parse(storedHistory);
    }
}

function saveHistory() {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function playSound(soundElement) {
    if (soundElement) {
        soundElement.currentTime = 0; 
        soundElement.play().catch(e => {}); 
    }
}

/**
 * Muestra el modal de advertencia al inicio. Usa sessionStorage para mostrarlo solo una vez por sesión.
 */
function showDisclaimerModal() {
    if (sessionStorage.getItem('disclaimerSeen')) {
        input.focus();
        return;
    }

    // 1. Rellenar contenido con formato
    modalTitle.textContent = "¡Atención! Portfolio Temático";

    let contentHtml = `
        <p>Este es el *Portfolio Temático de Terminal* de Eduardo Olivares, diseñado para mostrar habilidades de SysAdmin y scripting.</p>
        <p>El **portfolio oficial y más actualizado** está en: <a href="https://eduolihez.com" target="_blank" class="command-link">eduolihez.com</a></p>
        <p>Esta versión *puede estar desactualizada o incompleta*.</p>
        <p>Última actualización de esta versión: **${LAST_UPDATE_DATE}**</p>
    `;
    
    modalContentDiv.innerHTML = applyTextFormatting(contentHtml);

    btnVisitOfficial.textContent = "Ir al Portfolio Oficial";
    btnCloseModal.textContent = "Ver este Portfolio (Terminal)";

    // 2. Event Listeners y Lógica
    btnVisitOfficial.onclick = () => {
        // Redirigir al portfolio oficial en la misma ventana
        window.open(`https://eduolihez.com`, '_self');
    };

    const closeModal = () => {
        modalOverlay.classList.add('hidden');
        sessionStorage.setItem('disclaimerSeen', 'true');
        input.focus();
    };
    
    btnCloseModal.onclick = closeModal;

    // Permitir cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });

    // 3. Mostrar modal
    modalOverlay.classList.remove('hidden');
    btnCloseModal.focus(); 
}


document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    showDisclaimerModal(); 
    updatePrompt();
    printWelcomeMessage();
    renderSidebarMenu(); 
    // El foco se maneja dentro de showDisclaimerModal
});


function getCandidates(parts, lastPart) {
    const isFirstWord = parts.length === 1 && lastPart;
    let candidates = [];

    if (isFirstWord) {
        candidates = validCommands.filter(cmd => cmd.startsWith(lastPart));
    } 
    return candidates;
}


input.addEventListener('keydown', (e) => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Tab') {
        playSound(soundKey);
    }

    if (e.key === 'Enter') {
        const command = input.value.trim();
        if (command) {
            executeCommand(command);
            history.unshift(command);
            saveHistory(); 
            historyIndex = -1; 
        }
        input.value = '';
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateHistory(1);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateHistory(-1);
    } else if (e.key === 'Tab') { 
        e.preventDefault();
        const inputVal = input.value;
        const parts = inputVal.split(/\s+/);
        const lastPart = parts[parts.length - 1].toLowerCase();
        
        const candidates = getCandidates(parts, lastPart);

        if (candidates.length === 1) {
            const completedPart = candidates[0];
            input.value = completedPart + ' '; 
        } else if (candidates.length > 1) {
            const matchesText = `<span style="color:var(--color-link);">Múltiples coincidencias:</span>\n` + candidates.join('\t');
            
            const commandLine = document.createElement('div');
            commandLine.innerHTML = `<span id="prompt">${promptElement.innerHTML}</span>${inputVal}`;
            output.appendChild(commandLine);
            
            const result = document.createElement('div');
            result.classList.add('output-section');
            result.innerHTML = matchesText.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;'); 
            output.appendChild(result);
            
            terminal.scrollTop = terminal.scrollHeight;
            input.focus(); 
        }
    }
});

function navigateHistory(direction) {
    if (history.length === 0) return;

    historyIndex = Math.min(history.length - 1, Math.max(-1, historyIndex + direction));

    if (historyIndex === -1) {
        input.value = ''; 
    } else {
        input.value = history[historyIndex];
    }
}


function typeOut(targetElement, text) {
    return new Promise(resolve => {
        let i = 0;
        const speed = 15; 
        
        const lines = text.split('\n');
        
        function writeLine() {
            if (i < lines.length) {
                const line = lines[i];
                let j = 0;
                
                const lineSpan = document.createElement('span');
                targetElement.appendChild(lineSpan);
                targetElement.appendChild(document.createElement('br')); 

                const interval = setInterval(() => {
                    if (j < line.length) {
                        lineSpan.textContent += line.charAt(j);
                        terminal.scrollTop = terminal.scrollHeight;
                        j++;
                    } else {
                        clearInterval(interval);
                        i++;
                        writeLine(); 
                    }
                }, speed);
            } else {
                resolve(); 
            }
        }
        writeLine();
    });
}


function applyGrep(content, term) {
    if (!term) return content;
    
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => 
        line.toLowerCase().includes(term.toLowerCase())
    );

    if (filteredLines.length === 0) {
        playSound(soundError);
        return createErrorOutput(
            `No se encontraron coincidencias para la búsqueda "${term}".`,
            `La búsqueda de GREP no arrojó resultados en el contenido.`
        );
    }
    
    return `<span style="color:var(--color-link);">(Filtro: grep "${term}")</span>\n` + filteredLines.join('\n');
}

/**
 * Función auxiliar para generar bloques de error consistentes y bien espaciados.
 */
function createErrorOutput(errorTitle, errorHint = '') {
    let output = `<span ${ERROR_STYLE}>ERROR: ${errorTitle}`;
    
    if (errorHint) {
        output += `\n\n>> ${errorHint}`;
    }
    output += `</span>`;
    return output;
}


function applyTextFormatting(text) {
    // 1. Bold: **TEXTO** -> <span class="bold-style">TEXTO</span>
    text = text.replace(/\*\*(.*?)\*\*/g, '<span class="bold-style">$1</span>');

    // 2. Italic: *TEXTO* -> <span class="italic-style">$1</span>
    text = text.replace(/\*(.*?)\*/g, '<span class="italic-style">$1</span>');
    
    return text;
}


async function executeCommand(command) {
    // 1. Preparación para Grep
    const grepIndex = command.indexOf('| grep ');
    let grepTerm = '';
    let baseCommand = command.trim();

    if (grepIndex !== -1) {
        baseCommand = command.substring(0, grepIndex).trim();
        grepTerm = command.substring(grepIndex + 7).trim().toLowerCase().replace(/['"]/g, '');
    }

    // 2. Mostrar el comando introducido
    const commandLine = document.createElement('div');
    commandLine.innerHTML = `<span id="prompt">${promptElement.innerHTML}</span>${command}`;
    output.appendChild(commandLine);

    // 3. Procesamiento del comando
    const baseParts = baseCommand.toLowerCase().split(/\s+/);
    const mainCommand = baseParts[0];
    const args = baseParts.slice(1);
    let outputContent = '';
    let commandSuccess = true;

    const result = document.createElement('div');
    result.classList.add('output-section');
    output.appendChild(result);

    switch (mainCommand) {
        case 'whoami':
            outputContent = renderWhoami();
            break;
        case 'skills':
            outputContent = renderSkills();
            break;
        case 'projects':
            if (args[0] === '-i' && args[1]) {
                outputContent = renderProjectDetails(args[1]);
                if (outputContent.includes('ERROR:')) commandSuccess = false;
            } else if (args.length > 0) {
                outputContent = createErrorOutput(
                    `Argumento desconocido para projects: ${args.join(' ')}`,
                    `Argumentos válidos: '-i <id>' (Ver detalles del proyecto).`
                );
                commandSuccess = false;
            } else {
                outputContent = renderProjects();
            }
            break;
        case 'certs':
            outputContent = renderCerts();
            break;
        case 'contact':
            outputContent = renderContact();
            break;
        case 'cv':
            outputContent = renderCV();
            break;
        case 'help':
            outputContent = renderHelp(); 
            break;
        case 'clear':
            output.innerHTML = '';
            printWelcomeMessage(false); 
            terminal.scrollTop = terminal.scrollHeight;
            return; 
        case '': 
            outputContent = '';
            commandSuccess = true;
            break;
        default:
            outputContent = createErrorOutput(
                `Comando no encontrado: ${mainCommand}`,
                `Comandos disponibles en el menú lateral. Escribe 'help'.`
            );
            commandSuccess = false;
    }

    // 4. Aplicar formato de texto (Bold/Italic)
    outputContent = applyTextFormatting(outputContent);
    
    // 5. Aplicar Grep (si aplica)
    if (grepTerm) {
        const contentWithoutHtml = outputContent.replace(/<a[^>]*>.*?<\/a>/g, '').replace(/<[^>]*>/g, '');
        const filtered = applyGrep(contentWithoutHtml, grepTerm); 
        
        if (filtered.includes('ERROR:')) {
            outputContent = filtered;
            commandSuccess = false;
        } else {
            outputContent = filtered;
        }
    }
    
    // 6. Animación y Renderizado
    const isSimpleText = !/<a|<span class="command-title">/i.test(outputContent); 

    if (outputContent) {
        if (isSimpleText && outputContent.length < 500 && !grepTerm && !outputContent.includes('ERROR:')) { 
            await typeOut(result, outputContent);
        } else {
            result.innerHTML = outputContent.replace(/\n/g, '<br>');
        }
    }
    
    // 7. Sonido de Resultado
    if (commandSuccess && mainCommand !== '') {
        playSound(soundSuccess);
    } else if (!commandSuccess && mainCommand !== '') {
        playSound(soundError);
    }

    // 8. Scroll final
    updatePrompt();
    terminal.scrollTop = terminal.scrollHeight;
    input.focus(); 
}

// --- 4. FUNCIONES DE RENDERIZADO MEJORADAS ---

function renderSidebarMenu() {
    if (!sidebar) return;

    let menuHtml = '<span class="menu-title">Manual de Comandos (help)</span>';
    
    commandsList.forEach(cmd => {
        menuHtml += `<div class="menu-item">`;
        menuHtml += `<span class="menu-command">${cmd.command}</span>`;
        menuHtml += `<br>${cmd.desc}`;
        menuHtml += `</div>`;
    });
    
    sidebar.innerHTML = menuHtml;
}

function printWelcomeMessage(showTip = true) {
    const promptColor = `style="color:var(--color-prompt);"`;
    const titleColor = `style="color:var(--color-title);"`;
    
    let welcome = `
<span ${titleColor}>//============================================\\</span>
<span ${titleColor}>| ${portfolioData.user} | Terminal Portfolio v4.1 |</span>
<span ${titleColor}>\\============================================//</span>

<span ${promptColor}>${portfolioData.role}</span>
Ubicación: ${portfolioData.location}

Escribe un comando para empezar.
La lista completa está en el menú lateral o escribe '<span ${promptColor}>help</span>'.
${showTip ? `Tip: Usa flecha Arriba/Abajo para navegar por el historial.` : ''}
`;
    const welcomeDiv = document.createElement('div');
    welcomeDiv.innerHTML = welcome.replace(/\n/g, '<br>'); 
    output.appendChild(welcomeDiv);
}

function renderHelp() {
    return `
<span class="command-title">Ayuda</span>
-----------------------------------
La lista completa de comandos está visible en el panel lateral derecho.

Comandos de Información:
\t- whoami:\tPerfil profesional y resumen.
\t- skills:\tListado de tecnologías y stack.
\t- projects:\tProyectos destacados.
\t- certs:\tCertificaciones obtenidas.
\t- contact:\tEnlaces a redes y email.
\t- cv:\t\tDescarga tu CV (PDF).

Funcionalidades Avanzadas:
\t- FILTRO GREP:\tskills | grep Python
\t- DETALLES:\tprojects -i <ID>
`;
}

function renderCV() {
    return `
<span class="command-title">Curriculum Vitae</span>
-----------------------------------
Descargando CV...

Enlace:\t<a href="${portfolioData.cv_link}" target="_blank" class="command-link">${portfolioData.cv_link}</a>
`;
}

function renderProjectDetails(id) {
    const project = portfolioData.projects.find(p => p.id == id || p.slug === id);
    if (!project) {
        return createErrorOutput(
            `Proyecto ID o slug no encontrado.`,
            `Por favor, usa 'projects' para listar los IDs válidos.`
        );
    }

    const linkHtml = `<a href="${project.link}" target="_blank" class="command-link">${project.link}</a>`;

    return `
<span class="command-title">Detalles del Proyecto: ${project.title}</span>
-----------------------------------
Título:\t\t**${project.title}**
Descripción:\t${project.longDesc}

<span class="command-title">Ficha Técnica</span>
-----------------------------------
Stack Principal:\t*${project.tags}*
URL del Proyecto:\t${linkHtml}
`;
}

function renderWhoami() {
    return `
<span class="command-title">Perfil: ${portfolioData.user}</span>
-----------------------------------
**Nombre:**\t${portfolioData.user}
**Alias:**\t${portfolioData.alias}
**Rol Principal:**\t**${portfolioData.role}**
**Ubicación:**\t${portfolioData.location}

<span class="command-title">Resumen Profesional</span>
-----------------------------------
${portfolioData.summary}

<span class="command-title">Logros Destacados (KPI)</span>
-----------------------------------
>> **Reducción de >15% en SLA** (*Tiempo de respuesta*)
>> **Liderazgo y Soporte** a >100 usuarios
>> **4 certificaciones** completadas en el *último año*
`;
}

function renderSkills() {
    let outputHtml = '<span class="command-title">Stack Tecnológico (skills)</span>\n-----------------------------------';
    
    for (const category in portfolioData.skills) {
        outputHtml += `\n\n<span style="color:var(--color-title);font-weight:bold;">[ ${category.toUpperCase()} ]</span>`;
        portfolioData.skills[category].forEach(skill => {
            outputHtml += `\n\t-- **${skill.split('(')[0].trim()}** (*${skill.split('(')[1].replace(')', '').trim()}*)`;
        });
    }

    return outputHtml;
}

function renderProjects() {
    let outputHtml = '<span class="command-title">Proyectos Destacados (projects)</span>\n-----------------------------------';

    portfolioData.projects.forEach(p => {
        const linkHtml = `<a href="${p.link}" target="_blank" class="command-link">${p.link}</a>`;
        outputHtml += `\n\n[ ID: ${p.id} ] - **${p.title}**`;
        outputHtml += `\n\tDescripción:\t${p.desc}`; 
        outputHtml += `\n\tStack:\t\t*${p.tags}*`;    
        outputHtml += `\n\tEnlace:\t\t${linkHtml}`;
        outputHtml += `\n\t(Detalles: projects -i ${p.id})`; 
    });
    
    return outputHtml;
}

function renderCerts() {
    let outputHtml = '<span class="command-title">Certificaciones (certs)</span>\n-----------------------------------';
    
    portfolioData.certs.forEach(cert => {
        const linkHtml = `<a href="${cert.link}" target="_blank" class="command-link">Ver Credencial</a>`;
        outputHtml += `\n>> **${cert.name}**`;
        outputHtml += `\n\tEnlace:\t${linkHtml}`; 
    });

    return outputHtml;
}

function renderContact() {
    let outputHtml = '<span class="command-title">Contacto (contact)</span>\n-----------------------------------';
    
    outputHtml += '\n**¡Siempre abierto a conectar y discutir nuevas oportunidades!**';
    outputHtml += '\n\n**Opciones de Contacto Directo:**';
    
    for (const platform in portfolioData.contact) {
        const link = portfolioData.contact[platform];
        const url = platform === 'Email' ? `mailto:${link}` : link;
        const linkHtml = `<a href="${url}" target="_blank" class="command-link">${link}</a>`;
        
        const platformDisplay = platform.padEnd(10, ' ');
        
        outputHtml += `\n\t>> **${platformDisplay}**:\t${linkHtml}`;
    }
    
    outputHtml += '\n\n*Nota: Para solicitar el CV directamente, usa el comando "cv".*';

    return outputHtml;
}