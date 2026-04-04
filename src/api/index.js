const BASE_URL = 'http://localhost:8080/api';

let authToken = null;

export function setToken(token) {
    authToken = token;
}

export function clearToken() {
    authToken = null;
}

async function apiFetch(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw err.error || 'Request failed';
    }

    if (response.status === 204) return null;
    return response.json();
}

// ─── Auth ────────────────────────────────────────────────
export async function login(username, password) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data.user;
}

export async function logout() {
    clearToken();
}

export async function getCurrentUser() {
    return apiFetch('/auth/me');
}

// ─── Products ────────────────────────────────────────────
export const getAllProducts = () =>
    apiFetch('/products');

export const searchProducts = (query) =>
    apiFetch(`/products?query=${encodeURIComponent(query)}`);

export const getProductById = (id) =>
    apiFetch(`/products/${id}`);

export const createProduct = (reference, name, category, unit, alertThreshold, maxCapacity) =>
    apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({ reference, name, category, unit, alert_threshold: alertThreshold, max_capacity: maxCapacity ?? null }),
    });

export const updateProduct = (id, reference, name, category, unit, alertThreshold) =>
    apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ reference, name, category, unit, alert_threshold: alertThreshold }),
    });

export const deleteProduct = (id) =>
    apiFetch(`/products/${id}`, { method: 'DELETE' });

// ─── Suppliers ───────────────────────────────────────────
export const getAllSuppliers = () =>
    apiFetch('/suppliers');

export const searchSuppliers = (query) =>
    apiFetch(`/suppliers?query=${encodeURIComponent(query)}`);

export const getSupplierById = (id) =>
    apiFetch(`/suppliers/${id}`);

export const createSupplier = (name, contact, phone, address) =>
    apiFetch('/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name, contact: contact ?? null, phone: phone ?? null, address: address ?? null }),
    });

export const updateSupplier = (id, name, contact, phone, address, isActive) =>
    apiFetch(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, contact: contact ?? null, phone: phone ?? null, address: address ?? null, is_active: isActive }),
    });

export const deleteSupplier = (id) =>
    apiFetch(`/suppliers/${id}`, { method: 'DELETE' });

export const getProductsForSupplier = (supplierId) =>
    apiFetch(`/suppliers/${supplierId}/products`);

export const getSuppliersForProduct = (productId) =>
    apiFetch(`/products/${productId}/suppliers`);

export const addProductToSupplier = (productId, supplierId, unitPrice, deliveryDays, reliabilityScore) =>
    apiFetch('/product-suppliers', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, supplier_id: supplierId, unit_price: unitPrice, delivery_days: deliveryDays, reliability_score: reliabilityScore }),
    });

export const updateProductSupplier = (id, unitPrice, deliveryDays, reliabilityScore) =>
    apiFetch(`/product-suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ unit_price: unitPrice, delivery_days: deliveryDays, reliability_score: reliabilityScore }),
    });

export const removeProductFromSupplier = (id) =>
    apiFetch(`/product-suppliers/${id}`, { method: 'DELETE' });

// ─── Stock ───────────────────────────────────────────────
export const getAllStorage = () =>
    apiFetch('/storage');

export const searchStorage = (query) =>
    apiFetch(`/storage?query=${encodeURIComponent(query)}`);

export const getStorageByProduct = (productId) =>
    apiFetch(`/storage/${productId}`);

export const recordMovement = (productId, movementType, quantity, note) =>
    apiFetch('/storage/movements', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, movement_type: movementType, quantity, note: note ?? null }),
    });

export const getAllHistory = () =>
    apiFetch('/storage/history');

export const getHistoryByProduct = (productId) =>
    apiFetch(`/storage/history/${productId}`);

export const searchHistory = (productQuery, movementType, startDate, endDate) => {
    const params = new URLSearchParams();
    if (productQuery) params.append('product_query', productQuery);
    if (movementType) params.append('movement_type', movementType);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiFetch(`/storage/history?${params.toString()}`);
};

// ─── Orders ──────────────────────────────────────────────
export const getAllOrders = () =>
    apiFetch('/orders');

export const searchOrders = (supplierQuery, status) => {
    const params = new URLSearchParams();
    if (supplierQuery) params.append('supplier', supplierQuery);
    if (status) params.append('status', status);
    return apiFetch(`/orders?${params.toString()}`);
};

export const getOrderById = (id) =>
    apiFetch(`/orders/${id}`);

export const getOrderItems = (orderId) =>
    apiFetch(`/orders/${orderId}/items`);

export const validateOrder = (orderId) =>
    apiFetch(`/orders/${orderId}/validate`, { method: 'POST' });

export const rejectOrder = (orderId) =>
    apiFetch(`/orders/${orderId}`, { method: 'DELETE' });

// ─── Alerts ──────────────────────────────────────────────
export const getAllAlerts = () =>
    apiFetch('/alerts');

export const getActiveAlerts = () =>
    apiFetch('/alerts?status=active');

export const acknowledgeAlert = (alertId) =>
    apiFetch(`/alerts/${alertId}/acknowledge`, { method: 'POST' });

export const resolveAlert = (alertId) =>
    apiFetch(`/alerts/${alertId}/resolve`, { method: 'POST' });

// ─── Exceptional Periods ─────────────────────────────────
export const getAllExceptionalPeriods = () =>
    apiFetch('/exceptional-periods');

export const createExceptionalPeriod = (name, startDate, endDate, factor) =>
    apiFetch('/exceptional-periods', {
        method: 'POST',
        body: JSON.stringify({ name, start_date: startDate, end_date: endDate, factor }),
    });

export const updateExceptionalPeriod = (id, name, startDate, endDate, factor) =>
    apiFetch(`/exceptional-periods/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, start_date: startDate, end_date: endDate, factor }),
    });

export const deleteExceptionalPeriod = (id) =>
    apiFetch(`/exceptional-periods/${id}`, { method: 'DELETE' });

// ─── Users ───────────────────────────────────────────────
export const getAllUsers = () =>
    apiFetch('/users');

export const createUser = (username, password, role) =>
    apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ username, password, role }),
    });

export const deleteUser = (id) =>
    apiFetch(`/users/${id}`, { method: 'DELETE' });

export const updateRole = (id, role) =>
    apiFetch(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    });

export const changePassword = (id, oldPassword, newPassword) =>
    apiFetch(`/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });

export const updateUsername = (id, newUsername) =>
    apiFetch(`/users/${id}/username`, {
        method: 'PUT',
        body: JSON.stringify({ new_username: newUsername }),
    });

// ─── Settings ────────────────────────────────────────────
export const getAllSettings = () =>
    apiFetch('/settings');

export const updateSetting = (key, value) =>
    apiFetch(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
    });