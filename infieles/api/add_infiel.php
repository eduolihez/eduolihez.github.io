<?php
// api/add_infiel.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

// Validar que todos los datos sean obligatoriamente ficticios
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validaciones básicas
if (!isset($data['consentimientoLegal']) || $data['consentimientoLegal'] !== true) {
    http_response_code(400);
    echo json_encode(['error' => 'Se requiere confirmación de datos ficticios']);
    exit;
}

if (!isset($data['aceptoTerminos']) || $data['aceptoTerminos'] !== true) {
    http_response_code(400);
    echo json_encode(['error' => 'Debe aceptar los términos']);
    exit;
}

// Marcar automáticamente todos los datos como ficticios
$data['ficticio'] = true;
$data['ip_reportador'] = $_SERVER['REMOTE_ADDR'] ?? '';

// Conectar a la base de datos infielesdb
$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos infielesdb']);
    exit;
}

try {
    // Iniciar transacción
    $conn->beginTransaction();
    
    // Insertar en la tabla infieles
    $sql = "INSERT INTO infieles (
        nombre, apellidos, edad, provincia, 
        tiene_pruebas, pruebas_descripcion, 
        fecha_registro, fecha_actualizacion, 
        verificado, ficticio, ip_reportador, consentimiento_legal
    ) VALUES (
        :nombre, :apellidos, :edad, :provincia,
        :tiene_pruebas, :pruebas_descripcion,
        CURDATE(), CURDATE(),
        :verificado, :ficticio, :ip_reportador, :consentimiento_legal
    )";
    
    $stmt = $conn->prepare($sql);
    
    // Asignar valores - todos marcados como ficticios
    $stmt->execute([
        ':nombre' => htmlspecialchars(strip_tags($data['nombre'])),
        ':apellidos' => htmlspecialchars(strip_tags($data['apellidos'])),
        ':edad' => intval($data['edad']),
        ':provincia' => htmlspecialchars(strip_tags($data['provincia'])),
        ':tiene_pruebas' => isset($data['tienePruebas']) ? 1 : 0,
        ':pruebas_descripcion' => isset($data['pruebasDescripcion']) ? 
                                 htmlspecialchars(strip_tags($data['pruebasDescripcion'])) : '',
        ':verificado' => isset($data['tienePruebas']) ? 1 : 0,
        ':ficticio' => 1,
        ':ip_reportador' => $data['ip_reportador'],
        ':consentimiento_legal' => 1
    ]);
    
    $infiel_id = $conn->lastInsertId();
    
    // Insertar redes sociales
    if (isset($data['redes']) && is_array($data['redes'])) {
        $social_sql = "INSERT INTO redes_sociales (infiel_id, tipo, usuario, principal) 
                      VALUES (:infiel_id, :tipo, :usuario, :principal)";
        $social_stmt = $conn->prepare($social_sql);
        
        foreach ($data['redes'] as $red) {
            $social_stmt->execute([
                ':infiel_id' => $infiel_id,
                ':tipo' => htmlspecialchars(strip_tags($red['tipo'])),
                ':usuario' => htmlspecialchars(strip_tags($red['usuario'])),
                ':principal' => isset($red['principal']) ? 1 : 0
            ]);
        }
    }
    
    $conn->commit();
    
    // Registrar en log
    error_log("Nuevo registro ficticio insertado en infielesdb - IP: " . $data['ip_reportador']);
    
    echo json_encode([
        'success' => true,
        'message' => 'Datos ficticios registrados correctamente en infielesdb',
        'id' => $infiel_id,
        'warning' => 'ESTOS DATOS SON COMPLETAMENTE FICTICIOS - Solo demostración técnica - Base de datos: infielesdb'
    ]);
    
} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Error en add_infiel.php para infielesdb: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al registrar datos ficticios en infielesdb',
        'debug' => (isset($_ENV['ENVIRONMENT']) && $_ENV['ENVIRONMENT'] === 'development') ? $e->getMessage() : null
    ]);
}
?>