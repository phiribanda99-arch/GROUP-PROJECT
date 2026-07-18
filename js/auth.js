// User Registration and Authentication Logic

// Switch between sign in and sign up tabs
function switchAuthTab(tab) {
    const loginTabBtn = document.getElementById('tab-login-btn');
    const registerTabBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (tab === 'login') {
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        loginTabBtn.classList.remove('active');
        registerTabBtn.classList.add('active');
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }
}

// Handle Login Form Submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    
    console.log(`Attempting login for email: ${email}`);
    
    // Find user in AppState
    const user = AppState.users.find(u => u.email === email);
    
    if (!user) {
        showToast('Account not found. Please register or verify email.', 'error');
        return;
    }
    
    if (user.password !== password) {
        showToast('Incorrect password. Please try again.', 'error');
        return;
    }
    
    // Log user in
    AppState.currentUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    };
    
    saveState('smartbus_current_user');
    showToast(`Welcome back, ${user.name}!`, 'success');
    
    // Clear form
    document.getElementById('login-form').reset();
    
    // Show shell
    showAppShell();
}

// Handle User Registration Form Submission
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    
    console.log(`Attempting registration for email: ${email}`);
    
    // Check if email already exists
    const emailExists = AppState.users.some(u => u.email === email);
    if (emailExists) {
        showToast('An account with this email already exists.', 'error');
        return;
    }
    
    // Create new user account
    const newUser = {
        id: `u-${Date.now()}`,
        name: name,
        email: email,
        password: password,
        role: role
    };
    
    // Save to AppState and localStorage
    AppState.users.push(newUser);
    saveState('smartbus_users');
    
    // Log in automatically
    AppState.currentUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
    };
    saveState('smartbus_current_user');
    
    showToast(`Account created successfully. Welcome, ${name}!`, 'success');
    
    // Clear form
    document.getElementById('register-form').reset();
    
    // Show shell
    showAppShell();
}

// Handle Sign Out
function handleLogout() {
    console.log('Logging out user...');
    
    AppState.currentUser = null;
    saveState('smartbus_current_user');
    
    showToast('Signed out successfully.', 'info');
    
    // Switch to login tab and show auth screen
    switchAuthTab('login');
    showAuthScreen();
}
