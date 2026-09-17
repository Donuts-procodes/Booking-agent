import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MerchantProvider } from "./context/MerchantContext";
import { Navbar } from "./components/ui/Navbar";
import { ChatAgentPage } from "./pages/ChatAgentPage";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { MerchantAdminPage } from "./pages/MerchantAdminPage";
import { ChatWidget } from "./components/widget/ChatWidget";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MerchantProvider>
        <div className="min-h-screen flex flex-col bg-[#080a10] text-slate-100">
          <Navbar />
          <main className="flex-1">

            <Routes>
              {/* Customer / User Routes */}
              <Route path="/" element={<ChatAgentPage />} />
              <Route path="/book" element={<ChatAgentPage />} />
              <Route path="/status" element={<ChatAgentPage />} />

              {/* Staff Routes */}
              <Route path="/staff" element={<StaffDashboardPage />} />
              <Route path="/staff/queue" element={<StaffDashboardPage />} />
              <Route path="/staff/login" element={<StaffDashboardPage />} />

              {/* Merchant Admin Routes */}
              <Route path="/admin" element={<MerchantAdminPage />} />
              <Route path="/admin/config" element={<MerchantAdminPage />} />
              <Route path="/admin/catalog" element={<MerchantAdminPage />} />
              <Route path="/admin/knowledge" element={<MerchantAdminPage />} />
              <Route path="/admin/staff" element={<MerchantAdminPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ChatWidget />
          <footer className="py-4 border-t border-white/5 text-center text-xs text-slate-500">
            Booking Agent Universal Service Booking Assistant • Built with FastAPI, Milvus &amp; React
          </footer>
        </div>
      </MerchantProvider>
    </BrowserRouter>
  );
};


export default App;
