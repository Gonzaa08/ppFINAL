// ===============================================
// 1. BASE DE DATOS Y ESTRUCTURA DE DATOS
// ===============================================

let currentScreen = 'screen-events'; 
let activeEventId = null; 

let db = {
    events: [],
    participants: [],
    payments: [],
    assistances: []
}; 

// Array de imágenes de placeholder temáticas para eventos
const defaultEventImages = [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=160&fit=crop',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=160&fit=crop',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=160&fit=crop',
    'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&h=160&fit=crop',
    'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=400&h=160&fit=crop',
];

function getRandomDefaultImage() {
    return defaultEventImages[Math.floor(Math.random() * defaultEventImages.length)];
}

async function fetchDatabaseData() {
    try {
        const response = await fetch('obtener_eventos.php'); 
        if (!response.ok) {
            console.error("Error al obtener datos del servidor:", response.statusText);
            throw new Error('Error al cargar la base de datos desde PHP.');
        }
        
        const eventsData = await response.json();
        console.log('Eventos recibidos:', eventsData); // DEBUG
        
        return {
            events: eventsData.events || [], 
            participants: [], 
            payments: [],     
            assistances: []   
        };

    } catch (e) {
        console.error("Fallo al obtener datos del servidor:", e);
        return { events: [], participants: [], payments: [], assistances: [] };
    }
}

async function loadDatabase() {
    console.log('Cargando base de datos...'); // DEBUG
    const data = await fetchDatabaseData();
    db = data;
    console.log('Base de datos cargada:', db); // DEBUG
    loadEvents();
}

// ===============================================
// 2. FUNCIONES DE NAVEGACIÓN Y UTILIDAD
// ===============================================

function navigate(screenId, navElement = null, eventId = null) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    activeEventId = eventId;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    if (navElement) {
        navElement.classList.add('active');
    } else {
        if (screenId.includes('event') && screenId !== 'screen-events') {
            const eventsNav = document.querySelector('.nav-item[onclick*="screen-events"]');
            if (eventsNav) eventsNav.classList.add('active');
        } else if (screenId.includes('payment')) {
            const paymentsNav = document.querySelector('.nav-item[onclick*="screen-payments"]');
            if (paymentsNav) paymentsNav.classList.add('active');
        } else if (screenId.includes('assistance')) {
            const assistNav = document.querySelector('.nav-item[onclick*="screen-assistances"]');
            if (assistNav) assistNav.classList.add('active');
        }
    }

    if (screenId === 'screen-events') loadEvents();
    if (screenId === 'screen-event-details' && eventId) loadEventDetails(eventId);
    if (screenId === 'screen-payments') loadPayments(currentPaymentFilter);
    if (screenId === 'screen-assistances') loadAssistances();
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day} de ${getMonthName(parseInt(month))} de ${year}`;
}

function getMonthName(month) {
    const names = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return names[month - 1];
}

function getStatusClass(status) {
    switch(status) {
        case 'pending': return 'pending';
        case 'processing': return 'processing';
        case 'confirmed': return 'confirmed';
        case 'overdue': return 'pending';
        default: return 'default';
    }
}

// ===============================================
// 3. CARGA DE DATOS EN PANTALLAS - EVENTOS
// ===============================================

function loadEvents(events = db.events) {
    console.log('loadEvents llamado con:', events); // DEBUG
    const listContainer = document.getElementById('events-list');
    
    if (!listContainer) {
        console.error('No se encontró el contenedor events-list');
        return;
    }
    
    if (!events || events.length === 0) {
        listContainer.innerHTML = '<p class="text-text-light text-center mt-8">No hay eventos disponibles. ¡Crea tu primer evento!</p>';
        return;
    }
    
    listContainer.innerHTML = events.map(event => {
        let imageUrl = event.imageUrl;
        if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder')) {
            imageUrl = getRandomDefaultImage();
        }
        
        return `
        <div class="event-card-item" onclick="navigate('screen-event-details', null, ${event.id})">
            <img src="${imageUrl}" alt="${event.title}" onerror="this.src='${getRandomDefaultImage()}'">
            <div class="event-card-details">
                <div class="event-card-title">${event.title}</div>
                <div class="event-card-info">${formatDate(event.date)}</div>
                <div class="event-card-info">${event.location}</div>
            </div>
        </div>
    `}).join('');
}

function filterEvents(query) {
    const filtered = db.events.filter(event => 
        event.title.toLowerCase().includes(query.toLowerCase()) || 
        event.location.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase())
    );
    loadEvents(filtered);
}

function loadEventDetails(eventId) {
    const event = db.events.find(e => e.id === eventId);
    if (!event) {
        alert('Evento no encontrado.');
        navigate('screen-events');
        return;
    }

    let imageUrl = event.imageUrl;
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder')) {
        imageUrl = getRandomDefaultImage();
    }

    document.getElementById('event-details-title-header').innerText = event.title;
    document.getElementById('event-details-image').src = imageUrl;
    document.getElementById('event-details-image').onerror = function() {
        this.src = getRandomDefaultImage();
    };
    document.getElementById('event-details-title').innerText = event.title;
    document.getElementById('event-details-date-location').innerText = `${formatDate(event.date)} ${event.time} • ${event.location}`;
    document.getElementById('event-details-address').innerText = event.address;

    document.getElementById('event-capacity').innerText = event.capacity === 0 ? 'Ilimitada' : event.capacity;
    const availableSpots = event.capacity - event.registeredParticipants;
    document.getElementById('event-available-spots').innerText = availableSpots >= 0 ? availableSpots : 'N/A';
    document.getElementById('event-price').innerText = event.costPerPerson === 0 ? 'Gratis' : formatCurrency(event.costPerPerson);

    document.getElementById('event-details-description').innerText = event.description;
    document.getElementById('event-details-datetime').innerText = `${formatDate(event.date)} a las ${event.time}`;
    document.getElementById('event-details-location').innerText = event.location;
    document.getElementById('event-details-full-address').innerText = event.address;

    const eventParticipantsList = document.getElementById('event-details-participants-list');
    const participantsForEvent = db.participants.filter(p => p.eventId === eventId);
    if (participantsForEvent.length === 0) {
        eventParticipantsList.innerHTML = `<p class="text-text-light text-center mt-4">No hay participantes inscritos aún para este evento.</p>`;
    } else {
        eventParticipantsList.innerHTML = participantsForEvent.map(p => `
            <div class="event-participant-row">
                <div class="flex items-center gap-3">
                    <img src="${p.profilePic}" alt="${p.name}" class="w-8 h-8 rounded-full object-cover">
                    <span class="text-white text-sm">${p.name}</span>
                </div>
                <span class="status-badge ${p.confirmed ? 'confirmed' : 'pending'}">${p.confirmed ? 'Confirmado' : 'Pendiente'}</span>
                <span class="status-badge ${p.paid ? 'confirmed' : 'default'}">${p.paid ? 'Pago' : 'No Pago'}</span>
            </div>
        `).join('');
    }
}

function filterEventParticipants(query) {
    const event = db.events.find(e => e.id === activeEventId);
    if (!event) return;

    const filtered = db.participants.filter(p => 
        p.eventId === activeEventId &&
        (p.name.toLowerCase().includes(query.toLowerCase()) || 
         p.email.toLowerCase().includes(query.toLowerCase()))
    );

    const eventParticipantsList = document.getElementById('event-details-participants-list');
    if (filtered.length === 0) {
        eventParticipantsList.innerHTML = `<p class="text-text-light text-center mt-4">No se encontraron participantes con ese criterio en este evento.</p>`;
    } else {
        eventParticipantsList.innerHTML = filtered.map(p => `
            <div class="event-participant-row">
                <div class="flex items-center gap-3">
                    <img src="${p.profilePic}" alt="${p.name}" class="w-8 h-8 rounded-full object-cover">
                    <span class="text-white text-sm">${p.name}</span>
                </div>
                <span class="status-badge ${p.confirmed ? 'confirmed' : 'pending'}">${p.confirmed ? 'Confirmado' : 'Pendiente'}</span>
                <span class="status-badge ${p.paid ? 'confirmed' : 'default'}">${p.paid ? 'Pago' : 'No Pago'}</span>
            </div>
        `).join('');
    }
}

// ===============================================
// SISTEMA DE PAGOS CON FILTROS
// ===============================================

let currentPaymentFilter = 'all';
let allPayments = [];
let filteredPayments = [];

async function loadPayments(filter = 'all') {
    console.log('Cargando pagos con filtro:', filter); // DEBUG
    currentPaymentFilter = filter;
    
    const loadingEl = document.getElementById('payments-loading');
    const listEl = document.getElementById('payments-list');
    const emptyEl = document.getElementById('payments-empty');
    
    if (!loadingEl || !listEl || !emptyEl) {
        console.error('Elementos de pagos no encontrados');
        return;
    }
    
    loadingEl.classList.remove('hidden');
    listEl.classList.add('hidden');
    emptyEl.classList.add('hidden');
    
    try {
        const response = await fetch(`obtener_pagos.php?filter=${filter}`);
        const result = await response.json();
        
        console.log('Respuesta de pagos:', result); // DEBUG
        
        if (result.success) {
            allPayments = result.payments;
            filteredPayments = allPayments;
            
            updatePaymentStats(result.stats);
            renderPayments(filteredPayments);
            
            loadingEl.classList.add('hidden');
            
            if (filteredPayments.length === 0) {
                emptyEl.classList.remove('hidden');
            } else {
                listEl.classList.remove('hidden');
            }
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error al cargar pagos:', error);
        loadingEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        alert('Error al cargar los pagos: ' + error.message);
    }
}

function updatePaymentStats(stats) {
    const confirmedEl = document.getElementById('stat-confirmed');
    const pendingEl = document.getElementById('stat-pending');
    const overdueEl = document.getElementById('stat-overdue');
    
    if (confirmedEl) confirmedEl.textContent = stats.confirmed;
    if (pendingEl) pendingEl.textContent = stats.pending;
    if (overdueEl) overdueEl.textContent = stats.overdue;
    
    const pendingBadge = document.getElementById('pending-badge');
    const totalPending = stats.pending + stats.overdue;
    if (pendingBadge) {
        if (totalPending > 0) {
            pendingBadge.textContent = totalPending;
            pendingBadge.classList.remove('hidden');
        } else {
            pendingBadge.classList.add('hidden');
        }
    }
    
    const statsEl = document.getElementById('payment-stats');
    if (statsEl) {
        if (currentPaymentFilter === 'all') {
            statsEl.classList.remove('hidden');
        } else {
            statsEl.classList.add('hidden');
        }
    }
}

function renderPayments(payments) {
    const listContainer = document.getElementById('payments-list');
    
    if (!listContainer) return;
    
    if (payments.length === 0) {
        const emptyEl = document.getElementById('payments-empty');
        if (emptyEl) emptyEl.classList.remove('hidden');
        listContainer.classList.add('hidden');
        return;
    }
    
    listContainer.innerHTML = payments.map(payment => {
        const statusClass = getStatusClass(payment.actual_status);
        const statusText = getStatusText(payment.actual_status);
        const statusIcon = getStatusIcon(payment.actual_status);
        
        const paymentDate = formatDate(payment.payment_date);
        const dueDate = payment.due_date ? formatDate(payment.due_date) : null;
        
        let dateDisplay = paymentDate;
        if (payment.actual_status === 'pending' || payment.actual_status === 'overdue') {
            dateDisplay = dueDate ? `Vence: ${dueDate}` : paymentDate;
        }
        
        let overdueAlert = '';
        if (payment.actual_status === 'overdue' && payment.days_overdue) {
            overdueAlert = `<span class="text-xs text-red-400 mt-1 block"><i class="fas fa-exclamation-triangle"></i> Vencido hace ${payment.days_overdue} días</span>`;
        } else if (payment.days_until_due && payment.days_until_due <= 3) {
            overdueAlert = `<span class="text-xs text-yellow-400 mt-1 block"><i class="fas fa-clock"></i> Vence en ${payment.days_until_due} días</span>`;
        }
        
        return `
            <div class="list-card payment-list-item cursor-pointer" data-status="${payment.actual_status}" onclick="showPaymentDetail(${payment.id})">
                <div class="flex items-start gap-3 flex-1">
                    ${payment.participant_pic ? 
                        `<img src="${payment.participant_pic}" class="w-12 h-12 rounded-full object-cover" alt="${payment.participant_name}">` : 
                        `<div class="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                            <i class="fas fa-user text-gray-400"></i>
                        </div>`
                    }
                    <div class="flex-1">
                        <div class="font-bold text-white">${payment.participant_name}</div>
                        <div class="text-sm text-text-light">${payment.payment_type} • ${payment.event_title}</div>
                        <div class="text-xs text-text-light mt-1">${dateDisplay}</div>
                        ${overdueAlert}
                        ${payment.payment_method ? `<span class="text-xs text-text-light mt-1 block"><i class="fas fa-credit-card"></i> ${payment.payment_method}</span>` : ''}
                    </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <span class="text-lg font-bold text-white">${formatCurrency(payment.amount)}</span>
                    <span class="status-badge ${statusClass}">
                        <i class="${statusIcon}"></i> ${statusText}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function filterPaymentsByTab(filter, tabElement) {
    document.querySelectorAll('.payment-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    tabElement.classList.add('active');
    
    loadPayments(filter);
}

function searchPayments(query) {
    if (!query.trim()) {
        filteredPayments = allPayments;
    } else {
        const lowerQuery = query.toLowerCase();
        filteredPayments = allPayments.filter(payment => 
            payment.participant_name.toLowerCase().includes(lowerQuery) ||
            payment.payment_type.toLowerCase().includes(lowerQuery) ||
            payment.event_title.toLowerCase().includes(lowerQuery) ||
            (payment.payment_method && payment.payment_method.toLowerCase().includes(lowerQuery))
        );
    }
    
    renderPayments(filteredPayments);
}

function togglePaymentFilters() {
    const filtersEl = document.getElementById('advanced-filters');
    if (filtersEl) filtersEl.classList.toggle('hidden');
}

function applyAdvancedFilters() {
    const checkboxes = document.querySelectorAll('#advanced-filters input[type="checkbox"]:checked');
    const selectedStatuses = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedStatuses.length === 0) {
        filteredPayments = [];
    } else {
        filteredPayments = allPayments.filter(payment => 
            selectedStatuses.includes(payment.actual_status)
        );
    }
    
    renderPayments(filteredPayments);
}

function showPaymentDetail(paymentId) {
    const payment = allPayments.find(p => p.id === paymentId);
    if (!payment) return;
    
    const statusClass = getStatusClass(payment.actual_status);
    const statusText = getStatusText(payment.actual_status);
    
    const modalBody = document.getElementById('payment-detail-body');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div class="text-center pb-4 border-b border-border-color">
                <div class="text-sm text-text-light mb-2">${formatDate(payment.payment_date)} • ${payment.payment_type}</div>
                <div class="text-3xl font-bold text-white mb-2">${formatCurrency(payment.amount)}</div>
                <span class="status-badge ${statusClass} text-base">${statusText}</span>
            </div>
            
            <div class="space-y-3">
                <div class="detail-row">
                    <span class="detail-label">Evento</span>
                    <span class="detail-value">${payment.event_title}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Participante</span>
                    <span class="detail-value">${payment.participant_name}</span>
                </div>
                ${payment.participant_email ? `
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${payment.participant_email}</span>
                </div>` : ''}
                ${payment.participant_phone ? `
                <div class="detail-row">
                    <span class="detail-label">Teléfono</span>
                    <span class="detail-value">${payment.participant_phone}</span>
                </div>` : ''}
                <div class="detail-row">
                    <span class="detail-label">Fecha de Pago</span>
                    <span class="detail-value">${formatDate(payment.payment_date)}</span>
                </div>
                ${payment.due_date ? `
                <div class="detail-row">
                    <span class="detail-label">Vencimiento</span>
                    <span class="detail-value">${formatDate(payment.due_date)}</span>
                </div>` : ''}
                ${payment.payment_method ? `
                <div class="detail-row">
                    <span class="detail-label">Método</span>
                    <span class="detail-value">${payment.payment_method}</span>
                </div>` : ''}
            </div>
            
            ${payment.proof_image ? `
            <div class="mt-4">
                <div class="text-sm font-semibold text-white mb-2">Comprobante</div>
                <img src="${payment.proof_image}" class="w-full rounded-lg" alt="Comprobante">
            </div>` : ''}
            
            <div class="flex gap-3 mt-6">
                ${payment.actual_status === 'pending' || payment.actual_status === 'overdue' ? `
                <button onclick="markPaymentAsPaid(${payment.id})" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition">
                    <i class="fas fa-check mr-2"></i>Marcar Pagado
                </button>` : ''}
                <button onclick="closePaymentDetailModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('payment-detail-modal');
    if (modal) modal.classList.remove('hidden');
}

function closePaymentDetailModal() {
    const modal = document.getElementById('payment-detail-modal');
    if (modal) modal.classList.add('hidden');
}

async function markPaymentAsPaid(paymentId) {
    if (!confirm('¿Marcar este pago como pagado?')) return;
    
    try {
        const response = await fetch('actualizar_pago.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                payment_id: paymentId,
                status: 'confirmed'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Pago marcado como pagado');
            closePaymentDetailModal();
            loadPayments(currentPaymentFilter);
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Pendiente';
        case 'processing': return 'Procesando';
        case 'confirmed': return 'Pagado';
        case 'overdue': return 'Vencido';
        default: return status;
    }
}

function getStatusIcon(status) {
    switch(status) {
        case 'pending': return 'fas fa-clock';
        case 'processing': return 'fas fa-spinner';
        case 'confirmed': return 'fas fa-check-circle';
        case 'overdue': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-circle';
    }
}

// ===============================================
// RESTO DE FUNCIONES (Asistencias, etc)
// ===============================================

function loadAssistances(assistances = db.assistances) {
    const listContainer = document.getElementById('assistances-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = assistances.map(a => {
        const participant = db.participants.find(pt => pt.id === a.participantId);
        const event = db.events.find(e => e.id === a.eventId);
        const statusClass = a.state === 'CONFIRMADO' ? 'confirmed' : 'pending';
        
        return `
            <div class="list-card border-l-4 border-border-color cursor-pointer">
                <div class="flex flex-col">
                    <span class="text-base font-medium">${participant ? participant.name : 'Desconocido'}</span>
                    <span class="text-sm text-text-light">${participant ? participant.email : 'N/A'}</span>
                    <span class="text-xs text-text-light mt-2">Confirmado por: ${a.confirmedBy} (${event ? event.title : 'N/A'})</span>
                </div>
                <span class="status-badge ${statusClass}">${a.state}</span>
            </div>
        `;
    }).join('');
}

function filterAssistances(query) {
    const filtered = db.assistances.filter(a => {
        const participant = db.participants.find(pt => pt.id === a.participantId);
        const event = db.events.find(e => e.id === a.eventId);
        return (participant && participant.name.toLowerCase().includes(query.toLowerCase())) || 
               (participant && participant.email.toLowerCase().includes(query.toLowerCase())) ||
               (event && event.title.toLowerCase().includes(query.toLowerCase()));
    });
    loadAssistances(filtered);
}

// ===============================================
// FORMULARIOS
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, iniciando app...'); // DEBUG
    loadDatabase();
    
    // Formulario crear evento
    const createEventForm = document.getElementById('form-create-event');
    if (createEventForm) {
        createEventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                title: document.getElementById('event-title').value,
                description: document.getElementById('event-description').value,
                date: document.getElementById('event-date').value,
                location: document.getElementById('event-location').value,
                address: document.getElementById('event-address').value,
                cost: document.getElementById('event-cost').value,
                capacity: document.getElementById('event-capacity').value,
                reminderDays: document.getElementById('reminder-days').value || 0
            };

            const imageFile = document.getElementById('event-image').files[0];
            let imageUrl = getRandomDefaultImage();
            
            if (imageFile) {
                const reader = new FileReader();
                reader.onloadend = async function() {
                    imageUrl = reader.result;
                    await saveEvent(data, imageUrl);
                };
                reader.readAsDataURL(imageFile);
            } else {
                await saveEvent(data, imageUrl);
            }
        });
    }
    
    // Preview imagen
    const eventImageInput = document.getElementById('event-image');
    if (eventImageInput) {
        eventImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('image-preview');
                    const container = document.getElementById('image-preview-container');
                    if (preview && container) {
                        preview.src = event.target.result;
                        container.classList.remove('hidden');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

async function saveEvent(data, imageUrl) {
    try {
        data.imageUrl = imageUrl;
        
        const response = await fetch('guardar_evento.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', 
            },
            body: new URLSearchParams(data),
        });

        const text = await response.text();
        
        if (!text) {
            alert('❌ Error: Respuesta vacía del servidor.');
            return;
        }

        const result = JSON.parse(text);

        if (result.success) {
            alert(`✅ ${result.message}`);
            document.getElementById('form-create-event').reset();
            const previewContainer = document.getElementById('image-preview-container');
            if (previewContainer) previewContainer.classList.add('hidden');
            await loadDatabase(); 
            navigate('screen-events');
        } else {
            alert(`❌ Error: ${result.message}`);
            console.error(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error crítico. Revisa la consola.');
    }
}

function manageEventAdmin() {
    alert(`Simulación: Administrar Evento ID ${activeEventId}.`);
}

function controlEventAssistance() {
    alert(`Simulación: Control de Asistencia para Evento ID ${activeEventId}.`);
}

function editCurrentEvent() {
    const event = db.events.find(e => e.id === activeEventId);
    if (!event) {
        alert('No hay evento activo para editar.');
        return;
    }

    document.getElementById('event-title').value = event.title;
    document.getElementById('event-description').value = event.description;
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-location').value = event.location;
    document.getElementById('event-address').value = event.address;
    document.getElementById('event-cost').value = event.costPerPerson;
    document.getElementById('event-capacity').value = event.capacity;
    const reminderInput = document.getElementById('reminder-days');
    if (reminderInput) reminderInput.value = event.reminderDays;
    
    alert(`Editando evento: "${event.title}".`);
    navigate('screen-create-event');
}

// ===============================================
// FUNCIONES AUXILIARES (Asumo que existen)
// ===============================================
// La corrección asume que las funciones formatDate, formatCurrency 
// y la variable activeEventId están definidas en otra parte de tu proyecto.
// ===============================================


// ===============================================
// RF5: RESUMEN DEL EVENTO
// ===============================================

async function generateReport() {
    // La variable activeEventId debe estar definida globalmente
    if (!activeEventId) {
        alert("❌ Seleccione un evento para generar el reporte.");
        return;
    }
    
    try {
        const response = await fetch(`obtener_resumen_evento.php?event_id=${activeEventId}`);
        const result = await response.json();
        
        if (result.success) {
            showEventSummaryModal(result);
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al generar el reporte');
    }
}

function showEventSummaryModal(data) {
    const modalBody = document.getElementById('event-summary-body');
    if (!modalBody) return;
    
    const event = data.event;
    const participants = data.participants;
    const payments = data.payments;
    const capacity = data.capacity;
    
    // Generación dinámica del contenido (Tu código original)
    modalBody.innerHTML = `
        <div class="space-y-6">
            <div class="text-center pb-4 border-b border-border-color">
                <h3 class="text-2xl font-bold text-white mb-2">${event.title}</h3>
                <p class="text-text-light">${formatDate(event.date)} • ${event.location}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-bg-card p-4 rounded-lg border border-border-color">
                    <div class="text-text-light text-sm mb-1">Participantes</div>
                    <div class="text-2xl font-bold text-white">${participants.total}</div>
                    <div class="text-xs text-text-light mt-1">
                        ${participants.confirmed} confirmados • ${participants.pending} pendientes
                    </div>
                </div>
                
                <div class="bg-bg-card p-4 rounded-lg border border-border-color">
                    <div class="text-text-light text-sm mb-1">Capacidad</div>
                    <div class="text-2xl font-bold text-white">${capacity.total}</div>
                    <div class="text-xs text-text-light mt-1">
                        ${capacity.available !== 'N/A' ? `${capacity.available} disponibles` : 'Ilimitada'}
                    </div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(112,71,235,0.2), rgba(147,51,234,0.2)); padding: 16px; border-radius: 12px; border: 1px solid rgba(112,71,235,0.3);">
                <h4 class="text-white font-semibold mb-3 flex items-center gap-2">
                    <i class="fas fa-dollar-sign"></i> Resumen Financiero
                </h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-text-light">Pagos Confirmados</span>
                        <span class="font-bold text-lg" style="color: #10B981;">${formatCurrency(payments.confirmed)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-text-light">Pagos Pendientes</span>
                        <span class="font-bold text-lg" style="color: #FACC15;">${formatCurrency(payments.pending)}</span>
                    </div>
                    
                    ${payments.processing > 0 ? `
                    <div class="flex justify-between items-center">
                        <span class="text-text-light">En Proceso</span>
                        <span class="font-bold text-lg" style="color: #3B82F6;">${formatCurrency(payments.processing)}</span>
                    </div>
                    ` : ''}
                    
                    <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
                        <div class="flex justify-between items-center">
                            <span class="text-white font-semibold">Total Recaudado/Por Recaudar</span>
                            <span class="text-white font-bold text-xl">${formatCurrency(payments.total)}</span>
                        </div>
                    </div>
                    
                    ${capacity.potential_revenue > 0 ? `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-text-light">Potencial Máximo</span>
                        <span class="text-text-light">${formatCurrency(capacity.potential_revenue)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-bg-card p-3 rounded-lg" style="border: 1px solid rgba(16,185,129,0.3);">
                    <div class="font-semibold mb-1 flex items-center gap-2" style="color: #10B981;">
                        <i class="fas fa-check-circle"></i> Confirmados
                    </div>
                    <div class="text-2xl font-bold text-white">${data.payment_counts.confirmed}</div>
                </div>
                
                <div class="bg-bg-card p-3 rounded-lg" style="border: 1px solid rgba(250,204,21,0.3);">
                    <div class="font-semibold mb-1 flex items-center gap-2" style="color: #FACC15;">
                        <i class="fas fa-clock"></i> Pendientes
                    </div>
                    <div class="text-2xl font-bold text-white">${data.payment_counts.pending}</div>
                </div>
                
                ${data.payment_counts.overdue > 0 ? `
                <div class="bg-bg-card p-3 rounded-lg" style="border: 1px solid rgba(239,68,68,0.3);">
                    <div class="font-semibold mb-1 flex items-center gap-2" style="color: #EF4444;">
                        <i class="fas fa-exclamation-triangle"></i> Vencidos
                    </div>
                    <div class="text-2xl font-bold text-white">${data.payment_counts.overdue}</div>
                </div>
                ` : ''}
                
                ${data.payment_counts.processing > 0 ? `
                <div class="bg-bg-card p-3 rounded-lg" style="border: 1px solid rgba(59,130,246,0.3);">
                    <div class="font-semibold mb-1 flex items-center gap-2" style="color: #3B82F6;">
                        <i class="fas fa-spinner"></i> Procesando
                    </div>
                    <div class="text-2xl font-bold text-white">${data.payment_counts.processing}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="flex gap-3 pt-4">
                <button onclick="downloadEventReport()" class="flex-1 text-white py-3 rounded-lg font-semibold transition" style="background-color: var(--accent-blue);">
                    <i class="fas fa-download mr-2"></i>Descargar
                </button>
                <button onclick="closeEventSummaryModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('event-summary-modal');
    if (modal) modal.classList.remove('hidden'); // Muestra el modal
}

// 🛑 FUNCIÓN DE CIERRE DE RF5 (ASIGNADA AL BOTÓN 'X' Y 'CERRAR')
function closeEventSummaryModal() {
    const modal = document.getElementById('event-summary-modal');
    if (modal) modal.classList.add('hidden'); // Oculta el modal
}


// ===============================================
// RF9: REPORTE MENSUAL
// ===============================================
async function showMonthlyReport() {
    const modal = document.getElementById('monthly-report-modal');
    if (!modal) return;
    
    // 1. Muestra el modal inmediatamente
    modal.classList.remove('hidden'); 
    
    // 2. Muestra el spinner de carga
    const loadingEl = document.getElementById('monthly-report-loading');
    if (loadingEl) loadingEl.classList.remove('hidden');

    // 🛑 ATENCIÓN: COMENTAMOS LA LLAMADA COMPLEJA AL SERVIDOR
    // await loadMonthlyReport(new Date().getMonth() + 1, new Date().getFullYear()); 
    
    // 3. Simula un retraso y luego oculta el spinner para mostrar el botón de cerrar
    setTimeout(() => {
        if (loadingEl) loadingEl.classList.add('hidden');
        const contentEl = document.getElementById('monthly-report-content');
        // Usamos un contenido de prueba para ver el botón 'Cerrar'
        if (contentEl) {
            contentEl.innerHTML = '<div class="p-5 text-center text-white">Prueba exitosa. Ahora presiona el botón Cerrar.</div>';
            contentEl.classList.remove('hidden');
        }
    }, 1000); // Espera 1 segundo
}

// ... La función closeMonthlyReportModal() debe estar intacta y funcionando:
function closeMonthlyReportModal() {
    const modal = document.getElementById('monthly-report-modal');
    if (modal) {
        modal.classList.add('hidden'); // Oculta el modal
    }
}
async function loadMonthlyReport(month, year) {
    const loadingEl = document.getElementById('monthly-report-loading');
    const contentEl = document.getElementById('monthly-report-content');
    
    // Muestra el spinner de carga y oculta el contenido
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    
    try {
        const response = await fetch(`obtener_reporte_mensual.php?month=${month}&year=${year}`);
        const result = await response.json();
        
        if (result.success) {
            renderMonthlyReport(result);
            // Oculta el spinner y muestra el contenido al tener éxito
            if (loadingEl) loadingEl.classList.add('hidden');
            if (contentEl) contentEl.classList.remove('hidden');
        } else {
            alert('❌ Error: ' + result.message);
            // Oculta el modal si hay un error
            closeMonthlyReportModal();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al cargar el reporte mensual');
        // Oculta el modal si hay un error
        closeMonthlyReportModal();
    }
}

function renderMonthlyReport(data) {
    const contentEl = document.getElementById('monthly-report-content');
    if (!contentEl) return;
    
    const summary = data.summary;
    const events = data.events;
    
    // Generación dinámica del contenido (Tu código original)
    contentEl.innerHTML = `
        <div class="space-y-6">
            <div class="text-center pb-4 border-b border-border-color">
                <h3 class="text-2xl font-bold text-white mb-2">Reporte Mensual</h3>
                <p class="text-text-light">${data.period.display}</p>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-bg-card p-4 rounded-lg border border-border-color text-center">
                    <div class="text-text-light text-xs mb-1">Eventos</div>
                    <div class="text-3xl font-bold text-white">${summary.total_events}</div>
                </div>
                
                <div class="bg-bg-card p-4 rounded-lg border border-border-color text-center">
                    <div class="text-text-light text-xs mb-1">Participantes</div>
                    <div class="text-3xl font-bold text-white">${summary.total_participants}</div>
                </div>
                
                <div class="bg-bg-card p-4 rounded-lg border border-border-color text-center">
                    <div class="text-text-light text-xs mb-1">Pagos</div>
                    <div class="text-3xl font-bold text-white">${summary.payments.confirmed_count}</div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2)); padding: 16px; border-radius: 12px; border: 1px solid rgba(16,185,129,0.3);">
                <h4 class="text-white font-semibold mb-3 flex items-center gap-2">
                    <i class="fas fa-chart-line"></i> Resumen Financiero
                </h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-text-light">Pagos Confirmados</span>
                        <span class="font-bold text-lg" style="color: #10B981;">${formatCurrency(summary.payments.confirmed)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-text-light">Pagos Pendientes</span>
                        <span class="font-bold text-lg" style="color: #FACC15;">${formatCurrency(summary.payments.pending)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-text-light">${summary.payments.confirmed_count} confirmados • ${summary.payments.pending_count} pendientes</span>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 class="text-white font-semibold mb-3 flex items-center gap-2">
                    <i class="fas fa-calendar"></i> Eventos del Mes (${events.length})
                </h4>
                
                ${events.length === 0 ? `
                    <p class="text-text-light text-center py-8">No hay eventos en este período</p>
                ` : `
                    <div class="space-y-3" style="max-height: 400px; overflow-y: auto;">
                        ${events.map(item => `
                            <div class="bg-bg-card p-4 rounded-lg border border-border-color">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="flex-1">
                                        <div class="font-semibold text-white">${item.event.title}</div>
                                        <div class="text-sm text-text-light">${formatDate(item.event.date)} • ${item.event.location}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-text-light">Participantes</div>
                                        <div class="font-bold text-white">${item.event.participants_count}</div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border-color">
                                    <div>
                                        <div class="text-xs text-text-light">Confirmados</div>
                                        <div class="font-semibold" style="color: #10B981;">${formatCurrency(item.payments.confirmed)}</div>
                                        <div class="text-xs text-text-light">${item.payments.confirmed_count} pagos</div>
                                    </div>
                                    <div>
                                        <div class="text-xs text-text-light">Pendientes</div>
                                        <div class="font-semibold" style="color: #FACC15;">${formatCurrency(item.payments.pending)}</div>
                                        <div class="text-xs text-text-light">${item.payments.pending_count} pagos</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
            
            <div class="flex gap-3 pt-4">
                <button onclick="downloadMonthlyReport()" class="flex-1 text-white py-3 rounded-lg font-semibold transition" style="background-color: var(--accent-blue);">
                    <i class="fas fa-download mr-2"></i>Descargar
                </button>
                <button onclick="closeMonthlyReportModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition">
                    Cerrar
                </button>
            </div>
        </div>
    `;
}

// 🛑 FUNCIÓN DE CIERRE DE RF9 (ASIGNADA AL BOTÓN 'X' Y 'CERRAR')
function closeMonthlyReportModal() {
    const modal = document.getElementById('monthly-report-modal');
    if (modal) {
        modal.classList.add('hidden'); // Oculta el modal
    }
}

// ===============================================
// OTRAS FUNCIONES (Incluidas para completar)
// ===============================================

function downloadEventReport() {
    alert('🚧 Función de descarga PDF en desarrollo. Por ahora puedes imprimir esta pantalla (Ctrl+P)');
    window.print();
}

function downloadMonthlyReport() {
    alert('🚧 Función de descarga PDF en desarrollo. Por ahora puedes imprimir esta pantalla (Ctrl+P)');
    window.print();
}

function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        window.location.href = 'logout.php';
    }
}