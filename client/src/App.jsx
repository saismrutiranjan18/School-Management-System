import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./app/store";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Classes from "./pages/admin/Classes";
import Subjects from "./pages/admin/Subjects";
import TimetableBuilder from "./pages/admin/TimetableBuilder";
import TeacherMyTimetable from "./pages/teacher/MyTimetable";
import StudentMyTimetable from "./pages/student/MyTimetable";
import MarkAttendance from "./pages/teacher/MarkAttendance";
import AttendanceReport from "./pages/teacher/AttendanceReport";
import MyAttendance from "./pages/student/MyAttendance";
import Exams from "./pages/admin/Exams";
import EnterMarks from "./pages/teacher/EnterMarks";
import MyResults from "./pages/student/MyResults";
import FeeStructure from "./pages/admin/FeeStructure";
import FeeCollection from "./pages/admin/FeeCollection";
import OutstandingDues from "./pages/admin/OutstandingDues";
import MyFees from "./pages/student/MyFees";
import Expenses from "./pages/admin/Expenses";
import FinancialReport from "./pages/admin/FinancialReport";

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
              <Route path="/admin/timetable" element={<TimetableBuilder />} />
              <Route path="/admin/exams" element={<Exams />} />
              <Route path="/admin/fees/structure" element={<FeeStructure />} />
              <Route
                path="/admin/fees/collection"
                element={<FeeCollection />}
              />

              <Route
                path="/admin/fees/outstanding"
                element={<OutstandingDues />}
              />
              <Route path="/admin/expenses" element={<Expenses />} />
              <Route
                path="/admin/financial-report"
                element={<FinancialReport />}
              />
            </Route>

            {/* Teacher only */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

              <Route
                path="/teacher/timetable"
                element={<TeacherMyTimetable />}
              />
              <Route
                path="/teacher/attendance/mark"
                element={<MarkAttendance />}
              />
              <Route
                path="/teacher/attendance/report"
                element={<AttendanceReport />}
              />
              <Route path="/teacher/marks" element={<EnterMarks />} />
            </Route>

            {/* Student only */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route
                path="/student/timetable"
                element={<StudentMyTimetable />}
              />
              <Route path="/student/attendance" element={<MyAttendance />} />
              <Route path="/student/results" element={<MyResults />} />
              <Route path="/student/fees" element={<MyFees />} />
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
