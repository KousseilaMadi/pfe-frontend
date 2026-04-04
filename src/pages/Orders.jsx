import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { formatDate, formatQuantity } from '../utils/format';

export default function Orders({ navigate }) {
    const { canValidateOrders } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            setLoading(true);
            const data = await api.searchOrders(null, null);
            setOrders(data);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch() {
        try {
            const data = await api.searchOrders(
                supplierSearch || null,
                statusFilter || null,
            );
            setOrders(data);
        } catch (e) {
            console.error(e);
        }
    }

    async function openOrderDetail(order) {
        setSelectedOrder(order);
        try {
            const items = await api.getOrderItems(order.id);
            setOrderItems(items);
        } catch (e) {
            console.error(e);
        }
    }

    function closeOrderDetail() {
        setSelectedOrder(null);
        setOrderItems([]);
    }

    async function handleValidate(orderId) {
        if (!window.confirm('Validate this order?')) return;
        try {
            await api.validateOrder(orderId);
            closeOrderDetail();
            loadOrders();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleReject(orderId) {
        if (!window.confirm('Reject and delete this order?')) return;
        try {
            await api.rejectOrder(orderId);
            closeOrderDetail();
            loadOrders();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    if (loading) return <div>Loading orders...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div id="page-orders">
            <h1>Orders</h1>

            <div id="orders-toolbar">
                <input
                    type="text"
                    placeholder="Search by supplier"
                    value={supplierSearch}
                    onChange={e => setSupplierSearch(e.target.value)}
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="validated">Validated</option>
                </select>
                <button onClick={handleSearch}>Search</button>
                <button onClick={() => { setSupplierSearch(''); setStatusFilter(''); loadOrders(); }}>Clear</button>
            </div>

            {/* Orders table */}
            {!selectedOrder && (
                orders.length === 0 ? (
                    <p>No orders found.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Supplier</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Validated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td>#{o.id}</td>
                                    <td>{o.supplier_name}</td>
                                    <td>{o.status}</td>
                                    <td>{formatDate(o.created_at)}</td>
                                    <td>{o.validated_at ? formatDate(o.validated_at) : '—'}</td>
                                    <td>
                                        <button onClick={() => openOrderDetail(o)}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            )}

            {/* Order detail */}
            {selectedOrder && (
                <div id="order-detail-container">
                    <h2>Order #{selectedOrder.id}</h2>
                    <p>Supplier: {selectedOrder.supplier_name}</p>
                    <p>Status: {selectedOrder.status}</p>
                    <p>Created: {formatDate(selectedOrder.created_at)}</p>
                    {selectedOrder.validated_at && (
                        <p>Validated: {formatDate(selectedOrder.validated_at)}</p>
                    )}

                    <h3>Items</h3>
                    {orderItems.length === 0 ? (
                        <p>No items.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Reference</th>
                                    <th>Unit</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.product_name}</td>
                                        <td>{item.product_reference}</td>
                                        <td>{item.unit}</td>
                                        <td>{formatQuantity(item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {canValidateOrders() && selectedOrder.status === 'pending' && (
                        <div id="order-detail-actions">
                            <button onClick={() => handleValidate(selectedOrder.id)}>
                                Validate
                            </button>
                            <button onClick={() => handleReject(selectedOrder.id)}>
                                Reject
                            </button>
                        </div>
                    )}

                    <button onClick={closeOrderDetail}>Back to Orders</button>
                </div>
            )}
        </div>
    );
}