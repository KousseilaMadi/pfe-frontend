import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!username || !password) return;

        const result = await login(username, password);
        if (!result.success) {
            setError('Invalid username or password');
        }
    }

    return (
        <div id="login-screen">
            <form id="login-form" onSubmit={handleSubmit}>
                <h1>Packaging Manager</h1>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p id="login-error">{error}</p>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
}