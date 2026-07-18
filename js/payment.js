// Payment Tracking and Transaction Ledger Logic

// Render all transactions in the operator's financial ledger
function refreshOperatorPaymentsView() {
    console.log('Refreshing operator transaction ledger view...');
    
    // Clear and re-populate the filter selection dropdown to ensure options are synced
    const filterSelect = document.getElementById('payment-operator-filter');
    const selectedVal = filterSelect.value;
    
    // Re-fill operator selection options based on active operators in our buses list
    const activeOperators = [...new Set(AppState.buses.map(b => b.operator))];
    
    filterSelect.innerHTML = '<option value="">All Bus Operators</option>';
    activeOperators.forEach(op => {
        filterSelect.innerHTML += `<option value="${op}">${op}</option>`;
    });
    
    // Restore selection
    if (activeOperators.includes(selectedVal)) {
        filterSelect.value = selectedVal;
    }
    
    // Render the table data
    filterPaymentsTable();
}

// Filter and render payments table rows based on operator selection dropdown
function filterPaymentsTable() {
    const tbody = document.getElementById('operator-payments-tbody');
    const selectedOperator = document.getElementById('payment-operator-filter').value;
    
    tbody.innerHTML = '';
    
    // Filter payment records
    const filteredPayments = AppState.payments.filter(pay => {
        if (!selectedOperator) return true;
        return pay.operator === selectedOperator;
    });
    
    // Reverse sort transactions to show newest first
    const sortedPayments = [...filteredPayments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (sortedPayments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No transaction logs found matching criteria.</td></tr>`;
        return;
    }
    
    sortedPayments.forEach(pay => {
        const tr = document.createElement('tr');
        
        // Formatting timestamp nicely
        const dateStr = new Date(pay.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        tr.innerHTML = `
            <td><code style="font-family: monospace; font-weight: 700; color: #a78bfa;">${pay.ref}</code></td>
            <td>
                <div style="font-weight: 600;">${pay.passengerName}</div>
            </td>
            <td><strong>${pay.operator}</strong></td>
            <td>${pay.route}</td>
            <td><strong style="color: #60a5fa;">ZMW ${pay.amount}</strong></td>
            <td>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">${pay.method}</span>
            </td>
            <td>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</span>
            </td>
            <td>
                <span class="badge ${pay.status === 'Successful' ? 'bg-emerald' : pay.status === 'Pending' ? 'bg-amber' : 'bg-rose'}">
                    ${pay.status}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}
