<?php

date_default_timezone_set('Europe/Madrid');

// Mostrar errores SOLO en desarrollo
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Headers para CORS (permite peticiones desde tu dominio)
header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN'] ?? '*');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// config/database.php
class Database {
    private $host = "localhost";
    private $db_name = "infielesdb";
    private $username = "infielesdbuser";
    private $password = "aA123456789!";
    private $conn;
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            return null;
        }
        
        return $this->conn;
    }
}
?>