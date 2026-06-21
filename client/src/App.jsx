import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./app/store";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Students from "./pages/admin/Students";
import Teachers from "./pages/admin/Teachers";
import Parents from "./pages/admin/Parents";
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
import AdminAnnouncements   from './pages/admin/Announcements'
import TeacherAnnouncements from './pages/teacher/Announcements'
import StudentNoticeBoard   from './pages/student/NoticBoard'
import ParentNoticeBoard    from './pages/parent/NoticeBoard'
import { SocketProvider } from './context/SocketContext'
import MessagingPage from './pages/shared/MessagingPage'
import CalendarPage from './pages/shared/CalendarPage'
import Profile from './pages/shared/Profile'
import Library   from './pages/admin/Library'
import MyLibrary from './pages/student/MyLibrary'
import Transport   from './pages/admin/Transport'
import MyTransport from './pages/student/MyTransport'
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ParentDashboard from "./pages/parent/ParentDashboard";


const queryClient = new QueryClient();

const Unauthorized = () => (
  <h1 className="p-8 text-2xl text-red-500">403 — Unauthorized</h1>
);

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin only */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/students" element={<Students />} />
              <Route path="/admin/teachers" element={<Teachers />} />
              <Route path="/admin/parents" element={<Parents />} />
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
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/messages"   element={<MessagingPage />} />
              <Route path="/admin/calendar"   element={<CalendarPage />} />
              <Route path="/admin/library" element={<Library />} />
              <Route path="/admin/transport" element={<Transport />} />
              <Route path="/admin/profile" element={<Profile />} />



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
              <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
              <Route path="/teacher/messages" element={<MessagingPage />} />
              <Route path="/teacher/calendar" element={<CalendarPage />} />
              <Route path="/teacher/profile" element={<Profile />} />


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
              <Route path="/student/notices" element={<StudentNoticeBoard />} />
              <Route path="/student/messages" element={<MessagingPage />} />
              <Route path="/student/calendar" element={<CalendarPage />} />
              <Route path="/student/library" element={<MyLibrary />} />
              <Route path="/student/transport" element={<MyTransport />} />
              <Route path="/student/profile" element={<Profile />} />



            </Route>

            {/* Parent only */}
            <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/notices" element={<ParentNoticeBoard />} />
              <Route path="/parent/messages"  element={<MessagingPage />} />
              <Route path="/parent/calendar"  element={<CalendarPage />} />
              <Route path="/parent/transport" element={<MyTransport />} />
              <Route path="/parent/profile" element={<Profile />} />



            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        </SocketProvider>  
      </QueryClientProvider>
    </Provider>
  );
}