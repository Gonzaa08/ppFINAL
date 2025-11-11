<?php
// Incluye el archivo de conexión
require_once 'conexion.php';

// Verifica que la solicitud sea POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 1. Obtener y sanear datos del formulario (RF1)
    $title = $conn->real_escape_string($_POST['title']);
    $description = $conn->real_escape_string($_POST['description']);
    $event_date = $conn->real_escape_string($_POST['date']);
    $location = $conn->real_escape_string($_POST['location']);
    $address = $conn->real_escape_string($_POST['address']);
    $cost = floatval($_POST['cost']);
    $capacity = intval($_POST['capacity']);
    
    // NUEVO: Obtener la URL de la imagen (puede venir como Base64 o URL)
    $imageUrl = isset($_POST['imageUrl']) ? $_POST['imageUrl'] : '';
    
    // Si no hay imagen, usar una por defecto
    if (empty($imageUrl)) {
        $imageUrl = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=160&fit=crop';
    }

    // 2. Preparar la consulta SQL
    // IMPORTANTE: Asegúrate de que tu tabla 'events' tenga una columna 'image_url' VARCHAR(500)
    $sql = "INSERT INTO events (title, description, event_date, location, cost, capacity, address, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    if ($stmt = $conn->prepare($sql)) {
        // 3. Vincular parámetros (agregamos 's' al final para image_url que es string)
        $stmt->bind_param("sssssdiss", $title, $description, $event_date, $location, $cost, $capacity, $address, $imageUrl);
        
        // 4. Ejecutar la consulta
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Evento creado exitosamente en la base de datos."]);
        } else {
            // MOSTRAR EL ERROR REAL DE MYSQL
            echo json_encode(["success" => false, "message" => "Error al guardar el evento: " . $stmt->error . " | Código SQL: " . $sql]); 
        }

        // 5. Cerrar sentencia
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "message" => "Error de preparación de la consulta: " . $conn->error]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Método de solicitud no válido."]);
}

// 6. Cerrar conexión
$conn->close();
?>