import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { queryClientInstance } from "@/lib/query-client";
import ScrollToTop from "@/components/ScrollToTop";
import { DemoBusinessRoute } from "@/demo/DemoContext";
import DemoSelector from "@/pages/DemoSelector";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

function DemoRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DemoSelector />} />
      <Route path="/demo/:presetId" element={<DemoBusinessRoute />}>
        <Route index element={<Navigate to="booking" replace />} />
        <Route path="booking" element={<Home />} />
        <Route path="admin-login" element={<AdminLogin />} />
        <Route path="admin" element={<Admin />} />
        <Route path="adatvedelmi-tajekoztato" element={<PrivacyPolicy />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <BrowserRouter>
        <ScrollToTop />
        <DemoRoutes />
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
