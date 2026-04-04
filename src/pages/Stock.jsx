import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { formatDate, formatQuantity } from '../utils/format';

export default function Stock({ navigate }) {
    const { canManageStock } = useAuth();

    const [activeTab, setActiveTab] = useState('storage');
    const [storage, setStorage] = useState([]);
    const [history, setHistory] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [storageSearch, setStorageSearch] = useState('');
    const [historyFilters, setHistoryFilters] = useState({
        productQuery: '', movementType: '', startDate: '', endDate: ''
    });

    const [showMovementForm, setShowMovementForm] = useState(false);
    const [movementForm, setMovementForm] = useState({
        productId: '', movementType: 'exit', quantity: '', note: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [storageData, historyData, productsData] = await Promise.all([
                api.getAllStorage(),
                api.getAllHistory(),
                api.getAllProducts(),
            ]);
            setStorage(storageData);
            setHistory(historyData);
            setProducts(productsData);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading(false);
        }
    }

    async function handleStorageSearch(e) {
        const q = e.target.value;
        setStorageSearch(q);
        try {
            if (q.trim() === '') {
                setStorage(await api.getAllStorage());
            } else {
                setStorage(await api.searchStorage(q));
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function handleHistorySearch() {
        try {
            const data = await api.searchHistory(
                historyFilters.productQuery || null,
                historyFilters.movementType || null,
                historyFilters.startDate || null,
                historyFilters.endDate || null,
            );
            setHistory(data);
        } catch (e) {
            console.error(e);
        }
    }

    async function handleMovementSubmit(e) {
        e.preventDefault();
        try {
            await api.recordMovement(
                parseInt(movementForm.productId),
                movementForm.movementType,
                parseFloat(movementForm.quantity),
                movementForm.note || null,
            );
            setShowMovementForm(false);
            setMovementForm({ productId: '', movementType: 'exit', quantity: '', note: '' });
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    if (loading) return <div>Loading stock...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div id="page-stock">
            <h1>Stock</h1>

            <div id="stock-tabs">
                <button
                    className={activeTab === 'storage' ? 'active' : ''}
                    onClick={() => setActiveTab('storage')}
                >
                    Current Stock
                </button>
                <button
                    className={activeTab === 'history' ? 'active' : ''}
                    onClick={() => setActiveTab('history')}
                >
                    Movement History
                </button>
            </div>

            {/* Tab 1: Current stock */}
            {activeTab === 'storage' && (
                <div id="panel-storage">
                    <div id="storage-toolbar">
                        <input
                            type="text"
                            placeholder="Search by product name or reference"
                            value={storageSearch}
                            onChange={handleStorageSearch}
                        />
                        {canManageStock() && (
                            <button onClick={() => setShowMovementForm(true)}>Record Movement</button>
                        )}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Unit</th>
                                <th>Quantity</th>
                                <th>Threshold</th>
                                <th>Max Capacity</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {storage.map(s => {
                                const isLow = s.quantity <= s.alert_threshold;
                                const isFull = s.max_capacity && s.quantity >= s.max_capacity;
                                return (
                                    <tr key={s.product_id}>
                                        <td>{s.product_reference}</td>
                                        <td>{s.product_name}</td>
                                        <td>{s.category}</td>
                                        <td>{s.unit}</td>
                                        <td style={{ color: isLow ? 'red' : isFull ? 'orange' : 'inherit' }}>
                                            {formatQuantity(s.quantity)}
                                        </td>
                                        <td>{formatQuantity(s.alert_threshold)}</td>
                                        <td>{s.max_capacity ? formatQuantity(s.max_capacity) : '—'}</td>
                                        <td>{formatDate(s.updated_at)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab 2: Movement history */}
            {activeTab === 'history' && (
                <div id="panel-history">
                    <div id="history-toolbar">
                        <input
                            type="text"
                            placeholder="Search by product"
                            value={historyFilters.productQuery}
                            onChange={e => setHistoryFilters({ ...historyFilters, productQuery: e.target.value })}
                        />
                        <select
                            value={historyFilters.movementType}
                            onChange={e => setHistoryFilters({ ...historyFilters, movementType: e.target.value })}
                        >
                            <option value="">All types</option>
                            <option value="entry">Entry</option>
                            <option value="exit">Exit</option>
                        </select>
                        <input
                            type="date"
                            value={historyFilters.startDate}
                            onChange={e => setHistoryFilters({ ...historyFilters, startDate: e.target.value })}
                        />
                        <input
                            type="date"
                            value={historyFilters.endDate}
                            onChange={e => setHistoryFilters({ ...historyFilters, endDate: e.target.value })}
                        />
                        <button onClick={handleHistorySearch}>Search</button>
                        <button onClick={() => {
                            setHistoryFilters({ productQuery: '', movementType: '', startDate: '', endDate: '' });
                            loadData();
                        }}>Clear</button>
                        {canManageStock() && (
                            <button onClick={() => setShowMovementForm(true)}>Record Movement</button>
                        )}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Reference</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Note</th>
                                <th>By</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(h => (
                                <tr key={h.id}>
                                    <td>{h.product_name}</td>
                                    <td>{h.product_reference}</td>
                                    <td>{h.movement_type}</td>
                                    <td>{formatQuantity(h.quantity)}</td>
                                    <td>{h.note ?? '—'}</td>
                                    <td>{h.username ?? 'Deleted user'}</td>
                                    <td>{formatDate(h.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Record movement form */}
            {showMovementForm && (
                <div id="movement-form-container">
                    <h2>Record Movement</h2>
                    <form onSubmit={handleMovementSubmit}>
                        <select
                            value={movementForm.productId}
                            onChange={e => setMovementForm({ ...movementForm, productId: e.target.value })}
                            required
                        >
                            <option value="">Select product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <select
                            value={movementForm.movementType}
                            onChange={e => setMovementForm({ ...movementForm, movementType: e.target.value })}
                        >
                            <option value="entry">Entry</option>
                            <option value="exit">Exit</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Quantity"
                            value={movementForm.quantity}
                            onChange={e => setMovementForm({ ...movementForm, quantity: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Note (optional)"
                            value={movementForm.note}
                            onChange={e => setMovementForm({ ...movementForm, note: e.target.value })}
                        />
                        <button type="submit">Record</button>
                        <button type="button" onClick={() => setShowMovementForm(false)}>Cancel</button>
                    </form>
                </div>
            )}
        </div>
    );
}