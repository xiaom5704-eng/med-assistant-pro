import React, { useState, useEffect } from "react";
import { PasswordInput } from "../components/PasswordInput";
import { Lock, Mail, CheckCircle2, AlertCircle, LayoutDashboard, Pill, Calendar, User, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export const PasswordSettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isQuickLogin, setIsQuickLogin] = useState(false);
  const [activeTab, setActiveTab] = useState<"change" | "reset">("change");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [changeData, setChangeData] = useState({ current: "", new: "", confirm: "" });
  const [resetData, setResetData] = useState({ email: "", code: "", new: "", confirm: "" });
  const [step, setStep] = useState(1);

  useEffect(() => {
    // 檢查是否是從快速登入按鈕過來的
    if (location.search.includes("mode=quick")) {
      setIsQuickLogin(true);
    }
  }, [location]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changeData.new !== changeData.confirm) {
      setMessage({ type: "error", text: "新密碼與確認密碼不一致" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setMessage({ type: "success", text: "密碼修改成功！" });
      setLoading(false);
      setChangeData({ current: "", new: "", confirm: "" });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!resetData.email) return;
    setLoading(true);
    setTimeout(() => {
      setStep(2);
      setLoading(false);
      setMessage({ type: "success", text: "驗證碼已發送至您的信箱" });
    }, 1000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetData.new !== resetData.confirm) {
      setMessage({ type: "error", text: "新密碼與確認密碼不一致" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setMessage({ type: "success", text: "密碼重設成功，請重新登入" });
      setLoading(false);
      setStep(1);
      setResetData({ email: "", code: "", new: "", confirm: "" });
    }, 1000);
  };

  // 如果是快速登入模式，顯示功能儀表板
  if (isQuickLogin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 p-8 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <LayoutDashboard /> 歡迎使用用藥助手 Pro
              </h2>
              <button 
                onClick={() => navigate("/")}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
              >
                <LogOut size={18} /> 登出
              </button>
            </div>
            <p className="text-blue-100">您已透過快速登入進入系統，現在可以開始管理您的用藥計畫。</p>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 hover:shadow-md transition cursor-pointer group">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Pill size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">藥品管理</h3>
              <p className="text-gray-600 text-sm">新增、修改或刪除您的常用藥品清單。</p>
            </div>
            
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 hover:shadow-md transition cursor-pointer group">
              <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">用藥提醒</h3>
              <p className="text-gray-600 text-sm">設定每日用藥時間，系統將準時提醒您。</p>
            </div>
            
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 hover:shadow-md transition cursor-pointer group">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">個人檔案</h3>
              <p className="text-gray-600 text-sm">管理您的健康資訊與緊急聯絡人。</p>
            </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
            <button 
              onClick={() => setIsQuickLogin(false)}
              className="text-blue-600 hover:underline font-medium"
            >
              需要設定密碼以保護帳號安全？點此前往設定
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center space-x-2 mb-6 border-b pb-4">
        <Lock className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-800">密碼安全設定</h2>
      </div>

      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => { setActiveTab("change"); setMessage(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "change" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          修改目前密碼
        </button>
        <button
          onClick={() => { setActiveTab("reset"); setMessage(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "reset" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          忘記密碼/重設
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md flex items-center space-x-2 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {activeTab === "change" ? (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordInput
            label="目前密碼"
            value={changeData.current}
            onChange={(e) => setChangeData({ ...changeData, current: e.target.value })}
            placeholder="請輸入目前使用的密碼"
            required
          />
          <PasswordInput
            label="新密碼"
            value={changeData.new}
            onChange={(e) => setChangeData({ ...changeData, new: e.target.value })}
            placeholder="請輸入新密碼（至少 6 位）"
            required
          />
          <PasswordInput
            label="確認新密碼"
            value={changeData.confirm}
            onChange={(e) => setChangeData({ ...changeData, confirm: e.target.value })}
            placeholder="請再次輸入新密碼"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "處理中..." : "更新密碼"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">註冊信箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={resetData.email}
                    onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="example@mail.com"
                    required
                  />
                </div>
              </div>
              <button
                onClick={handleSendCode}
                disabled={loading || !resetData.email}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? "發送中..." : "發送驗證碼"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">驗證碼</label>
                <input
                  type="text"
                  value={resetData.code}
                  onChange={(e) => setResetData({ ...resetData, code: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="請輸入 6 位驗證碼"
                  required
                />
              </div>
              <PasswordInput
                label="設置新密碼"
                value={resetData.new}
                onChange={(e) => setResetData({ ...resetData, new: e.target.value })}
                placeholder="請輸入新密碼"
                required
              />
              <PasswordInput
                label="確認新密碼"
                value={resetData.confirm}
                onChange={(e) => setResetData({ ...resetData, confirm: e.target.value })}
                placeholder="請再次輸入新密碼"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? "處理中..." : "確認重設密碼"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-500 text-sm hover:underline"
              >
                返回上一步
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
