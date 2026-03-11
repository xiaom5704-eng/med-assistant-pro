import React, { useState, useEffect } from "react";
import { PasswordInput } from "../components/PasswordInput";
import { Lock, Mail, CheckCircle2, AlertCircle, LayoutDashboard, Pill, Calendar, User, LogOut, ChevronLeft, Plus, Bell, Settings, Trash2, Edit2, Clock, ShieldCheck, UserPlus, LogIn, KeyRound, Eye, EyeOff, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// --- 類型定義 ---
type SubPage = "dashboard" | "meds" | "reminders" | "profile";
type AuthMode = "login" | "register" | "reset";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
}

interface Reminder {
  id: string;
  time: string;
  medName: string;
  taken: boolean;
}

export const PasswordSettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- 狀態管理 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [currentSubPage, setCurrentSubPage] = useState<SubPage>("dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testCode, setTestCode] = useState<string | null>(null);

  // --- 表單數據 ---
  const [authData, setAuthData] = useState({ email: "", password: "", confirmPassword: "", code: "" });
  const [meds, setMeds] = useState<Medication[]>([
    { id: "1", name: "阿斯匹靈", dosage: "100mg", frequency: "每日一次", time: "08:00" },
    { id: "2", name: "維他命 B 群", dosage: "1 錠", frequency: "每日一次", time: "12:00" }
  ]);
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: "r1", time: "08:00", medName: "阿斯匹靈", taken: true },
    { id: "r2", time: "12:00", medName: "維他命 B 群", taken: false },
    { id: "r3", time: "20:00", medName: "鈣片", taken: false }
  ]);

  // --- 初始化 ---
  useEffect(() => {
    // 優先檢查 URL 參數
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "quick") {
      setIsLoggedIn(true);
      setCurrentSubPage("dashboard");
    }
  }, [location]);

  // --- 帳號邏輯 ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    setTimeout(() => {
      if (authMode === "register") {
        if (authData.password !== authData.confirmPassword) {
          setMessage({ type: "error", text: "密碼不一致" });
          setLoading(false);
          return;
        }
        if (authData.password.length < 6) {
          setMessage({ type: "error", text: "密碼長度至少需 6 位" });
          setLoading(false);
          return;
        }
      }
      
      setIsLoggedIn(true);
      setLoading(false);
      setMessage({ type: "success", text: authMode === "login" ? "登入成功！" : "註冊成功！" });
    }, 1000);
  };

  const handleSendCode = () => {
    if (!authData.email) {
      setMessage({ type: "error", text: "請先輸入信箱" });
      return;
    }
    setLoading(true);
    setMessage(null);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setTestCode(code);
      setLoading(false);
      setMessage({ type: "success", text: `測試驗證碼：${code} (請直接輸入)` });
    }, 800);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (authData.code !== testCode) {
      setMessage({ type: "error", text: "驗證碼錯誤" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setMessage({ type: "success", text: "密碼重設成功，請重新登入" });
      setAuthMode("login");
      setTestCode(null);
      setAuthData({ ...authData, password: "", confirmPassword: "", code: "" });
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthMode("login");
    setMessage(null);
    navigate("/password-settings");
  };

  // --- 功能邏輯 ---
  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, taken: !r.taken } : r));
  };

  const deleteMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
  };

  // --- 渲染子頁面 ---
  const renderContent = () => {
    switch (currentSubPage) {
      case "meds":
        return (
          <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <button onClick={() => setCurrentSubPage("dashboard")} className="flex items-center gap-1 text-blue-600 mb-2 hover:underline font-bold">
                  <ChevronLeft size={20} /> 返回儀表板
                </button>
                <h3 className="text-3xl font-black text-gray-900">藥品管理</h3>
              </div>
              <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition active:scale-95 font-bold">
                <Plus size={20} /> 新增藥品
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {meds.map(med => (
                <div key={med.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Pill size={28} />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-gray-900">{med.name}</div>
                      <div className="text-sm sm:text-base text-gray-500 font-medium">{med.dosage} • {med.frequency} • {med.time}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <button className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Edit2 size={20} /></button>
                    <button onClick={() => deleteMed(med.id)} className="p-2 sm:p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
              {meds.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Pill size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 font-bold">目前尚無藥品紀錄</p>
                </div>
              )}
            </div>
          </div>
        );
      case "reminders":
        return (
          <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setCurrentSubPage("dashboard")} className="flex items-center gap-1 text-blue-600 mb-2 hover:underline font-bold">
              <ChevronLeft size={20} /> 返回儀表板
            </button>
            <h3 className="text-3xl font-black text-gray-900 mb-8">用藥提醒</h3>
            <div className="space-y-4">
              {reminders.map(r => (
                <div key={r.id} onClick={() => toggleReminder(r.id)} className={`p-6 rounded-3xl border transition-all cursor-pointer flex justify-between items-center ${r.taken ? "bg-green-50 border-green-100 opacity-75" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${r.taken ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                      <Clock size={28} />
                    </div>
                    <div>
                      <div className={`text-lg sm:text-xl font-bold ${r.taken ? "text-green-800 line-through" : "text-gray-900"}`}>{r.medName}</div>
                      <div className="text-sm sm:text-base text-gray-500 font-medium">提醒時間：{r.time}</div>
                    </div>
                  </div>
                  {r.taken ? (
                    <div className="flex items-center gap-1 sm:gap-2 text-green-600 font-bold bg-white px-3 sm:px-4 py-1 sm:py-2 rounded-full shadow-sm text-xs sm:text-sm">
                      <CheckCircle2 size={18} /> 已服用
                    </div>
                  ) : (
                    <div className="text-gray-400 font-bold border-2 border-gray-100 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">標記服用</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setCurrentSubPage("dashboard")} className="flex items-center gap-1 text-blue-600 mb-2 hover:underline font-bold">
              <ChevronLeft size={20} /> 返回儀表板
            </button>
            <h3 className="text-3xl font-black text-gray-900 mb-8">個人檔案</h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <div className="px-6 sm:px-8 pb-8">
                <div className="relative -top-10 sm:-top-12 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white p-2 rounded-3xl shadow-lg">
                    <div className="w-full h-full bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black">用</div>
                  </div>
                  <div className="pb-0 sm:pb-4">
                    <h4 className="text-2xl font-black text-gray-900">用藥助手測試員</h4>
                    <p className="text-gray-500 font-medium">test@example.com</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-4">
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">性別</label>
                      <div className="text-lg font-bold text-gray-800 mt-1">不便透露</div>
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">年齡</label>
                      <div className="text-lg font-bold text-gray-800 mt-1">25 歲</div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">過敏史</label>
                      <div className="text-lg font-bold text-red-600 mt-1">盤尼西林 (Penicillin)</div>
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">緊急聯絡人</label>
                      <div className="text-lg font-bold text-gray-800 mt-1">王小明 (0912-345-678)</div>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-10 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition shadow-xl shadow-gray-200 flex items-center justify-center gap-2">
                  <Settings size={20} /> 編輯詳細健康資訊
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 sm:p-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div onClick={() => setCurrentSubPage("meds")} className="p-6 sm:p-8 bg-blue-50 rounded-[2rem] sm:rounded-[2.5rem] border border-blue-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                  <Pill size={32} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">藥品管理</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">新增、修改或刪除您的常用藥品清單。</p>
                <div className="mt-6 flex items-center text-blue-600 font-bold gap-1 group-hover:gap-2 transition-all">
                  立即管理 <ChevronRight size={20} />
                </div>
              </div>
              <div onClick={() => setCurrentSubPage("reminders")} className="p-6 sm:p-8 bg-green-50 rounded-[2rem] sm:rounded-[2.5rem] border border-green-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-200 group-hover:rotate-12 transition-transform">
                  <Calendar size={32} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">用藥提醒</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">設定每日用藥時間，系統將準時提醒您。</p>
                <div className="mt-6 flex items-center text-green-600 font-bold gap-1 group-hover:gap-2 transition-all">
                  查看提醒 <ChevronRight size={20} />
                </div>
              </div>
              <div onClick={() => setCurrentSubPage("profile")} className="p-6 sm:p-8 bg-purple-50 rounded-[2rem] sm:rounded-[2.5rem] border border-purple-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200 group-hover:rotate-12 transition-transform">
                  <User size={32} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">個人檔案</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">管理您的健康資訊與緊急聯絡人。</p>
                <div className="mt-6 flex items-center text-purple-600 font-bold gap-1 group-hover:gap-2 transition-all">
                  編輯檔案 <ChevronRight size={20} />
                </div>
              </div>
            </div>
            <div className="mt-12 sm:mt-16 p-8 sm:p-10 bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold mb-4">
                <ShieldCheck size={18} /> 帳號安全保護中
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">想要更安全的保護您的資料？</h4>
              <p className="text-gray-500 mb-8">設定專屬密碼，確保您的健康資訊只有您能存取。</p>
              <button onClick={() => setIsLoggedIn(false)} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition shadow-xl shadow-gray-200">
                前往設定密碼
              </button>
            </div>
          </div>
        );
    }
  };

  // --- 登入/註冊介面 ---
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500 px-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200">
                <Pill size={40} />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-center text-gray-900 mb-2">
              {authMode === "login" ? "歡迎回來" : authMode === "register" ? "建立帳號" : "重設密碼"}
            </h2>
            <p className="text-center text-gray-500 font-medium mb-10 text-sm sm:text-base">
              {authMode === "login" ? "請登入以繼續管理您的健康" : authMode === "register" ? "加入我們，開始專業的用藥管理" : "請輸入您的信箱以獲取驗證碼"}
            </p>

            {message && (
              <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span className="flex-1">{message.text}</span>
              </div>
            )}

            {authMode === "reset" ? (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">註冊信箱</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="email" value={authData.email} onChange={(e) => setAuthData({ ...authData, email: e.target.value })} className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 focus:ring-2 focus:ring-blue-600 font-medium transition-all" placeholder="example@mail.com" required />
                  </div>
                </div>
                {testCode && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-gray-700 ml-1">驗證碼</label>
                      <input type="text" value={authData.code} onChange={(e) => setAuthData({ ...authData, code: e.target.value })} className="w-full h-14 bg-gray-50 border-none rounded-2xl px-4 focus:ring-2 focus:ring-blue-600 font-black text-center text-2xl tracking-[0.5em] sm:tracking-[1em]" placeholder="000000" maxLength={6} required />
                    </div>
                    <PasswordInput label="設置新密碼" value={authData.password} onChange={(e) => setAuthData({ ...authData, password: e.target.value })} placeholder="請輸入新密碼" required />
                  </div>
                )}
                <button type={testCode ? "submit" : "button"} onClick={testCode ? undefined : handleSendCode} disabled={loading} className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition active:scale-95 disabled:opacity-50">
                  {loading ? "處理中..." : testCode ? "確認重設密碼" : "發送驗證碼"}
                </button>
                <button type="button" onClick={() => { setAuthMode("login"); setTestCode(null); setMessage(null); }} className="w-full text-gray-400 font-bold hover:text-blue-600 transition">返回登入</button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">電子信箱</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="email" value={authData.email} onChange={(e) => setAuthData({ ...authData, email: e.target.value })} className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 focus:ring-2 focus:ring-blue-600 font-medium transition-all" placeholder="example@mail.com" required />
                  </div>
                </div>
                <PasswordInput label="密碼" value={authData.password} onChange={(e) => setAuthData({ ...authData, password: e.target.value })} placeholder="請輸入密碼" required />
                {authMode === "register" && (
                  <PasswordInput label="確認密碼" value={authData.confirmPassword} onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })} placeholder="請再次輸入密碼" required />
                )}
                {authMode === "login" && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setAuthMode("reset"); setMessage(null); }} className="text-sm font-bold text-blue-600 hover:underline">忘記密碼？</button>
                  </div>
                )}
                <button type="submit" disabled={loading} className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? "處理中..." : authMode === "login" ? <><LogIn size={20} /> 立即登入</> : <><UserPlus size={20} /> 建立帳號</>}
                </button>
              </form>
            )}
          </div>
          <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-gray-500 font-bold text-sm sm:text-base">
              {authMode === "login" ? "還沒有帳號嗎？" : "已經有帳號了？"}
              <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setMessage(null); }} className="ml-2 text-blue-600 hover:underline">
                {authMode === "login" ? "立即註冊" : "立即登入"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 登入後儀表板 ---
  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-blue-50 overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 sm:p-10 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <LayoutDashboard size={28} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">控制中心</h2>
            </div>
            <button onClick={handleLogout} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-2xl transition font-bold backdrop-blur-md border border-white/10">
              <LogOut size={20} /> 登出
            </button>
          </div>
          <p className="text-blue-100 text-base sm:text-lg font-medium">歡迎回來，今天也要準時服藥喔！</p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};
