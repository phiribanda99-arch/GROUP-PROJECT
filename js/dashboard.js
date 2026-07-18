// Dashboard and Reporting Logic
let performanceChart = null;

// Refresh Operator Reporting Dashboard metrics and charts
function refreshDashboardView() {
    console.log('Refreshing operator reporting dashboard...');
    
    // 1. Calculations
    // Total Revenue (Successful payments)
    const totalRev = AppState.payments
        .filter(p => p.status === 'Successful')
        .reduce((sum, p) => sum + p.amount, 0);
        
    // Total Bookings (Count of valid bookings)
    const totalBookings = AppState.bookings.filter(b => b.status === 'Booked' || b.status === 'Completed').length;
    
    // Active Fleet Size
    const activeBuses = AppState.buses.filter(b => b.status === 'Active').length;
    const totalBuses = AppState.buses.length;
    
    // Average Load Factor
    // Sum of (bookedSeats / capacity) for all active schedules
    let loadFactorTotal = 0;
    let schedulesWithBuses = 0;
    
    AppState.schedules.forEach(sch => {
        const bus = AppState.buses.find(b => b.id === sch.busId);
        if (bus && bus.capacity > 0) {
            const booked = sch.bookedSeats ? sch.bookedSeats.length : 0;
            loadFactorTotal += (booked / bus.capacity);
            schedulesWithBuses++;
        }
    });
    
    const avgLoadFactor = schedulesWithBuses > 0 
        ? Math.round((loadFactorTotal / schedulesWithBuses) * 100) 
        : 0;
        
    // 2. Bind Values to UI
    document.getElementById('stat-revenue').textContent = `ZMW ${totalRev.toLocaleString('en-US')}.00`;
    document.getElementById('stat-bookings').textContent = totalBookings;
    document.getElementById('stat-active-buses').textContent = `${activeBuses} / ${totalBuses}`;
    document.getElementById('stat-load-factor').textContent = `${avgLoadFactor}%`;
    
    // 3. Render Recent Sales Table (limit to 5)
    renderRecentSalesTable();
    
    // 4. Render Chart.js Chart
    renderRevenueChart();
}

// Render the 5 most recent sales on the dashboard card
function renderRecentSalesTable() {
    const tbody = document.getElementById('recent-payments-tbody');
    tbody.innerHTML = '';
    
    // Newest payments first
    const sorted = [...AppState.payments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recent = sorted.slice(0, 5);
    
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No sales recorded yet.</td></tr>`;
        return;
    }
    
    recent.forEach(pay => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${pay.passengerName}</strong></td>
            <td>${pay.operator}</td>
            <td>${pay.route}</td>
            <td><strong style="color: #60a5fa;">ZMW ${pay.amount}</strong></td>
            <td><span class="badge bg-emerald">${pay.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Generate the Chart.js Revenue Chart
function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Group payments by date for the last 7 days
    const dates = [];
    const revenueData = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        
        // Human label
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dates.push(label);
        
        // Sum revenue for this date
        const dailyRev = AppState.payments
            .filter(p => p.status === 'Successful' && p.timestamp.startsWith(dateString))
            .reduce((sum, p) => sum + p.amount, 0);
            
        revenueData.push(dailyRev);
    }
    
    // Destroy previous chart if exists to prevent overlapping drawings
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Configure beautiful purple/indigo gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
    
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Daily Revenue (ZMW)',
                data: revenueData,
                borderColor: '#8b5cf6',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#ffffff',
                pointHoverRadius: 7,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Revenue: ZMW ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            family: 'Plus Jakarta Sans'
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            family: 'Plus Jakarta Sans'
                        },
                        callback: function(value) {
                            return 'K' + value;
                        }
                    }
                }
            }
        }
    });
}

// -------------------------------------------------------------
// PASSENGER TRAVEL HISTORY & PORTAL VIEWS
// -------------------------------------------------------------

// Toggle Subtabs on Travel History Section
function switchHistorySubtab(tab) {
    const activeBtn = document.getElementById('history-subtab-active');
    const pastBtn = document.getElementById('history-subtab-past');
    const activeGrid = document.getElementById('subview-active-tickets');
    const pastTable = document.getElementById('subview-past-trips');
    
    if (tab === 'active') {
        activeBtn.classList.add('active');
        pastBtn.classList.remove('active');
        activeGrid.classList.add('active');
        pastTable.classList.remove('active');
        renderActiveTickets();
    } else {
        activeBtn.classList.remove('active');
        pastBtn.classList.add('active');
        activeGrid.classList.remove('active');
        pastTable.classList.add('active');
        renderPastTripsTable();
    }
}

// Render active trips view
function refreshTravelHistoryView() {
    // Switch to active subtab by default
    switchHistorySubtab('active');
}

// Render Active Boarding Passes
function renderActiveTickets() {
    const container = document.getElementById('active-tickets-container');
    container.innerHTML = '';
    
    const user = AppState.currentUser;
    if (!user) return;
    
    // Filter bookings belonging to this passenger that are active
    // Active means schedule date is today or in the future AND status is 'Booked'
    const activeBookings = AppState.bookings.filter(b => {
        if (b.userId !== user.id) return false;
        if (b.status !== 'Booked') return false;
        
        const sched = AppState.schedules.find(s => s.id === b.scheduleId);
        if (!sched) return false;
        
        // Simple string comparison for dates YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0];
        return sched.date >= todayStr;
    });
    
    if (activeBookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="ticket" class="empty-icon"></i>
                <h4>No Upcoming Trips</h4>
                <p>You don't have any active ticket reservations. Book a ticket in the Search portal to start traveling!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    activeBookings.forEach(booking => {
        const sched = AppState.schedules.find(s => s.id === booking.scheduleId);
        const route = AppState.routes.find(r => r.code === sched.routeCode);
        const bus = AppState.buses.find(b => b.id === sched.busId);
        
        const card = document.createElement('div');
        card.className = 'ticket-pass-card glass-panel';
        card.innerHTML = `
            <div class="pass-header">
                <div>
                    <h4 class="pass-operator">${bus.operator}</h4>
                    <span style="font-size:0.75rem; color:var(--text-secondary);">${bus.model} (${bus.regNumber})</span>
                </div>
                <span class="badge bg-emerald">ACTIVE TICKET</span>
            </div>
            
            <div class="pass-route-info">
                <div class="pass-city">
                    <span>From</span>
                    <h4>Lusaka</h4>
                </div>
                <div class="route-connector" style="min-width: 80px;">
                    <span style="font-size:0.65rem;">${sched.departureTime}</span>
                    <div class="connector-line"></div>
                </div>
                <div class="pass-city" style="text-align: right;">
                    <span>To</span>
                    <h4>${route.destination}</h4>
                </div>
            </div>
            
            <div class="pass-meta">
                <div class="pass-meta-item">
                    <label>Travel Date</label>
                    <span>${sched.date}</span>
                </div>
                <div class="pass-meta-item">
                    <label>Seat Number(s)</label>
                    <span>Seat ${booking.seats.join(', ')}</span>
                </div>
                <div class="pass-meta-item">
                    <label>Paid Amount</label>
                    <span>ZMW ${booking.totalAmount}.00</span>
                </div>
                <div class="pass-meta-item">
                    <label>Ticket Code</label>
                    <code style="font-family: monospace; color:#a78bfa; font-weight:700;">${booking.id}</code>
                </div>
            </div>
            
            <div class="pass-footer">
                <button class="btn btn-primary btn-sm btn-block" onclick="openTicketModal('${booking.id}')">
                    <i data-lucide="eye"></i> View Boarding Pass
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    lucide.createIcons();
}

// Render Past Trips Table
function renderPastTripsTable() {
    const tbody = document.getElementById('past-bookings-tbody');
    tbody.innerHTML = '';
    
    const user = AppState.currentUser;
    if (!user) return;
    
    // Past bookings include:
    // 1. Bookings belonging to the user
    // 2. Either status is 'Completed' / 'Cancelled' OR the schedule date is yesterday or older
    const pastBookings = AppState.bookings.filter(b => {
        if (b.userId !== user.id) return false;
        
        if (b.status === 'Cancelled' || b.status === 'Completed') return true;
        
        const sched = AppState.schedules.find(s => s.id === b.scheduleId);
        if (!sched) return false;
        
        const todayStr = new Date().toISOString().split('T')[0];
        return sched.date < todayStr;
    });
    
    if (pastBookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No past trips recorded in your history ledger.</td></tr>`;
        return;
    }
    
    // Sort past bookings newest first
    const sorted = [...pastBookings].sort((a, b) => {
        const schedA = AppState.schedules.find(s => s.id === a.scheduleId);
        const schedB = AppState.schedules.find(s => s.id === b.scheduleId);
        if (!schedA || !schedB) return 0;
        return new Date(schedB.date) - new Date(schedA.date);
    });
    
    sorted.forEach(booking => {
        const sched = AppState.schedules.find(s => s.id === booking.scheduleId);
        const route = AppState.routes.find(r => r.code === sched.routeCode);
        const bus = AppState.buses.find(b => b.id === sched.busId);
        
        let statusBadgeClass = 'bg-rose'; // Cancelled
        if (booking.status === 'Booked') statusBadgeClass = 'bg-blue'; // Past but booked -> completed
        if (booking.status === 'Completed') statusBadgeClass = 'bg-emerald';
        
        const displayStatus = (booking.status === 'Booked' && sched.date < new Date().toISOString().split('T')[0]) 
            ? 'Completed' 
            : booking.status;
            
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code style="font-family: monospace; font-weight:700;">${booking.id}</code></td>
            <td><strong>${sched.date}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">${sched.departureTime}</span></td>
            <td>${bus ? bus.operator : 'Unknown'}</td>
            <td>Lusaka → ${route ? route.destination : 'Unknown'}</td>
            <td>Seat ${booking.seats.join(', ')}</td>
            <td><strong>ZMW ${booking.totalAmount}.00</strong></td>
            <td><span class="badge ${statusBadgeClass}">${displayStatus}</span></td>
        `;
        tbody.appendChild(tr);
    });
}
