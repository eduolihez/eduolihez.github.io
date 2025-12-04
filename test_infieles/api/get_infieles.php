<?php
// api/get_infieles.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config/database.php';

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    echo json_encode(['infieles' => [], 'error' => 'Error de conexión']);
    exit;
}

try {
    // Obtener infieles con sus redes sociales
    $sql = "SELECT i.*, 
            (SELECT COUNT(*) FROM infieles) as total_count,
            (SELECT COUNT(*) FROM infieles WHERE verificado = 1) as verified_count
            FROM infieles i 
            WHERE i.ficticio = 1 
            ORDER BY i.fecha_registro DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    
    $infieles = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Obtener redes sociales para este infiel
        $social_sql = "SELECT tipo, usuario, principal FROM redes_sociales 
                      WHERE infiel_id = :id ORDER BY principal DESC";
        $social_stmt = $conn->prepare($social_sql);
        $social_stmt->execute([':id' => $row['id']]);
        $redes = $social_stmt->fetchAll();
        
        $infieles[] = [
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'apellidos' => $row['apellidos'],
            'edad' => $row['edad'],
            'provincia' => $row['provincia'],
            'redesSociales' => $redes,
            'tienePruebas' => (bool)$row['tiene_pruebas'],
            'pruebasDescripcion' => $row['pruebas_descripcion'],
            'fechaRegistro' => $row['fecha_registro'],
            'fechaActualizacion' => $row['fecha_actualizacion'],
            'verificado' => (bool)$row['verificado'],
            'ficticio' => true, // SIEMPRE true
            'total_count' => $row['total_count'],
            'verified_count' => $row['verified_count']
        ];
    }
    
    echo json_encode([
        'infieles' => $infieles,
        'disclaimer' => 'TODOS LOS DATOS SON FICTICIOS - Proyecto demostrativo'
    ]);
    
} catch (PDOException $e) {
    error_log("Error en get_infieles.php: " . $e->getMessage());
    echo json_encode(['infieles' => [], 'error' => 'Error al obtener datos']);
}
?>