<?php
// Define las credenciales de la base de datos
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');     
define('DB_NAME', 'evento_db');
define('DB_PORT', 3307); // <--- PUERTO DEFINIDO COMO CONSTANTE

// Intenta establecer la conexión con MySQL
// ⚠️ USAMOS LA CONSTANTE DB_PORT (3307) como QUINTO ARGUMENTO ⚠️
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);

// Verifica la conexión
if ($conn === false) {
    // Si la conexión falla, detenemos la ejecución y mostramos el error de MySQL
    die(json_encode([
        "success" => false, 
        "message" => "ERROR DE CONEXIÓN: No se pudo conectar a la base de datos. Puerto: 3307. Razón: " . $conn->connect_error
    ]));
}

// Opcional: Configura el conjunto de caracteres a UTF8
$conn->set_charset("utf8");
?>

