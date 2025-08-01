import 'react-toastify/dist/ReactToastify.css'
import React, { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Appointments from "@/components/pages/Appointments";
import "@/index.css";
import Header from "@/components/organisms/Header";
import Sidebar from "@/components/organisms/Sidebar";
import Pipeline from "@/components/pages/Pipeline";
import Dashboard from "@/components/pages/Dashboard";
import Leads from "@/components/pages/Leads";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/appointments" element={<Appointments />} />
              </Routes>
            </div>
          </main>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </BrowserRouter>
  );
}

export default App;