<?php
// config/config.php
define('ENVIRONMENT', 'development');
define('SITE_URL', 'http://localhost/infieles_db');
define('ADMIN_EMAIL', 'admin@ejemplo.com');
define('DB_NAME', 'infielesdb');

// Configuración de logging
define('LOG_FILE', __DIR__ . '/../logs/application.log');

// Crear directorio de logs si no existe
if (!file_exists(dirname(LOG_FILE))) {
    mkdir(dirname(LOG_FILE), 0755, true);
}

// Manejo de errores según el entorno
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Función para log seguro
function log_message($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] [$level] [infielesdb] $message" . PHP_EOL;
    
    if (ENVIRONMENT === 'development' || $level === 'ERROR') {
        file_put_contents(LOG_FILE, $log_entry, FILE_APPEND | LOCK_EX);
    }
}
?>