import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { formatDate, formatQuantity } from '../utils/format';

export default function Dashboard({ navigate }) {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [storage, setStorage] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);
            const [alertsData, ordersData, storageData, historyData] = await Promise.all([
                api.getAllAlerts(),
                api.getAllOrders(),
                api.getAllStorage(),
                api.getAllHistory(),
            ]);
            setAlerts(alertsData);
            setOrders(ordersData);
            setStorage(storageData);
            setHistory(historyData);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div>Loading dashboard...</div>;
    if (error) return <div>Error: {error}</div>;

    const activeAlerts = alerts.filter(a => a.status === 'active');
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const lowStockProducts = storage.filter(s => s.quantity <= s.alert_threshold);
    const recentMovements = history.slice(0, 10);

    const alertsByType = {
        low_stock: activeAlerts.filter(a => a.alert_type === 'low_stock').length,
        forecast:  activeAlerts.filter(a => a.alert_type === 'forecast').length,
        anomaly:   activeAlerts.filter(a => a.alert_type === 'anomaly').length,
        capacity:  activeAlerts.filter(a => a.alert_type === 'capacity').length,
    };

    return (
        <div id="page-dashboard">
            <h1>Dashboard</h1>
            <p>Welcome, {user.username}</p>

            {/* Stats */}
            <div id="dashboard-stats">
                <div className="stat-card" onClick={() => navigate('alerts')}>
                    <span className="stat-value">{activeAlerts.length}</span>
                    <span className="stat-label">Active Alerts</span>
                    <div className="stat-breakdown">
                        {alertsByType.low_stock > 0 && <span>Low stock: {alertsByType.low_stock}</span>}
                        {alertsByType.forecast > 0  && <span>Forecast: {alertsByType.forecast}</span>}
                        {alertsByType.anomaly > 0   && <span>Anomaly: {alertsByType.anomaly}</span>}
                        {alertsByType.capacity > 0  && <span>Capacity: {alertsByType.capacity}</span>}
                    </div>
                </div>

                <div className="stat-card" onClick={() => navigate('orders')}>
                    <span className="stat-value">{pendingOrders.length}</span>
                    <span className="stat-label">Pending Orders</span>
                </div>

                <div className="stat-card" onClick={() => navigate('stock')}>
                    <span className="stat-value">{lowStockProducts.length}</span>
                    <span className="stat-label">Low Stock Products</span>
                </div>

                <div className="stat-card">
                    <span className="stat-value">{storage.length}</span>
                    <span className="stat-label">Total Products</span>
                </div>
            </div>

            {/* Low stock products */}
            {lowStockProducts.length > 0 && (
                <div id="dashboard-low-stock">
                    <h2>Products Below Threshold</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Name</th>
                                <th>Current Stock</th>
                                <th>Threshold</th>
                                <th>Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockProducts.map(s => (
                                <tr key={s.product_id}>
                                    <td>{s.product_reference}</td>
                                    <td>{s.product_name}</td>
                                    <td>{formatQuantity(s.quantity)}</td>
                                    <td>{s.alert_threshold}</td>
                                    <td>{s.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pending orders */}
            {pendingOrders.length > 0 && (
                <div id="dashboard-pending-orders">
                    <h2>Pending Orders</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Supplier</th>
                                <th>Created</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingOrders.map(o => (
                                <tr key={o.id}>
                                    <td>#{o.id}</td>
                                    <td>{o.supplier_name}</td>
                                    <td>{formatDate(o.created_at)}</td>
                                    <td>
                                        <button onClick={() => navigate('orders')}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Recent movements */}
            <div id="dashboard-recent-movements">
                <h2>Recent Movements</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>By</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentMovements.map(m => (
                            <tr key={m.id}>
                                <td>{m.product_name}</td>
                                <td>{m.movement_type}</td>
                                <td>{formatQuantity(m.quantity)}</td>
                                <td>{m.username}</td>
                                <td>{formatDate(m.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}