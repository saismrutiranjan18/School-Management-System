import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./app/store";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Classes from "./pages/admin/Classes";
import Subjects from "./pages/admin/Subjects";

const queryClient = new QueryClient();

// Placeholder dashboards — replace in later phases
const AdminDashboard = () => <h1 className="p-8 text-2xl">Admin Dashboard</h1>;
const TeacherDashboard = () => (
  <h1 className="p-8 text-2xl">Teacher Dashboard</h1>
);
const StudentDashboard = () => (
  <h1 className="p-8 text-2xl">Student Dashboard</h1>
);
const ParentDashboard = () => (
  <h1 className="p-8 text-2xl">Parent Dashboard</h1>
);
const Unauthorized = () => (
  <h1 className="p-8 text-2xl text-red-500">403 — Unauthorized</h1>
);

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin only */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/classes" element={<Classes />} />
              <Route path="/admin/subjects" element={<Subjects />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            {/* Teacher only */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            </Route>

            {/* Student only */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
            </Route>

            {/* Parent only */}
            <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
