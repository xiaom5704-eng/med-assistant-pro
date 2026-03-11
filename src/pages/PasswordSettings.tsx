import React, { useState, useEffect, useRef } from "react";
import { PasswordInput } from "../components/PasswordInput";
import { 
  Lock, Mail, CheckCircle2, AlertCircle, LayoutDashboard, Pill, Calendar, User, LogOut, 
  ChevronLeft, Plus, Bell, Settings, Trash2, Edit2, Clock, ShieldCheck, UserPlus, 
  LogIn, KeyRound, Eye, EyeOff, ChevronRight, Activity, Camera, FileText, Baby, 
  History, MessageSquare, Search, AlertTriangle, Info, Send, Upload, Image as ImageIcon,
  Check, X, RefreshCw, MessageCircle
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// --- 類型定義 ---
type Tab = "dashboard" | "ai" | "baby" | "history" | "meds" | "reminders" | "profile";
type AuthMode = "login" | "register" | "reset";
type AnalysisMode = "simple" | "detailed";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  function?: string;
  risk?: string;
}

export const PasswordSettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- 狀態管理 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testCode, setTestCode] = useState<string | null>(null);

  // --- AI 分析狀態 ---
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("simple");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [ocrText, setOcrText] = useState("");

  // --- 對話紀錄狀態 ---
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "s1",
      title: "關於阿斯匹靈的副作用諮詢",
      timestamp: "2026-03-10 14:30",
      messages: [
        { id: "m1", role: "user", content: "請問阿斯匹靈可以跟維他命 B 一起吃嗎？", timestamp: "14:30" },
        { id: "m2", role: "ai", content: "一般來說，阿斯匹靈與維他命 B 群之間沒有明顯的藥物交互作用，可以一起服用。但建議阿斯匹靈隨餐服用以減少胃部不適。", timestamp: "14:31" }
      ]
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>("s1");
  const [inputMessage, setInputMessage] = useState("");

  // --- 藥物資料 ---
  const [meds, setMeds] = useState<Medication[]>([
    { id: "1", name: "阿斯匹靈 (Aspirin)", dosage: "100mg", frequency: "每日一次", time: "08:00", function: "抗血小板凝集，預防心血管疾病", risk: "可能引起胃潰瘍或出血風險" },
    { id: "2", name: "普拿疼 (Panadol)", dosage: "500mg", frequency: "需要時服用", time: "不固定", function: "解熱鎮痛", risk: "過量可能造成肝損傷" }
  ]);

  // --- 初始化 ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "quick") {
      setIsLoggedIn(true);
      const tab = params.get("tab") as Tab;
      if (tab) setActiveTab(tab);
    }
  }, [location]);

  // --- 帳號邏輯 ---
  const [authData, setAuthData] = useState({ email: "", password: "", confirmPassword: "", code: "" });
  
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
    }, 1000);
  };

  const handleSendCode = () => {
    setLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setTestCode(code);
      setLoading(false);
      setMessage({ type: "success", text: `測試驗證碼：${code}` });
    }, 800);
  };

  // --- AI 分析邏輯 ---
  const runAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setAnalysisResult({
        meds: ["阿斯匹靈", "布洛芬"],
        interaction: "高風險：兩者皆為非類固醇消炎止痛藥 (NSAIDs)，併用會顯著增加胃出血與腎損傷風險。",
        advice: "建議僅選擇其中一種服用，或諮詢醫師調整劑量。",
        details: {
          aspirin: { function: "抗凝血", risk: "胃黏膜損傷" },
          ibuprofen: { function: "消炎止痛", risk: "腎功能影響" }
        }
      });
      setLoading(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setLoading(true);
      setTimeout(() => {
        setOcrText("辨識結果：阿斯匹靈 100mg, 每日一次；布洛芬 400mg, 必要時服用。");
        setLoading(false);
      }, 2000);
    }
  };

  // --- 對話邏輯 ---
  const startNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "新對話 " + new Date().toLocaleTimeString(),
      timestamp: new Date().toLocaleString(),
      messages: []
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !currentSessionId) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setSessions(sessions.map(s => 
      s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
    ));
    setInputMessage("");

    // 模擬 AI 回覆
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "收到您的問題。針對「" + inputMessage + "」，建議您先確認藥盒上的警語，並在服藥後觀察是否有過敏反應。如果是給嬰兒使用，請務必精確測量體重對應的劑量。",
        timestamp: new Date().toLocaleTimeString()
      };
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
      ));
    }, 1000);
  };

  // --- 渲染組件 ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "ai":
        return (
          <div className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <Activity size={28} />
              </div>
              <h3 className="text-3xl font-black text-gray-900">AI 藥物分析</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Camera size={20} className="text-blue-600" /> 辨識與輸入
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-50 text-blue-600 rounded-3xl border-2 border-dashed border-blue-200 hover:bg-blue-100 transition group">
                      <ImageIcon size={32} className="group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-sm">拍照/截圖 OCR</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 text-purple-600 rounded-3xl border-2 border-dashed border-purple-200 hover:bg-purple-100 transition group">
                      <FileText size={32} className="group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-sm">上傳檔案判斷</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                  </div>
                  {loading && <div className="flex items-center justify-center py-4 text-blue-600 font-bold gap-2"><RefreshCw className="animate-spin" /> AI 辨識中...</div>}
                  {ocrText && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                      <p className="text-sm font-medium text-gray-600">{ocrText}</p>
                    </div>
                  )}
                  <textarea className="w-full h-32 bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 font-medium text-sm" placeholder="或手動輸入藥物名稱，例如：阿斯匹靈, 布洛芬..."></textarea>
                  <button onClick={runAnalysis} className="w-full mt-6 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition active:scale-95">
                    開始 AI 安全分析
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm min-h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-green-600" /> 分析報告
                    </h4>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button onClick={() => setAnalysisMode("simple")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition ${analysisMode === "simple" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>簡潔</button>
                      <button onClick={() => setAnalysisMode("detailed")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition ${analysisMode === "detailed" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>詳細</button>
                    </div>
                  </div>

                  {!analysisResult ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                      <Search size={48} className="mb-4" />
                      <p className="font-bold">等待分析輸入...</p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="p-5 bg-red-50 border border-red-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-red-600 font-black mb-2">
                          <AlertTriangle size={18} /> 交互作用警告
                        </div>
                        <p className="text-sm text-red-800 font-medium leading-relaxed">{analysisResult.interaction}</p>
                      </div>
                      <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-blue-600 font-black mb-2">
                          <Info size={18} /> 專業建議
                        </div>
                        <p className="text-sm text-blue-800 font-medium leading-relaxed">{analysisResult.advice}</p>
                      </div>
                      {analysisMode === "detailed" && (
                        <div className="space-y-4">
                          <h5 className="font-black text-gray-900 text-sm uppercase tracking-widest">藥理細節</h5>
                          {Object.entries(analysisResult.details).map(([name, info]: any) => (
                            <div key={name} className="border-l-4 border-blue-200 pl-4 py-1">
                              <div className="font-bold text-gray-900">{name}</div>
                              <div className="text-xs text-gray-500 font-medium">功能：{info.function} | 風險：{info.risk}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case "baby":
        return (
          <div className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center">
                <Baby size={28} />
              </div>
              <h3 className="text-3xl font-black text-gray-900">嬰兒用藥安全</h3>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-8">
              <h4 className="text-xl font-black text-gray-900 mb-6">請選擇或輸入嬰兒症狀</h4>
              <div className="flex flex-wrap gap-3 mb-8">
                {["發燒", "咳嗽", "流鼻涕", "腸絞痛", "皮膚紅疹", "腹瀉"].map(s => (
                  <button key={s} className="px-6 py-3 bg-gray-50 hover:bg-pink-50 hover:text-pink-600 rounded-2xl font-bold text-sm transition border border-transparent hover:border-pink-100">{s}</button>
                ))}
              </div>
              <div className="p-6 bg-pink-50 rounded-3xl border border-pink-100">
                <div className="flex items-center gap-3 text-pink-600 font-black mb-4">
                  <AlertTriangle size={24} /> 嬰兒用藥特別提醒
                </div>
                <ul className="space-y-3 text-pink-800 font-medium text-sm">
                  <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 flex-shrink-0" /> 務必根據嬰兒「體重」而非年齡計算劑量。</li>
                  <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 flex-shrink-0" /> 兩歲以下幼兒不建議自行使用非處方感冒藥。</li>
                  <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 flex-shrink-0" /> 若發燒超過 38.5 度且活動力下降，請立即就醫。</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case "history":
        return (
          <div className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[700px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                  <History size={28} />
                </div>
                <h3 className="text-3xl font-black text-gray-900">對話紀錄</h3>
              </div>
              <button onClick={startNewSession} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-100">
                <Plus size={20} /> 開啟新紀錄
              </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
              <div className="w-1/3 border-r border-gray-100 pr-6 overflow-y-auto space-y-3 hidden md:block">
                {sessions.map(s => (
                  <div key={s.id} onClick={() => setCurrentSessionId(s.id)} className={`p-4 rounded-2xl cursor-pointer transition ${currentSessionId === s.id ? "bg-purple-50 border border-purple-100" : "hover:bg-gray-50"}`}>
                    <div className="font-bold text-gray-900 truncate">{s.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{s.timestamp}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100">
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  {currentSessionId && sessions.find(s => s.id === currentSessionId)?.messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl font-medium text-sm shadow-sm ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none"}`}>
                        {m.content}
                        <div className={`text-[10px] mt-2 opacity-50 ${m.role === "user" ? "text-right" : "text-left"}`}>{m.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} className="flex-1 bg-gray-50 border-none rounded-xl px-4 font-medium focus:ring-2 focus:ring-purple-600" placeholder="詢問家長常見問題或藥物疑慮..." />
                  <button onClick={sendMessage} className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 transition shadow-lg shadow-purple-100">
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case "dashboard":
      default:
        return (
          <div className="p-6 sm:p-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div onClick={() => setActiveTab("ai")} className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                  <Activity size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">AI 藥物分析</h3>
                <p className="text-gray-500 text-sm font-medium">風險判斷與交互作用檢查</p>
              </div>
              <div onClick={() => setActiveTab("baby")} className="p-8 bg-pink-50 rounded-[2.5rem] border border-pink-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-14 h-14 bg-pink-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-200 group-hover:rotate-12 transition-transform">
                  <Baby size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">嬰兒用藥</h3>
                <p className="text-gray-500 text-sm font-medium">針對幼兒的安全用藥指南</p>
              </div>
              <div onClick={() => setActiveTab("history")} className="p-8 bg-purple-50 rounded-[2.5rem] border border-purple-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200 group-hover:rotate-12 transition-transform">
                  <History size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">對話紀錄</h3>
                <p className="text-gray-500 text-sm font-medium">家長溝通與諮詢歷史</p>
              </div>
              <div onClick={() => setActiveTab("meds")} className="p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-200 group-hover:rotate-12 transition-transform">
                  <Pill size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">藥品管理</h3>
                <p className="text-gray-500 text-sm font-medium">個人藥箱與評論系統</p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-2xl font-black text-gray-900">今日用藥提醒</h4>
                  <button onClick={() => setActiveTab("reminders")} className="text-blue-600 font-bold text-sm hover:underline">查看全部</button>
                </div>
                <div className="space-y-4">
                  {[
                    { time: "08:00", name: "阿斯匹靈", status: "已服用" },
                    { time: "12:00", name: "維他命 B 群", status: "待服用" },
                    { time: "20:00", name: "鈣片", status: "待服用" }
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.status === "已服用" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                          <Clock size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{r.name}</div>
                          <div className="text-xs text-gray-400 font-medium">{r.time}</div>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-black ${r.status === "已服用" ? "bg-green-100 text-green-700" : "bg-blue-600 text-white"}`}>
                        {r.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
                <h4 className="text-2xl font-black mb-6">健康小撇步</h4>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Info size={20} /></div>
                    <p className="text-sm font-medium leading-relaxed">服藥時請配溫開水，避免使用葡萄柚汁、咖啡或茶，以免影響藥效。</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Bell size={20} /></div>
                    <p className="text-sm font-medium leading-relaxed">如果您忘記服藥，請勿一次服用雙倍劑量，應諮詢藥師建議。</p>
                  </div>
                </div>
                <button className="w-full mt-10 py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition shadow-lg">
                  查看更多衛教資訊
                </button>
              </div>
            </div>
          </div>
        );
      case "meds":
        return (
          <div className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                  <Pill size={28} />
                </div>
                <h3 className="text-3xl font-black text-gray-900">藥品管理與評論</h3>
              </div>
              <button className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-100 flex items-center gap-2">
                <Plus size={20} /> 新增藥品
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {meds.map(med => (
                <div key={med.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-6">
                      <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Pill size={32} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-gray-900 mb-1">{med.name}</h4>
                        <p className="text-sm text-gray-500 font-bold mb-4">{med.dosage} • {med.frequency}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="text-xs font-black text-blue-600 uppercase mb-1">治療功能</div>
                            <div className="text-sm font-medium text-blue-900">{med.function}</div>
                          </div>
                          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <div className="text-xs font-black text-red-600 uppercase mb-1">潛在風險</div>
                            <div className="text-sm font-medium text-red-900">{med.risk}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition">
                        <MessageCircle size={18} /> 撰寫評論
                      </button>
                      <button className="flex items-center justify-center gap-2 px-6 py-3 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition">
                        <Trash2 size={18} /> 刪除紀錄
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">電子信箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="email" value={authData.email} onChange={(e) => setAuthData({ ...authData, email: e.target.value })} className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 focus:ring-2 focus:ring-blue-600 font-medium transition-all" placeholder="example@mail.com" required />
                </div>
              </div>
              <PasswordInput label="密碼" value={authData.password} onChange={(e) => setAuthData({ ...authData, password: e.target.value })} placeholder="請輸入密碼" required />
              <button type="submit" disabled={loading} className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? "處理中..." : authMode === "login" ? <><LogIn size={20} /> 立即登入</> : <><UserPlus size={20} /> 建立帳號</>}
              </button>
            </form>
          </div>
          <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-gray-500 font-bold text-sm sm:text-base">
              {authMode === "login" ? "還沒有帳號嗎？" : "已經有帳號了？"}
              <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="ml-2 text-blue-600 hover:underline">
                {authMode === "login" ? "立即註冊" : "立即登入"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 登入後介面 ---
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-50 overflow-hidden border border-gray-100 min-h-[800px] flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-gray-50 border-r border-gray-100 p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <LayoutDashboard size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-900">控制中心</h2>
          </div>
          
          <div className="space-y-2 flex-1">
            {[
              { id: "dashboard", name: "總覽儀表板", icon: <LayoutDashboard size={20} /> },
              { id: "ai", name: "AI 藥物分析", icon: <Activity size={20} /> },
              { id: "baby", name: "嬰兒用藥安全", icon: <Baby size={20} /> },
              { id: "history", name: "對話紀錄", icon: <History size={20} /> },
              { id: "meds", name: "藥品管理", icon: <Pill size={20} /> },
              { id: "profile", name: "個人檔案", icon: <User size={20} /> },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition ${activeTab === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-gray-500 hover:bg-white hover:text-blue-600"}`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </div>

          <button onClick={() => setIsLoggedIn(false)} className="mt-8 flex items-center gap-3 px-6 py-4 text-gray-400 font-bold text-sm hover:text-red-600 transition">
            <LogOut size={20} /> 登出系統
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
