<?php
// Incluye el archivo de conexión
require_once 'conexion.php';

// Array para almacenar todos los eventos
$events_array = [];

// Consulta SQL para seleccionar los eventos creados
// INCLUIMOS el campo image_url
$sql = "SELECT 
            id, 
            title, 
            description, 
            event_date AS date, 
            location, 
            cost AS costPerPerson, 
            capacity, 
            address,
            image_url AS imageUrl
        FROM events 
        ORDER BY event_date DESC";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        
        // Conversión de tipos y adición de campos que JS espera
        $row['id'] = (int)$row['id'];
        $row['costPerPerson'] = (float)$row['costPerPerson'];
        $row['capacity'] = (int)$row['capacity'];
        
        // Añadir campos por defecto que necesita el JS y que no están en la DB (por ahora)
        $row['time'] = '20:00'; // Hora por defecto
        $row['registeredParticipants'] = 0; // Se calcularía con otra tabla
        $row['reminderDays'] = 0; // Días de recordatorio por defecto
        
        // Si no tiene imageUrl, usar imagen por defecto
        if (empty($row['imageUrl'])) {
            $row['imageUrl'] = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=160&fit=crop';
        }

        $events_array[] = $row;
    }
}

// Envía la cabecera JSON y los datos en la estructura { events: [...] }
header('Content-Type: application/json');
echo json_encode(['events' => $events_array]);

$conn->close();
?>