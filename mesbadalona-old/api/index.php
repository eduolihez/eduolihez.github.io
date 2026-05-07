<?php

// Configuración de CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT"); 
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Respuesta a la solicitud OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Inicializar la sesión para la gestión del administrador
session_start();

// --- 1. CONFIGURACIÓN DE LA BASE DE DATOS (VERIFICAR ESTAS LÍNEAS) ---
// ** ASEGÚRESE DE QUE ESTOS DATOS SEAN CORRECTOS PARA SU ENTORNO **
define('DB_HOST', 'localhost');
define('DB_USER', 'badalonauser'); 
define('DB_PASS', 'gpmm90Zttn5r1kw6HqZ$'); 
define('DB_NAME', 'mesbadalona'); 

// --- 2. FUNCIONES DE UTILIDAD Y MANTENIMIENTO ---

/**
 * Conexión a la base de datos.
 */
function connectDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        error_log("Fallo de conexión a la base de datos: " . $conn->connect_error);
        return false;
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}

/**
 * Retorna la respuesta JSON.
 */
function sendResponse($data, $http_code = 200) {
    http_response_code($http_code);
    echo json_encode($data);
    exit;
}

/**
 * Función auxiliar para referenciar los valores en mysqli::bind_param.
 * NECESARIO para llamadas dinámicas con call_user_func_array.
 */
function makeValuesReferenced($arr){
    $refs = array();
    foreach($arr as $key => $value)
        $refs[$key] = &$arr[$key];
    return $refs;
}


/**
 * Función de mantenimiento: Elimina denuncias de más de 2 días, independientemente de su estado.
 */
function autoDeleteDenuncias($conn) {
    $days_limit = 2; // Límite de 2 días
    
    // Sentencia DELETE para eliminar cualquier denuncia más antigua de 2 días.
    $sql = "DELETE FROM incidencias 
            WHERE categoria = 'denuncia' 
            AND created_at < DATE_SUB(NOW(), INTERVAL $days_limit DAY)";
    
    // Suprimimos el error si hay un problema de ejecución
    @$conn->query($sql); 
}

function handleReverseGeocode() {
    if (!extension_loaded('curl')) {
        return sendResponse(["status" => "error", "message" => "La extensión cURL de PHP es requerida para el proxy de geocodificación."], 500);
    }

    $lat = filter_var($_GET['lat'] ?? '', FILTER_VALIDATE_FLOAT);
    $lng = filter_var($_GET['lng'] ?? '', FILTER_VALIDATE_FLOAT);

    if (!$lat || !$lng) {
        return sendResponse(["status" => "error", "message" => "Latitud y Longitud requeridas para geocodificación."], 400);
    }

    $url = "https://nominatim.openstreetmap.org/reverse?format=json&lat={$lat}&lon={$lng}&zoom=18&addressdetails=1";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'MesBadalona-App-v1.0 (https://mesbadalona.eduolihez.com)'); 
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    $result = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($result === FALSE || $http_code >= 400) {
        $error_msg = $curl_error ?: "Código HTTP: {$http_code}. (Probablemente User-Agent no válido o restricción de Nominatim)";
        return sendResponse(["status" => "error", "message" => "Error al contactar con el servicio de geocodificación. Detalles: {$error_msg}"], 500);
    }
    
    $response_data = json_decode($result, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return sendResponse(["status" => "error", "message" => "Respuesta de geocodificación inválida."], 500);
    }
    sendResponse($response_data);
}


// --- 3. GESTIÓN DE INCIDENCIAS (REPORTAR CON COMPRESIÓN) ---

function handleNewIncident($conn) {
    // Lectura y saneamiento de datos
    $lat = filter_var($_POST['lat'] ?? '', FILTER_VALIDATE_FLOAT);
    $lng = filter_var($_POST['lng'] ?? '', FILTER_VALIDATE_FLOAT);
    $titulo = $_POST['titulo'] ?? '';
    $descripcion = $_POST['descripcion'] ?? '';
    $categoria = $_POST['categoria'] ?? 'infraestructura';
    $tipo = $_POST['tipo'] ?? '';
    $direccion = $_POST['direccion'] ?? '';
    $barri = $_POST['barri'] ?? '';
    $districte = $_POST['districte'] ?? '';
    $urgencia = $_POST['urgencia'] ?? 'media';
    $afectacion = $_POST['afectacion'] ?? 'individual';
    $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL) ? $_POST['email'] : null;
    $cp = $_POST['cp'] ?? '';

    if (!$lat || !$lng || empty($titulo) || empty($categoria)) {
        return sendResponse(["status" => "error", "message" => "Faltan campos obligatorios (lat, lng, título, categoría)."], 400);
    }

    $foto_url = null;
    $upload_dir = '../uploads/'; 
        
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0775, true)) {
            error_log("Failed to create upload directory: " . $upload_dir);
            // Si falla la creación, no abortamos la incidencia, solo el upload
        }
    }
    
    // Manejo de imagen comprimida (Base64)
    if (!empty($_POST['compressed_image'])) {
        $base64_image = $_POST['compressed_image'];
        if (preg_match('/^data:image\/(.*?);base64,/', $base64_image, $matches)) {
            $base64_image = substr($base64_image, strpos($base64_image, ',') + 1);
            $ext = $matches[1] == 'jpeg' ? 'jpg' : $matches[1];
            $image_data = base64_decode($base64_image);
            
            $filename = uniqid('inc_') . '.' . $ext;
            $target_path = $upload_dir . $filename;

            if (@file_put_contents($target_path, $image_data) !== false) {
                $foto_url = 'uploads/' . $filename; 
            } else {
                error_log("Failed to save uploaded image via Base64 at: " . $target_path);
            }
        }
    }
        
    // Manejo de subida tradicional (Fallback o si no hay JS)
    if (!$foto_url && isset($_FILES['foto']) && $_FILES['foto']['error'] == UPLOAD_ERR_OK) {
        $filename = uniqid('inc_') . '.' . pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
        $target_path = $upload_dir . $filename;

        if (@move_uploaded_file($_FILES['foto']['tmp_name'], $target_path)) {
            $foto_url = 'uploads/' . $filename;
        } else {
            error_log("Failed to move uploaded file: " . $target_path);
        }
    }

    $sql = "INSERT INTO incidencias (
                lat, lng, titulo, descripcion, categoria, tipo_problema, direccion, 
                barri, districte, urgencia, afectacion, email, cp, foto_url, estado, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW()
            )";
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        error_log("SQL Error: " . $conn->error);
        return sendResponse(["status" => "error", "message" => "Error al preparar la inserción en la base de datos."], 500);
    }

    $stmt->bind_param("ddssssssssssss", 
        $lat, $lng, $titulo, $descripcion, $categoria, $tipo, $direccion, 
        $barri, $districte, $urgencia, $afectacion, $email, $cp, $foto_url
    );

    if ($stmt->execute()) {
        sendResponse(["status" => "success", "message" => "Incidencia reportada correctamente!", "id" => $conn->insert_id]);
    } else {
        sendResponse(["status" => "error", "message" => "Error al insertar en la base de datos: " . $stmt->error], 500);
    }
}

// --- 4. GESTIÓN DE VOTOS ---

function handleVote($conn, $id, $action) {
    if (!$id) {
        return sendResponse(["status" => "error", "message" => "ID de Incidencia requerido."], 400);
    }
    
    $sql = "UPDATE incidencias SET votos = 
            CASE 
                WHEN ? = 'unvote' AND votos > 0 THEN votos - 1
                WHEN ? = 'vote' THEN votos + 1
                ELSE votos
            END
            WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        return sendResponse(["status" => "error", "message" => "Error DB al preparar voto: " . $conn->error], 500);
    }
    
    $stmt->bind_param("ssi", $action, $action, $id); 
    
    if ($stmt->execute()) {
        $result = $conn->query("SELECT votos FROM incidencias WHERE id = " . $id);
        if ($result && $row = $result->fetch_assoc()) {
            sendResponse(["status" => "success", "message" => "Voto exitoso.", "new_votes" => (int)$row['votos']]);
        } else {
            sendResponse(["status" => "error", "message" => "Voto actualizado, pero no se pudo recuperar el nuevo conteo."], 500);
        }
    } else {
        sendResponse(["status" => "error", "message" => "Error de ejecución en la base de datos (voto): " . $stmt->error], 500);
    }
}

// --- 5. OBTENER DATOS PÚBLICOS Y ESTATS PÚBLICAS ---

function getPublicData($conn) {
    autoDeleteDenuncias($conn); // LLAMADA A LA NUEVA FUNCIÓN DE ELIMINACIÓN
    $sql = "SELECT 
                id, lat, lng, titulo, descripcion, categoria, tipo_problema AS tipo, 
                direccion, barri, districte, votos, estado, foto_url, created_at, urgencia
            FROM incidencias 
            ORDER BY created_at DESC";
            
    $result = $conn->query($sql);

    $incidents = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $row['lat'] = (float)$row['lat'];
            $row['lng'] = (float)$row['lng'];
            $row['votos'] = (int)$row['votos'];
            $incidents[] = $row;
        }
    }
    sendResponse($incidents);
}

function getPublicStats($conn) {
    $stats = [
        'total_incidents' => 0, 'by_category' => [], 'by_status' => [], 'by_barri' => [],
    ];
    autoDeleteDenuncias($conn); // LLAMADA A LA NUEVA FUNCIÓN DE ELIMINACIÓN
    
    $res = $conn->query("SELECT COUNT(id) as count FROM incidencias");
    if (!$res) {
        return sendResponse(["status" => "error", "message" => "SQL Error en getPublicStats: " . $conn->error], 500);
    }
    if ($row = $res->fetch_assoc()) { $stats['total_incidents'] = (int)$row['count']; }

    $res = $conn->query("SELECT categoria, COUNT(id) as count FROM incidencias GROUP BY categoria");
    if ($res) {
        while ($row = $res->fetch_assoc()) { $stats['by_category'][$row['categoria']] = (int)$row['count']; }
    } 
    if (!isset($stats['by_category']['infraestructura'])) $stats['by_category']['infraestructura'] = 0;
    if (!isset($stats['by_category']['denuncia'])) $stats['by_category']['denuncia'] = 0;

    $res = $conn->query("SELECT estado, COUNT(id) as count FROM incidencias GROUP BY estado");
    if ($res) {
        while ($row = $res->fetch_assoc()) { $stats['by_status'][$row['estado']] = (int)$row['count']; }
    }
    if (!isset($stats['by_status']['pendiente'])) $stats['by_status']['pendiente'] = 0;
    if (!isset($stats['by_status']['proceso'])) $stats['by_status']['proceso'] = 0;
    if (!isset($stats['by_status']['resuelto'])) $stats['by_status']['resuelto'] = 0;

    $res = $conn->query("SELECT barri, COUNT(id) as count FROM incidencias WHERE barri IS NOT NULL AND barri != '' GROUP BY barri ORDER BY count DESC LIMIT 5");
    if ($res) {
        while ($row = $res->fetch_assoc()) { $stats['by_barri'][$row['barri']] = (int)$row['count']; }
    }
    
    sendResponse(["status" => "success", "data" => $stats]);
}


// --- 6. GESTIÓN DE ADMINSTRACIÓN (AVANZADA) ---

/**
 * Endpoint para obtener datos para el dashboard, aplicando permisos de rol.
 */
function getAdminData($conn) {
    if (!isset($_SESSION['admin_logged_in'])) {
        return sendResponse(["status" => "error", "message" => "No autorizado."], 401);
    }
    
    $role = $_SESSION['admin_role'] ?? 'moderator';
    $access_type = $_SESSION['access_type'] ?? 'all'; 
    $district_access_raw = $_SESSION['district_access'] ?? 'all'; 
    
    $where_clauses = ["1=1"];
    $bindings = [];
    $types = "";

    // 1. Filtrado por Rol/Tipo de Acceso
    if ($access_type === 'infraestructura') {
        $where_clauses[] = "categoria = 'infraestructura'";
    } elseif ($access_type === 'denuncia') {
        $where_clauses[] = "categoria = 'denuncia'";
    }
    
    // 2. Filtrado por Distrito
    if ($district_access_raw && $district_access_raw !== 'all') {
        $districts = array_map('trim', explode(',', $district_access_raw));
        if (!empty($districts)) {
            $district_placeholders = implode(',', array_fill(0, count($districts), '?'));
            $where_clauses[] = "districte IN ({$district_placeholders})";
            
            foreach ($districts as $d) {
                $bindings[] = $d;
                $types .= "s";
            }
        }
    }
    
    // NOTA: Los filtros adicionales del frontend (category, barri) se aplicarán en JS. 
    // Aquí solo se aplican los filtros de seguridad/permisos del usuario.

    $where_sql = implode(" AND ", $where_clauses);
    
    $sql = "SELECT 
                id, lat, lng, titulo, descripcion, categoria, tipo_problema AS tipo, 
                direccion, barri, districte, votos, estado, urgencia, afectacion, email, foto_url, created_at, updated_at
            FROM incidencias 
            WHERE $where_sql
            ORDER BY created_at DESC";
            
    $stmt = $conn->prepare($sql);
    
    if ($types) {
        $param_arr = array_merge([$types], $bindings);
        call_user_func_array(array($stmt, 'bind_param'), makeValuesReferenced($param_arr));
    }

    if (!$stmt->execute()) {
        error_log("DB Error in getAdminData: " . $stmt->error . " SQL: " . $sql);
        return sendResponse(["status" => "error", "message" => "Error de base de datos al filtrar: " . $conn->error], 500);
    }

    $result = $stmt->get_result();

    $incidents = [];
    while ($row = $result->fetch_assoc()) {
        $row['lat'] = (float)$row['lat'];
        $row['lng'] = (float)$row['lng'];
        $row['votos'] = (int)$row['votos'];
        $incidents[] = $row;
    }
    sendResponse(["status" => "success", "data" => $incidents]);
}

/**
 * Endpoint para obtener datos estadísticos más detallados (para la pestaña Admin).
 */
function getAdminStats($conn) {
    if (!isset($_SESSION['admin_logged_in'])) {
        return sendResponse(["status" => "error", "message" => "No autorizado."], 401);
    }
    
    // 1. Consulta para tendencias mensuales
    $sql_monthly = "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, count(id) as count FROM incidencias GROUP BY month ORDER BY month DESC LIMIT 6";
    $monthly_res = $conn->query($sql_monthly);
    
    $monthly_data = [];
    if ($monthly_res) {
        while ($row = $monthly_res->fetch_assoc()) {
            $monthly_data[] = $row;
        }
    }

    // 2. Consulta para distribución general
    $sql_general = "SELECT urgencia, estado, afectacion, count(id) as count FROM incidencias GROUP BY urgencia, estado, afectacion";
    $general_res = $conn->query($sql_general);
    
    $urgency_distribution = [];
    $afectacion_distribution = [];
    $total_incidents = 0;
    
    if ($general_res) {
        while ($row = $general_res->fetch_assoc()) {
            $count = (int)$row['count'];
            $total_incidents += $count;
            
            // Urgencia (para el gráfico)
            $urgency_distribution[$row['urgencia']] = ($urgency_distribution[$row['urgencia']] ?? 0) + $count;
            // Estado (para los KPIs)
            $urgency_distribution[$row['estado']] = ($urgency_distribution[$row['estado']] ?? 0) + $count;
            // Afectación (para el gráfico)
            $afectacion_distribution[$row['afectacion']] = ($afectacion_distribution[$row['afectacion']] ?? 0) + $count;
        }
    }
    
    // 3. Consulta para Flujo Semanal (Creados vs Resueltos últimos 7 días)
    $sql_weekly_flow = "
        SELECT DATE(d) AS date, 
               COALESCE(SUM(CASE WHEN action = 'created' THEN count ELSE 0 END), 0) AS created,
               COALESCE(SUM(CASE WHEN action = 'resolved' THEN count ELSE 0 END), 0) AS resolved
        FROM (
            SELECT DATE(created_at) as d, 'created' as action, COUNT(id) as count 
            FROM incidencias 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY d
            UNION ALL
            SELECT DATE(updated_at) as d, 'resolved' as action, COUNT(id) as count 
            FROM incidencias 
            WHERE estado = 'resuelto' AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY d
        ) AS combined
        GROUP BY date
        ORDER BY date ASC";
    
    $weekly_flow_res = @$conn->query($sql_weekly_flow);
    $weekly_flow_output = [];
    if ($weekly_flow_res) {
        while ($row = $weekly_flow_res->fetch_assoc()) {
            $weekly_flow_output[] = [
                'date' => $row['date'],
                'created' => (int)$row['created'],
                'resolved' => (int)$row['resolved']
            ];
        }
    }

    // FINAL RESPONSE
    sendResponse(["status" => "success", "data" => [
        "total_incidents" => $total_incidents,
        "monthly_trend" => $monthly_data,
        "urgency_distribution" => $urgency_distribution,
        "afectacion_distribution" => $afectacion_distribution, 
        "weekly_status_flow" => $weekly_flow_output 
    ]]);
}


// --- 7. ACCIONES DE GESTIÓN DE USUARIOS (Superadmin ONLY) ---

/**
 * Crea un nuevo usuario administrador (Superadmin ONLY).
 */
function handleCreateAdmin($conn) {
    if (!isset($_SESSION['admin_logged_in']) || ($_SESSION['admin_role'] ?? '') !== 'superadmin') {
        return sendResponse(["status" => "error", "message" => "Permisos insuficientes. Solo Superadmin puede crear usuarios."], 403);
    }

    $usuario = $_POST['usuario'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'moderator';
    $access_type = $_POST['access_type'] ?? 'all';
    $district_access = $_POST['district_access'] ?? '';

    if (empty($usuario) || empty($password) || strlen($password) < 8) {
        return sendResponse(["status" => "error", "message" => "Usuario, email y contraseña (mínimo 8 caracteres) son obligatorios."], 400);
    }
    if (!filter_var($usuario, FILTER_VALIDATE_EMAIL)) {
        return sendResponse(["status" => "error", "message" => "El usuario debe ser un email válido."], 400);
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO admins (usuario, password, role, access_type, district_access) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        return sendResponse(["status" => "error", "message" => "Error DB al preparar creación de admin: " . $conn->error], 500);
    }
    
    $stmt->bind_param("sssss", $usuario, $hashed_password, $role, $access_type, $district_access);

    if ($stmt->execute()) {
        sendResponse(["status" => "success", "message" => "Administrador creado correctamente."]);
    } else {
        if ($stmt->errno === 1062) { // Código de error de duplicado MySQL
            return sendResponse(["status" => "error", "message" => "El usuario (email) ya existe."], 409);
        }
        return sendResponse(["status" => "error", "message" => "Error al crear el administrador: " . $stmt->error], 500);
    }
}

/**
 * Edita un usuario administrador existente (Superadmin ONLY).
 * CORREGIDA para evitar errores de referencia en bind_param.
 */
function handleUpdateAdmin($conn) {
    if (!isset($_SESSION['admin_logged_in']) || ($_SESSION['admin_role'] ?? '') !== 'superadmin') {
        return sendResponse(["status" => "error", "message" => "Permisos insuficientes. Solo Superadmin puede editar usuarios."], 403);
    }

    $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
    $usuario = $_POST['usuario'] ?? '';
    $password = $_POST['password'] ?? ''; // Opcional
    $role = $_POST['role'] ?? 'moderator';
    $access_type = $_POST['access_type'] ?? 'all';
    $district_access = $_POST['district_access'] ?? '';

    if (!$id || empty($usuario)) {
        return sendResponse(["status" => "error", "message" => "ID de usuario y nombre de usuario son obligatorios."], 400);
    }
    if (!filter_var($usuario, FILTER_VALIDATE_EMAIL)) {
        return sendResponse(["status" => "error", "message" => "El usuario debe ser un email válido."], 400);
    }
    
    $stmt = null;
    $hashed_password = null;

    if (!empty($password)) {
        if (strlen($password) < 8) {
            return sendResponse(["status" => "error", "message" => "La nueva contraseña debe tener al menos 8 caracteres."], 400);
        }
        // Caso 1: Actualizar contraseña y detalles (6 parámetros)
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $sql_final = "UPDATE admins SET usuario = ?, password = ?, role = ?, access_type = ?, district_access = ? WHERE id = ?";
        $stmt = $conn->prepare($sql_final);
        
        if (!$stmt) {
             error_log("SQL Error (Update with Pass): " . $conn->error);
             return sendResponse(["status" => "error", "message" => "Error DB al preparar actualización con contraseña."], 500);
        }
        $stmt->bind_param("sssssi", $usuario, $hashed_password, $role, $access_type, $district_access, $id);
        
    } else {
        // Caso 2: Solo actualizar detalles (5 parámetros)
        $sql_final = "UPDATE admins SET usuario = ?, role = ?, access_type = ?, district_access = ? WHERE id = ?";
        $stmt = $conn->prepare($sql_final);
        
        if (!$stmt) {
             error_log("SQL Error (Update No Pass): " . $conn->error);
             return sendResponse(["status" => "error", "message" => "Error DB al preparar actualización sin contraseña."], 500);
        }
        $stmt->bind_param("ssssi", $usuario, $role, $access_type, $district_access, $id);
    }
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            // Si el usuario edita su propio rol o acceso, la sesión debe ser actualizada
            if ($id == ($_SESSION['user_id'] ?? 0)) {
                $_SESSION['admin_role'] = $role;
                $_SESSION['access_type'] = $access_type;
                $_SESSION['district_access'] = $district_access;
            }
            sendResponse(["status" => "success", "message" => "Administrador actualizado correctamente."]);
        } else {
            sendResponse(["status" => "error", "message" => "No se encontró el administrador o no hubo cambios."]);
        }
    } else {
        return sendResponse(["status" => "error", "message" => "Error al ejecutar la actualización del administrador: " . $stmt->error], 500);
    }
}


/**
 * Maneja la gestión de usuarios admin (READ y DELETE).
 */
function handleUserManagement($conn) {
    if (!isset($_SESSION['admin_logged_in']) || ($_SESSION['admin_role'] ?? '') !== 'superadmin') {
        return sendResponse(["status" => "error", "message" => "Permisos insuficientes. Solo Superadmin."], 403);
    }
    
    $action = $_REQUEST['action'] ?? 'get_admins'; 
    
    if ($action === 'get_admins') {
        $sql = "SELECT id, usuario, role, 
                COALESCE(access_type, 'all') as access_type, 
                COALESCE(district_access, 'all') as district_access 
                FROM admins ORDER BY id DESC";

        $result = $conn->query($sql);
        
        if (!$result) {
            return sendResponse(["status" => "error", "message" => "SQL Error al obtener admins. Detalle: " . $conn->error], 500);
        }

        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        sendResponse(["status" => "success", "data" => $users]);
    } 
    
    if ($action === 'delete_admin' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id) return sendResponse(["status" => "error", "message" => "ID no válido."], 400);

        // 1. Comprobar si es el propio usuario o el único superadmin
        $check_sql = "SELECT id, role, usuario FROM admins WHERE id = ?";
        $stmt_check = $conn->prepare($check_sql);
        $stmt_check->bind_param("i", $id);
        $stmt_check->execute();
        $user_to_delete = $stmt_check->get_result()->fetch_assoc();
        
        if (!$user_to_delete) {
            return sendResponse(["status" => "error", "message" => "Usuario no encontrado."], 404);
        }

        if ($user_to_delete['id'] == ($_SESSION['user_id'] ?? 0)) {
            return sendResponse(["status" => "error", "message" => "No pots eliminar el teu propi compte mentre estàs connectat."], 403);
        }
        
        if ($user_to_delete['role'] === 'superadmin') {
            $count_res = $conn->query("SELECT COUNT(id) FROM admins WHERE role = 'superadmin'");
            if ($count_res && $count_res->fetch_row()[0] <= 1) {
                return sendResponse(["status" => "error", "message" => "No es pot eliminar l'últim Superadmin."], 403);
            }
        }

        // 2. Eliminar
        $sql = "DELETE FROM admins WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
             if ($stmt->affected_rows > 0) {
                 sendResponse(["status" => "success", "message" => "Usuari eliminat."]);
             } else {
                 sendResponse(["status" => "error", "message" => "L'usuari ja no existeix."], 404);
             }
        } else {
            return sendResponse(["status" => "error", "message" => "Error DB al eliminar usuari: " . $stmt->error], 500);
        }
    }
}


/**
 * Actualiza el estado de una incidencia.
 */
function handleUpdateStatus($conn) {
    if (!isset($_SESSION['admin_logged_in'])) {
        return sendResponse(["status" => "error", "message" => "No autorizado."], 401);
    }
    
    $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
    $new_status = $_POST['estado'] ?? ''; 

    if (!$id || !in_array($new_status, ['pendiente', 'proceso', 'resuelto'])) {
        return sendResponse(["status" => "error", "message" => "ID o estado no válido."], 400);
    }

    $sql = "UPDATE incidencias SET estado = ?, updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
          return sendResponse(["status" => "error", "message" => "Error al preparar la consulta de actualización. Detalle: " . $conn->error], 500);
    }
    
    $stmt->bind_param("si", $new_status, $id); 
    
    if ($stmt->execute()) {
        sendResponse(["status" => "success", "message" => "Estado actualizado correctamente."]);
    } else {
        return sendResponse(["status" => "error", "message" => "Error al ejecutar actualización de estado: " . $stmt->error], 500);
    }
}

/**
 * Verifica si el usuario está autenticado.
 */
function checkAuth() {
    if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
        sendResponse([
            'logged_in' => true, 
            'admin_role' => $_SESSION['admin_role'] ?? 'admin',
            'access_type' => $_SESSION['access_type'] ?? 'all',
            'district_access' => $_SESSION['district_access'] ?? null
        ]);
    } else {
        sendResponse(['logged_in' => false]);
    }
}

/**
 * Maneja el intento de inicio de sesión.
 */
function handleLogin($conn) {
    $usuario = $_POST['usuario'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($usuario) || empty($password)) {
        return sendResponse(["status" => "error", "message" => "Faltan credenciales."], 400);
    }

    $sql = "SELECT id, password, role, 
            COALESCE(access_type, 'all') as access_type, 
            COALESCE(district_access, 'all') as district_access 
            FROM admins WHERE usuario = ?";

    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
          return sendResponse(["status" => "error", "message" => "Error al preparar la consulta de login. Detalle: " . $conn->error], 500);
    }

    $stmt->bind_param("s", $usuario);
    
    if (!$stmt->execute()) {
        return sendResponse(["status" => "error", "message" => "Error al ejecutar la consulta de login. Detalle: " . $stmt->error], 500);
    }
    
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user) {
        if (password_verify($password, $user['password'])) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $usuario; 
            $_SESSION['admin_role'] = $user['role'];
            $_SESSION['access_type'] = $user['access_type'];
            $_SESSION['district_access'] = $user['district_access'];

            sendResponse(["status" => "success", "message" => "Login correcto", "role" => $user['role']]);
        } else {
            sendResponse(["status" => "error", "message" => "Contraseña incorrecta."], 401);
        }
    } else {
        sendResponse(["status" => "error", "message" => "Usuario no encontrado."], 401);
    }
}

/**
 * Cierra la sesión del administrador.
 */
function handleLogout() {
    session_unset();
    session_destroy();
    sendResponse(["status" => "success", "message" => "Logout correcto."]);
}


// --- 8. ROUTER PRINCIPAL ---

$conn = connectDB();

if (!$conn) {
    sendResponse(["status" => "error", "message" => "Fallo de conexión a la base de datos."], 503);
}

$action = $_REQUEST['action'] ?? '';

switch ($action) {
    case 'new_incident':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            handleNewIncident($conn);
        } else { sendResponse(["status" => "error", "message" => "Método no permitido."], 405); }
        break;

    case 'public_data':
        getPublicData($conn);
        break;
        
    case 'reverse_geocode':
        handleReverseGeocode();
        break;

    case 'public_stats': 
        getPublicStats($conn); 
        break;

    case 'vote':
    case 'unvote':
        $id = filter_var($_REQUEST['id'] ?? null, FILTER_VALIDATE_INT);
        handleVote($conn, $id, $action);
        break;

    // --- ACCIONES DE ADMIN ---
    case 'check_auth':
        checkAuth();
        break;
        
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            handleLogin($conn);
        } else { sendResponse(["status" => "error", "message" => "Método no permitido."], 405); }
        break;
        
    case 'logout':
        handleLogout();
        break;
        
    case 'admin_data':
        getAdminData($conn);
        break;
        
    case 'update_status':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            handleUpdateStatus($conn);
        } else { sendResponse(["status" => "error", "message" => "Método no permitido."], 405); }
        break;
        
    case 'admin_stats':
        getAdminStats($conn);
        break;

    case 'get_admins':
        handleUserManagement($conn);
        break;
        
    case 'create_admin':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            handleCreateAdmin($conn);
        } else { sendResponse(["status" => "error", "message" => "Método no permitido."], 405); }
        break;
        
    case 'update_admin':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            handleUpdateAdmin($conn);
        } else { sendResponse(["status" => "error", "message" => "Método no permitido."], 405); }
        break;
        
    case 'delete_admin':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            handleUserManagement($conn); // Usa la misma función, que contiene la lógica para DELETE
        } else { sendResponse(["status" => "error", "message" => "Método no permitido."], 405); }
        break;
        
    default:
        sendResponse(["status" => "error", "message" => "Acción desconocida."], 404);
        break;
}

$conn->close();
?>