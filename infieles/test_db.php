<?php
require_once 'config/database.php';

$database = new Database();
$conn = $database->getConnection();

if ($conn) {
    echo "✅ Conexión a MySQL exitosa<br>";
    
    // Probar consulta
    $stmt = $conn->query("SELECT COUNT(*) as total FROM infieles");
    $result = $stmt->fetch();
    echo "✅ Tabla 'infieles' encontrada. Registros: " . $result['total'];
    
} else {
    echo "❌ Error de conexión a MySQL";
    echo "<pre>";
    print_r(error_get_last());
    echo "</pre>";
}
?>