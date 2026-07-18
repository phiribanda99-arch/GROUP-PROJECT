// Bus Fleet Management Logic

// Refresh and Render the Bus Fleet Cards
function refreshBusesView() {
    console.log('Refreshing buses fleet view...');
    const grid = document.getElementById('bus-cards-grid');
    grid.innerHTML = '';
    
    if (AppState.buses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="truck" class="empty-icon"></i>
                <h4>No Buses Registered</h4>
                <p>Register your first transit coach to begin allocating schedules and routes.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    AppState.buses.forEach(bus => {
        let statusBadgeClass = 'bg-rose';
        if (bus.status === 'Active') statusBadgeClass = 'bg-emerald';
        if (bus.status === 'Maintenance') statusBadgeClass = 'bg-amber';
        
        const card = document.createElement('div');
        card.className = 'bus-card glass-panel';
        card.innerHTML = `
            <div class="bus-card-header">
                <div>
                    <h4 class="bus-card-operator">${bus.operator}</h4>
                    <span class="bus-card-model">${bus.model}</span>
                </div>
                <span class="badge ${statusBadgeClass}">${bus.status}</span>
            </div>
            
            <div>
                <span class="bus-card-plate">${bus.regNumber}</span>
                <div class="bus-card-body">
                    <div class="bus-info-item">
                        <label>Capacity</label>
                        <span>${bus.capacity} Seats</span>
                    </div>
                    <div class="bus-info-item">
                        <label>Layout</label>
                        <span>${bus.capacity === 48 ? '2x2 Premium' : bus.capacity === 60 ? '2x2 Standard' : '3x2 Economy'}</span>
                    </div>
                </div>
            </div>
            
            <div class="bus-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editBus('${bus.id}')">
                    <i data-lucide="edit-2"></i> Edit
                </button>
                <button class="btn btn-secondary btn-sm" onclick="toggleBusStatus('${bus.id}')">
                    <i data-lucide="refresh-cw"></i> Toggle Status
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteBus('${bus.id}')" style="margin-left: auto;">
                    <i data-lucide="trash-2"></i> Delete
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    // Refresh Icons
    lucide.createIcons();
}

// Open modal to add a bus
function openAddBusModal() {
    document.getElementById('bus-modal-title').textContent = 'Register New Fleet Coach';
    document.getElementById('bus-edit-id').value = '';
    document.getElementById('bus-form').reset();
    document.getElementById('bus-modal').classList.remove('hidden');
    lucide.createIcons();
}

// Open modal to edit a bus
function editBus(busId) {
    const bus = AppState.buses.find(b => b.id === busId);
    if (!bus) return;
    
    document.getElementById('bus-modal-title').textContent = 'Modify Fleet Coach Details';
    document.getElementById('bus-edit-id').value = bus.id;
    document.getElementById('bus-operator').value = bus.operator;
    document.getElementById('bus-reg-number').value = bus.regNumber;
    document.getElementById('bus-model').value = bus.model;
    document.getElementById('bus-capacity').value = bus.capacity;
    document.getElementById('bus-status').value = bus.status;
    
    document.getElementById('bus-modal').classList.remove('hidden');
    lucide.createIcons();
}

// Close bus modal
function closeBusModal() {
    document.getElementById('bus-modal').classList.add('hidden');
}

// Save Bus Form (Handle Add and Edit)
function handleSaveBus(event) {
    event.preventDefault();
    
    const id = document.getElementById('bus-edit-id').value;
    const operator = document.getElementById('bus-operator').value;
    const regNumber = document.getElementById('bus-reg-number').value.trim().toUpperCase();
    const model = document.getElementById('bus-model').value;
    const capacity = parseInt(document.getElementById('bus-capacity').value);
    const status = document.getElementById('bus-status').value;
    
    // Validation: Plate number check for uniqueness (excluding current editing bus)
    const plateConflict = AppState.buses.some(b => b.regNumber === regNumber && b.id !== id);
    if (plateConflict) {
        showToast(`License plate ${regNumber} is already registered.`, 'error');
        return;
    }
    
    if (id) {
        // Edit Mode
        const busIndex = AppState.buses.findIndex(b => b.id === id);
        if (busIndex !== -1) {
            AppState.buses[busIndex] = { ...AppState.buses[busIndex], operator, regNumber, model, capacity, status };
            showToast('Bus fleet details updated successfully.', 'success');
        }
    } else {
        // Add Mode
        const newBus = {
            id: `b-${Date.now()}`,
            operator,
            regNumber,
            model,
            capacity,
            status
        };
        AppState.buses.push(newBus);
        showToast(`${operator} coach (${regNumber}) registered in fleet.`, 'success');
    }
    
    saveState('smartbus_buses');
    closeBusModal();
    refreshBusesView();
}

// Toggle bus status quickly between Active, Maintenance, Out of Service
function toggleBusStatus(busId) {
    const busIndex = AppState.buses.findIndex(b => b.id === busId);
    if (busIndex === -1) return;
    
    const currentStatus = AppState.buses[busIndex].status;
    let nextStatus = 'Active';
    
    if (currentStatus === 'Active') {
        nextStatus = 'Maintenance';
    } else if (currentStatus === 'Maintenance') {
        nextStatus = 'Out of Service';
    }
    
    AppState.buses[busIndex].status = nextStatus;
    saveState('smartbus_buses');
    showToast(`Bus ${AppState.buses[busIndex].regNumber} status set to: ${nextStatus}`, 'info');
    refreshBusesView();
}

// Delete Bus from database
function deleteBus(busId) {
    // Check if the bus is currently allocated in active schedules
    const bus = AppState.buses.find(b => b.id === busId);
    if (!bus) return;
    
    const isAllocated = AppState.schedules.some(sch => sch.busId === busId);
    if (isAllocated) {
        if (!confirm(`Warning: This bus is currently allocated to active route schedules. Deleting it will leave schedules without an assigned coach. Proceed?`)) {
            return;
        }
    } else {
        if (!confirm(`Are you sure you want to remove bus ${bus.regNumber} from the system?`)) {
            return;
        }
    }
    
    AppState.buses = AppState.buses.filter(b => b.id !== busId);
    saveState('smartbus_buses');
    showToast('Bus removed from fleet.', 'success');
    refreshBusesView();
}
