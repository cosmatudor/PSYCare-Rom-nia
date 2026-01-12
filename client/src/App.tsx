import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import PatientDashboard from './pages/patient/Dashboard';
import PatientJournal from './pages/patient/Journal';
import PatientExercises from './pages/patient/Exercises';
import PatientSchedules from './pages/patient/Schedules';
import PatientTasks from './pages/patient/Tasks';
import PatientMaterials from './pages/patient/Materials';
import PatientMessages from './pages/patient/Messages';
import PatientAssessments from './pages/patient/Assessments';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import PsychologistPatients from './pages/psychologist/Patients';
import PsychologistAppointments from './pages/psychologist/Appointments';
import PsychologistMessages from './pages/psychologist/Messages';
import PsychologistTasks from './pages/psychologist/Tasks';
import PsychologistMaterials from './pages/psychologist/Materials';
import PatientRecord from './pages/psychologist/PatientRecord';
import PsychologistPatientAssessments from './pages/psychologist/PatientAssessments';
import PsychologistAcademicResources from './pages/psychologist/AcademicResources';
import PsychologistForum from './pages/psychologist/Forum';
import PsychologistWellbeing from './pages/psychologist/Wellbeing';
import PsychologistAdministrative from './pages/psychologist/Administrative';
import Layout from './components/Layout';

function PrivateRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: ('patient' | 'psychologist')[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute allowedRoles={['patient', 'psychologist']}>
            <Layout />
          </PrivateRoute>
        }
      >
        {user?.role === 'patient' && (
          <>
            <Route index element={<PatientDashboard />} />
            <Route path="journal" element={<PatientJournal />} />
            <Route path="exercises" element={<PatientExercises />} />
            <Route path="schedules" element={<PatientSchedules />} />
            <Route path="tasks" element={<PatientTasks />} />
            <Route path="materials" element={<PatientMaterials />} />
            <Route path="messages" element={<PatientMessages />} />
            <Route path="assessments" element={<PatientAssessments />} />
          </>
        )}
        
        {user?.role === 'psychologist' && (
          <>
            <Route index element={<PsychologistDashboard />} />
            <Route path="patients" element={<PsychologistPatients />} />
            <Route path="appointments" element={<PsychologistAppointments />} />
            <Route path="messages" element={<PsychologistMessages />} />
            <Route path="tasks" element={<PsychologistTasks />} />
            <Route path="materials" element={<PsychologistMaterials />} />
              <Route path="academic" element={<PsychologistAcademicResources />} />
              <Route path="forum" element={<PsychologistForum />} />
              <Route path="wellbeing" element={<PsychologistWellbeing />} />
              <Route path="administrative" element={<PsychologistAdministrative />} />
              <Route path="patients/:patientId/record" element={<PatientRecord />} />
              <Route path="patients/:patientId/assessments" element={<PsychologistPatientAssessments />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

