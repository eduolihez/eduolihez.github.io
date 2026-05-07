/**
 * Més Badalona - Logic Application Admin Module
 * Contiene toda la lógica específica para el panel de administración.
 * Extiende el objeto 'app' definido en app.js.
 */

// 1. PROPIEDADES ESPECÍFICAS DE ADMIN (Añadidas al objeto 'app' de app.js)
app.adminIncidents = []; 
app.adminUsers = []; 
app.adminRole = null; 
app.activeAdminTab = 'stats'; 
app.detailMap = null; // Mapa del panel de detalle

// Nuevo: Mapa Avanzado del Admin
app.adminMap = null;
app.adminMapMarkers = L.layerGroup();
app.adminMapFilters = {
    status: 'all',
    category: 'all',
    urgency: 'all',
    afectacion: 'all',
    votos: 'all'
};

app.adminFilters = {
    status: 'all',
    category: 'all',
    barri: 'all',
    search: ''      
};

// 2. FUNCIONES DE INICIALIZACIÓN Y AUTH (Añadidas a 'app')

app.updateAdminNav = function() {
    const sidebarNav = document.getElementById('admin-tabs');
    const mobileNav = document.getElementById('admin-tabs-mobile-nav');
    const tabButtons = sidebarNav.innerHTML;

    // Poblar navegación móvil si existe
    if (mobileNav) {
        mobileNav.innerHTML = tabButtons;
        
        // Re-adjuntar eventos a los nuevos botones de móvil (si se clona)
        mobileNav.querySelectorAll('.admin-tab-btn').forEach(btn => {
             btn.onclick = () => app.setActiveAdminTab(btn.getAttribute('data-tab'));
        });
    }

    // Ocultar botón de usuarios si no es Superadmin
    const tabUsersBtn = document.getElementById('tab-users-btn');
    const isSuperadmin = app.adminRole === 'superadmin';
    if (tabUsersBtn) {
        tabUsersBtn.style.display = isSuperadmin ? '' : 'none';
        
        const tabUsersBtnMobile = mobileNav?.querySelector('[data-tab="users"]');
        if (tabUsersBtnMobile) tabUsersBtnMobile.style.display = isSuperadmin ? '' : 'none';
    }
};

app.setActiveAdminTab = function(tabName) {
    // 1. Actualizar botones de navegación (Sidebar y Móvil)
    const tabsContainer = document.getElementById('admin-tabs');
    const tabsMobileContainer = document.getElementById('admin-tabs-mobile-nav');
    const allTabBtns = [...tabsContainer.querySelectorAll('.admin-tab-btn'), ...tabsMobileContainer?.querySelectorAll('.admin-tab-btn') || []];

    allTabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. Actualizar contenido
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.add('hidden'));
    const activeContent = document.getElementById(`tab-${tabName}-content`);
    if (activeContent) activeContent.classList.remove('hidden');
    
    // 3. Actualizar título de la cabecera
    const titleElement = document.getElementById('current-tab-title');
    if (titleElement) {
        const titleKey = `admin_tab_${tabName}`;
        titleElement.textContent = app.i18n[app.lang][titleKey] || tabName.toUpperCase();
    }
    
    // 4. Mostrar/Ocultar botón de crear usuario (LOGIC REMOVED/MOVED)
    // NOTA: El botón #createUserBtn ya no está en el header y se gestiona en loadUserManagement.

    this.activeAdminTab = tabName;
    
    // 5. Cargar datos específicos e inicializar mapa
    if (tabName === 'incidents') {
        this.loadAdminData();
    } else if (tabName === 'stats') {
        this.loadAdminStats();
    } else if (tabName === 'users') {
         this.loadUserManagement(); 
    } else if (tabName === 'map') {
         this.initAdminMap();
    }
};

app.checkAdminAuth = async function() {
    const loadingScreen = document.getElementById('loading-screen');
    const adminLogin = document.getElementById('admin-login');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginMessage = document.getElementById('loginMessage');
    const username = localStorage.getItem('admin_username') || 'Admin';
    
    if (loadingScreen) loadingScreen.style.display = 'flex';
    
    try {
        const res = await fetch('api/index.php?action=check_auth');
        const json = await res.json();
        
        if (json.logged_in) {
            app.adminRole = json.admin_role; 
            
            // 1. Actualizar Display de Usuario
            document.getElementById('admin-user-display-pc').textContent = username;
            document.getElementById('admin-user-display-mobile').textContent = username;
            
            // 2. Configurar la navegación (Sidebar/Tabs)
            app.updateAdminNav(); 
            
            // 3. Mostrar Dashboard
            if (adminDashboard) adminDashboard.classList.remove('hidden');
            if (adminLogin) adminLogin.classList.add('hidden');
            
            // 4. Activar la pestaña por defecto
            app.setActiveAdminTab('stats'); 
        } else {
            if (adminDashboard) adminDashboard.classList.add('hidden');
            if (adminLogin) adminLogin.classList.remove('hidden');
            if (loginMessage) loginMessage.textContent = ""; 
        }
    } catch(e) {
        console.error("Auth check failed:", e);
        if (loginMessage) loginMessage.textContent = "Error de conexión con la API o error de script.";
        if (adminLogin) adminLogin.classList.remove('hidden');
    } finally {
        if (loadingScreen) loadingScreen.style.display = 'none';
    }
};

app.handleAdminLogin = async function(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    const originalText = btn.innerHTML;
    const username = form.querySelector('input[name="usuario"]').value;
    const loginMessage = document.getElementById('loginMessage');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Entrant...';
    if(loginMessage) loginMessage.textContent = '';

    try {
        const formData = new FormData(form);
        const res = await fetch('api/index.php?action=login', { method: 'POST', body: formData });
        
        const errorText = await res.text();
        
        if (!res.ok) {
            let message = "Error desconocido al iniciar sesión.";
            try {
                const json = JSON.parse(errorText);
                message = json.message || `Server Error: ${res.status}`;
            } catch {
                message = `Error ${res.status}: Fallo de servidor. Revise logs PHP.`;
            }
            if (loginMessage) loginMessage.textContent = message;
            return;
        }

        const json = JSON.parse(errorText);
        
        if (json.status === 'success') {
            localStorage.setItem('admin_username', username);
            app.checkAdminAuth(); 
        } else {
            if (loginMessage) loginMessage.textContent = json.message || 'Error de autenticación.';
        }
    } catch (e) {
        if (loginMessage) loginMessage.textContent = 'Error de conexión al servidor.';
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

app.handleAdminLogout = async function() {
    await fetch('api/index.php?action=logout');
    localStorage.removeItem('admin_username');
    location.reload(); 
};

// 3. GESTIÓN DE INCIDENCIAS (Añadidas a 'app')

app.loadAdminData = async function() {
    const listContainer = document.getElementById('incident-list');
    // Obtener valores de los filtros dinámicamente
    this.adminFilters.status = document.getElementById('filter-status')?.value || 'all';
    this.adminFilters.category = document.getElementById('filter-category')?.value || 'all';
    this.adminFilters.barri = document.getElementById('filter-barri-admin')?.value || 'all'; 
    this.adminFilters.search = document.getElementById('filter-search')?.value.toLowerCase() || '';
    
    if (listContainer && this.activeAdminTab === 'incidents') {
        listContainer.innerHTML = `<p id="list-message" class="text-center" style="padding: 20px; color: var(--text-light);">${app.i18n[app.lang].admin_list_loading}</p>`;
    }

    try {
        const res = await fetch(`api/index.php?action=admin_data`);
        const json = await res.json();

        if (json.status === 'success') {
            app.adminIncidents = json.data;
            app.populateAdminFilterBarrios(); 
            app.renderAdminList(); 
            // Si la pestaña de mapa está activa, actualizar los marcadores
            if (app.activeAdminTab === 'map' && app.adminMap) {
                 app.drawAdminMapMarkers();
            }
        } else {
            if (listContainer) listContainer.innerHTML = `<p class="text-center" style="color: var(--danger);">Error carregant dades: ${json.message}</p>`;
        }
    } catch(e) {
        if (listContainer) listContainer.innerHTML = `<p class="text-center" style="color: var(--danger);">Error de connexió al servidor: ${e.message}</p>`;
    }
};

app.populateAdminFilterBarrios = function() {
    const filterBarriSelect = document.getElementById('filter-barri-admin');
    if (!filterBarriSelect) return;
    
    const currentBarri = filterBarriSelect.value;
    filterBarriSelect.innerHTML = `<option value="all">${this.i18n[this.lang].filter_barri_all}</option>`;
    
    const existingBarrios = new Set();
    this.adminIncidents.forEach(inc => {
        if (inc.barri && inc.barri !== '') {
            existingBarrios.add(inc.barri);
        }
    });
    
    const districtsWithIncidents = {};
    existingBarrios.forEach(barri => {
        const districteNum = this.BARRIOS_MAP[barri];
        const districteLabel = districteNum ? ('Districte ' + districteNum) : 'Sense Districte';

        if (!districtsWithIncidents[districteLabel]) {
            districtsWithIncidents[districteLabel] = [];
        }
        districtsWithIncidents[districteLabel].push(barri);
    });
    
    for (const districteLabel in districtsWithIncidents) {
        districtsWithIncidents[districteLabel].sort(); 
        
        const optgroup = document.createElement('optgroup');
        optgroup.label = districteLabel;
        
        districtsWithIncidents[districteLabel].forEach(barri => {
            const option = document.createElement('option');
            option.value = barri;
            option.textContent = barri;
            optgroup.appendChild(option);
        });
         filterBarriSelect.appendChild(optgroup);
    }
    
    filterBarriSelect.value = currentBarri || 'all';
};

app.renderAdminList = function() {
    const listContainer = document.getElementById('incident-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const filters = this.adminFilters;
    
    let filteredData = app.adminIncidents.filter(inc => {
        const matchesStatus = filters.status === 'all' || inc.estado === filters.status;
        const matchesCategory = filters.category === 'all' || inc.categoria === filters.category;
        const matchesBarri = filters.barri === 'all' || inc.barri === filters.barri;
        
        const matchesSearch = filters.search === '' ||
                              inc.titulo.toLowerCase().includes(filters.search) ||
                              inc.descripcion.toLowerCase().includes(filters.search);

        return matchesStatus && matchesCategory && matchesBarri && matchesSearch;
    });
    
    if (filteredData.length === 0) {
        listContainer.innerHTML = `<p class="text-center" style="padding: 20px; color: var(--text-light);">${app.i18n[app.lang].admin_list_empty}</p>`;
        return;
    }
    
    // Vista de Escritorio: Tabla
    const tableHTML = `
        <div class="table-wrapper desktop-table-view">
            <table class="incident-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">ID</th>
                        <th style="width: 25%;">Títol / Descripció</th>
                        <th style="width: 15%;">Ubicació / Barri</th>
                        <th style="width: 10%;">Tipus</th>
                        <th style="width: 10%;">Urgència</th>
                        <th style="width: 5%;">Vots</th>
                        <th style="width: 10%;">Estat</th>
                        <th style="width: 10%;">Acció</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(inc => {
                        const statusLabel = app.i18n[app.lang][`status_${inc.estado}`] || 'Estat Desconegut';
                        const categoryLabel = inc.categoria === 'infraestructura' ? app.i18n[app.lang].cat_infra : app.i18n[app.lang].cat_denuncia;
                        const formattedDate = app.formatDate(inc.created_at);
                        const shortDesc = inc.descripcion.substring(0, 50) + '...';
                        const urgencyLabel = app.i18n[app.lang][`urg_${inc.urgencia}`] || inc.urgencia || 'Baixa';
                        const votes = inc.votos || 0; // Asegura que los votos sean 0 si es null

                        // Se elimina la clase de estado 'status-${inc.estado}' de la fila <tr>
                        return `
                            <tr onclick="app.openDetailPanel(${inc.id})"> 
                                <td>#${inc.id}<br><small>${formattedDate.split(',')[0]}</small></td>
                                <td><strong>${inc.titulo}</strong><br><small>${shortDesc}</small></td>
                                <td>${inc.direccion || 'Desconeguda'}<br><small>${inc.barri} (D${inc.districte || '?'})</small></td>
                                <td>${categoryLabel}<br><small>${inc.tipo}</small></td>
                                <td><span class="urgency-pill urgency-${inc.urgencia}">${urgencyLabel.toUpperCase()}</span></td>
                                <td>${votes}</td>
                                <td class="status-cell">
                                    <span class="card-status status-${inc.estado}">${statusLabel.toUpperCase()}</span>
                                </td>
                                <td><button class="btn-sm btn-primary">Detalls</button></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Vista Móvil: Tarjetas 
    const cardHTML = filteredData.map(inc => {
        const statusLabel = app.i18n[app.lang][`status_${inc.estado}`] || 'Estat Desconegut';
        const categoryLabel = inc.categoria === 'infraestructura' ? app.i18n[app.lang].cat_infra : app.i18n[app.lang].cat_denuncia;
        const formattedDate = app.formatDate(inc.created_at);
        const urgencyLabel = app.i18n[app.lang][`urg_${inc.urgencia}`] || inc.urgencia || 'Baixa';
        const votes = inc.votos || 0; // Asegura que los votos sean 0 si es null

        // Se elimina la clase de estado 'status-${inc.estado}' de la tarjeta <div>
        return `
            <div class="incident-card-admin mobile-card-view" onclick="app.openDetailPanel(${inc.id})">
                <div class="card-header-admin" style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="card-status status-${inc.estado}">${statusLabel.toUpperCase()}</span>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span class="card-category text-muted">${categoryLabel}</span>
                        <span class="urgency-pill urgency-${inc.urgencia}">${urgencyLabel.toUpperCase()}</span>
                    </div>
                </div>
                <h4 class="card-title-admin" style="margin: 10px 0 5px 0; font-size:1.1rem;">${inc.titulo} <small style="color:var(--text-secondary); font-weight:400;">(#${inc.id})</small></h4>
                <p class="card-location-admin text-muted" style="margin-bottom: 5px;"><i class="ri-map-pin-line"></i> ${inc.barri || 'Sense Barri'}</p>
                <p class="card-meta-admin text-muted" style="font-size:0.8rem;"><i class="ri-calendar-line"></i> ${formattedDate}</p>
                <div class="card-votes-admin" style="position: absolute; top: 15px; right: 15px; font-weight:700; color:var(--text-secondary);">
                    <i class="ri-thumb-up-fill"></i> ${votes}
                </div>
            </div>
        `;
    }).join('');
    
    listContainer.innerHTML = tableHTML + cardHTML;
};

app.openDetailPanel = function(id) {
    const incident = app.adminIncidents.find(i => i.id === id);
    if (!incident) return;

    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');
    
    const statusLabel = app.i18n[app.lang][`status_${incident.estado}`].toUpperCase();
    const categoryLabel = incident.categoria === 'infraestructura' ? app.i18n[app.lang].cat_infra : app.i18n[app.lang].cat_denuncia;
    
    const statusOptions = ['pendiente', 'proceso', 'resuelto'].map(status => {
        const label = app.i18n[app.lang][`status_${status}`];
        const selected = status === incident.estado ? 'selected' : '';
        return `<option value="${status}" ${selected}>${label}</option>`;
    }).join('');
    
    const urgencyLabel = app.i18n[app.lang][`urg_${incident.urgencia}`] || app.i18n[app.lang].urg_low; // Default a Baja si es nulo

    if (content) content.innerHTML = `
        <div class="detail-header-admin status-${incident.estado}">
            <span class="detail-status-pill status-${incident.estado}">${statusLabel}</span>
            <span class="detail-id text-muted" style="float:right;">ID: ${incident.id}</span>
            <h2 class="detail-title-admin" style="font-size:1.5rem; margin-top: 10px; margin-bottom: 0;">${incident.titulo}</h2>
            <p class="detail-date"><i class="ri-calendar-line"></i> ${app.formatDate(incident.created_at)}</p>
        </div>
        
        <div class="detail-content">
            <div id="detailMap" class="detail-map-container"></div>
            
            <div class="detail-section">
                <h3><i class="ri-map-pin-line"></i> ${app.i18n[app.lang].detail_section_location}</h3>
                <p><strong>${app.i18n[app.lang].detail_address}:</strong> ${incident.direccion || 'Desconeguda'}</p>
                <p><strong>${app.i18n[app.lang].detail_district}:</strong> ${incident.barri} (D${incident.districte || '?'})</p>
                <p class="text-muted" style="font-size:0.85rem;"><strong>${app.i18n[app.lang].detail_coords}:</strong> ${incident.lat.toFixed(6)}, ${incident.lng.toFixed(6)}</p>
                <a href="http://google.com/maps/search/?api=1&query=${incident.lat},${incident.lng}" target="_blank" class="btn-sm btn-info detail-map-link">
                    <i class="ri-direction-line"></i> Ver en Google Maps
                </a>
            </div>

            <div class="detail-section">
                <h3><i class="ri-list-check"></i> ${app.i18n[app.lang].detail_section_details}</h3>
                <div class="detail-info-grid">
                    <p><strong>${app.i18n[app.lang].detail_urgency_level}:</strong> <span class="urgency-pill urgency-${incident.urgencia}">${urgencyLabel.toUpperCase()}</span></p>
                    <p><strong>${app.i18n[app.lang].detail_type_problem}:</strong> ${categoryLabel} - ${incident.tipo}</p>
                    <p style="grid-column: 1 / span 2;"><strong>${app.i18n[app.lang].detail_affects}:</strong> ${app.i18n[app.lang][`imp_${incident.afectacion}`] || incident.afectacion}</p>
                </div>
                <p class="detail-description-text"><strong>${app.i18n[app.lang].detail_description}:</strong> ${incident.descripcion}</p>
            </div>
            
            ${incident.foto_url ? `
                <div class="detail-section detail-photo-section">
                    <h3><i class="ri-camera-line"></i> Fotografia</h3>
                    <img src="${incident.foto_url}" class="detail-image" alt="Foto de la incidencia">
                    <a href="${incident.foto_url}" target="_blank" class="btn-sm btn-info detail-img-link">
                        <i class="ri-zoom-in-line"></i> ${app.i18n[app.lang].detail_img_view}
                    </a>
                </div>
            ` : ''}

            <div class="detail-section">
                <h3><i class="ri-user-line"></i> ${app.i18n[app.lang].detail_section_contact}</h3>
                <p><strong>${app.i18n[app.lang].detail_email}:</strong> ${incident.email || 'No proporcionat'}</p>
                <p><strong>${app.i18n[app.lang].detail_votes}:</strong> ${incident.votos || 0}</p>
            </div>

            <div class="detail-section detail-action-bar">
                <h3><i class="ri-exchange-box-line"></i> ${app.i18n[app.lang].detail_section_actions}</h3>
                <select id="newStatusSelect-${incident.id}" class="select-status status-${incident.estado}" 
                        onchange="this.className='select-status status-'+this.value">
                    ${statusOptions}
                </select>
                <button class="btn-sm btn-primary btn-update-status" 
                        onclick="app.handleStatusChange(${incident.id}, document.getElementById('newStatusSelect-${incident.id}').value, this)">
                    ${app.i18n[app.lang].detail_btn_update}
                </button>
            </div>
        </div>
    `;
    
    if (panel) panel.classList.add('open'); 
    
    // Inicializar el mapa de detalle
    setTimeout(() => {
         app.initDetailMap(incident.lat, incident.lng);
    }, 100); 
};

app.initDetailMap = function(lat, lng) {
    const mapElement = document.getElementById('detailMap');
    if (!mapElement) return;

    if (app.detailMap) {
        app.detailMap.remove();
    }

    if (typeof L === 'undefined') {
        console.error("Leaflet library not loaded.");
        return;
    }

    app.detailMap = L.map('detailMap', {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        attributionControl: false
    }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO', 
        maxZoom: 18
    }).addTo(app.detailMap);
    
    const customIcon = L.divIcon({
        html: '<i class="ri-map-pin-fill" style="font-size:35px; color:#ef4444; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3)); position:relative; top:-17px;"></i>',
        className: 'custom-pin-detail', iconSize: [35, 35], iconAnchor: [17, 35]
    });

    L.marker([lat, lng], { icon: customIcon }).addTo(app.detailMap);
};

app.closeDetailPanel = function() {
    const panel = document.getElementById('detail-panel');
    if (panel) panel.classList.remove('open');
    
    if (app.detailMap) {
        app.detailMap.remove();
        app.detailMap = null;
    }
};

app.handleStatusChange = async function(id, newStatus, btn) {
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> ...';

    const formData = new FormData();
    formData.append('id', id);
    formData.append('estado', newStatus);

    try {
        const res = await fetch('api/index.php?action=update_status', { method: 'POST', body: formData });
        
        const errorText = await res.text();
        
        if (!res.ok) {
            let message = "Error desconocido al actualizar estado.";
            try {
                const json = JSON.parse(errorText);
                message = json.message || `Server Error: ${res.status}`;
            } catch {
                message = `Error ${res.status}: Fallo de servidor. Revise logs PHP.`;
            }
            ui.showToast(`Error: ${message}`, 'error', 7000);
            return;
        }
        
        ui.showToast("Estat actualitzat correctament!", 'success', 3000);
        app.loadAdminData(); 
        app.closeDetailPanel(); 
    } catch(e) {
        ui.showToast("Error de connexió al servidor.", 'error', 5000);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// 4. LÓGICA DEL MAPA ADMIN AVANZADO (Mejorado)

app.initAdminMap = function() {
    // Si no hay incidentes cargados, cargarlos
    if (this.adminIncidents.length === 0) {
        this.loadAdminData(); 
    }
    
    const mapElement = document.getElementById('map-admin');
    if (!mapElement) return;
    
    // Inicialización del mapa si no existe
    if (!app.adminMap) {
        if (typeof L === 'undefined') {
            console.error("Leaflet library not loaded.");
            return;
        }

        app.adminMap = L.map('map-admin').setView([41.450, 2.240], 13); // Centrado en Badalona

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© CARTO', 
            maxZoom: 18
        }).addTo(app.adminMap);
        
        app.adminMapMarkers.addTo(app.adminMap);
        
        // Inicializar filtros al cargar el mapa por primera vez
        app.populateAdminMapFilters();
    }
    
    // Asegurar que el mapa se redibuje correctamente al cambiar de pestaña
    setTimeout(() => {
        app.adminMap.invalidateSize();
        app.drawAdminMapMarkers(); // Dibujar marcadores con filtros
    }, 200);
};

app.populateAdminMapFilters = function() {
    const i18n = this.i18n[this.lang];
    
    // Estado
    const statusSelect = document.getElementById('map-filter-status');
    statusSelect.innerHTML = `<option value="all">${i18n.admin_list_all} (${i18n.lbl_status})</option>` + 
        `<option value="pendiente">${i18n.status_pendiente}</option>` +
        `<option value="proceso">${i18n.status_proceso}</option>` +
        `<option value="resuelto">${i18n.status_resuelto}</option>`;
        
    // Categoría
    const categorySelect = document.getElementById('map-filter-category');
    categorySelect.innerHTML = `<option value="all">${i18n.admin_list_all} (${i18n.lbl_category})</option>` +
        `<option value="infraestructura">${i18n.cat_infra}</option>` +
        `<option value="denuncia">${i18n.cat_denuncia}</option>`;
        
    // Urgencia
    const urgencySelect = document.getElementById('map-filter-urgency');
    urgencySelect.innerHTML = `<option value="all">${i18n.admin_list_all} (${i18n.lbl_urgency})</option>` +
        `<option value="baja">${i18n.urg_low}</option>` +
        `<option value="media">${i18n.urg_medium}</option>` +
        `<option value="alta">${i18n.urg_high}</option>`;
        
    // Afectación (Impacto)
    const afectacionSelect = document.getElementById('map-filter-afectacion');
    afectacionSelect.innerHTML = `<option value="all">${i18n.admin_list_all} (${i18n.lbl_impact})</option>` +
        `<option value="individual">${i18n.imp_individual}</option>` +
        `<option value="col·lectiva">${i18n.imp_collective}</option>`;
        
    // Votos (Popularidad)
    const votosSelect = document.getElementById('map-filter-votos');
    votosSelect.innerHTML = `<option value="all">${i18n.admin_list_all} (${i18n.lbl_votes})</option>` +
        `<option value="5">${i18n.filter_votos_more_than} 5</option>` +
        `<option value="10">${i18n.filter_votos_more_than} 10</option>` +
        `<option value="20">${i18n.filter_votos_more_than} 20</option>`;

    // Restaurar valores si existen
    statusSelect.value = this.adminMapFilters.status;
    categorySelect.value = this.adminMapFilters.category;
    urgencySelect.value = this.adminMapFilters.urgency;
    afectacionSelect.value = this.adminMapFilters.afectacion;
    votosSelect.value = this.adminMapFilters.votos;
};

app.updateAdminMapFilters = function() {
    this.adminMapFilters.status = document.getElementById('map-filter-status').value;
    this.adminMapFilters.category = document.getElementById('map-filter-category').value;
    this.adminMapFilters.urgency = document.getElementById('map-filter-urgency').value;
    this.adminMapFilters.afectacion = document.getElementById('map-filter-afectacion').value;
    this.adminMapFilters.votos = document.getElementById('map-filter-votos').value;
    
    this.drawAdminMapMarkers();
};

app.resetAdminMapFilters = function() {
    this.adminMapFilters = { status: 'all', category: 'all', urgency: 'all', afectacion: 'all', votos: 'all' };
    this.populateAdminMapFilters(); // Restablece los valores en el DOM
    this.drawAdminMapMarkers();
};

app.drawAdminMapMarkers = function() {
    if (!app.adminMap) return;

    app.adminMapMarkers.clearLayers();
    const filters = this.adminMapFilters;
    let bounds = [];

    const filteredIncidents = app.adminIncidents.filter(inc => {
        const matchesStatus = filters.status === 'all' || inc.estado === filters.status;
        const matchesCategory = filters.category === 'all' || inc.categoria === filters.category;
        const matchesUrgency = filters.urgency === 'all' || inc.urgencia === filters.urgency;
        const matchesAfectacion = filters.afectacion === 'all' || inc.afectacion === filters.afectacion;
        
        const minVotes = filters.votos === 'all' ? 0 : parseInt(filters.votos, 10);
        const matchesVotos = parseInt(inc.votos) >= minVotes;

        return matchesStatus && matchesCategory && matchesUrgency && matchesAfectacion && matchesVotos;
    });
    
    // Crear y añadir marcadores
    filteredIncidents.forEach(inc => {
        if (!inc.lat || !inc.lng) return;
        
        const pinColor = this.getPinColor(inc.estado);
        const iconHtml = `<i class="ri-map-pin-2-fill" style="font-size:30px; color:${pinColor}; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));"></i>`;
        
        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-map-pin', iconSize: [30, 30], iconAnchor: [15, 30]
        });
        
        const marker = L.marker([inc.lat, inc.lng], { icon: customIcon });
        
        // Mejorado: Contenido del Popup más claro
        const urgencyLabel = this.i18n[this.lang][`urg_${inc.urgencia}`] || 'Sense especificar';
        const statusLabel = this.i18n[this.lang][`status_${inc.estado}`].toUpperCase();

        const popupContent = `
            <div style="font-family: 'Inter', sans-serif; padding: 5px;">
                <h4 style="margin: 0 0 5px 0; color: ${pinColor}; font-weight:700;">#${inc.id}: ${inc.titulo}</h4>
                <p style="margin: 0 0 5px 0; font-size: 0.9rem;">
                    <strong>Estat:</strong> <span class="card-status status-${inc.estado}">${statusLabel}</span>
                </p>
                <p style="margin: 0 0 5px 0; font-size: 0.8rem;">
                    <i class="ri-map-pin-line" style="font-size:1.1rem; vertical-align:middle; margin-right: 3px;"></i> 
                    ${inc.barri || 'Ubicació Desconeguda'}
                </p>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 10px;">
                    <span><i class="ri-thumb-up-fill"></i> <strong>Vots:</strong> ${inc.votos || 0}</span>
                    <span><i class="ri-fire-line"></i> <strong>Urgència:</strong> ${urgencyLabel}</span>
                </div>
                <button class="btn-sm btn-primary" onclick="app.openDetailPanel(${inc.id})" style="width: 100%;">Veure Detalls</button>
            </div>
        `;
        
        marker.bindPopup(popupContent, { maxWidth: 300 });
        app.adminMapMarkers.addLayer(marker);
        
        bounds.push([inc.lat, inc.lng]);
    });
    
    // Ajustar vista del mapa si hay marcadores y no es el zoom inicial
    if (bounds.length > 0) {
         try {
            app.adminMap.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
         } catch(e) {
            // Falla si solo hay un punto, centramos en el primero
             app.adminMap.setView(bounds[0], 15);
         }
    }
};

app.getPinColor = function(status) {
    switch (status) {
        case 'pendiente': return '#f59e0b'; // warning
        case 'proceso': return '#3b82f6';    // info
        case 'resuelto': return '#10b981';   // success
        default: return '#6b7280';
    }
};


// 5. GESTIÓN DE ESTADÍSTICAS AVANZADAS (Admin) (Mantenido)

app.loadAdminStats = async function() {
    const content = document.getElementById('tab-stats-content');
    
    Object.keys(this.chartInstances).forEach(key => {
        if (this.chartInstances[key] && typeof this.chartInstances[key].destroy === 'function') {
            this.chartInstances[key].destroy();
        }
    });
    this.chartInstances = {};
    
    if (content) content.innerHTML = `<p class="text-center" style="padding: 50px; color: var(--text-light);">${app.i18n[app.lang].admin_list_loading}</p>`;

    try {
        const res = await fetch('api/index.php?action=admin_stats');
        const errorText = await res.text();
        
        if (!res.ok) {
            if (content) content.innerHTML = `<p class="text-center" style="color: var(--danger); padding: 50px;">Error carregant estadístiques: Fallo de servidor. Detall: ${errorText.substring(0, 150)}...</p>`;
            return;
        }

        const json = JSON.parse(errorText);
        if (json.status === 'success') {
            app.renderAdminStats(json.data);
        } else {
            if (content) content.innerHTML = `<p class="text-center" style="color: var(--danger); padding: 50px;">Error carregant estadístiques: ${json.message}</p>`;
        }
    } catch(e) {
        if (content) content.innerHTML = `<p class="text-center" style="color: var(--danger); padding: 50px;">Error de connexió al servidor: ${e.message}</p>`;
    }
};

app.renderAdminStats = function(data) {
    
    const lang = this.lang;
    const i18n = this.i18n[lang];

    const totalResolved = data.urgency_distribution.resuelto || 0;
    const totalPending = (data.urgency_distribution.pendiente || 0) + (data.urgency_distribution.proceso || 0);

    const contentHTML = `
        <section class="info-section">
            <h2><i class="ri-pulse-line"></i> Indicadors Clau</h2>
            <div class="stats-grid">
                <div class="d-card" style="border-left: 5px solid var(--primary);">
                    <p>${i18n.admin_stats_total}</p>
                    <h3>${data.total_incidents}</h3>
                </div>
                <div class="d-card" style="border-left: 5px solid var(--warning);">
                    <p>${i18n.admin_stats_pending}</p>
                    <h3>${totalPending}</h3>
                </div>
                <div class="d-card" style="border-left: 5px solid var(--success);">
                    <p>${i18n.admin_stats_resolved}</p>
                    <h3>${totalResolved}</h3>
                </div>
                <div class="d-card" style="border-left: 5px solid var(--danger);">
                    <p>${i18n.lbl_urgency} ${i18n.urg_high}</p>
                    <h3>${data.urgency_distribution.alta || 0}</h3>
                </div>
            </div>
        </section>
        
        <section class="info-section">
            <h2><i class="ri-line-chart-line"></i> Anàlisi de Tendències i Flux Operatiu</h2>
            <div class="chart-duo">
                <div class="d-card chart-section">
                    <h3>${i18n.admin_stats_weekly_flow}</h3>
                    <div class="chart-container"><canvas id="adminWeeklyFlowChart"></canvas></div>
                </div>
                <div class="d-card chart-section">
                    <h3>${i18n.admin_stats_monthly}</h3>
                    <div class="chart-container"><canvas id="adminMonthlyChart"></canvas></div>
                </div>
            </div>
        </section>

        <section class="info-section">
            <h2><i class="ri-pie-chart-2-line"></i> Anàlisi de Classificació</h2>
            <div class="chart-duo">
                <div class="d-card chart-section">
                    <h3>${i18n.admin_stats_urgency}</h3>
                    <div class="chart-container"><canvas id="adminUrgencyChart"></canvas></div>
                </div>
                <div class="d-card chart-section">
                    <h3>${i18n.admin_stats_afectacion}</h3>
                    <div class="chart-container"><canvas id="adminAfectacionChart"></canvas></div>
                </div>
            </div>
        </section>
    `;
    
    const content = document.getElementById('tab-stats-content');
    if (content) content.innerHTML = contentHTML;
    
    // Timeout para asegurar que los elementos Canvas están en el DOM antes de dibujar
    setTimeout(() => {
        this.drawWeeklyFlowChart(data.weekly_status_flow, i18n);
        this.drawAdminMonthlyChart(data.monthly_trend, i18n);
        this.drawAdminUrgencyChart(data.urgency_distribution, i18n);
        this.drawAdminAfectacionChart(data.afectacion_distribution, i18n);
    }, 100);
};


app.drawWeeklyFlowChart = function(data, i18n) {
    const ctx = document.getElementById('adminWeeklyFlowChart');
    if (!ctx) return;
    
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    const dates = data.map(d => new Date(d.date).toLocaleDateString(this.lang, { weekday: 'short', day: 'numeric' }));
    const createdData = data.map(d => d.created);
    const resolvedData = data.map(d => d.resolved);

    this.chartInstances.adminWeeklyFlowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: i18n.admin_stats_created,
                    data: createdData,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: 'rgb(37, 99, 235)',
                    borderWidth: 1,
                    type: 'bar',
                    order: 2 
                },
                {
                    label: i18n.admin_stats_solved_wk,
                    data: resolvedData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2,
                    type: 'line',
                    fill: false,
                    tension: 0.3,
                    pointRadius: 5,
                    order: 1 
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, stacked: false, ticks: { precision: 0 } },
                x: { stacked: false }
            },
            plugins: {
                legend: { position: 'bottom' },
                title: { display: false }
            }
        }
    });
};

app.drawAdminMonthlyChart = function(data, i18n) {
    const ctx = document.getElementById('adminMonthlyChart');
    if (!ctx) return;
    
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    const labels = data.map(d => {
        const [year, month] = d.month.split('-');
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString(this.lang, { month: 'short', year: '2-digit' });
    }).reverse();
    const counts = data.map(d => d.count).reverse();

    this.chartInstances.adminMonthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: i18n.admin_stats_created,
                data: counts,
                backgroundColor: 'rgba(245, 158, 11, 0.3)',
                borderColor: 'rgb(245, 158, 11)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(245, 158, 11)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
};

app.drawAdminUrgencyChart = function(data, i18n) {
    const ctx = document.getElementById('adminUrgencyChart');
    if (!ctx) return;
    
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    const urgencyLabels = {
        'baja': i18n.urg_low,
        'media': i18n.urg_medium,
        'alta': i18n.urg_high
    };
    const relevantKeys = ['baja', 'media', 'alta'];
    const labels = relevantKeys.map(key => urgencyLabels[key]);
    const counts = relevantKeys.map(key => data[key] || 0);
    const colors = ['#34d399', '#facc15', '#ef4444'];

    this.chartInstances.adminUrgencyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
};

app.drawAdminAfectacionChart = function(data, i18n) {
    const ctx = document.getElementById('adminAfectacionChart');
    if (!ctx) return;
    
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    const labels = [
        i18n.imp_individual, 
        i18n.imp_collective, 
        'Sense especificar' 
    ];
    
    const counts = [
        data.individual || 0, 
        data['col·lectiva'] || 0, 
        (data[''] || 0) + (data[null] || 0)
    ];
    const colors = ['#60a5fa', '#f87171', '#94a3b8'];

    this.chartInstances.adminAfectacionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
};


// 6. GESTIÓN DE USUARIOS (Mantenido y funcional)

app.openCreateAdminModal = function() {
    const form = document.getElementById('adminUserForm');
    form.reset();
    
    document.getElementById('adminUserId').value = '';
    document.getElementById('adminModalTitle').textContent = app.i18n[app.lang].admin_btn_new_user;
    document.getElementById('adminSubmitBtn').textContent = app.i18n[app.lang].admin_btn_new_user;
    
    document.getElementById('adminPassword').required = true;
    document.getElementById('passwordLabel').textContent = `${app.i18n[app.lang].lbl_password} (${app.i18n[app.lang].ph_password_new})`;
    document.getElementById('adminPassword').placeholder = app.i18n[app.lang].ph_password_new;
    
    app.populateAdminUserForm();
    
    form.onsubmit = app.handleCreateAdminSubmit;
    
    document.getElementById('adminUserModal').classList.remove('hidden');
};

app.openEditAdminModal = function(id) {
    const user = app.adminUsers.find(u => u.id == id);
    if (!user) return;
    
    const form = document.getElementById('adminUserForm');
    form.reset(); 
    
    document.getElementById('adminUserId').value = user.id;
    document.getElementById('adminUsername').value = user.usuario;
    
    document.getElementById('adminPassword').required = false; 
    document.getElementById('adminPassword').value = ''; 
    document.getElementById('passwordLabel').textContent = `${app.i18n[app.lang].lbl_password} (${app.i18n[app.lang].ph_password_optional})`;
    document.getElementById('adminPassword').placeholder = app.i18n[app.lang].ph_password_optional;
    
    app.populateAdminUserForm(user.role, user.access_type, user.district_access);
    
    document.getElementById('adminModalTitle').textContent = app.i18n[app.lang].btn_edit_user || "Editar Administrador";
    document.getElementById('adminSubmitBtn').textContent = app.i18n[app.lang].detail_btn_update;
    
    form.onsubmit = app.handleUpdateAdminSubmit;
    
    document.getElementById('adminUserModal').classList.remove('hidden');
};

app.closeAdminUserModal = function() {
    document.getElementById('adminUserModal').classList.add('hidden');
    const msg = document.getElementById('userMessage');
    if (msg) msg.textContent = "";
};

app.populateAdminUserForm = function(selectedRole = 'moderator', selectedAccess = 'all', selectedDistricts = '') {
    const roleSelect = document.getElementById('adminRole');
    const accessSelect = document.getElementById('adminAccessType');
    const districtInput = document.getElementById('adminDistrictAccess');
    const districtContainer = document.getElementById('districtAccessContainer');

    roleSelect.innerHTML = `
        <option value="superadmin" ${selectedRole === 'superadmin' ? 'selected' : ''}>${app.i18n[app.lang].admin_user_role_superadmin}</option>
        <option value="admin" ${selectedRole === 'admin' ? 'selected' : ''}>${app.i18n[app.lang].admin_user_role_admin}</option>
        <option value="moderator" ${selectedRole === 'moderator' ? 'selected' : ''}>${app.i18n[app.lang].admin_user_role_moderator}</option>
    `;
    
    accessSelect.innerHTML = `
        <option value="all" ${selectedAccess === 'all' ? 'selected' : ''}>${app.i18n[app.lang].admin_user_access_all}</option>
        <option value="infraestructura" ${selectedAccess === 'infraestructura' ? 'selected' : ''}>${app.i18n[app.lang].admin_user_access_infra}</option>
        <option value="denuncia" ${selectedAccess === 'denuncia' ? 'selected' : ''}>${app.i18n[app.lang].admin_user_access_denuncia}</option>
    `;

    districtInput.value = selectedDistricts;
    
    const toggleDistrictAccess = () => {
        const currentRole = roleSelect.value;
        
        if (currentRole === 'superadmin' || currentRole === 'admin' || currentRole === 'moderator') {
             districtContainer.classList.remove('hidden');
        } else {
             districtContainer.classList.add('hidden');
        }
    };
    
    roleSelect.onchange = toggleDistrictAccess;
    accessSelect.onchange = toggleDistrictAccess;
    toggleDistrictAccess(); 
    
    roleSelect.value = selectedRole;
    accessSelect.value = selectedAccess;
};

app.handleCreateAdminSubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('adminSubmitBtn');
    const msg = document.getElementById('userMessage');
    const originalText = btn.innerHTML;
    
    msg.textContent = "";
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Creando...';

    try {
        const formData = new FormData(form);
        formData.delete('id'); 

        const usuario = formData.get('usuario');
        const password = formData.get('password');
        if (!usuario || usuario.trim() === '' || !password || password.length < 8) {
             throw new Error("Validation Error: Usuario (email) y contraseña (mínimo 8 caracteres) son obligatorios.");
        }
        
        const res = await fetch('api/index.php?action=create_admin', { method: 'POST', body: formData });
        
        const jsonText = await res.text();
        let json;
        try {
            json = JSON.parse(jsonText);
        } catch (err) {
            console.error("Failed to parse JSON response:", jsonText);
            throw new Error(`Server Error (${res.status}): ${jsonText.substring(0, 50)}...`);
        }

        if (json.status === 'success') {
            ui.showToast(json.message, 'success', 3000);
            app.closeAdminUserModal();
            app.loadUserManagement();
        } else {
            if (msg) msg.textContent = json.message || "Error desconocido al crear usuario.";
            throw new Error(json.message);
        }
    } catch(err) {
        console.error("Error creating admin:", err);
        ui.showToast("Error: " + (err.message || "Error al conectar con la API."), 'error', 5000);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

app.handleUpdateAdminSubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('adminSubmitBtn');
    const msg = document.getElementById('userMessage');
    const originalText = btn.innerHTML;
    
    msg.textContent = "";
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Actualizando...';

    try {
        const formData = new FormData(form);
        
        if (formData.get('password') === '') {
            formData.delete('password');
        } else if (formData.has('password') && formData.get('password').length < 8) {
             throw new Error("Validation Error: La nueva contraseña debe tener al menos 8 caracteres.");
        }
        
        const res = await fetch('api/index.php?action=update_admin', { method: 'POST', body: formData });
        const jsonText = await res.text();
        let json;
        try {
            json = JSON.parse(jsonText);
        } catch (err) {
             throw new Error(`Server Error (${res.status}): ${jsonText.substring(0, 50)}...`);
        }
        
        if (json.status === 'success') {
            ui.showToast(json.message, 'success', 3000);
            app.closeAdminUserModal();
            app.loadUserManagement();
        } else {
             if (msg) msg.textContent = json.message || "Error desconocido al actualizar usuario.";
            throw new Error(json.message);
        }
    } catch(err) {
        console.error("Error updating admin:", err);
        ui.showToast("Error: " + (err.message || "Error al conectar con la API."), 'error', 5000);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};


app.loadUserManagement = async function() {
    const listContainer = document.getElementById('admin-users-list');
    const createUserBtn = document.getElementById('createUserBtn');
    
    if (listContainer) {
        listContainer.innerHTML = `<p class="text-center" style="padding: 20px; color: var(--text-light);">${app.i18n[app.lang].admin_list_loading}</p>`;
    }
    
    // IMPORTANTE: Controla la visibilidad del botón 'Crear Usuario' (ahora dentro de la pestaña)
    if (app.adminRole !== 'superadmin') {
         if (listContainer) listContainer.innerHTML = `<p class="text-center" style="padding: 20px; color: var(--danger);">Permisos insuficients. Només Superadmin pot gestionar usuaris.</p>`;
         if(createUserBtn) createUserBtn.style.display = 'none';
         return;
    } else {
         // Si es Superadmin y está en la pestaña de usuarios, MUESTRA el botón.
         if(createUserBtn) createUserBtn.style.display = 'inline-block';
    }


    try {
        const res = await fetch('api/index.php?action=get_admins');
        const json = await res.json();
        
        if (json.status === 'success') {
            app.adminUsers = json.data;
            app.renderUserList();
        } else {
            if (listContainer) listContainer.innerHTML = `<p class="text-center" style="color: var(--danger);">Error carregant usuaris: ${json.message}</p>`;
        }
    } catch(e) {
        if (listContainer) listContainer.innerHTML = `<p class="text-center" style="color: var(--danger);">Error de connexió al servidor: ${e.message}</p>`;
    }
};

app.renderUserList = function() {
    const listContainer = document.getElementById('admin-users-list');
    if (!listContainer) return;

    const isSuperadmin = app.adminRole === 'superadmin';
    const currentUsername = localStorage.getItem('admin_username');

    const tableHTML = `
        <div class="table-wrapper">
            <table id="admin-users-table" class="incident-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Usuari</th>
                        <th>Rols</th>
                        <th>Accés (Tipus)</th>
                        <th>Accés (Districte)</th>
                        <th>Accions</th>
                    </tr>
                </thead>
                <tbody>
                    ${app.adminUsers.map(user => {
                        const roleLabel = app.i18n[app.lang][`admin_user_role_${user.role}`] || user.role;
                        const roleClass = `role-${user.role}`;
                        const accessTypeLabel = app.i18n[app.lang][`admin_user_access_${user.access_type}`] || user.access_type;
                        
                        const isCurrentUser = user.usuario === currentUsername; 
                        const isOnlySuperadmin = user.role === 'superadmin' && app.adminUsers.filter(u => u.role === 'superadmin').length === 1;

                        const canEdit = isSuperadmin;
                        const canDelete = isSuperadmin && !isCurrentUser && !(user.role === 'superadmin' && isOnlySuperadmin);

                        const editBtn = canEdit ? 
                            `<button class="btn-sm btn-info" title="${app.i18n[app.lang].btn_edit_user}" onclick="event.stopPropagation(); app.openEditAdminModal(${user.id})">
                                <i class="ri-edit-line"></i>
                            </button>` : 
                            `<button class="btn-sm btn-info" disabled title="No tienes permisos para editar." style="opacity:0.5; cursor: not-allowed;">
                                <i class="ri-edit-line"></i>
                            </button>`;


                        const deleteBtn = canDelete ? 
                            `<button class="btn-sm btn-del" onclick="event.stopPropagation(); app.handleDeleteAdmin(${user.id}, this)">
                                <i class="ri-delete-bin-line"></i>
                            </button>` : 
                            `<button class="btn-sm btn-del" disabled title="${isCurrentUser ? 'No puedes eliminar tu propio usuario.' : isOnlySuperadmin ? 'No puedes eliminar el único Superadmin.' : 'Permisos insuficientes.'}" style="opacity:0.5; cursor: not-allowed;">
                                <i class="ri-delete-bin-line"></i>
                            </button>`;

                        return `
                            <tr style="cursor: default;">
                                <td data-label="ID">#${user.id}</td>
                                <td data-label="Usuari"><strong>${user.usuario}</strong></td>
                                <td data-label="Rol"><span class="user-role ${roleClass}">${roleLabel}</span></td>
                                <td data-label="Tipus">${accessTypeLabel}</td>
                                <td data-label="Districte">${user.district_access || 'Tots'}</td>
                                <td data-label="Accions" class="user-actions">
                                    ${editBtn}
                                    ${deleteBtn}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    listContainer.innerHTML = tableHTML;
};

app.handleDeleteAdmin = async function(id, btn) {
    if (!confirm(app.i18n[app.lang].users_delete_confirm)) {
        return;
    }

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i>';

    try {
        const formData = new FormData();
        formData.append('id', id);

        const res = await fetch('api/index.php?action=delete_admin', { method: 'POST', body: formData });
        
        const errorText = await res.text();
        
        if (!res.ok) {
            let message = app.i18n[app.lang].users_delete_error;
            try {
                const json = JSON.parse(errorText);
                message = json.message || message;
            } catch {
                message = `Error ${res.status}: Fallo de servidor.`;
            }
            ui.showToast(message, 'error', 5000);
            return;
        }
        
        ui.showToast("Usuari eliminat correctament.", 'success', 3000);
        app.loadUserManagement();
        
    } catch(e) {
        ui.showToast("Error de connexió al servidor.", 'error', 5000);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};


// Ejecutar la inicialización específica del admin al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-dashboard')) {
        const loginForm = document.getElementById('adminLoginForm');
        if(loginForm) loginForm.addEventListener('submit', app.handleAdminLogin);
        
        app.checkAdminAuth();
    }
});