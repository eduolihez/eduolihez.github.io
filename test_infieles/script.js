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
        edadPromedio: 0,
        porEdades: { "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 },
        porProvincia: {}
    }
};

// Variables para el formulario
let currentFormStep = 1;
const totalFormSteps = 3;
let socialNetworkCounter = 1;

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
        const response = await fetch('api/get_infieles.php');
        if (!response.ok) throw new Error('Error al cargar la base de datos infielesdb');
        const data = await response.json();
        
        // Añadir aviso ficticio a todos los registros
        data.infieles.forEach(persona => {
            persona.ficticio = true;
        });
        
        database = data;
        console.log('Base de datos infielesdb cargada:', database.infieles.length, 'registros ficticios');
        initApp();
    } catch (error) {
        console.error('Error:', error);
        database.infieles = getSampleData();
        initApp();
        showNotification('Error cargando la base de datos infielesdb. Se están usando datos de ejemplo ficticios.', 'error');
    }
}

function getSampleData() {
    return [
        {
            "id": 1,
            "nombre": "Ejemplo",
            "apellidos": "Ficticio 1",
            "edad": 25,
            "provincia": "Madrid",
            "redesSociales": [
                { "tipo": "instagram", "usuario": "@ejemplo_ficticio_1", "principal": true }
            ],
            "tienePruebas": true,
            "pruebasDescripcion": "Datos completamente ficticios para demostración técnica",
            "fechaRegistro": "2025-11-01",
            "fechaActualizacion": "2025-11-01",
            "ficticio": true
        },
        {
            "id": 2,
            "nombre": "Persona",
            "apellidos": "Ficticia 2",
            "edad": 32,
            "provincia": "Barcelona",
            "redesSociales": [
                { "tipo": "instagram", "usuario": "@persona_ficticia_2", "principal": true }
            ],
            "tienePruebas": false,
            "pruebasDescripcion": "Datos de ejemplo sin validez legal",
            "fechaRegistro": "2025-10-15",
            "fechaActualizacion": "2025-10-15",
            "ficticio": true
        },
        {
            "id": 3,
            "nombre": "Usuario",
            "apellidos": "Demostración 3",
            "edad": 28,
            "provincia": "Valencia",
            "redesSociales": [
                { "tipo": "twitter", "usuario": "@usuario_ficticio", "principal": true },
                { "tipo": "instagram", "usuario": "@demo_ficticia", "principal": false }
            ],
            "tienePruebas": true,
            "pruebasDescripcion": "Información inventada para fines educativos",
            "fechaRegistro": "2025-09-20",
            "fechaActualizacion": "2025-09-20",
            "ficticio": true
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
    setupFormEventListeners();
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

    // Copiar plantilla de Instagram (mantenido para retrocompatibilidad)
    document.getElementById('copyTemplate')?.addEventListener('click', copyTemplate);

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

function setupFormEventListeners() {
    // Navegación del formulario
    document.getElementById('nextStep')?.addEventListener('click', nextFormStep);
    document.getElementById('prevStep')?.addEventListener('click', prevFormStep);
    
    // Añadir red social
    document.getElementById('addSocialNetwork')?.addEventListener('click', addSocialNetworkField);
    
    // Envío del formulario
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Cargar provincias en el select del formulario
    loadProvinciasForm();
}

function loadProvinciasForm() {
    const select = document.getElementById('provincia');
    if (!select) return;
    
    // Limpiar opciones excepto la primera
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    const provincias = appState.provinces.sort();
    provincias.forEach(provincia => {
        const option = document.createElement('option');
        option.value = provincia;
        option.textContent = provincia;
        select.appendChild(option);
    });
}

function nextFormStep() {
    if (currentFormStep < totalFormSteps) {
        // Validar paso actual
        if (!validateFormStep(currentFormStep)) {
            showNotification('Por favor, completa todos los campos requeridos', 'error');
            return;
        }
        
        currentFormStep++;
        updateFormUI();
    }
}

function prevFormStep() {
    if (currentFormStep > 1) {
        currentFormStep--;
        updateFormUI();
    }
}

function updateFormUI() {
    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Mostrar paso actual
    const steps = document.querySelectorAll('.form-step');
    if (steps.length >= currentFormStep) {
        steps[currentFormStep - 1].classList.add('active');
    }
    
    // Actualizar botones
    const prevBtn = document.getElementById('prevStep');
    const nextBtn = document.getElementById('nextStep');
    const submitBtn = document.getElementById('submitForm');
    
    if (prevBtn) prevBtn.style.display = currentFormStep === 1 ? 'none' : 'block';
    if (nextBtn) nextBtn.style.display = currentFormStep === totalFormSteps ? 'none' : 'block';
    if (submitBtn) submitBtn.style.display = currentFormStep === totalFormSteps ? 'block' : 'none';
    
    // Actualizar barra de progreso
    const progress = (currentFormStep / totalFormSteps) * 100;
    const progressBar = document.getElementById('formProgress');
    if (progressBar) progressBar.style.width = `${progress}%`;
    
    // Actualizar indicadores
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        if (index < currentFormStep) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

function validateFormStep(step) {
    let isValid = true;
    
    if (step === 1) {
        const requiredFields = ['nombre', 'apellidos', 'edad', 'provincia'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'var(--primary-color)';
            } else if (field) {
                field.style.borderColor = '';
            }
        });
        
        // Validar edad
        const edadInput = document.getElementById('edad');
        if (edadInput) {
            const edad = parseInt(edadInput.value);
            if (edad < 18 || edad > 99 || isNaN(edad)) {
                isValid = false;
                edadInput.style.borderColor = 'var(--primary-color)';
            } else {
                edadInput.style.borderColor = '';
            }
        }
    }
    
    if (step === 2) {
        // Validar al menos una red social
        const socialInputs = document.querySelectorAll('.red-usuario');
        let hasSocial = false;
        socialInputs.forEach(input => {
            if (input.value.trim().includes('@')) {
                hasSocial = true;
                input.style.borderColor = '';
            } else {
                input.style.borderColor = 'var(--primary-color)';
                isValid = false;
            }
        });
        
        if (socialInputs.length === 0) {
            isValid = false;
            showNotification('Debe añadir al menos una red social', 'error');
        } else if (!hasSocial) {
            isValid = false;
        }
    }
    
    if (step === 3) {
        // Validar checkboxes legales
        const legalChecks = [
            'consentimientoLegal',
            'aceptoTerminos',
            'mayorEdad'
        ];
        
        legalChecks.forEach(checkId => {
            const check = document.getElementById(checkId);
            if (check && !check.checked) {
                isValid = false;
                check.parentElement.style.color = 'var(--primary-color)';
            } else if (check) {
                check.parentElement.style.color = '';
            }
        });
    }
    
    return isValid;
}

function addSocialNetworkField() {
    const container = document.getElementById('socialNetworksContainer');
    if (!container) return;
    
    const newGroup = document.createElement('div');
    newGroup.className = 'social-input-group';
    newGroup.innerHTML = `
        <div class="form-group">
            <label for="red_tipo_${socialNetworkCounter}">Tipo de Red</label>
            <select class="red-tipo" name="redes[${socialNetworkCounter}][tipo]">
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter/X</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
            </select>
        </div>
        <div class="form-group">
            <label for="red_usuario_${socialNetworkCounter}">Usuario *</label>
            <input type="text" class="red-usuario" 
                   name="redes[${socialNetworkCounter}][usuario]" required
                   placeholder="@ejemplo_ficticio">
        </div>
        <div class="form-group checkbox-group">
            <label>
                <input type="checkbox" class="red-principal" 
                       name="redes[${socialNetworkCounter}][principal]">
                Red principal
            </label>
        </div>
    `;
    container.appendChild(newGroup);
    socialNetworkCounter++;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validar último paso
    if (!validateFormStep(3)) {
        showNotification('Debes aceptar todas las confirmaciones legales', 'error');
        return;
    }
    
    // Mostrar loading
    const submitBtn = document.getElementById('submitForm');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    try {
        // Recopilar datos del formulario
        const formData = {
            nombre: document.getElementById('nombre').value,
            apellidos: document.getElementById('apellidos').value,
            edad: parseInt(document.getElementById('edad').value),
            provincia: document.getElementById('provincia').value,
            tienePruebas: document.getElementById('tienePruebas').checked,
            pruebasDescripcion: document.getElementById('pruebasDescripcion').value,
            consentimientoLegal: document.getElementById('consentimientoLegal').checked,
            aceptoTerminos: document.getElementById('aceptoTerminos').checked,
            mayorEdad: document.getElementById('mayorEdad').checked,
            redes: []
        };
        
        // Recopilar redes sociales
        document.querySelectorAll('.social-input-group').forEach((group, index) => {
            const tipo = group.querySelector('.red-tipo').value;
            const usuario = group.querySelector('.red-usuario').value;
            const principal = group.querySelector('.red-principal').checked;
            
            if (usuario) {
                formData.redes.push({
                    tipo,
                    usuario,
                    principal: index === 0 ? true : principal
                });
            }
        });
        
        // Mostrar confirmación adicional
        if (!confirm('¿CONFIRMAS que todos los datos son FICTICIOS y que este es solo un proyecto demostrativo?\n\nIMPORTANTE: No introduzcas datos reales de personas.')) {
            throw new Error('Envío cancelado por el usuario');
        }
        
        // Enviar a la API
        const response = await fetch('api/add_infiel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification('✅ Datos ficticios registrados correctamente en infielesdb', 'success');
            
            // Resetear formulario
            document.getElementById('reportForm').reset();
            currentFormStep = 1;
            updateFormUI();
            socialNetworkCounter = 1;
            
            // Resetear contenedor de redes sociales (mantener solo una)
            const container = document.getElementById('socialNetworksContainer');
            if (container) {
                container.innerHTML = `
                    <div class="social-input-group">
                        <div class="form-group">
                            <label for="red_tipo_1">Tipo de Red</label>
                            <select class="red-tipo" name="redes[0][tipo]" required>
                                <option value="instagram">Instagram</option>
                                <option value="twitter">Twitter/X</option>
                                <option value="facebook">Facebook</option>
                                <option value="tiktok">TikTok</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="red_usuario_1">Usuario *</label>
                            <input type="text" class="red-usuario" name="redes[0][usuario]" required
                                   placeholder="@ejemplo_ficticio">
                        </div>
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" class="red-principal" name="redes[0][principal]" checked>
                                Red principal
                            </label>
                        </div>
                    </div>
                `;
            }
            
            // Recargar base de datos
            setTimeout(() => {
                loadDatabase();
                if (appState.currentView === 'database') {
                    applyFilters();
                }
                if (appState.currentView === 'stats') {
                    calculateStatistics();
                    updateStatisticsDisplay();
                }
            }, 1000);
            
        } else {
            showNotification(result.error || 'Error al enviar los datos ficticios a infielesdb', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message !== 'Envío cancelado por el usuario') {
            showNotification('Error de conexión con el servidor o con infielesdb', 'error');
        }
        
    } finally {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
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
        } else if (section === 'add') {
            // Resetear formulario al entrar
            currentFormStep = 1;
            updateFormUI();
        } else if (section === 'stats') {
            calculateStatistics();
            updateStatisticsDisplay();
            setTimeout(() => {
                detectDarkMode();
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
        filtered = filtered.filter(persona => persona.tienePruebas);
    } else if (appState.filters.hasProof === 'false') {
        filtered = filtered.filter(persona => !persona.tienePruebas);
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
                    <p>No se encontraron registros ficticios en infielesdb</p>
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
                <tr onclick="showDetailsModalFromTable(${personaJSON})" tabindex="0" role="button" aria-label="Ver detalles ficticios de ${persona.nombre} ${persona.apellidos}">
                    <td>${persona.nombre} ${persona.apellidos} ${persona.ficticio ? '<span class="ficticio-badge">FICTICIO</span>' : ''}</td>
                    <td>${persona.edad} años</td>
                    <td>${persona.provincia}</td>
                    <td><div class="social-badges">${redesHTML}</div></td>
                    <td>
                        <a href="https://instagram.com/infieles_db_espana" target="_blank" class="instagram-verify-btn" onclick="event.stopPropagation();">
                            <i class="fab fa-instagram"></i> Contactar para verificar
                        </a>
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
        
        // Añadir CSS para la etiqueta ficticia
        if (!document.querySelector('#ficticioBadgeStyle')) {
            const style = document.createElement('style');
            style.id = 'ficticioBadgeStyle';
            style.textContent = `
                .ficticio-badge {
                    background: linear-gradient(135deg, #ff6b6b, #dc3545);
                    color: white;
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 10px;
                    margin-left: 5px;
                    vertical-align: middle;
                    font-weight: bold;
                }
                .instagram-verify-btn {
                    display: inline-block;
                    background: linear-gradient(45deg, #E4405F, #833AB4);
                    color: white;
                    padding: 8px 15px;
                    border-radius: 20px;
                    text-decoration: none;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-align: center;
                    border: none;
                    cursor: pointer;
                    white-space: nowrap;
                }
                .instagram-verify-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(228, 64, 95, 0.3);
                }
                .instagram-verify-btn i {
                    margin-right: 5px;
                }
                @media (max-width: 768px) {
                    .instagram-verify-btn {
                        padding: 6px 12px;
                        font-size: 0.8rem;
                        white-space: normal;
                        line-height: 1.2;
                    }
                }
            `;
            document.head.appendChild(style);
        }
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

    if (pageInfo) pageInfo.textContent = `Página ${appState.currentPage} de ${totalPages || 1}`;
    if (prevBtn) prevBtn.disabled = appState.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = appState.currentPage >= totalPages;
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

    const totalStats = document.getElementById('totalStats');
    const topProvince = document.getElementById('topProvince');
    const topProvinceCountEl = document.getElementById('topProvinceCount');
    const avgAge = document.getElementById('avgAge');
    
    if (totalStats) totalStats.textContent = appState.stats.totalRegistros;
    if (topProvince) topProvince.textContent = topProvincia;
    if (topProvinceCountEl) topProvinceCountEl.textContent = `${topProvinciaCount} casos`;
    if (avgAge) avgAge.textContent = appState.stats.edadPromedio;

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
                <h4>${persona.nombre} ${persona.apellidos} <span style="color: #ff6b6b; font-size: 0.8rem;">(FICTICIO)</span></h4>
                <p>Infiel ficticio reportado - ${persona.provincia}</p>
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
                    label: 'Número de casos ficticios',
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Casos ficticios: ${context.raw}`;
                            }
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
    const template = `**REPORTE DE INFIEL - BASE DE DATOS FICTICIA (infielesdb)**

**AVISO IMPORTANTE:** Todos los datos deben ser COMPLETAMENTE FICTICIOS

**DATOS PERSONALES (FICTICIOS):**
• Nombre completo: [Nombre y apellidos INVENTADOS]
• Edad/Año nacimiento: [Edad o año de nacimiento INVENTADO]
• Provincia: [Provincia de residencia INVENTADA]
• Instagram: [@usuario_instagram_INVENTADO]
• Otras redes: [Twitter, Facebook, etc. INVENTADOS]

**PRUEBAS (OPCIONAL - FICTICIAS):**
[Si tienes pruebas, descríbelas aquí (INVENTADAS). Envía las pruebas a @infieles_db_espana para verificación]

**INFORMACIÓN ADICIONAL:**
[Contexto ficticio, cómo conoces a la persona (INVENTADO), etc.]

**VERIFICACIÓN:**
Contacta por Instagram: @infieles_db_espana con las pruebas para confirmar la infidelidad.`;

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

    modalTitle.textContent = `Detalles ficticios de ${persona.nombre} ${persona.apellidos}`;
    modalDetails.innerHTML = `
        <div class="persona-details">
            <h2 style="margin-bottom: 20px; color: var(--primary-color);">
                ${persona.nombre} ${persona.apellidos}
                <span style="background: linear-gradient(135deg, #ff6b6b, #dc3545); color: white; padding: 3px 10px; border-radius: 15px; font-size: 0.8rem; margin-left: 10px;">FICTICIO</span>
            </h2>
            
            <div class="legal-notice" style="background: #fff3cd; color: #856404; padding: 15px; border-radius: var(--border-radius); margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <p><strong>AVISO LEGAL:</strong> Estos datos son COMPLETAMENTE FICTICIOS y sirven únicamente para demostración técnica en la base de datos infielesdb.</p>
                </div>
            </div>
            
            <div class="verification-instruction" style="background: linear-gradient(135deg, #E4405F, #833AB4); color: white; padding: 20px; border-radius: var(--border-radius); margin-bottom: 25px; text-align: center;">
                <i class="fab fa-instagram" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <h3 style="color: white; margin-bottom: 10px;">¡Verificación por Instagram!</h3>
                <p style="margin-bottom: 15px;">Para verificar esta información, contacta con:</p>
                <a href="https://instagram.com/infieles_db_espana" target="_blank" style="display: inline-block; background: white; color: #E4405F; padding: 10px 20px; border-radius: 25px; font-weight: bold; text-decoration: none;">
                    <i class="fab fa-instagram"></i> @infieles_db_espana
                </a>
                <p style="margin-top: 15px; font-size: 0.9rem;">Envía las pruebas necesarias para confirmar la infidelidad.</p>
            </div>
            
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
                    <h4 style="color: var(--secondary-color); margin-bottom: 5px;"><i class="fas fa-camera"></i> Pruebas</h4>
                    <p style="font-size: 1.2rem;">${persona.tienePruebas ? 'Reporte con pruebas ficticias' : 'Reporte sin pruebas'}</p>
                </div>
            </div>

            <div class="detail-section" style="margin-bottom: 25px;">
                <h4 style="color: var(--secondary-color); margin-bottom: 10px;"><i class="fas fa-hashtag"></i> Redes Sociales Ficticias</h4>
                <div class="social-badges" style="display: flex; flex-wrap: wrap; gap: 8px;">${redesHTML}</div>
            </div>

            ${persona.pruebasDescripcion ? `
            <div class="detail-section" style="margin-bottom: 25px; background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--secondary-color); margin-bottom: 10px;"><i class="fas fa-file-alt"></i> Descripción de Pruebas Ficticias</h4>
                <p style="line-height: 1.6;">${persona.pruebasDescripcion}</p>
            </div>
            ` : ''}

            <div class="detail-section" style="margin-bottom: 25px;">
                <h4 style="color: var(--secondary-color); margin-bottom: 10px;"><i class="fas fa-calendar-alt"></i> Fechas</h4>
                <p style="margin-bottom: 5px;"><strong>Registrado:</strong> ${fechaRegistro}</p>
                <p><strong>Última actualización:</strong> ${fechaActualizacion}</p>
            </div>
            
            <div class="verification-note" style="background: var(--bg-tertiary); padding: 15px; border-radius: var(--border-radius); border-left: 4px solid var(--primary-color);">
                <h4 style="color: var(--secondary-color); margin-bottom: 10px;"><i class="fas fa-info-circle"></i> Nota sobre verificación</h4>
                <p>La verificación de infieles se realiza exclusivamente a través de Instagram (<strong>@infieles_db_espana</strong>). Contacta con nosotros enviando las pruebas necesarias para confirmar la información.</p>
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
                <p>Esta base de datos (infielesdb) es un proyecto demostrativo que cumple con la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales, y el Reglamento General de Protección de Datos (RGPD).</p>
                <div class="legal-notice" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <p><strong>IMPORTANTE:</strong> Todos los datos almacenados en infielesdb son COMPLETAMENTE FICTICIOS y sirven únicamente para demostración técnica y educativa.</p>
                    </div>
                </div>
                <h3 style="margin-top: 20px; color: var(--secondary-color);">Bases legales para el tratamiento:</h3>
                <ul style="margin-left: 20px; margin-bottom: 20px;">
                    <li>Proyecto educativo y demostrativo (Artículo 83 del Reglamento de Desarrollo LOPD)</li>
                    <li>Consentimiento explícito del usuario para el tratamiento de datos ficticios</li>
                    <li>Datos 100% ficticios sin relación con personas reales</li>
                </ul>
                <h3 style="color: var(--secondary-color);">Derechos ARCO:</h3>
                <p>Todas las personas tienen derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos personales. En este caso, al ser datos ficticios, estos derechos se aplican de forma académica.</p>
            `;
            break;
        case 'terms':
            content = `
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Términos y Condiciones de Uso</h2>
                <div class="legal-notice" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <p><strong>AVISO IMPORTANTE:</strong> Esta plataforma es UNICAMENTE para fines educativos y demostrativos. Todos los datos en infielesdb son FICTICIOS.</p>
                    </div>
                </div>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">1. Aceptación de términos</h3>
                <p>Al utilizar esta plataforma, aceptas que es un proyecto educativo con datos completamente ficticios almacenados en la base de datos infielesdb.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">2. Uso permitido</h3>
                <p>Esta base de datos (infielesdb) solo puede ser consultada para fines educativos y de demostración técnica. No está permitido el uso comercial, la reventa de datos o la difamación.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">3. Responsabilidad del usuario</h3>
                <p>El usuario se compromete a NO introducir datos reales de personas en infielesdb. Todos los datos deben ser completamente inventados.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">4. Limitación de responsabilidad</h3>
                <p>Los administradores no se responsabilizan por el uso indebido de la información por parte de terceros. Esta es una plataforma demostrativa con base de datos infielesdb.</p>
            `;
            break;
        case 'delete':
            content = `
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Solicitud de Eliminación de Datos Ficticios</h2>
                <div class="legal-notice" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <p><strong>RECUERDA:</strong> Todos los datos en infielesdb son FICTICIOS. Si encuentras datos que parezcan reales, es coincidencia.</p>
                    </div>
                </div>
                <p>Si deseas solicitar la eliminación de datos ficticios que puedan coincidir casualmente con información real, puedes contactar a: <strong>demo@proyectoeducativo.es</strong></p>
                <p>Debido a que todos los datos en infielesdb son generados aleatoriamente, cualquier coincidencia con la realidad es puramente casual.</p>
                <p>Procesaremos tu solicitud en un plazo máximo de 30 días hábiles, aunque al ser datos ficticios, la eliminación es inmediata.</p>
            `;
            break;
        case 'disclaimer':
            content = `
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Aviso Legal - Proyecto Educativo</h2>
                <div class="legal-notice" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <p><strong>ESTA ES UNA PLATAFORMA DEMOSTRATIVA CON DATOS 100% FICTICIOS EN INFIELESDB</strong></p>
                    </div>
                </div>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">1. Responsabilidad</h3>
                <p>Esta plataforma es una base de datos de carácter educativo y demostrativo. Todos los datos mostrados en infielesdb son completamente inventados.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">2. Propiedad intelectual</h3>
                <p>Todos los derechos de propiedad intelectual sobre la base de datos infielesdb y el código pertenecen a sus creadores como proyecto educativo.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">3. Enlaces externos</h3>
                <p>No nos responsabilizamos del contenido de enlaces externos a redes sociales u otras páginas web.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">4. Jurisdicción</h3>
                <p>Cualquier disputa será resuelta en los tribunales de Madrid, España.</p>
                <h3 style="margin-top: 15px; color: var(--secondary-color);">5. Contacto legal</h3>
                <p>Para cuestiones legales relacionadas con este proyecto educativo: legal@proyectoeducativo.es</p>
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

// Hacer funciones globales para eventos HTML
window.showDetailsModalFromTable = showDetailsModalFromTable;
window.copyTemplate = copyTemplate;