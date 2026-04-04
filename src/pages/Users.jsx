import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { formatDate } from '../utils/format';

export default function Users({ navigate }) {
    const { user, canManageUsers } = useAuth();

    const [username, setUsername] = useState(user.username)

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showUserForm, setShowUserForm] = useState(false);
    const [userForm, setUserForm] = useState({ username: '', password: '', role: 'operator' });

    const [usernameForm, setUsernameForm] = useState({ newUsername: '' });
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [usernameMsg, setUsernameMsg] = useState('');
    const [passwordMsg, setPasswordMsg] = useState('');

    useEffect(() => {
        if (canManageUsers()) loadUsers();
        setLoading(false);
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            const data = await api.getAllUsers();
            setUsers(data);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateUser(e) {
        e.preventDefault();
        try {
            await api.createUser(userForm.username, userForm.password, userForm.role);
            setShowUserForm(false);
            setUserForm({ username: '', password: '', role: 'operator' });
            loadUsers();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleDeleteUser(id) {
        if (!window.confirm('Delete this user?')) return;
        try {
            await api.deleteUser(id);
            loadUsers();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleUpdateRole(id, role) {
        try {
            await api.updateRole(id, role);
            loadUsers();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleUpdateUsername(e) {
        e.preventDefault();
        setUsernameMsg('');
        try {
            await api.updateUsername(user.id, usernameForm.newUsername);
            setUsernameMsg('Username updated successfully.');
            setUsername(usernameForm.newUsername)
            setUsernameForm({ newUsername: '' });
        } catch (e) {
            setUsernameMsg('Error: ' + e);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setPasswordMsg('');
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMsg('Passwords do not match.');
            return;
        }
        try {
            await api.changePassword(user.id, passwordForm.oldPassword, passwordForm.newPassword);
            setPasswordMsg('Password changed successfully.');
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (e) {
            setPasswordMsg('Error: ' + e);
        }
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div id="page-users">

            {/* Profile section */}
            <div id="profile-section">
                <h1>My Profile</h1>
                <p>Username: {username}</p>
                <p>Role: {user.role}</p>

                <h3>Change Username</h3>
                <form onSubmit={handleUpdateUsername}>
                    <input
                        type="text"
                        placeholder="New username"
                        value={usernameForm.newUsername}
                        onChange={e => setUsernameForm({ newUsername: e.target.value })}
                        required
                    />
                    <button type="submit">Update</button>
                </form>
                {usernameMsg && <p>{usernameMsg}</p>}

                <h3>Change Password</h3>
                <form onSubmit={handleChangePassword}>
                    <input
                        type="password"
                        placeholder="Current password"
                        value={passwordForm.oldPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="New password"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                    />
                    <button type="submit">Change Password</button>
                </form>
                {passwordMsg && <p>{passwordMsg}</p>}
            </div>

            {/* User management — admin only */}
            {canManageUsers() && (
                <div id="user-management-section">
                    <h2>User Management</h2>
                    <button onClick={() => setShowUserForm(true)}>Add User</button>

                    {showUserForm && (
                        <form onSubmit={handleCreateUser}>
                            <input
                                type="text"
                                placeholder="Username"
                                value={userForm.username}
                                onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={userForm.password}
                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                required
                            />
                            <select
                                value={userForm.role}
                                onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                            >
                                <option value="manager">Manager</option>
                                <option value="operator">Operator</option>
                            </select>
                            <button type="submit">Create</button>
                            <button type="button" onClick={() => setShowUserForm(false)}>Cancel</button>
                        </form>
                    )}

                    {users.length === 0 ? (
                        <p>No users found.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(u => u.id !== user.id).map(u => (
                                    <tr key={u.id}>
                                        <td>{u.username}</td>
                                        <td>
                                            <select
                                                value={u.role}
                                                onChange={e => handleUpdateRole(u.id, e.target.value)}
                                            >
                                                <option value="manager">Manager</option>
                                                <option value="operator">Operator</option>
                                            </select>
                                        </td>
                                        <td>{formatDate(u.created_at)}</td>
                                        <td>
                                            <button onClick={() => handleDeleteUser(u.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}