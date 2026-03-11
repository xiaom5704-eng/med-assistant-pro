import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { 
  Pill, 
  Home as HomeIcon, 
  ShieldCheck, 
  Menu, 
  X
} from "lucide-react";
import { PasswordSettings } from "./pages/PasswordSettings";

// --- 導覽列 (極簡版：右上角僅留首頁) ---
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
              <Pill size={20} />
            </div>
            <span className="text-lg font-bold text-gray-900">MedAssistant Pro</span>
          </Link>

          <div className="hidden md:flex items-center">
            <Link
              to="/"
              className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              首頁
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg"
          >
            首頁
          </Link>
        </div>
      )}
    </nav>
  );
};

// --- 首頁 ---
const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-6">
        <ShieldCheck size={14} /> 專業醫療輔助系統
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
        智慧用藥，守護健康
      </h1>
      <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
        整合 AI 藥物分析、OCR 辨識與嬰兒用藥安全判斷，為您提供最專業的用藥建議。
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button 
          onClick={() => navigate("/password-settings?mode=quick")}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          🚀 快速登入 (免帳密)
        </button>
        <button 
          onClick={() => navigate("/password-settings")}
          className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl border border-gray-200 hover:border-blue-600 transition"
        >
          帳號密碼登入
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white font-sans">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/password-settings" element={<PasswordSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
