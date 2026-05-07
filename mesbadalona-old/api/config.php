<?php

$envFile = __DIR__ . '/.env';

if (!file_exists($envFile)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Fitxer de configuració no trobat."]);
    exit;
}

$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#')) continue;
    if (strpos($line, '=') === false) continue;
    [$key, $value] = explode('=', $line, 2);
    $key   = trim($key);
    $value = trim($value);
    if (!defined($key)) {
        define($key, $value);
    }
}

if (!defined('DB_HOST') || !defined('DB_USER') || !defined('DB_PASS') || !defined('DB_NAME')) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Configuració de base de dades incompleta."]);
    exit;
}
