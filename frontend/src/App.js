import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetail from "@/pages/ProjectDetail";
import VerifyPage from "@/pages/VerifyPage";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AuditTrail from "@/pages/AuditTrail";
import ManagePackages from "@/pages/ManagePackages";
import Signboard from "@/pages/Signboard";
import PilotInbox from "@/pages/PilotInbox";

function Protected({ children, roles }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="p-20 text-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
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
        <ScrollManager />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/verify/:projectId/:packageId" element={<VerifyPage />} />
            <Route path="/signboard/:projectId" element={<Signboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/audit" element={<Protected><AuditTrail /></Protected>} />
            <Route path="/manage" element={<Protected roles={["LGU Administrator"]}><ManagePackages /></Protected>} />
            <Route path="/pilot-inbox" element={<Protected roles={["LGU Administrator"]}><PilotInbox /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
