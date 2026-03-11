import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { PasswordSettings } from "./pages/PasswordSettings";

const Home = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
    <h1 className="text-4xl font-bold text-blue-600 mb-4">用藥助手 Pro</h1>
    <p className="text-lg text-gray-600 mb-8">您的智能用藥管家，守護家人健康。</p>
    <div className="space-x-4">
      <Link to="/password-settings" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        進入密碼設定
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
