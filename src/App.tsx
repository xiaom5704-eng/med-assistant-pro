import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { 
  Pill, 
  LayoutDashboard, 
  Settings, 
  Menu, 
  X, 
  Home as HomeIcon, 
  ShieldCheck, 
  Activity, 
  MessageSquare, 
  Camera, 
  FileText, 
  Baby, 
  History, 
  Search,
  AlertTriangle,
  Info,
  ChevronRight,
  User,
  LogOut,
  Plus,
  Bell,
  Heart
} from "lucide-react";
import { PasswordSettings } from "./pages/PasswordSettings";

// --- 全域導覽列組件 ---
const Navbar = ({ isLoggedIn, onLogout }: { isLoggedIn: boolean; onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "首頁", path: "/", icon: <HomeIcon size={18} /> },
    { name: "功能中心", path: "/password-settings", icon: <LayoutDashboard size={18} /> },
    { name: "AI 藥物分析", path: "/password-settings?mode=quick&tab=ai", icon: <Activity size={18} /> },
    { name: "嬰兒用藥", path: "/password-settings?mode=quick&tab=baby", icon: <Baby size={18} /> },
    { name: "對話紀錄", path: "/password-settings?mode=quick&tab=history", icon: <History size={18} /> },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                <Pill size={24} />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">MedAssistant <span className="text-blue-600">Pro</span></span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                  location.pathname === link.path ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            {isLoggedIn ? (
              <button onClick={onLogout} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
                <LogOut size={18} /> 登出
              </button>
            ) : (
              <Link to="/password-settings" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition active:scale-95">
                立即開始
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 p-2">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-base font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition"
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                to="/password-settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 mt-4"
              >
                立即開始
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// --- 首頁組件 ---
const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="text-center mb-16 sm:mb-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-black mb-6 animate-bounce">
          <ShieldCheck size={18} /> 專業醫療輔助系統專題
        </div>
        <h1 className="text-5xl sm:text-7xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
          您的智慧 <span className="text-blue-600">用藥管家</span><br />
          守護全家人的健康
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          整合 AI 藥物分析、OCR 辨識與嬰兒用藥安全判斷，為您提供最專業、最即時的用藥建議與風險評估。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <button 
            onClick={() => navigate("/password-settings?mode=quick")}
            className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            🚀 快速登入 (免帳密)
          </button>
          <button 
            onClick={() => navigate("/password-settings")}
            className="px-10 py-5 bg-white text-gray-900 font-black rounded-2xl border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 transition transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 text-lg shadow-xl shadow-gray-100"
          >
            <Settings size={22} /> 帳號密碼登入
          </button>
        </div>
      </div>

      {/* 特色功能展示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
        <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Activity size={32} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-4">AI 藥物分析</h3>
          <p className="text-gray-500 font-medium leading-relaxed">自動判斷藥物功能與風險，檢查多種藥物是否相衝，提供專業建議。</p>
        </div>
        <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Camera size={32} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-4">OCR 智慧辨識</h3>
          <p className="text-gray-500 font-medium leading-relaxed">支援拍照截圖或上傳檔案，自動將圖片轉為文字，快速匯入藥品資訊。</p>
        </div>
        <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Baby size={32} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-4">嬰兒用藥安全</h3>
          <p className="text-gray-500 font-medium leading-relaxed">針對嬰兒症狀判斷可用藥物，提供簡潔與詳細雙模式分析報告。</p>
        </div>
      </div>
    </div>
  );
};

// --- 主應用程式 ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#FAFBFF] font-sans selection:bg-blue-100 selection:text-blue-900">
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <main className="py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/password-settings" element={<PasswordSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <footer className="py-12 border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <Pill size={18} />
              </div>
              <span className="text-lg font-black text-gray-900">MedAssistant Pro</span>
            </div>
            <p className="text-gray-400 font-bold text-sm">© 2026 用藥助手 Pro. 您的健康，我們的使命。</p>
            <div className="mt-6 flex justify-center gap-6 text-gray-400 font-bold text-sm">
              <a href="#" className="hover:text-blue-600 transition">隱私權政策</a>
              <a href="#" className="hover:text-blue-600 transition">服務條款</a>
              <a href="#" className="hover:text-blue-600 transition">聯絡我們</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
