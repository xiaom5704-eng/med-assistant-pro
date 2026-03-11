import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PasswordSettings } from "./pages/PasswordSettings";
import { Pill, Calendar, User, LogOut, LayoutDashboard, Bell, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Menu, X, ChevronRight, Heart, ShieldCheck } from "lucide-react";

// --- 模擬資料庫 (LocalStorage) ---
const STORAGE_KEY = "med_pro_user_data";
const getStoredUser = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
const setStoredUser = (user: any) => localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

// --- 首頁組件 ---
const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-8 animate-bounce">
          <ShieldCheck size={18} /> 您的私人健康管家
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight">
          用藥助手 <span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          專業、安全、簡單。我們幫助您管理每日用藥計畫，守護您與家人的健康，讓生活更安心。
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button 
            onClick={() => navigate("/password-settings?mode=quick")}
            className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            🚀 快速登入 (免帳密)
          </button>
          <button 
            onClick={() => navigate("/password-settings")}
            className="w-full sm:w-auto px-10 py-4 bg-white text-blue-600 font-bold rounded-2xl border-2 border-blue-600 hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            帳號密碼登入
          </button>
        </div>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { icon: <Pill className="text-blue-600" />, title: "精確管理", desc: "完整記錄藥品名稱、劑量與服用頻率。" },
            { icon: <Bell className="text-green-600" />, title: "準時提醒", desc: "自定義提醒時間，不再錯過任何一次服藥。" },
            { icon: <Heart className="text-red-600" />, title: "健康追蹤", desc: "記錄過敏史與健康狀況，隨時掌握身體變化。" }
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 主應用組件 ---
const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        {/* 導覽列 */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                  <Pill size={24} />
                </div>
                <span className="text-xl font-black tracking-tighter text-gray-900">MedAssistant <span className="text-blue-600">Pro</span></span>
              </Link>
              
              {/* 桌面選單 */}
              <div className="hidden md:flex items-center space-x-8">
                <Link to="/" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition">首頁</Link>
                <Link to="/password-settings" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition">功能中心</Link>
                <Link to="/password-settings" className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition shadow-md shadow-blue-100">
                  立即開始
                </Link>
              </div>

              {/* 手機選單按鈕 */}
              <div className="md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600">
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* 手機選單內容 */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-b border-gray-100 p-4 space-y-4 animate-in slide-in-from-top duration-200">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">首頁</Link>
              <Link to="/password-settings" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">功能中心</Link>
              <Link to="/password-settings" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 bg-blue-600 text-white text-center font-bold rounded-xl">立即開始</Link>
            </div>
          )}
        </nav>

        {/* 內容區 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/password-settings" element={<PasswordSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* 頁尾 */}
        <footer className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Pill className="text-blue-600" size={20} />
              <span className="font-bold text-gray-900">MedAssistant Pro</span>
            </div>
            <p className="text-gray-400 text-sm">© 2026 用藥助手 Pro. 您的健康，我們的使命。</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
