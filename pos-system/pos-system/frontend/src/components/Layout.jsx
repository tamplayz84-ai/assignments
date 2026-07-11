import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/pos', label: 'POS Billing' },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/customers', label: 'Customers' },
  { to: '/sales-history', label: 'Sales History' },
  { to: '/reports', label: 'Reports', adminOnly: true },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="p-4 text-lg font-bold border-b border-slate-700">
          General Store POS
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm ${
                    isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="p-3 border-t border-slate-700 text-sm">
          <div className="mb-2">
            {user?.name} <span className="text-slate-400">({user?.role})</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-700 hover:bg-slate-600 rounded px-3 py-1.5"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}
