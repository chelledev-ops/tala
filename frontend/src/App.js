import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import PublicPortal from "@/pages/PublicPortal";
import ProjectDetail from "@/pages/ProjectDetail";
import VerifyPage from "@/pages/VerifyPage";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AuditTrail from "@/pages/AuditTrail";
import ManagePackages from "@/pages/ManagePackages";

function Protected({ children, roles }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="p-20 text-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <div className="App flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<PublicPortal />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/verify/:projectId/:packageId" element={<VerifyPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/audit" element={<Protected><AuditTrail /></Protected>} />
            <Route path="/manage" element={<Protected roles={["LGU Administrator"]}><ManagePackages /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
