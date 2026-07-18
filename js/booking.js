// Passenger Ticket Booking and Seat Selection Logic

let selectedSeats = [];
let bookingActiveSchedule = null;

// Initialize Booking Portal Views
function refreshBookingView() {
    console.log('Refreshing passenger booking view...');
    
    // Populate Destination Dropdown options dynamically from defined routes
    const destSelect = document.getElementById('search-destination');
    const prevVal = destSelect.value;
    
    // Unique destinations list
    const destinations = [...new Set(AppState.routes.map(r => r.destination))];
    
    destSelect.innerHTML = '<option value="">Select Destination</option>';
    destinations.forEach(dest => {
        destSelect.innerHTML += `<option value="${dest}">${dest}</option>`;
    });
    
    if (destinations.includes(prevVal)) {
        destSelect.value = prevVal;
    }
}

// Handle Schedule Search form submit
function handleScheduleSearch(event) {
    if (event) event.preventDefault();
    
    const origin = document.getElementById('search-origin').value;
    const destination = document.getElementById('search-destination').value;
    const date = document.getElementById('search-date').value;
    const preferredOperator = document.getElementById('search-operator').value;
    
    if (!destination) {
        showToast('Please select a destination city.', 'error');
        return;
    }
    
    console.log(`Searching schedules: ${origin} to ${destination} on ${date} (Operator: ${preferredOperator || 'Any'})`);
    
    // Filter schedules
    const filteredSchedules = AppState.schedules.filter(sched => {
        const route = AppState.routes.find(r => r.code === sched.routeCode);
        const bus = AppState.buses.find(b => b.id === sched.busId);
        
        if (!route || !bus) return false;
        
        // Match route pathway
        const routeMatches = route.origin === origin && route.destination === destination;
        // Match date
        const dateMatches = sched.date === date;
        // Match operator if selected
        const operatorMatches = preferredOperator ? bus.operator === preferredOperator : true;
        
        return routeMatches && dateMatches && operatorMatches;
    });
    
    renderSearchResults(filteredSchedules);
}

// Render schedule search results cards
function renderSearchResults(results) {
    const container = document.getElementById('schedule-results-container');
    const badgeCount = document.getElementById('results-count');
    
    container.innerHTML = '';
    badgeCount.textContent = `${results.length} found`;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="info" class="empty-icon"></i>
                <h4>No Departures Found</h4>
                <p>There are no departures matching your filters for this date. Try searching for a different date or clearing the preferred operator filter.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    results.forEach(sched => {
        const route = AppState.routes.find(r => r.code === sched.routeCode);
        const bus = AppState.buses.find(b => b.id === sched.busId);
        
        const capacity = bus ? bus.capacity : 60;
        const bookedCount = sched.bookedSeats ? sched.bookedSeats.length : 0;
        const remainingSeats = capacity - bookedCount;
        
        const card = document.createElement('div');
        card.className = 'schedule-card glass-panel';
        card.innerHTML = `
            <div class="schedule-main-info">
                <div class="schedule-operator-brand">
                    <h4 class="operator-title">${bus.operator}</h4>
                    <span class="operator-model-desc">
                        <i data-lucide="bus-front" style="width: 14px; height: 14px;"></i>
                        ${bus.model} (${bus.regNumber})
                    </span>
                </div>
                
                <div class="schedule-route-path">
                    <div class="route-stop">
                        <h4>${sched.departureTime}</h4>
                        <span>Lusaka</span>
                    </div>
                    <div class="route-connector">
                        <span>${route.duration} hrs</span>
                        <div class="connector-line"></div>
                    </div>
                    <div class="route-stop">
                        <h4>${sched.arrivalTime}</h4>
                        <span>${route.destination}</span>
                    </div>
                </div>
            </div>
            
            <div class="schedule-price-info">
                <h3 class="fare-price text-gradient">ZMW ${sched.fare}</h3>
                <span class="seats-remaining">${remainingSeats} of ${capacity} seats free</span>
            </div>
            
            <div>
                <button class="btn btn-primary" onclick="openBookingModal('${sched.id}')" ${remainingSeats === 0 ? 'disabled' : ''}>
                    ${remainingSeats === 0 ? 'Sold Out' : 'Select Seats <i data-lucide="arrow-right"></i>'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    lucide.createIcons();
}

// Open Booking Seat Selector Modal
function openBookingModal(scheduleId) {
    const sched = AppState.schedules.find(s => s.id === scheduleId);
    if (!sched) return;
    
    const bus = AppState.buses.find(b => b.id === sched.busId);
    const route = AppState.routes.find(r => r.code === sched.routeCode);
    if (!bus || !route) return;
    
    bookingActiveSchedule = sched;
    selectedSeats = [];
    
    // Set labels
    document.getElementById('booking-modal-route-label').textContent = `LSK to ${route.destination} | ${sched.departureTime} | ${bus.operator}`;
    document.getElementById('summary-operator').textContent = bus.operator;
    document.getElementById('summary-bus-model').textContent = bus.model;
    document.getElementById('summary-datetime').textContent = `${sched.date} at ${sched.departureTime}`;
    document.getElementById('summary-fare').textContent = `ZMW ${sched.fare}.00`;
    
    document.getElementById('summary-seats').textContent = 'None Selected';
    document.getElementById('summary-total').textContent = 'ZMW 0.00';
    document.getElementById('checkout-schedule-id').value = sched.id;
    
    // Pre-populate name & phone if logged-in user is a passenger
    if (AppState.currentUser && AppState.currentUser.role === 'passenger') {
        document.getElementById('passenger-name-input').value = AppState.currentUser.name;
        document.getElementById('passenger-phone-input').value = '+260 970 000000'; // Default placeholder phone
    } else {
        document.getElementById('passenger-name-input').value = '';
        document.getElementById('passenger-phone-input').value = '';
    }
    
    // Generate Seating Layout Grid
    const seatGrid = document.getElementById('bus-seat-grid');
    seatGrid.innerHTML = '';
    
    const capacity = bus.capacity;
    
    // Determine configuration: Standard 2x2 layout is used
    // Grid template has 5 columns: 1 (Window), 2 (Aisle-left), 3 (Aisle spacer), 4 (Aisle-right), 5 (Window)
    // Row count = capacity / 4. For 60 seats -> 15 rows.
    const rowsCount = Math.ceil(capacity / 4);
    
    for (let r = 0; r < rowsCount; r++) {
        // Seat numbers for this row: 
        // Left side: seatNum1, seatNum2. Aisle. Right side: seatNum3, seatNum4.
        const leftWindow = r * 4 + 1;
        const leftAisle = r * 4 + 2;
        const rightAisle = r * 4 + 3;
        const rightWindow = r * 4 + 4;
        
        const rowSeats = [
            { num: leftWindow, role: 'window' },
            { num: leftAisle, role: 'aisle-left' },
            { num: null, role: 'aisle-space' }, // Spacer
            { num: rightAisle, role: 'aisle-right' },
            { num: rightWindow, role: 'window' }
        ];
        
        rowSeats.forEach(seatInfo => {
            if (seatInfo.num === null) {
                // Render aisle space
                const aisleDiv = document.createElement('div');
                aisleDiv.className = 'seat-aisle-space';
                seatGrid.appendChild(aisleDiv);
            } else if (seatInfo.num <= capacity) {
                const isBooked = sched.bookedSeats && sched.bookedSeats.includes(seatInfo.num);
                const seatBtn = document.createElement('div');
                seatBtn.className = `seat ${isBooked ? 'booked' : 'available'}`;
                seatBtn.textContent = seatInfo.num;
                seatBtn.dataset.seatNum = seatInfo.num;
                
                if (!isBooked) {
                    seatBtn.onclick = () => toggleSeatSelection(seatBtn, seatInfo.num);
                }
                
                seatGrid.appendChild(seatBtn);
            } else {
                // If capacity limit reached and not perfect multiple of 4, render empty space
                const emptyDiv = document.createElement('div');
                seatGrid.appendChild(emptyDiv);
            }
        });
    }
    
    document.getElementById('booking-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.add('hidden');
    bookingActiveSchedule = null;
    selectedSeats = [];
}

// Seat Selection toggler
function toggleSeatSelection(seatElement, seatNum) {
    if (seatElement.classList.contains('booked')) return;
    
    if (seatElement.classList.contains('selected')) {
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s !== seatNum);
    } else {
        seatElement.classList.add('selected');
        selectedSeats.push(seatNum);
    }
    
    // Sort seats numerically
    selectedSeats.sort((a, b) => a - b);
    
    // Update summary labels
    const summarySeats = document.getElementById('summary-seats');
    const summaryTotal = document.getElementById('summary-total');
    
    if (selectedSeats.length === 0) {
        summarySeats.textContent = 'None Selected';
        summaryTotal.textContent = 'ZMW 0.00';
    } else {
        summarySeats.textContent = selectedSeats.join(', ');
        const total = selectedSeats.length * bookingActiveSchedule.fare;
        summaryTotal.textContent = `ZMW ${total}.00`;
    }
}

// Checkout Form Submission (Proceeding to payment and ticketing)
function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    if (selectedSeats.length === 0) {
        showToast('Please select at least one seat to book.', 'error');
        return;
    }
    
    const scheduleId = document.getElementById('checkout-schedule-id').value;
    const passengerName = document.getElementById('passenger-name-input').value.trim();
    const passengerPhone = document.getElementById('passenger-phone-input').value.trim();
    const paymentMethod = document.getElementById('payment-method-input').value;
    
    const schedIndex = AppState.schedules.findIndex(s => s.id === scheduleId);
    if (schedIndex === -1) return;
    
    const sched = AppState.schedules[schedIndex];
    const bus = AppState.buses.find(b => b.id === sched.busId);
    const route = AppState.routes.find(r => r.code === sched.routeCode);
    
    // Calculate total price
    const totalAmount = selectedSeats.length * sched.fare;
    
    // 1. Generate unique Ref ID and Booking ID
    const bookingId = `TX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10)}`;
    const paymentRef = `REF-${Math.floor(Math.random() * 900000) + 100000}-${Math.floor(Math.random() * 90) + 10}`;
    
    // 2. Add seats to the schedule's booked list
    if (!sched.bookedSeats) sched.bookedSeats = [];
    sched.bookedSeats.push(...selectedSeats);
    
    // 3. Create Booking Record
    const newBooking = {
        id: bookingId,
        userId: AppState.currentUser ? AppState.currentUser.id : 'guest',
        scheduleId: scheduleId,
        passengerName,
        passengerPhone,
        seats: [...selectedSeats],
        totalAmount,
        status: 'Booked',
        timestamp: new Date().toISOString(),
        paymentRef
    };
    
    // 4. Create Payment Transaction Record
    const newPayment = {
        ref: paymentRef,
        bookingId,
        passengerName,
        operator: bus.operator,
        route: `Lusaka → ${route.destination}`,
        amount: totalAmount,
        method: paymentMethod,
        status: 'Successful',
        timestamp: new Date().toISOString()
    };
    
    // 5. Save everything to AppState and sync to storage
    AppState.bookings.push(newBooking);
    AppState.payments.push(newPayment);
    
    saveState('smartbus_schedules');
    saveState('smartbus_bookings');
    saveState('smartbus_payments');
    
    // 6. Notify passenger
    showToast(`Booking complete! Ticket ${bookingId} generated.`, 'success');
    
    // 7. Close selector and open printable ticket
    closeBookingModal();
    openTicketModal(bookingId);
    
    // Refresh the search view search results to show updated seats count
    handleScheduleSearch();
}

// Load Booking Details into Ticket Viewer Modal
function openTicketModal(bookingId) {
    const booking = AppState.bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const sched = AppState.schedules.find(s => s.id === booking.scheduleId);
    const bus = AppState.buses.find(b => b.id === sched.busId);
    const route = AppState.routes.find(r => r.code === sched.routeCode);
    
    // Map ticket labels
    document.getElementById('ticket-status').textContent = booking.status === 'Cancelled' ? 'VOID/CANCELLED' : 'PAID / VALID';
    document.getElementById('ticket-status').className = booking.status === 'Cancelled' ? 'ticket-status-badge bg-rose' : 'ticket-status-badge bg-emerald';
    
    document.getElementById('ticket-passenger-name').textContent = booking.passengerName;
    document.getElementById('ticket-passenger-phone').textContent = booking.passengerPhone;
    document.getElementById('ticket-bus-operator').textContent = bus.operator;
    document.getElementById('ticket-bus-details').textContent = `${bus.model} (${bus.regNumber})`;
    document.getElementById('ticket-origin').textContent = route.origin;
    document.getElementById('ticket-destination').textContent = route.destination;
    document.getElementById('ticket-date').textContent = sched.date;
    document.getElementById('ticket-time').textContent = `${sched.departureTime} hrs`;
    document.getElementById('ticket-seats').textContent = booking.seats.join(', ');
    document.getElementById('ticket-amount').textContent = `ZMW ${booking.totalAmount}.00`;
    document.getElementById('ticket-ref').textContent = booking.paymentRef;
    document.getElementById('ticket-barcode-id').textContent = booking.id;
    
    // Show Modal
    document.getElementById('ticket-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeTicketModal() {
    document.getElementById('ticket-modal').classList.add('hidden');
}

// Call Browser Print Dialog
function printTicket() {
    window.print();
}
