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
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex-shrink-0 flex items-center mr-8">
                <h1 className="text-xl font-bold text-primary-600">PSYCare România</h1>
              </div>
              <div className="hidden md:flex md:space-x-1 lg:space-x-2 overflow-x-auto flex-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
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

