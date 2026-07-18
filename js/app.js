// Global Application State Manager
const STATE_KEYS = {
    USERS: 'smartbus_users',
    BUSES: 'smartbus_buses',
    ROUTES: 'smartbus_routes',
    SCHEDULES: 'smartbus_schedules',
    BOOKINGS: 'smartbus_bookings',
    PAYMENTS: 'smartbus_payments',
    CURRENT_USER: 'smartbus_current_user'
};

// Main State Object
let AppState = {
    users: [],
    buses: [],
    routes: [],
    schedules: [],
    bookings: [],
    payments: [],
    currentUser: null
};

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="toast-icon-${type}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 50);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Local Storage Sync Utilities
function loadState() {
    try {
        AppState.users = JSON.parse(localStorage.getItem(STATE_KEYS.USERS)) || [];
        AppState.buses = JSON.parse(localStorage.getItem(STATE_KEYS.BUSES)) || [];
        AppState.routes = JSON.parse(localStorage.getItem(STATE_KEYS.ROUTES)) || [];
        AppState.schedules = JSON.parse(localStorage.getItem(STATE_KEYS.SCHEDULES)) || [];
        AppState.bookings = JSON.parse(localStorage.getItem(STATE_KEYS.BOOKINGS)) || [];
        AppState.payments = JSON.parse(localStorage.getItem(STATE_KEYS.PAYMENTS)) || [];
        AppState.currentUser = JSON.parse(localStorage.getItem(STATE_KEYS.CURRENT_USER)) || null;

        // If data is empty, seed initial data for demonstration
        if (AppState.users.length === 0) {
            seedDatabaseData();
        }
    } catch (e) {
        console.error('Error loading state from localStorage:', e);
        showToast('Error initializing system data.', 'error');
    }
}

function saveState(key) {
    try {
        if (key) {
            localStorage.setItem(key, JSON.stringify(AppState[key.replace('smartbus_', '')]));
        } else {
            // Save all
            localStorage.setItem(STATE_KEYS.USERS, JSON.stringify(AppState.users));
            localStorage.setItem(STATE_KEYS.BUSES, JSON.stringify(AppState.buses));
            localStorage.setItem(STATE_KEYS.ROUTES, JSON.stringify(AppState.routes));
            localStorage.setItem(STATE_KEYS.SCHEDULES, JSON.stringify(AppState.schedules));
            localStorage.setItem(STATE_KEYS.BOOKINGS, JSON.stringify(AppState.bookings));
            localStorage.setItem(STATE_KEYS.PAYMENTS, JSON.stringify(AppState.payments));
            localStorage.setItem(STATE_KEYS.CURRENT_USER, JSON.stringify(AppState.currentUser));
        }
    } catch (e) {
        console.error('Error saving state to localStorage:', e);
        showToast('Error saving changes to database.', 'error');
    }
}

// Database Seeder
function seedDatabaseData() {
    console.log('Seeding initial database data...');
    
    // 1. Users
    AppState.users = [
        {
            id: 'u-1',
            email: 'operator@intercity.zm',
            password: 'password',
            name: 'Mutale Chanda',
            role: 'operator'
        },
        {
            id: 'u-2',
            email: 'passenger@gmail.com',
            password: 'password',
            name: 'John Phiri',
            role: 'passenger'
        }
    ];

    // 2. Buses
    AppState.buses = [
        { id: 'b-1', operator: 'Mazhandu Family Bus Services', regNumber: 'ABL 4390', model: 'Scania Marcopolo G7', capacity: 60, status: 'Active' },
        { id: 'b-2', operator: 'Power Tools', regNumber: 'ABA 8831', model: 'Yutong F12+', capacity: 60, status: 'Active' },
        { id: 'b-3', operator: 'Likili Motorways', regNumber: 'ALL 9002', model: 'Volvo B11R', capacity: 48, status: 'Active' },
        { id: 'b-4', operator: 'Shalom Bus Services', regNumber: 'ABM 2110', model: 'Zhongtong Climber', capacity: 60, status: 'Active' },
        { id: 'b-5', operator: 'Juldan Motors', regNumber: 'ABL 9811', model: 'Scania Marcopolo G7', capacity: 48, status: 'Active' },
        { id: 'b-6', operator: 'Euro Africa', regNumber: 'ABE 1234', model: 'Yutong F12+', capacity: 60, status: 'Active' },
        { id: 'b-7', operator: 'FM Travellers', regNumber: 'ABF 5678', model: 'Volvo B11R', capacity: 66, status: 'Active' },
        { id: 'b-8', operator: 'Mazhandu Family Bus Services', regNumber: 'ABL 2211', model: 'Volvo B11R', capacity: 60, status: 'Maintenance' }
    ];

    // 3. Routes
    AppState.routes = [
        { code: 'LSK-NDL-01', origin: 'Lusaka (Intercity Terminus)', destination: 'Ndola', duration: 4.5, basePrice: 240 },
        { code: 'LSK-LIV-01', origin: 'Lusaka (Intercity Terminus)', destination: 'Livingstone', duration: 7, basePrice: 280 },
        { code: 'LSK-KTW-01', origin: 'Lusaka (Intercity Terminus)', destination: 'Kitwe', duration: 5, basePrice: 260 },
        { code: 'LSK-CHP-01', origin: 'Lusaka (Intercity Terminus)', destination: 'Chipata', duration: 8, basePrice: 290 },
        { code: 'LSK-KSM-01', origin: 'Lusaka (Intercity Terminus)', destination: 'Kasama', duration: 12, basePrice: 380 },
        { code: 'LSK-SLW-01', origin: 'Lusaka (Intercity Terminus)', destination: 'Solwezi', duration: 10, basePrice: 350 }
    ];

    // 4. Schedules
    // Create schedules for today (June 18, 2026), yesterday, and tomorrow to show variety
    const today = new Date('2026-06-18').toISOString().split('T')[0];
    const tomorrow = new Date('2026-06-19').toISOString().split('T')[0];
    const yesterday = new Date('2026-06-17').toISOString().split('T')[0];

    AppState.schedules = [
        { id: 'sch-1', routeCode: 'LSK-NDL-01', busId: 'b-1', departureTime: '06:00', arrivalTime: '10:30', date: today, fare: 240, bookedSeats: [5, 6, 12, 15] },
        { id: 'sch-2', routeCode: 'LSK-NDL-01', busId: 'b-2', departureTime: '08:30', arrivalTime: '13:00', date: today, fare: 250, bookedSeats: [1, 2, 23, 24, 25] },
        { id: 'sch-3', routeCode: 'LSK-LIV-01', busId: 'b-3', departureTime: '07:00', arrivalTime: '14:00', date: today, fare: 280, bookedSeats: [8, 9, 10, 11] },
        { id: 'sch-4', routeCode: 'LSK-KTW-01', busId: 'b-4', departureTime: '13:00', arrivalTime: '18:00', date: today, fare: 260, bookedSeats: [] },
        { id: 'sch-5', routeCode: 'LSK-CHP-01', busId: 'b-5', departureTime: '05:00', arrivalTime: '13:00', date: today, fare: 300, bookedSeats: [3, 4] },
        { id: 'sch-6', routeCode: 'LSK-NDL-01', busId: 'b-1', departureTime: '06:00', arrivalTime: '10:30', date: tomorrow, fare: 240, bookedSeats: [] },
        { id: 'sch-7', routeCode: 'LSK-LIV-01', busId: 'b-6', departureTime: '09:00', arrivalTime: '16:00', date: tomorrow, fare: 280, bookedSeats: [] },
        { id: 'sch-8', routeCode: 'LSK-NDL-01', busId: 'b-7', departureTime: '06:30', arrivalTime: '11:00', date: yesterday, fare: 240, bookedSeats: [1,2,3,4,5,6,7,8,9,10] } // Completed yesterday
    ];

    // 5. Bookings & Payments
    // Seed some bookings for analytics
    AppState.bookings = [
        {
            id: 'TX-832941-1',
            userId: 'u-2',
            scheduleId: 'sch-8', // Yesterday
            passengerName: 'John Phiri',
            passengerPhone: '+260 977 112233',
            seats: [1, 2],
            totalAmount: 480,
            status: 'Completed',
            timestamp: '2026-06-17T05:30:00Z',
            paymentRef: 'REF-173820-94'
        },
        {
            id: 'TX-832941-2',
            userId: 'u-2',
            scheduleId: 'sch-1', // Today's early bus
            passengerName: 'John Phiri',
            passengerPhone: '+260 977 112233',
            seats: [12],
            totalAmount: 240,
            status: 'Booked',
            timestamp: '2026-06-18T04:45:00Z',
            paymentRef: 'REF-183021-41'
        },
        {
            // Seed operator-owned bookings for other passengers to populate dashboard
            id: 'TX-832941-3',
            userId: 'u-none-1',
            scheduleId: 'sch-2', // Today
            passengerName: 'Mutinta Mwanza',
            passengerPhone: '+260 966 443322',
            seats: [23, 24],
            totalAmount: 500,
            status: 'Booked',
            timestamp: '2026-06-18T06:15:00Z',
            paymentRef: 'REF-184511-92'
        },
        {
            id: 'TX-832941-4',
            userId: 'u-none-2',
            scheduleId: 'sch-3', // Today
            passengerName: 'Chanda Kapya',
            passengerPhone: '+260 955 889900',
            seats: [8, 9, 10],
            totalAmount: 840,
            status: 'Booked',
            timestamp: '2026-06-18T06:20:00Z',
            paymentRef: 'REF-185610-88'
        }
    ];

    AppState.payments = [
        { ref: 'REF-173820-94', bookingId: 'TX-832941-1', passengerName: 'John Phiri', operator: 'FM Travellers', route: 'Lusaka → Ndola', amount: 480, method: 'Mobile Money (Airtel/MTN/Zamtel)', status: 'Successful', timestamp: '2026-06-17T05:30:00Z' },
        { ref: 'REF-183021-41', bookingId: 'TX-832941-2', passengerName: 'John Phiri', operator: 'Mazhandu Family Bus Services', route: 'Lusaka → Ndola', amount: 240, method: 'Credit/Debit Card (Visa/Mastercard)', status: 'Successful', timestamp: '2026-06-18T04:45:00Z' },
        { ref: 'REF-184511-92', bookingId: 'TX-832941-3', passengerName: 'Mutinta Mwanza', operator: 'Power Tools', route: 'Lusaka → Ndola', amount: 500, method: 'Mobile Money (Airtel/MTN/Zamtel)', status: 'Successful', timestamp: '2026-06-18T06:15:00Z' },
        { ref: 'REF-185610-88', bookingId: 'TX-832941-4', passengerName: 'Chanda Kapya', operator: 'Likili Motorways', route: 'Lusaka → Livingstone', amount: 840, method: 'Cash at Terminal Counter', status: 'Successful', timestamp: '2026-06-18T06:20:00Z' }
    ];

    saveState();
}

// Single Page Navigation Controller
function navigateTo(viewId) {
    console.log(`Navigating to view: ${viewId}`);
    
    // Hide all view sections
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.remove('active'));
    
    // Remove active class from nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Show active view section
    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Add active class to sidebar item
        const navItem = document.getElementById(`nav-${viewId}`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Update header title
        const titles = {
            'dashboard': 'Reporting Dashboard & Performance',
            'buses': 'Bus Fleet Management',
            'schedules': 'Schedules & Routes Allocation',
            'operator-payments': 'Payment Ledger & Tracking',
            'book-tickets': 'Search & Book Bus Tickets',
            'travel-history': 'Travel History & Active Tickets'
        };
        document.getElementById('current-view-title').textContent = titles[viewId] || 'Portal';
        
        // Trigger module-specific refreshes
        if (viewId === 'dashboard') refreshDashboardView();
        if (viewId === 'buses') refreshBusesView();
        if (viewId === 'schedules') refreshSchedulesView();
        if (viewId === 'operator-payments') refreshOperatorPaymentsView();
        if (viewId === 'book-tickets') refreshBookingView();
        if (viewId === 'travel-history') refreshTravelHistoryView();
    } else {
        console.error(`Target view section view-${viewId} not found.`);
    }
}

// Set up UI components and state on initial load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load data from localStorage
    loadState();
    
    // 2. Set Current Date Display in Header
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date-display').textContent = new Date().toLocaleDateString('en-US', dateOptions);
    
    // 3. Set Date pickers default boundaries
    const dateInput = document.getElementById('search-date');
    if (dateInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        dateInput.value = todayStr;
        dateInput.min = todayStr;
    }
    const schedDateInput = document.getElementById('schedule-date');
    if (schedDateInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        schedDateInput.value = todayStr;
        schedDateInput.min = todayStr;
    }

    // 4. Check Authentication session
    if (AppState.currentUser) {
        showAppShell();
    } else {
        showAuthScreen();
    }
    
    // 5. Initialize Lucide Icons
    lucide.createIcons();
});

// App Shell visual states
function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
}

function showAppShell() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    
    // Set user profile info in navbar
    const user = AppState.currentUser;
    document.getElementById('nav-user-name').textContent = user.name;
    document.getElementById('nav-user-avatar').textContent = user.name.charAt(0).toUpperCase();
    
    const roleBadge = document.getElementById('nav-user-role');
    if (user.role === 'operator') {
        roleBadge.textContent = 'OPERATOR';
        roleBadge.className = 'badge badge-role bg-violet';
        
        // Show operator nav items, hide passenger ones
        document.querySelectorAll('.operator-only').forEach(el => el.classList.remove('hidden'));
        document.querySelectorAll('.passenger-only').forEach(el => el.classList.add('hidden'));
        
        navigateTo('dashboard');
    } else {
        roleBadge.textContent = 'PASSENGER';
        roleBadge.className = 'badge badge-role bg-blue';
        
        // Hide operator nav items, show passenger ones
        document.querySelectorAll('.operator-only').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.passenger-only').forEach(el => el.classList.remove('hidden'));
        
        navigateTo('book-tickets');
    }
}
