document.addEventListener('DOMContentLoaded', async function () {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.hasAttribute('data-page')) {
                e.preventDefault();
                const page = this.dataset.page;
                showSection(page);

                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Show initial section
    showSection('dashboard');

    // Load initial data
    await loadDashboardData();
    await loadServices();
    await loadProducts();

    // Setup event listeners for filters
    setupFilters();

    // Update counters periodically
    updateCounters();
    setInterval(updateCounters, 30000); // Update every 30 seconds

    // Initial update
    updateDashboardStats();

    // Update every 30 seconds
    setInterval(updateDashboardStats, 30000);

    // Initial CSRF token refresh
    await refreshCsrfToken();

    // Refresh CSRF token every 30 minutes
    setInterval(refreshCsrfToken, 30 * 60 * 1000);

    // Booking and Payment event listeners
    document.getElementById('save-booking').addEventListener('click', saveBooking);
    document.getElementById('save-payment').addEventListener('click', savePayment);

    // Logout button click handler
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

function showSection(section) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('d-none');
    });
    document.querySelector(`#${section}-page`).classList.remove('d-none');

    // Load section-specific data
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'services':
            loadServices();
            break;
        case 'products':
            loadProducts();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'quotations':
            loadQuotations();
            break;
        case 'payments':
            loadPayments();
            break;
        case 'chat':
            loadChatSessions();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Get stored CSRF token - CSRF validation is disabled
function getCsrfToken() {
    // Return a dummy token since CSRF is disabled
    const dummyToken = 'csrf-disabled-token';
    localStorage.setItem('csrfToken', dummyToken);
    return dummyToken;
}

// Function to refresh CSRF token - CSRF validation is disabled
async function refreshCsrfToken() {
    // Return a dummy token since CSRF is disabled
    const dummyToken = 'csrf-disabled-token';
    localStorage.setItem('csrfToken', dummyToken);
    return dummyToken;
}

// Function to make authenticated API requests
async function apiRequest(url, options = {}) {
    try {
        // Get CSRF token
        let csrfToken = localStorage.getItem('csrfToken');
        if (!csrfToken) {
            csrfToken = await refreshCsrfToken();
            if (!csrfToken) {
                throw new Error('Could not get CSRF token');
            }
        }

        // Set default headers
        const headers = {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
            ...options.headers
        };

        // Make the request
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include'
        });

        // Handle different response statuses
        if (response.status === 401) {
            // Unauthorized - clear stored data and redirect to login
            localStorage.clear();
            window.location.href = '/admin/login';
            return;
        }

        if (response.status === 403) {
            // Forbidden - might be expired CSRF token
            const newToken = await refreshCsrfToken();
            if (newToken) {
                // Retry the request with new token
                headers['x-csrf-token'] = newToken;
                const retryResponse = await fetch(url, {
                    ...options,
                    headers,
                    credentials: 'include'
                });

                if (retryResponse.ok) {
                    return retryResponse.json();
                }
            }
            // If retry fails, redirect to login
            localStorage.clear();
            window.location.href = '/admin/login';
            return;
        }

        if (!response.ok) {
            throw new Error('API request failed');
        }

        return response.json();
    } catch (error) {
        console.error('API request error:', error);
        showAlert(error.message || 'An error occurred', 'danger');
        throw error;
    }
}

// Use apiRequest for all API calls
async function loadDashboardData() {
    try {
        const data = await apiRequest('/api/admin/dashboard');

        document.getElementById('today-bookings').textContent = data.todayBookings;
        document.getElementById('today-revenue').textContent = `$${data.todayRevenue}`;
        document.getElementById('pending-quotes').textContent = data.pendingQuotes;
        document.getElementById('active-chats').textContent = data.activeChats;

        // Update recent bookings table
        updateRecentBookingsTable(data.recentBookings);

        // Update recent payments table
        updateRecentPaymentsTable(data.recentPayments);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

async function loadServices() {
    try {
        const category = document.getElementById('service-category-filter').value;
        const status = document.getElementById('service-status-filter').value;
        const search = document.getElementById('service-search').value;

        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        if (search) params.append('search', search);

        const data = await apiRequest('/api/admin/services', {
            method: 'GET',
            params: params
        });

        const tbody = document.querySelector('#services-table tbody');
        tbody.innerHTML = '';

        data.forEach(service => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${service._id}</td>
                <td>${service.name}</td>
                <td>${service.category}</td>
                <td>$${service.price}</td>
                <td>
                    <span class="badge ${service.isActive ? 'bg-success' : 'bg-danger'}">
                        ${service.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editService('${service._id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteService('${service._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading services:', error);
        showAlert('Error loading services', 'error');
    }
}

async function loadProducts() {
    try {
        const category = document.getElementById('product-category-filter').value;
        const status = document.getElementById('product-status-filter').value;
        const search = document.getElementById('product-search').value;

        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        if (search) params.append('search', search);

        const data = await apiRequest('/api/admin/products', {
            method: 'GET',
            params: params
        });

        const tbody = document.querySelector('#products-table tbody');
        tbody.innerHTML = '';

        data.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product._id}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>$${product.price}</td>
                <td>${product.stock}</td>
                <td>
                    <span class="badge ${product.isActive ? 'bg-success' : 'bg-danger'}">
                        ${product.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProduct('${product._id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Error loading products', 'error');
    }
}

function setupFilters() {
    // Service filters
    const serviceFilters = ['service-category-filter', 'service-status-filter'];
    serviceFilters.forEach(id => {
        document.getElementById(id).addEventListener('change', () => loadServices());
    });

    // Product filters
    const productFilters = ['product-category-filter', 'product-status-filter'];
    productFilters.forEach(id => {
        document.getElementById(id).addEventListener('change', () => loadProducts());
    });

    // Search inputs with debounce
    document.getElementById('service-search').addEventListener('input',
        debounce(() => loadServices(), 500)
    );
    document.getElementById('product-search').addEventListener('input',
        debounce(() => loadProducts(), 500)
    );

    // Form submissions
    document.getElementById('save-service').addEventListener('click', saveService);
    document.getElementById('save-product').addEventListener('click', saveProduct);
}

async function saveService() {
    try {
        const form = document.getElementById('new-service-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Convert checkbox value to boolean
        data.isActive = formData.has('isActive') ? true : false;

        const response = await apiRequest('/api/admin/services', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to save service');

        showAlert('Service saved successfully');
        loadServices();
        bootstrap.Modal.getInstance(document.getElementById('newServiceModal')).hide();
        form.reset();
    } catch (err) {
        console.error('Error saving service:', err);
        showAlert('Error saving service', 'error');
    }
}

async function saveProduct() {
    try {
        const form = document.getElementById('new-product-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Convert checkbox value to boolean
        data.isActive = formData.has('isActive') ? true : false;

        const response = await apiRequest('/api/admin/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to save product');

        showAlert('Product saved successfully');
        loadProducts();
        bootstrap.Modal.getInstance(document.getElementById('newProductModal')).hide();
        form.reset();
    } catch (err) {
        console.error('Error saving product:', err);
        showAlert('Error saving product', 'error');
    }
}

async function editService(id) {
    try {
        const response = await apiRequest(`/api/admin/services/${id}`);
        const service = await response.json();

        const form = document.getElementById('new-service-form');
        form.elements.name.value = service.name;
        form.elements.description.value = service.description;
        form.elements.category.value = service.category;
        form.elements.price.value = service.price;
        form.elements.keywords.value = service.keywords.join(', ');
        form.elements.isActive.checked = service.isActive;

        const modal = new bootstrap.Modal(document.getElementById('newServiceModal'));
        modal.show();

        // Update save button to handle update
        document.getElementById('save-service').onclick = async () => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const updateResponse = await apiRequest(`/api/admin/services/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            if (!updateResponse.ok) throw new Error('Failed to update service');

            showAlert('Service updated successfully');
            loadServices();
            modal.hide();
        };
    } catch (err) {
        console.error('Error editing service:', err);
        showAlert('Error editing service', 'error');
    }
}

async function editProduct(id) {
    try {
        const response = await apiRequest(`/api/admin/products/${id}`);
        const product = await response.json();

        const form = document.getElementById('new-product-form');
        form.elements.name.value = product.name;
        form.elements.description.value = product.description;
        form.elements.category.value = product.category;
        form.elements.price.value = product.price;
        form.elements.stock.value = product.stock;
        form.elements.keywords.value = product.keywords.join(', ');
        form.elements.isActive.checked = product.isActive;

        const modal = new bootstrap.Modal(document.getElementById('newProductModal'));
        modal.show();

        // Update save button to handle update
        document.getElementById('save-product').onclick = async () => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const updateResponse = await apiRequest(`/api/admin/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            if (!updateResponse.ok) throw new Error('Failed to update product');

            showAlert('Product updated successfully');
            loadProducts();
            modal.hide();
        };
    } catch (err) {
        console.error('Error editing product:', err);
        showAlert('Error editing product', 'error');
    }
}

async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
        const response = await apiRequest(`/api/admin/services/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete service');

        showAlert('Service deleted successfully');
        loadServices();
    } catch (err) {
        console.error('Error deleting service:', err);
        showAlert('Error deleting service', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await apiRequest(`/api/admin/products/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete product');

        showAlert('Product deleted successfully');
        loadProducts();
    } catch (err) {
        console.error('Error deleting product:', err);
        showAlert('Error deleting product', 'error');
    }
}

function updateRecentBookingsTable(bookings) {
    const tbody = document.querySelector('#recent-bookings-table tbody');
    tbody.innerHTML = '';

    bookings.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.customer.name}</td>
            <td>${booking.service}</td>
            <td>${new Date(booking.dateTime).toLocaleString()}</td>
            <td>
                <span class="badge bg-${getStatusColor(booking.status)}">
                    ${booking.status}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateRecentPaymentsTable(payments) {
    const tbody = document.querySelector('#recent-payments-table tbody');
    tbody.innerHTML = '';

    payments.forEach(payment => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${payment.customer.name}</td>
            <td>$${payment.amount}</td>
            <td>${payment.paymentMethod}</td>
            <td>
                <span class="badge bg-${getStatusColor(payment.status)}">
                    ${payment.status}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusColor(status) {
    const colors = {
        pending: 'warning',
        confirmed: 'primary',
        completed: 'success',
        cancelled: 'danger',
        failed: 'danger'
    };
    return colors[status.toLowerCase()] || 'secondary';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

async function updateCounters() {
    try {
        const response = await apiRequest('/api/admin/dashboard/overview');
        const data = await response.json();

        // Update badges
        document.getElementById('bookings-count').textContent = data.pendingBookings || 0;
        document.getElementById('quotes-count').textContent = data.pendingQuotations || 0;
        document.getElementById('payments-count').textContent = data.todayPayments || 0;
        document.getElementById('chats-count').textContent = data.activeChats || 0;
        document.getElementById('services-count').textContent = data.totalServices || 0;
        document.getElementById('products-count').textContent = data.totalProducts || 0;

        // Add pulse animation to badges with non-zero values
        document.querySelectorAll('.badge').forEach(badge => {
            if (parseInt(badge.textContent) > 0) {
                badge.classList.add('badge-pulse');
            } else {
                badge.classList.remove('badge-pulse');
            }
        });
    } catch (error) {
        console.error('Error updating counters:', error);
    }
}

// Function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to update dashboard statistics
async function updateDashboardStats() {
    try {
        const response = await apiRequest('/api/admin/dashboard/stats');
        const data = await response.json();

        // Update card values
        document.getElementById('today-bookings').textContent = data.todayBookings;
        document.getElementById('today-revenue').textContent = formatCurrency(data.todayRevenue);
        document.getElementById('pending-quotes').textContent = data.pendingQuotes;
        document.getElementById('active-chats').textContent = data.activeChats;

        // Update recent bookings table
        const bookingsTableBody = document.querySelector('#recent-bookings-table tbody');
        bookingsTableBody.innerHTML = '';
        data.recentBookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${booking.customer.name}</td>
                <td>${booking.service.name}</td>
                <td>${formatDate(booking.date)}</td>
                <td><span class="badge bg-${getStatusColor(booking.status)}">${booking.status}</span></td>
            `;
            bookingsTableBody.appendChild(row);
        });

        // Update recent payments table
        const paymentsTableBody = document.querySelector('#recent-payments-table tbody');
        paymentsTableBody.innerHTML = '';
        data.recentPayments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.customer.name}</td>
                <td>${formatCurrency(payment.amount)}</td>
                <td>${payment.method}</td>
                <td><span class="badge bg-${getStatusColor(payment.status)}">${payment.status}</span></td>
            `;
            paymentsTableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Admin Users Management
async function loadAdminUsers() {
    try {
        const response = await apiRequest('/api/admin/users');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load admin users');
        }

        const usersTable = document.getElementById('users-table').getElementsByTagName('tbody')[0];
        usersTable.innerHTML = '';

        data.data.forEach(user => {
            const row = usersTable.insertRow();
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-${user.role === 'super_admin' ? 'danger' : 'primary'}">${user.role}</span></td>
                <td><span class="badge bg-${user.isActive ? 'success' : 'secondary'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-user" data-id="${user._id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-user" data-id="${user._id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
        });

        // Update users count
        document.getElementById('users-count').textContent = data.count;
    } catch (error) {
        showAlert('error', error.message);
    }
}

// Create new admin user
document.getElementById('save-user')?.addEventListener('click', async () => {
    try {
        const form = document.getElementById('new-user-form');
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role'),
            isActive: formData.get('isActive') === 'on'
        };

        const response = await apiRequest('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create admin user');
        }

        // Close modal and refresh users list
        const modal = bootstrap.Modal.getInstance(document.getElementById('newUserModal'));
        modal.hide();
        form.reset();
        showAlert('success', 'Admin user created successfully');
        loadAdminUsers();
    } catch (error) {
        showAlert('error', error.message);
    }
});

// Delete admin user
document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-user')) {
        const userId = e.target.closest('.delete-user').dataset.id;
        if (confirm('Are you sure you want to delete this admin user?')) {
            try {
                const response = await apiRequest(`/api/admin/users/${userId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete admin user');
                }

                showAlert('success', 'Admin user deleted successfully');
                loadAdminUsers();
            } catch (error) {
                showAlert('error', error.message);
            }
        }
    }
});

// Edit admin user
document.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-user')) {
        const userId = e.target.closest('.edit-user').dataset.id;
        try {
            const response = await apiRequest(`/api/admin/users/${userId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load admin user details');
            }

            // Populate form with user data
            const form = document.getElementById('new-user-form');
            form.querySelector('[name="username"]').value = data.data.username;
            form.querySelector('[name="email"]').value = data.data.email;
            form.querySelector('[name="role"]').value = data.data.role;
            form.querySelector('[name="isActive"]').checked = data.data.isActive;

            // Hide password field for editing
            form.querySelector('[name="password"]').parentElement.style.display = 'none';

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('newUserModal'));
            modal.show();

            // Update save button to handle edit
            const saveButton = document.getElementById('save-user');
            saveButton.dataset.mode = 'edit';
            saveButton.dataset.userId = userId;
        } catch (error) {
            showAlert('error', error.message);
        }
    }
});

// Filter admin users
document.getElementById('user-role-filter')?.addEventListener('change', loadAdminUsers);
document.getElementById('user-status-filter')?.addEventListener('change', loadAdminUsers);
document.getElementById('user-search')?.addEventListener('input', loadAdminUsers);

// Load admin users when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('users-page')) {
        loadAdminUsers();
    }
});

// Save Booking
async function saveBooking() {
    try {
        const form = document.getElementById('new-booking-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Format the data properly
        data.date = data.dateTime; // Rename dateTime to date to match the API
        delete data.dateTime;
        
        const response = await apiRequest('/api/admin/bookings', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response) throw new Error('Failed to save booking');

        showAlert('Booking saved successfully');
        bootstrap.Modal.getInstance(document.getElementById('newBookingModal')).hide();
        form.reset();
        
        // Refresh dashboard data
        updateDashboardStats();
    } catch (err) {
        console.error('Error saving booking:', err);
        showAlert('Error saving booking', 'danger');
    }
}

// Save Payment
async function savePayment() {
    try {
        const form = document.getElementById('new-payment-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Format the data properly
        data.method = data.paymentMethod; // Rename paymentMethod to method to match the API
        delete data.paymentMethod;
        data.status = 'completed'; // Default status
        
        const response = await apiRequest('/api/admin/payments', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response) throw new Error('Failed to save payment');

        showAlert('Payment saved successfully');
        bootstrap.Modal.getInstance(document.getElementById('newPaymentModal')).hide();
        form.reset();
        
        // Refresh dashboard data
        updateDashboardStats();
    } catch (err) {
        console.error('Error saving payment:', err);
        showAlert('Error saving payment', 'danger');
    }
}

// Handle logout
async function handleLogout() {
    try {
        const response = await apiRequest('/api/admin/logout', {
            method: 'GET'
        });
        if (response && response.success !== false) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/admin/login';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Logout failed. Please try again.', 'danger');
    }
} 