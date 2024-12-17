import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { AuthCallback } from "@/components/AuthCallback";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardTabs />} />
        <Route path="/matches" element={<DashboardTabs defaultTab="matches" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;