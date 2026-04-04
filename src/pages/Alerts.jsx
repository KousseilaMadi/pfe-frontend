import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { formatDate } from '../utils/format';

export default function Alerts({ navigate }) {
    const { canManageProducts } = useAuth();

    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('active');

    useEffect(() => {
        loadAlerts();
    }, []);

    async function loadAlerts() {
        try {
            setLoading(true);
            const data = await api.getAllAlerts();
            setAlerts(data);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading(false);
        }
    }

    async function handleAcknowledge(id) {
        try {
            await api.acknowledgeAlert(id);
            loadAlerts();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleResolve(id) {
        try {
            await api.resolveAlert(id);
            loadAlerts();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    const filtered = alerts
        .filter(a => filterType ? a.alert_type === filterType : true)
        .filter(a => filterStatus ? a.status === filterStatus : true);

    if (loading) return <div>Loading alerts...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div id="page-alerts">
            <h1>Alerts</h1>

            <div id="alerts-toolbar">
                <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">All types</option>
                    <option value="low_stock">Low stock</option>
                    <option value="forecast">Forecast</option>
                    <option value="anomaly">Anomaly</option>
                    <option value="capacity">Capacity</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                </select>
                <button onClick={loadAlerts}>Refresh</button>
            </div>

            {filtered.length === 0 ? (
                <p>No alerts found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Type</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Order</th>
                            {canManageProducts() && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(a => (
                            <tr key={a.id}>
                                <td>{a.product_name}</td>
                                <td>{a.alert_type}</td>
                                <td>{a.message}</td>
                                <td>{a.status}</td>
                                <td>{formatDate(a.created_at)}</td>
                                <td>
                                    {a.order_id ? (
                                        <button onClick={() => navigate('orders')}>
                                            #{a.order_id}
                                        </button>
                                    ) : '—'}
                                </td>
                                {canManageProducts() && (
                                    <td>
                                        {a.status === 'active' && (
                                            <button onClick={() => handleAcknowledge(a.id)}>
                                                Acknowledge
                                            </button>
                                        )}
                                        {a.status !== 'resolved' && (
                                            <button onClick={() => handleResolve(a.id)}>
                                                Resolve
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}