import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppointmentsPage } from './pages/AppointmentsPage.tsx';
import { CaregiverDashboard } from './pages/CaregiverDashboard.tsx';
import { DoctorDashboard } from './pages/DoctorDashboard.tsx';
import { FollowUpsPage } from './pages/FollowUpsPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { HealthRecordsPage } from './pages/HealthRecordsPage.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { MedicationsPage } from './pages/MedicationsPage.tsx';
import { NotificationsPage } from './pages/NotificationsPage.tsx';
import { PatientDashboard } from './pages/PatientDashboard.tsx';
import { PatientRecordPage } from './pages/PatientRecordPage.tsx';
import { PrescriptionsPage } from './pages/PrescriptionsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { NotFoundPage, UnauthorizedPage } from './pages/StatusPages.tsx';
import { AuthenticatedShell, RequireAuth, RequireRole } from './routes/guards.tsx';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AuthenticatedShell />}>
            <Route path="/patient/dashboard" element={<RequireRole role="patient"><PatientDashboard /></RequireRole>} />
            <Route path="/doctor/dashboard" element={<RequireRole role="doctor"><DoctorDashboard /></RequireRole>} />
            <Route path="/caregiver/dashboard" element={<RequireRole role="caregiver"><CaregiverDashboard /></RequireRole>} />
            <Route path="/patients/:patientId" element={<RequireRole role="doctor"><PatientRecordPage /></RequireRole>} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/follow-ups" element={<FollowUpsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/health-records" element={<HealthRecordsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
