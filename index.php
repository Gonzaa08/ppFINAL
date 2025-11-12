<?php
// Verificar sesión al inicio
session_start();

// Si no está logueado, redirigir al login
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.html');
    exit();
}

// Obtener información del usuario
$user_name = $_SESSION['user_name'] ?? 'Usuario';
$user_email = $_SESSION['user_email'] ?? '';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evento App - Gestión de Reuniones</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

<div class="app-container">

    <div id="screen-events" class="screen active">
        <div class="screen-header">
            <div>
                <h2 class="text-xl font-bold text-white">Eventos Disponibles</h2>
                <p class="text-xs text-text-light mt-1">Bienvenido, <?php echo htmlspecialchars($user_name); ?></p>
            </div>
            <div class="flex gap-2">
                <button onclick="navigate('screen-create-event')" class="btn-accent text-sm px-3 py-2">
                    <i class="fas fa-plus mr-1"></i> Crear Evento
                </button>
                <button onclick="logout()" class="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg transition" title="Cerrar sesión">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
        
        <input type="text" class="form-control mb-4" placeholder="Buscar eventos..." oninput="filterEvents(this.value)">

        <div id="events-list" class="flex flex-col space-y-3">
        </div>
    </div>

    <div id="screen-event-details" class="screen">
        <div class="screen-header">
            <h2 class="text-xl font-bold text-white flex items-center">
                <i class="fas fa-arrow-left text-lg mr-3 cursor-pointer" onclick="navigate('screen-events')"></i> 
                <span id="event-details-title-header">Detalles del Evento</span>
            </h2>
        </div>

        <div id="event-details-content" class="flex flex-col space-y-5">
            <div class="relative w-full h-40 bg-gray-700 rounded-xl overflow-hidden shadow-lg">
                <img id="event-details-image" src="https://via.placeholder.com/400x160/2d3748/ffffff?text=Imagen+del+Evento" alt="Imagen del evento" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            </div>

            <div class="text-center">
                <h3 id="event-details-title" class="text-2xl font-bold text-white"></h3>
                <p id="event-details-date-location" class="text-sm text-text-light mt-1"></p>
                <p id="event-details-address" class="text-xs text-text-light"></p>
            </div>

            <div class="grid grid-cols-4 gap-2 mt-4">
                <button onclick="manageEventAdmin()" class="event-action-button"><i class="fas fa-dollar-sign"></i> <span>Administrar</span></button>
                <button onclick="controlEventAssistance()" class="event-action-button"><i class="fas fa-clipboard-check"></i> <span>Control Asist...</span></button>
                <button onclick="generateReport()" class="event-action-button"><i class="fas fa-chart-pie"></i> <span>Reportes</span></button>
                <button onclick="editCurrentEvent()" class="event-action-button"><i class="fas fa-edit"></i> <span>Editar Evento</span></button>
            </div>

            <h4 class="text-lg font-bold text-white mt-6 border-b border-border-color pb-2">Indicadores del Evento</h4>
            <div class="grid grid-cols-3 gap-3">
                <div class="indicator-card">
                    <span class="text-sm text-text-light">Capacidad</span>
                    <span id="event-capacity" class="text-white font-semibold">--</span>
                </div>
                <div class="indicator-card">
                    <span class="text-sm text-text-light">Disponibles</span>
                    <span id="event-available-spots" class="text-white font-semibold">--</span>
                </div>
                <div class="indicator-card">
                    <span class="text-sm text-text-light">Precio</span>
                    <span id="event-price" class="text-white font-semibold">--</span>
                </div>
            </div>

            <h4 class="text-lg font-bold text-white mt-6 border-b border-border-color pb-2">Detalles del Evento</h4>
            <div class="detail-item">
                <span class="detail-label">Descripción</span>
                <span id="event-details-description" class="detail-value text-right"></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Fecha y Hora</span>
                <span id="event-details-datetime" class="detail-value"></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ubicación</span>
                <span id="event-details-location" class="detail-value"></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Dirección</span>
                <span id="event-details-full-address" class="detail-value"></span>
            </div>

            <h4 class="text-lg font-bold text-white mt-6 border-b border-border-color pb-2">Participantes Inscritos</h4>
            <div class="flex items-center gap-2 mb-4">
                <input type="text" class="form-control flex-grow mb-0" placeholder="Buscar participante..." oninput="filterEventParticipants(this.value)">
                <button class="btn-accent text-sm px-3 py-2"><i class="fas fa-plus"></i> Add</button>
            </div>
            
            <div id="event-details-participants-list" class="flex flex-col space-y-2">
                <div class="event-participant-row">
                    <div class="flex items-center gap-3">
                        <img src="https://i.pravatar.cc/150?img=68" alt="MicaelaRamos" class="w-8 h-8 rounded-full object-cover">
                        <span class="text-white text-sm">Micaela Ramos</span>
                    </div>
                    <span class="status-badge pending">Por Confirmar</span>
                    <span class="status-badge default">No Pago</span>
                </div>
            </div>
        </div>
    </div>


    <div id="screen-confirm-assistance" class="screen">
        <div class="screen-header">
            <h2 class="text-xl font-bold text-white flex items-center">
                <i class="fas fa-arrow-left text-lg mr-3 cursor-pointer" onclick="navigate('screen-events')"></i> Confirmar Asistencia
            </h2>
        </div>
        
        <form id="form-confirm-assistance" class="flex flex-col space-y-4">
            <input type="text" id="assistance-name" class="form-control" placeholder="Nombre Completo" required>
            <input type="email" id="assistance-email" class="form-control" placeholder="Email" required>
            
            <div class="p-4 bg-gray-800 border border-border-color rounded-lg">
                <label for="assistance-payment-proof" class="text-sm font-medium text-white mb-2 block">Comprobante de Pago (Opcional)</label>
                <input type="file" id="assistance-payment-proof" class="form-control border-none p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white" accept="image/*">
            </div>

            <button type="submit" class="btn-accent mt-6">Confirmar Asistencia</button>
        </form>
    </div>
    
<div id="screen-payments" class="screen">
    <div class="screen-header">
        <h2 class="text-xl font-bold text-white">Pagos</h2>
        <button onclick="navigate('screen-register-payment')" class="btn-accent text-sm px-3 py-2">
            <i class="fas fa-plus mr-1"></i> Add
        </button>
    </div>
    
    <div class="payment-tabs mb-4">
        <button class="payment-tab active" data-filter="all" onclick="filterPaymentsByTab('all', this)">
            <i class="fas fa-list"></i>
            <span>Registrados</span>
        </button>
        <button class="payment-tab" data-filter="my_payments" onclick="filterPaymentsByTab('my_payments', this)">
            <i class="fas fa-wallet"></i>
            <span>Mis Pagos</span>
        </button>
        <button class="payment-tab" data-filter="pending" onclick="filterPaymentsByTab('pending', this)">
            <i class="fas fa-clock"></i>
            <span>Pendientes</span>
            <span id="pending-badge" class="payment-badge hidden">0</span>
        </button>
    </div>
    
    <div id="payment-stats" class="payment-stats-grid mb-4 hidden">
        <div class="stat-card">
            <i class="fas fa-check-circle text-green-500"></i>
            <div>
                <span class="stat-label">Pagados</span>
                <span class="stat-value" id="stat-confirmed">0</span>
            </div>
        </div>
        <div class="stat-card">
            <i class="fas fa-clock text-yellow-500"></i>
            <div>
                <span class="stat-label">Pendientes</span>
                <span class="stat-value" id="stat-pending">0</span>
            </div>
        </div>
        <div class="stat-card">
            <i class="fas fa-exclamation-circle text-red-500"></i>
            <div>
                <span class="stat-label">Vencidos</span>
                <span class="stat-value" id="stat-overdue">0</span>
            </div>
        </div>
    </div>
    
    <div class="flex items-center gap-2 mb-4">
        <input type="text" id="payment-search" class="form-control flex-grow mb-0" placeholder="Buscar pago..." oninput="searchPayments(this.value)">
        <button onclick="togglePaymentFilters()" class="bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition">
            <i class="fas fa-filter"></i>
        </button>
    </div>
    
    <div id="advanced-filters" class="advanced-filters hidden mb-4">
        <div class="filter-group">
            <label class="filter-label">Estado</label>
            <div class="filter-options">
                <label class="filter-checkbox">
                    <input type="checkbox" value="pending" checked onchange="applyAdvancedFilters()">
                    <span>Pendiente</span>
                </label>
                <label class="filter-checkbox">
                    <input type="checkbox" value="processing" checked onchange="applyAdvancedFilters()">
                    <span>Procesando</span>
                </label>
                <label class="filter-checkbox">
                    <input type="checkbox" value="confirmed" checked onchange="applyAdvancedFilters()">
                    <span>Pagado</span>
                </label>
                <label class="filter-checkbox">
                    <input type="checkbox" value="overdue" checked onchange="applyAdvancedFilters()">
                    <span>Vencido</span>
                </label>
            </div>
        </div>
    </div>
    
    <div id="payments-list" class="flex flex-col space-y-3">
        </div>
    
    <div id="payments-loading" class="text-center py-8 hidden">
        <i class="fas fa-spinner fa-spin text-4xl text-accent-blue"></i>
        <p class="text-text-light mt-2">Cargando pagos...</p>
    </div>
    
    <div id="payments-empty" class="text-center py-12 hidden">
        <i class="fas fa-receipt text-6xl text-gray-600 mb-4"></i>
        <p class="text-text-light text-lg">No hay pagos para mostrar</p>
        <p class="text-text-light text-sm mt-2">Los pagos aparecerán aquí cuando se registren</p>
    </div>
</div>

<div id="payment-detail-modal" class="payment-modal hidden">
    <div class="payment-modal-content">
        <div class="payment-modal-header">
            <h3 class="text-xl font-bold text-white">Detalle del Pago</h3>
            <button onclick="closePaymentDetailModal()" class="text-text-light hover:text-white">
                <i class="fas fa-times text-2xl"></i>
            </button>
        </div>
        <div id="payment-detail-body" class="payment-modal-body">
            </div>
    </div>
</div>

    <div id="screen-create-event" class="screen">
        <div class="screen-header">
            <h2 class="text-xl font-bold text-white flex items-center">
                <i class="fas fa-arrow-left text-lg mr-3 cursor-pointer" onclick="navigate('screen-events')"></i> Crear Nuevo Evento
            </h2>
        </div>
        
        <form id="form-create-event" class="flex flex-col space-y-4">
            <div class="p-4 bg-gray-800 border border-border-color rounded-lg">
                <label for="event-image" class="text-sm font-medium text-white mb-2 block">
                    <i class="fas fa-image mr-2"></i>Imagen del Evento
                </label>
                <input type="file" id="event-image" class="form-control border-none p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white" accept="image/*">
                <p class="text-xs text-text-light mt-2">Recomendado: 400x160px. Si no subes una imagen, se usará una por defecto.</p>
                
                <div id="image-preview-container" class="mt-3 hidden">
                    <img id="image-preview" src="" alt="Preview" class="w-full h-32 object-cover rounded-lg">
                </div>
            </div>

            <input type="text" id="event-title" class="form-control" placeholder="Título del Evento" required>
            <textarea id="event-description" class="form-control" placeholder="Descripción del Evento" rows="3" required></textarea>
            <input type="date" id="event-date" class="form-control" required>
            <input type="text" id="event-location" class="form-control" placeholder="Lugar (Ej: Salón de Eventos X)" required>
            <input type="text" id="event-address" class="form-control" placeholder="Dirección completa" required>
            <input type="number" id="event-cost" class="form-control" placeholder="Costo por Persona (Ej: 50.00)" required>
            <input type="number" id="event-capacity" class="form-control" placeholder="Capacidad total de cupos" required>
            
            <h3 class="text-lg font-medium text-white pt-4 border-t border-border-color">Opciones de Gestión</h3>
            
            <input type="number" id="reminder-days" class="form-control" placeholder="Recordatorio (días antes del pago)">
            
            <button type="submit" class="btn-accent mt-6">Crear Evento</button>
        </form>
    </div>

    <div id="screen-assistances" class="screen">
        <div class="screen-header">
            <h2 class="text-xl font-bold text-white">Asistencias Confirmadas</h2>
            <button class="btn-accent text-sm px-3 py-2"><i class="fas fa-plus mr-1"></i> Add</button>
        </div>
        
        <input type="text" class="form-control mb-4" placeholder="Buscar..." oninput="filterAssistances(this.value)">

        <div id="assistances-list" class="flex flex-col space-y-3">
        </div>
    </div>


    <div class="nav-bar">
        <div class="nav-item active" onclick="navigate('screen-events', this)">
            <i class="fas fa-calendar-alt"></i>
            <span>Eventos</span>
        </div>
        <div class="nav-item" onclick="navigate('screen-payments', this)">
            <i class="fas fa-wallet"></i>
            <span>Pagos</span>
        </div>
        <div class="nav-item" onclick="navigate('screen-assistances', this)">
            <i class="fas fa-clipboard-check"></i>
            <span>Asistencias</span>
        </div>
        <div class="nav-item" onclick="navigate('screen-confirm-assistance', this)">
            <i class="fas fa-user-check"></i>
            <span>Confirmar</span>
        </div>
    </div>
</div>

<div id="event-summary-modal" class="modal-overlay hidden">
    <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
            <h3 class="modal-title">📊 Resumen del Evento</h3>
            <button class="modal-close-btn" onclick="closeEventSummaryModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body" id="event-summary-body">
            </div>
    </div>
</div>

<div id="monthly-report-modal" class="modal-overlay hidden">
    <div class="modal-content" style="max-width: 700px; max-height: 90vh;">
        <div class="modal-header">
            <h3 class="modal-title">📅 Reporte Mensual</h3>
            <button class="modal-close-btn" onclick="closeMonthlyReportModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div id="monthly-report-loading" class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-4xl mb-3" style="color: var(--accent-blue);"></i>
                <p class="text-text-light">Cargando reporte...</p>
            </div>
            
            <div id="monthly-report-content" class="hidden">
                </div>
        </div>
    </div>
</div>

<button onclick="showMonthlyReport()" class="floating-button" title="Ver Reporte Mensual" style="
    position: fixed;
    bottom: 100px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #F59E42, #7047EB);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(245, 158, 66, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 900;
    border: none;
">
    <i class="fas fa-file-invoice" style="color: white; font-size: 24px;"></i>
</button>

<script>
// Funciones JS simples (logout, preview)
// Esto asegura que el código PHP/HTML que estaba aquí se mueva, evitando el error de sintaxis.

// Función de logout
function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        window.location.href = 'logout.php';
    }
}

// Preview de imagen al seleccionar archivo
document.getElementById('event-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('image-preview').src = event.target.result;
            document.getElementById('image-preview-container').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});
</script>

<style>
.floating-button:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 30px rgba(245, 158, 66, 0.6);
}

/* Estilos para los modales de reportes */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal-content {
    background-color: var(--bg-dark);
    border-radius: 20px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    border: 2px solid var(--border-color);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
    padding: 20px;
    border-bottom: 2px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background-color: var(--bg-dark);
    z-index: 10;
}

.modal-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--text-white);
}

.modal-close-btn {
    background: none;
    border: none;
    color: var(--text-light);
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.3s ease;
    padding: 5px 10px;
}

.modal-close-btn:hover {
    color: var(--text-white);
}

.modal-body {
    padding: 20px;
}

/* Scrollbar personalizado */
.modal-content::-webkit-scrollbar {
    width: 8px;
}

.modal-content::-webkit-scrollbar-track {
    background: var(--bg-card);
}

.modal-content::-webkit-scrollbar-thumb {
    background: var(--accent-blue);
    border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
    background: #F59E42;
}

/* Animación de aparición */
.modal-overlay:not(.hidden) {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 🛑 REGLA CLAVE PARA OCULTAR ELEMENTOS POR DEFECTO 🛑 */
.hidden {
    display: none !important;
}

/* Responsive */
@media (max-width: 500px) {
    .floating-button {
        bottom: 90px;
        right: 15px;
        width: 56px;
        height: 56px;
    }
    
    .floating-button i {
        font-size: 20px;
    }
    
    .modal-content {
        border-radius: 15px;
    }
    
    .modal-header {
        padding: 15px;
    }
    
    .modal-title {
        font-size: 1.2rem;
    }
    
    .modal-body {
        padding: 15px;
    }
}
</style>

<script src="script.js"></script>

</body>
</html>