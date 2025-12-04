-- database.sql
CREATE DATABASE IF NOT EXISTS infieles_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE infieles_db;

CREATE TABLE IF NOT EXISTS infieles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    edad INT NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    tiene_pruebas BOOLEAN DEFAULT FALSE,
    pruebas_descripcion TEXT,
    fecha_registro DATE NOT NULL,
    fecha_actualizacion DATE NOT NULL,
    verificado BOOLEAN DEFAULT FALSE,
    ficticio BOOLEAN DEFAULT TRUE, -- TODOS los registros son ficticios
    ip_reportador VARCHAR(45), -- Para tracking legal
    consentimiento_legal BOOLEAN DEFAULT FALSE -- Confirmación de datos ficticios
);

CREATE TABLE IF NOT EXISTS redes_sociales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    infiel_id INT,
    tipo VARCHAR(50) NOT NULL,
    usuario VARCHAR(150) NOT NULL,
    principal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (infiel_id) REFERENCES infieles(id) ON DELETE CASCADE
);

-- Insertar datos de ejemplo ficticios
INSERT INTO infieles (nombre, apellidos, edad, provincia, tiene_pruebas, pruebas_descripcion, fecha_registro, fecha_actualizacion, verificado, ficticio, consentimiento_legal) VALUES
('Persona', 'Ejemplo 1', 28, 'Madrid', TRUE, 'Datos completamente ficticios para demostración', CURDATE(), CURDATE(), TRUE, TRUE, TRUE),
('Persona', 'Ejemplo 2', 34, 'Barcelona', FALSE, 'Datos de ejemplo sin validez legal', CURDATE(), CURDATE(), FALSE, TRUE, TRUE);

INSERT INTO redes_sociales (infiel_id, tipo, usuario, principal) VALUES
(1, 'instagram', '@ejemplo_ficticio_1', TRUE),
(2, 'instagram', '@ejemplo_ficticio_2', TRUE);