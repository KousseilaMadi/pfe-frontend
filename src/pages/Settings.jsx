import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { formatDate } from '../utils/format';

export default function Settings({ navigate }) {
    const { canManageSettings } = useAuth();

    const [settings, setSettings] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingKey, setEditingKey] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    const [showPeriodForm, setShowPeriodForm] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState(null);
    const [periodForm, setPeriodForm] = useState({
        name: '', startDate: '', endDate: '', factor: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [settingsData, periodsData] = await Promise.all([
                api.getAllSettings(),
                api.getAllExceptionalPeriods(),
            ]);
            setSettings(settingsData);
            setPeriods(periodsData);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveSetting(key) {
        try {
            await api.updateSetting(key, editingValue);
            setEditingKey(null);
            setEditingValue('');
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    function openAddPeriod() {
        setEditingPeriod(null);
        setPeriodForm({ name: '', startDate: '', endDate: '', factor: '' });
        setShowPeriodForm(true);
    }

    function openEditPeriod(period) {
        setEditingPeriod(period);
        setPeriodForm({
            name: period.name,
            startDate: period.start_date,
            endDate: period.end_date,
            factor: period.factor,
        });
        setShowPeriodForm(true);
    }

    async function handlePeriodSubmit(e) {
        e.preventDefault();
        try {
            if (editingPeriod) {
                await api.updateExceptionalPeriod(
                    editingPeriod.id,
                    periodForm.name,
                    periodForm.startDate,
                    periodForm.endDate,
                    parseFloat(periodForm.factor),
                );
            } else {
                await api.createExceptionalPeriod(
                    periodForm.name,
                    periodForm.startDate,
                    periodForm.endDate,
                    parseFloat(periodForm.factor),
                );
            }
            setShowPeriodForm(false);
            setEditingPeriod(null);
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleDeletePeriod(id) {
        if (!window.confirm('Delete this period?')) return;
        try {
            await api.deleteExceptionalPeriod(id);
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    if (loading) return <div>Loading settings...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div id="page-settings">
            <h1>Settings</h1>

            {/* AI Parameters */}
            <div id="settings-section">
                <h2>AI Parameters</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                            {canManageSettings() && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {settings.map(s => (
                            <tr key={s.key}>
                                <td>{s.key}</td>
                                <td>
                                    {editingKey === s.key ? (
                                        <input
                                            type="text"
                                            value={editingValue}
                                            onChange={e => setEditingValue(e.target.value)}
                                        />
                                    ) : s.value}
                                </td>
                                {canManageSettings() && (
                                    <td>
                                        {editingKey === s.key ? (
                                            <>
                                                <button onClick={() => handleSaveSetting(s.key)}>Save</button>
                                                <button onClick={() => setEditingKey(null)}>Cancel</button>
                                            </>
                                        ) : (
                                            <button onClick={() => { setEditingKey(s.key); setEditingValue(s.value); }}>
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Exceptional Periods */}
            <div id="periods-section">
                <h2>Exceptional Periods</h2>
                {canManageSettings() && (
                    <button onClick={openAddPeriod}>Add Period</button>
                )}

                {periods.length === 0 ? (
                    <p>No exceptional periods defined.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Factor</th>
                                {canManageSettings() && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(p => (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.start_date}</td>
                                    <td>{p.end_date}</td>
                                    <td>{p.factor}</td>
                                    {canManageSettings() && (
                                        <td>
                                            <button onClick={() => openEditPeriod(p)}>Edit</button>
                                            <button onClick={() => handleDeletePeriod(p.id)}>Delete</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {showPeriodForm && (
                    <div id="period-form-container">
                        <h3>{editingPeriod ? 'Edit Period' : 'Add Period'}</h3>
                        <form onSubmit={handlePeriodSubmit}>
                            <input
                                type="text"
                                placeholder="Name (e.g. Ramadan)"
                                value={periodForm.name}
                                onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })}
                                required
                            />
                            <input
                                type="date"
                                value={periodForm.startDate}
                                onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                                required
                            />
                            <input
                                type="date"
                                value={periodForm.endDate}
                                onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Factor (e.g. 1.5)"
                                step="0.01"
                                value={periodForm.factor}
                                onChange={e => setPeriodForm({ ...periodForm, factor: e.target.value })}
                                required
                            />
                            <button type="submit">{editingPeriod ? 'Update' : 'Create'}</button>
                            <button type="button" onClick={() => { setShowPeriodForm(false); setEditingPeriod(null); }}>Cancel</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}