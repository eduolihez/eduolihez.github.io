// ========== VARIABLES GLOBALES Y ESTADO ==========
let database = { infieles: [] };
let appState = {
    currentView: 'none',
    filteredData: [],
    currentPage: 1,
    itemsPerPage: window.innerWidth <= 768 ? 5 : 10,
    filters: {
        search: '',
        provincia: '',
        minAge: null,
        maxAge: null,
        hasProof: ''
    },
    provinces: [
        "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", 
        "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", 
        "Gijón", "Hospitalet", "La Coruña", "Granada", "Vitoria", "Elche", "Oviedo", 
        "Santa Cruz", "Badalona", "Cartagena", "Sabadell", "Jerez", "Móstoles",
        "Tarragona", "Almería", "Burgos", "Salamanca", "Albacete", "Getafe", "Marbella",
        "León", "San Sebastián", "Castellón", "Logroño", "Badajoz", "Huelva", "Cádiz",
        "Santander", "Jaén", "Lleida", "Ourense", "Algeciras", "Toledo", "Guadalajara"
    ],
    stats: {
        totalRegistros: 0,
        conPruebas: 0,
        sinPruebas: 0,
        verificado: 0,
        noVerificado: 0,
        edadPromedio: 0,
        porEdades: { "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 },
        porProvincia: {}
    }
};

// Variables para gráficos
let provinceChart = null;
let ageChart = null;

// ========== FUNCIONES DE OPTIMIZACIÓN ==========
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== FUNCIONES PRINCIPALES ==========
async function loadDatabase() {
    try {
        const response = await fetch('database.json');
        if (!response.ok) throw new Error('Error al cargar la base de datos');
        database = await response.json();
        console.log('Base de datos cargada:', database.infieles.length, 'registros');
        initApp();
    } catch (error) {
        console.error('Error:', error);
        database.infieles = getSampleData();
        initApp();
        showNotification('Error cargando la base de datos. Se están usando datos de ejemplo.', 'error');
    }
}

function getSampleData() {
    return [
        {
            "id": 1,
            "nombre": "Ejemplo",
            "apellidos": "Usuario",
            "edad": 25,
            "provincia": "Madrid",
            "redesSociales": [
                { "tipo": "instagram", "usuario": "@ejemplo", "principal": true }
            ],
            "tienePruebas": true,
            "pruebasDescripcion": "Capturas de pantalla de conversaciones",
            "fechaRegistro": "2025-11-01",
            "fechaActualizacion": "2025-11-01",
            "verificado": true
        },
        {
            "id": 2,
            "nombre": "Otro",
            "apellidos": "Ejemplo",
            "edad": 32,
            "provincia": "Barcelona",
            "redesSociales": [
                { "tipo": "instagram", "usuario": "@otroejemplo", "principal": true }
            ],
            "tienePruebas": false,
            "pruebasDescripcion": "",
            "fechaRegistro": "2025-10-15",
            "fechaActualizacion": "2025-10-15",
            "verificado": false
        }
    ];
}

function initApp() {
    // Inicializar Select2
    if ($('.select2').length) {
        $('.select2').select2({
            placeholder: "Selecciona una provincia",
            allowClear: true,
            width: '100%'
        }).on('select2:open', () => {
            // Ajustar para móviles
            if (window.innerWidth <= 768) {
                $('.select2-container').css('position', 'fixed');
                $('.select2-dropdown').css('position', 'fixed');
            }
        }).on('select2:close', () => {
            if (window.innerWidth <= 768) {
                $('.select2-container').css('position', 'absolute');
                $('.select2-dropdown').css('position', 'absolute');
            }
        });
    }

    loadProvinces();
    setupEventListeners();
    calculateStatistics();
    showSection('database');
    adjustForTouch();
    setupLazyLoading();
    
    // Detectar modo oscuro inicial
    detectDarkMode();
}

function loadProvinces() {
    const provinceFilter = document.getElementById('provinceFilter');
    if (!provinceFilter) return;
    
    // Limpiar opciones excepto la primera
    while (provinceFilter.options.length > 1) {
        provinceFilter.remove(1);
    }
    
    // Obtener provincias únicas de los datos
    const provinciasUnicas = [...new Set(database.infieles.map(p => p.provincia))].sort();
    provinciasUnicas.forEach(provincia => {
        const option = document.createElement('option');
        option.value = provincia;
        option.textContent = provincia;
        provinceFilter.appendChild(option);
    });
    
    // Actualizar Select2 si está inicializado
    if ($(provinceFilter).hasClass('select2')) {
        $(provinceFilter).trigger('change');
    }
}

function setupEventListeners() {
    // Botones principales
    document.getElementById('viewDatabaseBtn').addEventListener('click', () => showSection('database'));
    document.getElementById('addPersonBtn').addEventListener('click', () => showSection('add'));
    document.getElementById('statsBtn').addEventListener('click', () => showSection('stats'));

    // Filtros con debounce
    document.getElementById('searchInput').addEventListener('input', debounce((e) => {
        appState.filters.search = e.target.value.toLowerCase();
        applyFilters();
    }, 300));

    document.getElementById('provinceFilter').addEventListener('change', (e) => {
        appState.filters.provincia = e.target.value;
        applyFilters();
    });

    document.getElementById('minAge').addEventListener('change', (e) => {
        const value = e.target.value;
        appState.filters.minAge = value ? parseInt(value) : null;
        if (appState.filters.minAge && appState.filters.maxAge && appState.filters.minAge > appState.filters.maxAge) {
            appState.filters.maxAge = appState.filters.minAge;
            document.getElementById('maxAge').value = appState.filters.minAge;
        }
        applyFilters();
    });

    document.getElementById('maxAge').addEventListener('change', (e) => {
        const value = e.target.value;
        appState.filters.maxAge = value ? parseInt(value) : null;
        if (appState.filters.minAge && appState.filters.maxAge && appState.filters.maxAge < appState.filters.minAge) {
            appState.filters.minAge = appState.filters.maxAge;
            document.getElementById('minAge').value = appState.filters.maxAge;
        }
        applyFilters();
    });

    document.getElementById('proofFilter').addEventListener('change', (e) => {
        appState.filters.hasProof = e.target.value;
        applyFilters();
    });

    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Paginación
    document.getElementById('prevPage').addEventListener('click', prevPage);
    document.getElementById('nextPage').addEventListener('click', nextPage);

    // Copiar plantilla de Instagram
    document.getElementById('copyTemplate').addEventListener('click', copyTemplate);

    // Enlaces del footer
    document.querySelectorAll('.view-db').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('database');
        });
    });

    document.querySelectorAll('.report').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('add');
        });
    });

    document.querySelectorAll('.stats').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('stats');
        });
    });

    document.querySelectorAll('.legal').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const type = e.target.dataset.type || e.target.closest('.legal').dataset.type;
            showLegalModal(type);
        });
    });

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Resize y orientación
    window.addEventListener('resize', throttle(handleResize, 250));
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Escuchar cambios en modo oscuro
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectDarkMode);
}

function handleResize() {
    appState.itemsPerPage = window.innerWidth <= 768 ? 5 : 10;
    if (appState.currentView === 'database') {
        applyFilters();
    }
    if (appState.currentView === 'stats' && window.innerWidth > 768) {
        resizeCharts();
    }
}

function handleOrientationChange() {
    setTimeout(() => {
        appState.itemsPerPage = window.innerWidth <= 768 ? 5 : 10;
        if (appState.currentView === 'database') {
            applyFilters();
        }
        if (appState.currentView === 'stats') {
            resizeCharts();
        }
    }, 300);
}

function showSection(section) {
    document.querySelectorAll('.main-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.classList.add('hidden');
            el.style.opacity = '';
            el.style.transform = '';
        }, 50);
    });
    
    setTimeout(() => {
        const targetSection = document.getElementById(section + 'Section');
        if (targetSection) {
            targetSection.classList.remove('hidden');
            requestAnimationFrame(() => {
                targetSection.style.opacity = '1';
                targetSection.style.transform = 'translateY(0)';
            });
        }
        
        appState.currentView = section;
        
        if (section === 'database') {
            applyFilters();
        } else if (section === 'stats') {
            calculateStatistics();
            updateStatisticsDisplay();
            setTimeout(() => {
                detectDarkMode(); // Aplicar modo oscuro antes de renderizar gráficos
                renderCharts();
            }, 100);
        }
    }, 100);
}

function applyFilters() {
    let filtered = [...database.infieles];

    // Filtrar por búsqueda
    if (appState.filters.search) {
        const searchTerm = appState.filters.search.toLowerCase();
        filtered = filtered.filter(persona => 
            persona.nombre.toLowerCase().includes(searchTerm) ||
            persona.apellidos.toLowerCase().includes(searchTerm) ||
            persona.redesSociales.some(red => red.usuario.toLowerCase().includes(searchTerm)) ||
            persona.provincia.toLowerCase().includes(searchTerm)
        );
    }

    // Filtrar por provincia
    if (appState.filters.provincia) {
        filtered = filtered.filter(persona => 
            persona.provincia === appState.filters.provincia
        );
    }

    // Filtrar por edad
    if (appState.filters.minAge) {
        filtered = filtered.filter(persona => persona.edad >= appState.filters.minAge);
    }
    if (appState.filters.maxAge) {
        filtered = filtered.filter(persona => persona.edad <= appState.filters.maxAge);
    }

    // Filtrar por estado de verificación
    if (appState.filters.hasProof === 'true') {
        filtered = filtered.filter(persona => persona.verificado);
    } else if (appState.filters.hasProof === 'false') {
        filtered = filtered.filter(persona => !persona.verificado);
    }

    appState.filteredData = filtered;
    appState.currentPage = 1;
    renderDatabase();
}

function clearFilters() {
    appState.filters = {
        search: '',
        provincia: '',
        minAge: null,
        maxAge: null,
        hasProof: ''
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('provinceFilter').value = '';
    document.getElementById('minAge').value = '';
    document.getElementById('maxAge').value = '';
    document.getElementById('proofFilter').value = '';

    if ($('#provinceFilter').hasClass('select2')) {
        $('#provinceFilter').val(null).trigger('change');
    }

    applyFilters();
}

function renderDatabase() {
    const tbody = document.getElementById('databaseBody');
    if (!tbody) return;

    const startTime = performance.now();
    const fragment = document.createDocumentFragment();
    const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
    const endIndex = startIndex + appState.itemsPerPage;
    const pageData = appState.filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 2rem; color: var(--text-secondary); margin-bottom: 10px;"></i>
                    <p>No se encontraron registros</p>
                    <button id="clearFiltersFromTable" class="btn small primary" style="margin-top: 10px;">
                        <i class="fas fa-times"></i> Limpiar filtros
                    </button>
                </td>
            </tr>
        `;
        
        document.getElementById('clearFiltersFromTable')?.addEventListener('click', clearFilters);
    } else {
        const rowsHTML = pageData.map(persona => {
            const redesHTML = persona.redesSociales.map(red => 
                `<span class="social-badge ${red.tipo}">
                    <i class="${getSocialIconClass(red.tipo)}"></i>
                    ${red.usuario}
                </span>`
            ).join('');
            
            const fecha = new Date(persona.fechaRegistro);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const personaJSON = JSON.stringify(persona).replace(/"/g, '&quot;');

            return `
                <tr onclick="showDetailsModalFromTable(${personaJSON})" tabindex="0" role="button" aria-label="Ver detalles de ${persona.nombre} ${persona.apellidos}">
                    <td>${persona.nombre} ${persona.apellidos}</td>
                    <td>${persona.edad} años</td>
                    <td>${persona.provincia}</td>
                    <td><div class="social-badges">${redesHTML}</div></td>
                    <td>
                        <span class="proof-indicator ${persona.verificado ? 'proof-yes' : 'proof-no'}">
                            <i class="fas fa-${persona.verificado ? 'check' : 'times'}"></i>
                            ${persona.verificado ? 'Verificado' : 'No verificado'}
                        </span>
                    </td>
                    <td>${fechaFormateada}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rowsHTML;
        
        // Añadir event listeners para teclado
        tbody.querySelectorAll('tr[role="button"]').forEach(row => {
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const personaData = JSON.parse(row.getAttribute('onclick').match(/showDetailsModalFromTable\(([^)]+)\)/)[1]);
                    showDetailsModalFromTable(personaData);
                }
            });
        });
    }

    document.getElementById('totalCount').textContent = database.infieles.length;
    document.getElementById('filteredCount').textContent = appState.filteredData.length;
    updatePagination();
    
    if (performance.now() - startTime > 100) {
        console.log(`Renderizado en ${Math.round(performance.now() - startTime)}ms`);
    }
}

function showDetailsModalFromTable(persona) {
    showDetailsModal(persona);
}

function getSocialIconClass(tipo) {
    switch(tipo) {
        case 'instagram': return 'fab fa-instagram';
        case 'twitter': return 'fab fa-twitter';
        case 'facebook': return 'fab fa-facebook';
        case 'tiktok': return 'fab fa-tiktok';
        default: return 'fas fa-share-alt';
    }
}

function updatePagination() {
    const totalPages = Math.ceil(appState.filteredData.length / appState.itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    pageInfo.textContent = `Página ${appState.currentPage} de ${totalPages || 1}`;
    prevBtn.disabled = appState.currentPage <= 1;
    nextBtn.disabled = appState.currentPage >= totalPages;
}

function prevPage() {
    if (appState.currentPage > 1) {
        appState.currentPage--;
        renderDatabase();
        // Scroll suave a la parte superior de la tabla en móviles
        if (window.innerWidth <= 768) {
            document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function nextPage() {
    const totalPages = Math.ceil(appState.filteredData.length / appState.itemsPerPage);
    if (appState.currentPage < totalPages) {
        appState.currentPage++;
        renderDatabase();
        // Scroll suave a la parte superior de la tabla en móviles
        if (window.innerWidth <= 768) {
            document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function calculateStatistics() {
    const infieles = database.infieles;
    
    appState.stats.totalRegistros = infieles.length;
    appState.stats.conPruebas = infieles.filter(p => p.tienePruebas).length;
    appState.stats.sinPruebas = appState.stats.totalRegistros - appState.stats.conPruebas;
    appState.stats.verificado = infieles.filter(p => p.verificado).length;
    appState.stats.noVerificado = appState.stats.totalRegistros - appState.stats.verificado;
    
    const sumaEdades = infieles.reduce((sum, p) => sum + p.edad, 0);
    appState.stats.edadPromedio = appState.stats.totalRegistros > 0 ? 
        (sumaEdades / appState.stats.totalRegistros).toFixed(1) : 0;
    
    appState.stats.porEdades = {
        "18-25": infieles.filter(p => p.edad >= 18 && p.edad <= 25).length,
        "26-35": infieles.filter(p => p.edad >= 26 && p.edad <= 35).length,
        "36-45": infieles.filter(p => p.edad >= 36 && p.edad <= 45).length,
        "46+": infieles.filter(p => p.edad >= 46).length
    };
    
    appState.stats.porProvincia = {};
    infieles.forEach(p => {
        appState.stats.porProvincia[p.provincia] = (appState.stats.porProvincia[p.provincia] || 0) + 1;
    });
}

function updateStatisticsDisplay() {
    let topProvincia = '-';
    let topProvinciaCount = 0;
    
    Object.entries(appState.stats.porProvincia).forEach(([provincia, count]) => {
        if (count > topProvinciaCount) {
            topProvincia = provincia;
            topProvinciaCount = count;
        }
    });

    document.getElementById('totalStats').textContent = appState.stats.totalRegistros;
    document.getElementById('topProvince').textContent = topProvincia;
    document.getElementById('topProvinceCount').textContent = `${topProvinciaCount} casos`;
    document.getElementById('avgAge').textContent = appState.stats.edadPromedio;
    
    const porcentajeVerificados = appState.stats.totalRegistros > 0 ? 
        ((appState.stats.verificado / appState.stats.totalRegistros) * 100).toFixed(1) : 0;
    document.getElementById('withProofs').textContent = `${porcentajeVerificados}%`;

    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    if (!activityList) return;

    const recent = [...database.infieles]
        .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
        .slice(0, 5);

    activityList.innerHTML = '';

    recent.forEach(persona => {
        const fecha = new Date(persona.fechaRegistro);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-user-plus"></i>
            </div>
            <div class="activity-content">
                <h4>${persona.nombre} ${persona.apellidos}</h4>
                <p>${persona.verificado ? 'Infiel verificado' : 'Infiel reportado'} - ${persona.provincia}</p>
                <span class="activity-time">${fechaFormateada}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

function detectDarkMode() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Añadir clase al body para facilitar estilos CSS
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
    
    // Si estamos en la sección de estadísticas, re-renderizar gráficos
    if (appState.currentView === 'stats') {
        renderCharts();
    }
}

function renderCharts() {
    // Destruir gráficos existentes
    [provinceChart, ageChart].forEach(chart => {
        if (chart && chart.destroy) chart.destroy();
    });

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Configuración de colores según modo
    const chartColors = isDarkMode ? {
        primary: 'rgba(255, 107, 107, 0.7)',
        border: 'rgba(255, 107, 107, 1)',
        background: 'rgba(255, 255, 255, 0.1)',
        text: '#e0e0e0',
        grid: 'rgba(255, 255, 255, 0.1)',
        pieColors: [
            'rgba(255, 107, 107, 0.7)',
            'rgba(67, 97, 238, 0.7)',
            'rgba(46, 204, 113, 0.7)',
            'rgba(241, 196, 15, 0.7)'
        ]
    } : {
        primary: 'rgba(220, 53, 69, 0.7)',
        border: 'rgba(220, 53, 69, 1)',
        background: 'rgba(0, 0, 0, 0.1)',
        text: '#666',
        grid: 'rgba(0, 0, 0, 0.1)',
        pieColors: [
            'rgba(220, 53, 69, 0.7)',
            'rgba(40, 167, 69, 0.7)',
            'rgba(23, 162, 184, 0.7)',
            'rgba(255, 193, 7, 0.7)'
        ]
    };

    // Distribución por provincia
    const provinciasCount = appState.stats.porProvincia;
    const provinciasSorted = Object.entries(provinciasCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const provinciaChartCtx = document.getElementById('provinceChart');
    if (provinciaChartCtx) {
        provinceChart = new Chart(provinciaChartCtx, {
            type: 'bar',
            data: {
                labels: provinciasSorted.map(p => p[0]),
                datasets: [{
                    label: 'Número de casos',
                    data: provinciasSorted.map(p => p[1]),
                    backgroundColor: chartColors.primary,
                    borderColor: chartColors.border,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: chartColors.text
                        },
                        grid: {
                            color: chartColors.grid
                        }
                    },
                    x: {
                        ticks: {
                            color: chartColors.text,
                            maxRotation: window.innerWidth <= 768 ? 45 : 0
                        },
                        grid: {
                            color: chartColors.grid
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: chartColors.text
                        }
                    }
                }
            }
        });
    }

    // Distribución por edad
    const ageChartCtx = document.getElementById('ageChart');
    if (ageChartCtx) {
        ageChart = new Chart(ageChartCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(appState.stats.porEdades),
                datasets: [{
                    data: Object.values(appState.stats.porEdades),
                    backgroundColor: chartColors.pieColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: chartColors.text,
                            padding: 20
                        }
                    }
                }
            }
        });
    }
}

function resizeCharts() {
    [provinceChart, ageChart].forEach(chart => {
        if (chart && chart.resize) chart.resize();
    });
}

function copyTemplate() {
    const template = `**REPORTE DE INFIEL - BASE DE DATOS**

**DATOS PERSONALES:**
• Nombre completo: [Nombre y apellidos]
• Edad/Año nacimiento: [Edad o año de nacimiento]
• Provincia: [Provincia de residencia]
• Instagram: [@usuario_instagram]
• Otras redes: [Twitter, Facebook, etc.]

**PRUEBAS (OPCIONAL):**
[Si tienes pruebas, descríbelas aquí. Las pruebas NO son obligatorias, pero si las envías, el reporte será marcado como VERIFICADO]

**INFORMACIÓN ADICIONAL:**
[Contexto, cómo conoces a la persona, etc.]`;

    navigator.clipboard.writeText(template).then(() => {
        showNotification('Plantilla copiada al portapapeles', 'success');
    }).catch(err => {
        console.error('Error al copiar:', err);
        showNotification('Error al copiar la plantilla', 'error');
    });
}

function showDetailsModal(persona) {
    const modal = document.getElementById('detailsModal');
    const modalDetails = document.getElementById('modalDetails');
    const modalTitle = document.getElementById('modalTitle');

    // Ajustar para móviles
    if (window.innerWidth <= 768) {
        modalDetails.style.maxHeight = 'calc(85vh - 100px)';
        modalDetails.style.overflowY = 'auto';
    }

    const redesHTML = persona.redesSociales.map(red => {
        const iconClass = getSocialIconClass(red.tipo);
        return `
            <span class="social-badge ${red.tipo}">
                <i class="${iconClass}"></i>
                ${red.usuario}
            </span>
        `;
    }).join('');

    const fechaRegistro = new Date(persona.fechaRegistro).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const fechaActualizacion = new Date(persona.fechaActualizacion).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    modalTitle.textContent = `Detalles de ${persona.nombre} ${persona.apellidos}`;
    modalDetails.innerHTML = `
        <div class="persona-details">
            <h2 style="margin-bottom: 20px; color: var(--primary-color);">${persona.nombre} ${persona.apellidos}</h2>
            
            <div class="details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div class="detail-item">
                    <h4 style="color: var(--secondary-color); margin-bottom: 5px;"><i class="fas fa-user"></i> Edad</h4>
                    <p style="font-size: 1.2rem;">${persona.edad} años</p>
                </div>
                <div class="detail-item">
                    <h4 style="color: var(--secondary-color); margin-bottom: 5px;"><i class="fas fa-map-marker-alt"></i> Provincia</h4>
                    <p style="font-size: 1.2rem;">${persona.provincia}</p>
                </div>
                <div class="detail-item">
                    <h4 style="color: var(--secondary-color); margin-bottom: 5px;"><i class="fas fa-check-circle"></i> Estado</h4>
                    <p style="font-size: 1.2rem; color: ${persona.verificado ? 'var(--success-color)' : '#666'}">
                        ${persona.verificado ? 'Verificado' : 'No verificado'}
                    </p>
                </div>
                <div class="detail-item">
                    <h4 style="color: var(--secondary-color); margin-bottom: 5px;"><i class="fas fa-camera"></i> Pruebas</h4>
                    <p style="font-size: 1.2rem;">${persona.tienePruebas ? 'Sí' : 'No'}</p>
                </div>
            </div>

            <div class="detail-section" style="margin-bottom: 25px;">
                <h4 style="color: var(--secondary-color); margin-bottom: 10px;"><i class="fas fa-hashtag"></i> Redes Sociales</h4>
                <div class="social-badges" style="display: flex; flex-wrap: wrap; gap: 8px;">${redesHTML}</div>
            </div>

            ${persona.pruebasDescripcion ? `
            <div class="detail-section" style="margin-bottom: 25px; background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--secondary-color); margin-bottom: 10px;"><i class="fas fa-file-alt"></i> Descripción de Pruebas</h4>
                <p style="line-height: 1.6;">${persona.pruebasDescripcion}</p>
            </div>
            ` : ''}

            <div class="detail-section" style="margin-bottom: 25px;">
                <h4 style="color: var(--secondary-color); margin-bottom: 10px;"><i class="fas fa-calendar-alt"></i> Fechas</h4>
                <p style="margin-bottom: 5px;"><strong>Registrado:</strong> ${fechaRegistro}</p>
                <p><strong>Última actualización:</strong> ${fechaActualizacion}</p>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    
    // Enfocar el modal para accesibilidad
    modal.focus();
}

function showLegalModal(type) {
    const modal = document.getElementById('legalModal');
    const legalContent = document.getElementById('legalContent');

    let content = '';

    switch(type) {
        case 'lopd':
            content = `
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Protección de Datos Personales (LOPD/GDPR)</h2>
                <p>Esta base de datos cumple con la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales, y el Reglamento General de Protección de Datos (RGPD).</p>
                <h3 style="margin-top: 20px; color: var(--secondary-color);">Bases legales para el tratamiento:</h3>
                <ul style="margin-left: 20px; margin-bottom: 20px;">
                    <li>Interés público en la prevención de conductas fraudulentas en relaciones personales.</li>
                    <li>Consentimiento explícito del informante para el tratamiento de los datos.</li>
                    <li>Derecho a la información de potenciales víctimas de infidelidades.</li>
                </ul>
                <h3 style="color: var(--secondary-color);">Derechos ARCO:</h3>
                <p>Todas las personas tienen derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos personales.</p>
            `;
            break;
        case 'terms':
            content = `
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Términos y Condiciones de Uso</h2>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">1. Aceptación de términos</h3>
                <p>Al utilizar esta plataforma, aceptas estos términos y condiciones en su totalidad.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">2. Uso permitido</h3>
                <p>Esta base de datos solo puede ser consultada para fines informativos personales. No está permitido el uso comercial, la reventa de datos o la difamación masiva.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">3. Responsabilidad del informante</h3>
                <p>La persona que reporta a un infiel es legalmente responsable de la veracidad de la información proporcionada.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">4. Limitación de responsabilidad</h3>
                <p>Los administradores no se responsabilizan por el uso indebido de la información por parte de terceros.</p>
            `;
            break;
        case 'delete':
            content = `
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Solicitud de Eliminación de Datos</h2>
                <p>Si deseas solicitar la eliminación de tus datos personales de nuestra base de datos, debes enviar un correo electrónico a <strong>eliminacion@infielesdb.es</strong> con la siguiente información:</p>
                <ul style="margin-left: 20px; margin-bottom: 20px;">
                    <li>Nombre completo</li>
                    <li>Forma de verificar que eres quien dices ser</li>
                    <li>Motivo de la solicitud</li>
                    <li>Pruebas de que eres la persona cuyos datos quieres eliminar</li>
                </ul>
                <p>Procesaremos tu solicitud en un plazo máximo de 30 días hábiles.</p>
                <p>Si los datos han sido obtenidos de forma legítima y existe interés público en su conservación, podremos denegar la solicitud, notificándote los motivos.</p>
            `;
            break;
        case 'disclaimer':
            content = `
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Aviso Legal</h2>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">1. Responsabilidad</h3>
                <p>Esta plataforma es una base de datos de carácter informativo. Los administradores revisan la información recibida pero no garantizan al 100% su exactitud.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">2. Propiedad intelectual</h3>
                <p>Todos los derechos de propiedad intelectual sobre la base de datos pertenecen a sus creadores.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">3. Enlaces externos</h3>
                <p>No nos responsabilizamos del contenido de enlaces externos a redes sociales u otras páginas web.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">4. Jurisdicción</h3>
                <p>Cualquier disputa será resuelta en los tribunales de Madrid, España.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">5. Contacto legal</h3>
                <p>Para cuestiones legales: legal@infielesdb.es</p>
            `;
            break;
        default:
            content = `<h2 style="color: var(--primary-color);">Información no disponible</h2>`;
    }

    legalContent.innerHTML = content;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
}

// ========== FUNCIONES DE UTILIDAD ==========
function showNotification(message, type = 'info') {
    // Eliminar notificaciones existentes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function adjustForTouch() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
        
        // Ajustes específicos para touch
        document.querySelectorAll('button, a, .social-badge, .pagination-btn').forEach(el => {
            el.style.cursor = 'pointer';
        });
    }
}

function setupLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && appState.currentView === 'stats') {
                renderCharts();
                observer.disconnect();
            }
        });
    }, { threshold: 0.1 });
    
    const statsSection = document.getElementById('statsSection');
    if (statsSection) observer.observe(statsSection);
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    // Prevenir zoom en iOS al hacer focus en inputs
    document.addEventListener('touchstart', function() {}, {passive: true});
    
    loadDatabase();
    
    // Añadir clase inicial de modo
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.add('light-mode');
    }
});

// Mejorar accesibilidad con teclado
document.addEventListener('keydown', (e) => {
    // Cerrar modales con ESC
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    }
});