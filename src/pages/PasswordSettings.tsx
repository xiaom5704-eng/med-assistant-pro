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
type Tab = "dashboard" | "ai" | "baby" | "history" | "meds" | "profile";
type AuthMode = "login" | "register" | "reset";
type AgeGroup = "infant" | "adult" | "elderly";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  function: string;
  risk: string;
  comments: string[];
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
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [ocrText, setOcrText] = useState("");

  // --- 嬰兒用藥狀態 ---
  const [babySymptom, setBabySymptom] = useState<string | null>(null);
  const [babyAdvice, setBabyAdvice] = useState<any>(null);

  // --- 藥物資料與評論 ---
  const [meds, setMeds] = useState<Medication[]>([
    { id: "1", name: "阿斯匹靈 (Aspirin)", dosage: "100mg", frequency: "每日一次", function: "抗血小板凝集", risk: "胃出血風險", comments: ["效果不錯", "胃部稍微不適"] },
    { id: "2", name: "普拿疼 (Panadol)", dosage: "500mg", frequency: "需要時服用", function: "解熱鎮痛", risk: "肝損傷風險", comments: ["退燒很快"] }
  ]);
  const [newComment, setNewComment] = useState("");
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);

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
    }, 800);
  };

  const handleSendCode = () => {
    setLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setTestCode(code);
      setLoading(false);
      setMessage({ type: "success", text: `測試驗證碼：${code}` });
    }, 500);
  };

  // --- AI 分析邏輯 (針對年齡層) ---
  const runAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      let riskLevel = "低";
      let advice = "請按醫囑服用。";
      
      if (ageGroup === "infant") {
        riskLevel = "極高";
        advice = "嬰兒器官發育未完全，嚴禁自行給藥，請務必諮詢小兒科醫師。";
      } else if (ageGroup === "elderly") {
        riskLevel = "中";
        advice = "老年人代謝較慢，建議從低劑量開始，並注意藥物交互作用。";
      }

      setAnalysisResult({
        ageGroup: ageGroup === "infant" ? "嬰兒" : ageGroup === "elderly" ? "老年人" : "成年人",
        riskLevel,
        advice,
        interaction: "目前輸入藥物無明顯相衝，但請注意劑量。"
      });
      setLoading(false);
    }, 1000);
  };

  // --- 嬰兒用藥邏輯 ---
  const handleBabySymptom = (symptom: string) => {
    setBabySymptom(symptom);
    setLoading(true);
    setTimeout(() => {
      const adviceMap: any = {
        "發燒": { med: "乙醯胺酚 (Acetaminophen)", dosage: "10-15mg/kg", warning: "嚴禁使用阿斯匹靈，以免引起雷氏症候群。" },
        "咳嗽": { med: "生理食鹽水噴霧", dosage: "適量", warning: "兩歲以下不建議使用非處方止咳藥。" },
        "腸絞痛": { med: "益生菌", dosage: "每日一次", warning: "請先確認是否為腸套疊等急症。" }
      };
      setBabyAdvice(adviceMap[symptom] || { med: "請諮詢醫師", dosage: "無", warning: "不明症狀請勿給藥。" });
      setLoading(false);
    }, 800);
  };

  // --- 評論邏輯 ---
  const addComment = (id: string) => {
    if (!newComment.trim()) return;
    setMeds(meds.map(m => m.id === id ? { ...m, comments: [...m.comments, newComment] } : m));
    setNewComment("");
    setSelectedMedId(null);
  };

  // --- 渲染內容 ---
  const renderContent = () => {
    switch (activeTab) {
      case "ai":
        return (
          <div className="p-6 max-w-2xl mx-auto space-y-8">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Activity className="text-blue-600" /> AI 藥物分析</h3>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">選擇年齡層</label>
              <div className="flex gap-2">
                {(["infant", "adult", "elderly"] as AgeGroup[]).map(a => (
                  <button key={a} onClick={() => setAgeGroup(a)} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${ageGroup === a ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"}`}>
                    {a === "infant" ? "嬰兒" : a === "elderly" ? "老年人" : "成年人"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">輸入藥物或上傳圖片</label>
              <div className="flex gap-2">
                <input type="text" className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm" placeholder="輸入藥物名稱..." />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"><Camera size={20} /></button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={() => setOcrText("辨識成功：阿斯匹靈")} />
              </div>
              {ocrText && <p className="text-xs text-blue-600 font-bold">{ocrText}</p>}
            </div>
            <button onClick={runAnalysis} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">開始分析</button>
            
            {analysisResult && (
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">對象：{analysisResult.ageGroup}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${analysisResult.riskLevel === "極高" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>風險：{analysisResult.riskLevel}</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{analysisResult.advice}</p>
                <p className="text-xs text-gray-500">{analysisResult.interaction}</p>
              </div>
            )}
          </div>
        );
      case "baby":
        return (
          <div className="p-6 max-w-2xl mx-auto space-y-8">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Baby className="text-pink-600" /> 嬰兒用藥安全</h3>
            <div className="grid grid-cols-3 gap-2">
              {["發燒", "咳嗽", "腸絞痛"].map(s => (
                <button key={s} onClick={() => handleBabySymptom(s)} className={`py-3 rounded-xl text-sm font-bold border transition ${babySymptom === s ? "bg-pink-600 text-white border-pink-600" : "bg-white text-gray-500 border-gray-200"}`}>{s}</button>
              ))}
            </div>
            {loading && <p className="text-center text-pink-600 font-bold animate-pulse">分析中...</p>}
            {babyAdvice && !loading && (
              <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100 space-y-4 animate-in fade-in">
                <div className="font-bold text-pink-900">建議藥物：{babyAdvice.med}</div>
                <div className="text-sm text-pink-800">建議劑量：{babyAdvice.dosage}</div>
                <div className="p-3 bg-white rounded-lg text-xs text-red-600 font-bold border border-red-100">⚠️ 禁忌提醒：{babyAdvice.warning}</div>
              </div>
            )}
          </div>
        );
      case "meds":
        return (
          <div className="p-6 max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Pill className="text-orange-600" /> 藥品管理與評論</h3>
            <div className="space-y-4">
              {meds.map(m => (
                <div key={m.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{m.name}</h4>
                      <p className="text-xs text-gray-400">{m.dosage} • {m.frequency}</p>
                    </div>
                    <button onClick={() => setSelectedMedId(m.id)} className="text-blue-600 text-xs font-bold hover:underline">新增評論</button>
                  </div>
                  <div className="text-xs text-gray-500">功能：{m.function} | 風險：{m.risk}</div>
                  <div className="space-y-2">
                    {m.comments.map((c, i) => (
                      <div key={i} className="text-xs bg-gray-50 p-2 rounded-lg text-gray-600">💬 {c}</div>
                    ))}
                  </div>
                  {selectedMedId === m.id && (
                    <div className="flex gap-2 animate-in slide-in-from-top-2">
                      <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-xs" placeholder="輸入評論..." />
                      <button onClick={() => addComment(m.id)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold">送出</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "dashboard":
      default:
        return (
          <div className="p-6 max-w-2xl mx-auto grid grid-cols-2 gap-4">
            <button onClick={() => setActiveTab("ai")} className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-left hover:shadow-md transition">
              <Activity className="text-blue-600 mb-4" />
              <div className="font-bold text-gray-900">AI 藥物分析</div>
              <div className="text-xs text-gray-400">年齡層風險判斷</div>
            </button>
            <button onClick={() => setActiveTab("baby")} className="p-6 bg-pink-50 rounded-2xl border border-pink-100 text-left hover:shadow-md transition">
              <Baby className="text-pink-600 mb-4" />
              <div className="font-bold text-gray-900">嬰兒用藥安全</div>
              <div className="text-xs text-gray-400">症狀與禁忌提醒</div>
            </button>
            <button onClick={() => setActiveTab("meds")} className="p-6 bg-orange-50 rounded-2xl border border-orange-100 text-left hover:shadow-md transition">
              <Pill className="text-orange-600 mb-4" />
              <div className="font-bold text-gray-900">藥品管理</div>
              <div className="text-xs text-gray-400">評論與紀錄</div>
            </button>
            <button onClick={() => setActiveTab("history")} className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-left hover:shadow-md transition">
              <History className="text-purple-600 mb-4" />
              <div className="font-bold text-gray-900">對話紀錄</div>
              <div className="text-xs text-gray-400">家長諮詢歷史</div>
            </button>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-8">{authMode === "login" ? "登入" : "註冊"}</h2>
        {message && <div className="mb-4 p-3 bg-green-50 text-green-600 text-xs font-bold rounded-lg">{message.text}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="電子信箱" required />
          <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="密碼" required />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">進入系統</button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="text-xs text-blue-600 font-bold hover:underline">{authMode === "login" ? "沒有帳號？立即註冊" : "已有帳號？立即登入"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 flex flex-col md:flex-row gap-8 px-4">
      <div className="w-full md:w-48 space-y-2">
        {(["dashboard", "ai", "baby", "meds", "history"] as Tab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
            {t === "dashboard" ? "總覽" : t === "ai" ? "AI 分析" : t === "baby" ? "嬰兒安全" : t === "meds" ? "藥品管理" : "對話紀錄"}
          </button>
        ))}
        <button onClick={() => setIsLoggedIn(false)} className="w-full text-left px-4 py-2 text-red-600 text-sm font-bold hover:bg-red-50 rounded-lg mt-4">登出</button>
      </div>
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
};
