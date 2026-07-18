// Route and Schedule Management Logic

// Toggle between Schedules and Routes Directory tabs
function switchScheduleSubtab(tab) {
    const schedulesTabBtn = document.getElementById('schedules-subtab-schedules');
    const routesTabBtn = document.getElementById('schedules-subtab-routes');
    const schedulesSubview = document.getElementById('subview-schedules');
    const routesSubview = document.getElementById('subview-routes');
    
    if (tab === 'schedules') {
        schedulesTabBtn.classList.add('active');
        routesTabBtn.classList.remove('active');
        schedulesSubview.classList.add('active');
        routesSubview.classList.remove('active');
        renderSchedulesTable();
    } else {
        schedulesTabBtn.classList.remove('active');
        routesTabBtn.classList.add('active');
        schedulesSubview.classList.remove('active');
        routesSubview.classList.add('active');
        renderRoutesTable();
    }
}

// Refresh schedules view by rendering whichever subtab is active
function refreshSchedulesView() {
    console.log('Refreshing Route and Schedules view...');
    
    // Check which subtab is active
    const schedulesSubview = document.getElementById('subview-schedules');
    if (schedulesSubview.classList.contains('active')) {
        renderSchedulesTable();
    } else {
        renderRoutesTable();
    }
}

// Render active routes in the Routes subtab table
function renderRoutesTable() {
    const tbody = document.getElementById('routes-tbody');
    tbody.innerHTML = '';
    
    if (AppState.routes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No routes defined yet. Define a route to begin scheduling.</td></tr>`;
        return;
    }
    
    AppState.routes.forEach(route => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${route.code}</strong></td>
            <td>${route.origin}</td>
            <td>${route.destination}</td>
            <td>${route.duration} hrs</td>
            <td>ZMW ${route.basePrice}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteRoute('${route.code}')">
                    <i data-lucide="trash-2"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}

// Render active schedules in the Schedules subtab table
function renderSchedulesTable() {
    const tbody = document.getElementById('schedules-tbody');
    tbody.innerHTML = '';
    
    if (AppState.schedules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No schedules allocated yet. Create a schedule to open ticket bookings.</td></tr>`;
        return;
    }
    
    AppState.schedules.forEach(sched => {
        const route = AppState.routes.find(r => r.code === sched.routeCode);
        const bus = AppState.buses.find(b => b.id === sched.busId);
        
        const operatorName = bus ? bus.operator : 'Unknown Operator';
        const busModel = bus ? `${bus.model} (${bus.regNumber})` : 'Unassigned Bus';
        const routeString = route ? `${route.origin} → ${route.destination}` : 'Invalid Route';
        const capacity = bus ? bus.capacity : 0;
        const remainingSeats = capacity - (sched.bookedSeats ? sched.bookedSeats.length : 0);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge bg-blue">${sched.id}</span></td>
            <td>
                <div style="font-weight: 600;">${operatorName}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${busModel}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${routeString}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${sched.date}</div>
            </td>
            <td>
                <div>Dep: <strong>${sched.departureTime}</strong></div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Arr: ${sched.arrivalTime}</div>
            </td>
            <td><strong>ZMW ${sched.fare}</strong></td>
            <td>
                <div style="font-weight: 600;">${remainingSeats} / ${capacity}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">seats left</div>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteSchedule('${sched.id}')">
                    <i data-lucide="trash-2"></i> Cancel
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}

// Modal open/close actions for Routes
function openAddRouteModal() {
    document.getElementById('route-form').reset();
    document.getElementById('route-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeRouteModal() {
    document.getElementById('route-modal').classList.add('hidden');
}

// Save defined Route
function handleSaveRoute(event) {
    event.preventDefault();
    
    const code = document.getElementById('route-code').value.trim().toUpperCase();
    const origin = document.getElementById('route-origin').value;
    const destination = document.getElementById('route-destination').value.trim();
    const duration = parseFloat(document.getElementById('route-duration').value);
    const basePrice = parseInt(document.getElementById('route-price').value);
    
    // Check code duplication
    const routeConflict = AppState.routes.some(r => r.code === code);
    if (routeConflict) {
        showToast(`Route code ${code} is already defined.`, 'error');
        return;
    }
    
    const newRoute = {
        code,
        origin,
        destination,
        duration,
        basePrice
    };
    
    AppState.routes.push(newRoute);
    saveState('smartbus_routes');
    closeRouteModal();
    renderRoutesTable();
    showToast(`Route ${code} (${destination}) defined successfully.`, 'success');
}

// Delete Route
function deleteRoute(routeCode) {
    // Check if any schedule depends on this route
    const hasSchedules = AppState.schedules.some(sch => sch.routeCode === routeCode);
    if (hasSchedules) {
        if (!confirm(`Warning: There are active schedules allocated to this route. Deleting it will cause data issues. Proceed anyway?`)) {
            return;
        }
    } else {
        if (!confirm(`Are you sure you want to delete route code ${routeCode}?`)) {
            return;
        }
    }
    
    AppState.routes = AppState.routes.filter(r => r.code !== routeCode);
    saveState('smartbus_routes');
    renderRoutesTable();
    showToast('Route deleted from directory.', 'success');
}

// Modal open/close actions for Schedules
function openAddScheduleModal() {
    const routeSelect = document.getElementById('schedule-route');
    const busSelect = document.getElementById('schedule-bus');
    
    // Populate routes select
    routeSelect.innerHTML = '<option value="">Select Route Pathway</option>';
    AppState.routes.forEach(r => {
        routeSelect.innerHTML += `<option value="${r.code}">${r.code}: Lusaka to ${r.destination}</option>`;
    });
    
    // Populate active buses select
    busSelect.innerHTML = '<option value="">Select Active Bus Coach</option>';
    const activeBuses = AppState.buses.filter(b => b.status === 'Active');
    activeBuses.forEach(b => {
        busSelect.innerHTML += `<option value="${b.id}">${b.operator} - ${b.model} (${b.regNumber}) [${b.capacity} seats]</option>`;
    });
    
    document.getElementById('schedule-form').reset();
    document.getElementById('schedule-modal').classList.remove('hidden');
    lucide.createIcons();
    
    // Bind change listener to auto-populate default route base price in fare
    routeSelect.onchange = () => {
        const selectedRoute = AppState.routes.find(r => r.code === routeSelect.value);
        if (selectedRoute) {
            document.getElementById('schedule-fare').value = selectedRoute.basePrice;
        }
    };
}

function closeScheduleModal() {
    document.getElementById('schedule-modal').classList.add('hidden');
}

// Save allocated Schedule
function handleSaveSchedule(event) {
    event.preventDefault();
    
    const routeCode = document.getElementById('schedule-route').value;
    const busId = document.getElementById('schedule-bus').value;
    const departureTime = document.getElementById('schedule-departure').value;
    const arrivalTime = document.getElementById('schedule-arrival').value;
    const date = document.getElementById('schedule-date').value;
    const fare = parseInt(document.getElementById('schedule-fare').value);
    
    if (!routeCode || !busId) {
        showToast('Please select a route and bus.', 'error');
        return;
    }
    
    // Check bus scheduling conflicts (bus cannot be in two places at once on the same date/times)
    const busConflict = AppState.schedules.some(sch => 
        sch.busId === busId && 
        sch.date === date &&
        sch.departureTime === departureTime
    );
    
    if (busConflict) {
        showToast('Scheduling conflict: The selected bus coach is already assigned to a schedule at this time.', 'error');
        return;
    }
    
    const newSchedule = {
        id: `sch-${Date.now().toString().slice(-4)}`,
        routeCode,
        busId,
        departureTime,
        arrivalTime,
        date,
        fare,
        bookedSeats: []
    };
    
    AppState.schedules.push(newSchedule);
    saveState('smartbus_schedules');
    closeScheduleModal();
    renderSchedulesTable();
    showToast(`Schedule allocated successfully (ID: ${newSchedule.id}).`, 'success');
}

// Delete Schedule (Cancel Departure)
function deleteSchedule(scheduleId) {
    const hasBookings = AppState.bookings.some(b => b.scheduleId === scheduleId && b.status !== 'Cancelled');
    if (hasBookings) {
        if (!confirm(`CAUTION: There are booked tickets on this schedule. Cancelling it will void those bookings and require refunds. Cancel this schedule?`)) {
            return;
        }
        
        // Void affected bookings
        AppState.bookings.forEach(b => {
            if (b.scheduleId === scheduleId) {
                b.status = 'Cancelled';
            }
        });
        saveState('smartbus_bookings');
    } else {
        if (!confirm(`Are you sure you want to cancel this bus departure schedule?`)) {
            return;
        }
    }
    
    AppState.schedules = AppState.schedules.filter(sch => sch.id !== scheduleId);
    saveState('smartbus_schedules');
    renderSchedulesTable();
    showToast('Schedule cancelled and removed.', 'success');
}
