import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Stock from './pages/Stock';
import Alerts from './pages/Alerts';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Users from './pages/Users';

const PAGES = {
    dashboard: Dashboard,
    products: Products,
    suppliers: Suppliers,
    stock: Stock,
    alerts: Alerts,
    orders: Orders,
    settings: Settings,
    users: Users,
};

function AppContent() {
    const { user, loading, logout, isAdmin } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');

    if (loading) return <div>Loading...</div>;
    if (!user) return <Login />;

    const PageComponent = PAGES[currentPage] || Dashboard;

    return (
        <div id="layout">
            <aside id="sidebar">
                <div id="sidebar-header">
                    <span>Packaging Manager</span>
                </div>

                <nav id="sidebar-nav">
                    {[
                        { key: 'dashboard', label: 'Dashboard' },
                        { key: 'products',  label: 'Products'  },
                        { key: 'suppliers', label: 'Suppliers' },
                        { key: 'stock',     label: 'Stock'     },
                        { key: 'alerts',    label: 'Alerts'    },
                        { key: 'orders',    label: 'Orders'    },
                        { key: 'settings',  label: 'Settings'  },
                    ].map(({ key, label }) => (
                        <a
                            key={key}
                            href="#"
                            className={currentPage === key ? 'active' : ''}
                            onClick={(e) => { e.preventDefault(); setCurrentPage(key); }}
                        >
                            {label}
                        </a>
                    ))}
                    {(
                        <a
                            href="#"
                            className={currentPage === 'users' ? 'active' : ''}
                            onClick={(e) => { e.preventDefault(); setCurrentPage('users'); }}
                        >
                            {isAdmin()? "Users & Profile":"Profile" }
                        </a>
                    )}
                </nav>

                <div id="sidebar-footer">
                    <div id="sidebar-user">
                        <span id="sidebar-username">{user.username}</span>
                        <span id="sidebar-role">{user.role}</span>
                    </div>
                    <button id="btn-logout" onClick={logout}>Logout</button>
                </div>
            </aside>

            <main id="app">
                <PageComponent navigate={setCurrentPage} />
            </main>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}