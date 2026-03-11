import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { PasswordSettings } from "./pages/PasswordSettings";

const Home = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
    <h1 className="text-4xl font-bold text-blue-600 mb-4">用藥助手 Pro</h1>
    <p className="text-lg text-gray-600 mb-8">您的智能用藥管家，守護家人健康。</p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link to="/password-settings?mode=quick" className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
        🚀 快速登入 (免帳密)
      </Link>
      <Link to="/password-settings" className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-all active:scale-95">
        密碼安全設定
      </Link>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">MedAssistant Pro</Link>
          <div className="space-x-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">首頁</Link>
            <Link to="/password-settings" className="text-gray-600 hover:text-blue-600">密碼設定</Link>
          </div>
        </nav>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/password-settings" element={<PasswordSettings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
