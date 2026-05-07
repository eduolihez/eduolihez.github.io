-- 1. CREACIÓN DE LA BASE DE DATOS
CREATE DATABASE IF NOT EXISTS mesbadalona;
USE mesbadalona;

-- 2. ELIMINACIÓN DE LA TABLA EXISTENTE (REINICIO COMPLETO DE DATOS Y ESTRUCTURA)
-- **ADVERTENCIA: Esto eliminará todos los datos existentes en la tabla incidencias.**
DROP TABLE IF EXISTS incidencias;

-- 3. RECREACIÓN DE LA TABLA INCIDENCIAS CON LA ESTRUCTURA COMPLETA
CREATE TABLE incidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria ENUM('infraestructura', 'denuncia') NOT NULL,
    tipo_problema VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    cp VARCHAR(10),
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    foto_url VARCHAR(255),
    
    -- Nuevos campos de gestión y localización
    barri VARCHAR(100),
    districte VARCHAR(10),
    urgencia ENUM('baja', 'media', 'alta') DEFAULT 'media',
    afectacion ENUM('individual', 'colectiva') DEFAULT 'individual',
    email VARCHAR(255),
    
    -- Campos de estado y popularidad
    estado ENUM('pendiente', 'proceso', 'resuelto') DEFAULT 'pendiente',
    votos INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP 
);