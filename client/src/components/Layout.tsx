import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function Layout() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const patientNav = [
    { path: '/', label: 'Dashboard' },
    { path: '/journal', label: 'Jurnal' },
    { path: '/exercises', label: 'Exerciții' },
    { path: '/assessments', label: 'Evaluări' },
    { path: '/schedules', label: 'Programări' },
    { path: '/tasks', label: 'Sarcini' },
    { path: '/materials', label: 'Resurse' },
    { path: '/messages', label: 'Mesaje' },
  ];

  const psychologistNav = [
    { path: '/', label: 'Dashboard' },
    { path: '/patients', label: 'Pacienți' },
    { path: '/appointments', label: 'Programări' },
    { path: '/messages', label: 'Mesaje' },
    { path: '/tasks', label: 'Sarcini' },
    { path: '/materials', label: 'Resurse' },
    { path: '/academic', label: 'Articole' },
    { path: '/forum', label: 'Forum' },
    { path: '/wellbeing', label: 'Bunăstare' },
    { path: '/administrative', label: 'Administrativ' },
  ];

  const navItems = user?.role === 'patient' ? patientNav : psychologistNav;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">PSYCare România</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4 lg:space-x-8 overflow-x-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                      location.pathname === item.path
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              {user?.role === 'psychologist' && (
                <div className="mr-4 text-xs">
                  <span className="text-gray-600">ID:</span>
                  <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded ml-1 font-mono text-xs">
                    {user.id}
                  </code>
                </div>
              )}
              <span className="text-sm text-gray-700 mr-4">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Deconectare
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

