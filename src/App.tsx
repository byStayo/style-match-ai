import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { AuthCallback } from "@/components/AuthCallback";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardTabs />} />
          <Route path="/matches" element={<DashboardTabs defaultTab="matches" />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;