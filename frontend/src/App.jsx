import React, { useEffect } from "react";
import ThemeWrapper from "./components/layout/ThemeWrapper";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateNote from "./pages/CreateNote";
import NotesList from "./pages/NotesList";
import TagsList from "./pages/TagsList";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import NoteDetails from "./pages/NoteDetails";
import EditNote from "./pages/EditNote";
// import ProtectedRoute from "./components/ProtectedRoute";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminRoute from "./components/auth/AdminRoute.jsx";
import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import AuthEventListener from "./components/AuthEventListener";

// Components
import MainLayout from "./components/layout/MainLayout";
import PrivateRoute from "./components/auth/PrivateRoute";

// Redux actions
import { getCurrentUser } from "./features/auth/authSlice";
import ApiTest from "./tests/apiTest"; // Fixed casing in import path

// Placeholder component for missing pages
const PlaceholderPage = ({ pageName }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-4">{pageName} Page</h2>
    <p className="text-gray-600">This page is under development</p>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCurrentUser())
        .unwrap()
        .catch((error) => toast.error(error || "Failed to get user data"));
    }
  }, [isAuthenticated, dispatch]);
  
  
  return (
    <ThemeWrapper>
      <Router>
        <AuthEventListener /> {/* Add this component */}
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/api-test" element={<ApiTest />} />
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
          />
          <Route
            path="/register"
            element={!isAuthenticated ? <Register /> : <Navigate to="/" />}
          />
          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute element={<MainLayout />} />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />{" "}
            {/* Add this line */}
            <Route path="notes" element={<NotesList />} /> {/* Add this line */}
            <Route path="/create" element={<CreateNote />} />
            <Route path="notes/:id" element={<NoteDetails />} />
            <Route path="notes/:id/edit" element={<EditNote />} />
            <Route path="tags" element={<TagsList />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Admin routes - with separate AdminRoute */}
          <Route
            path="/admin"
            element={
              isAuthenticated === undefined || user === undefined ? (
                <div className="flex items-center justify-center h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <AdminRoute>
                  <MainLayout />
                </AdminRoute>
              )
            }
          >
            <Route index element={<AdminPanel />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
          </Route>
          {/* Routes to unauthorized */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* Not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeWrapper>
  );
}

export default App;
