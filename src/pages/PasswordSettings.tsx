import React, { useState, useEffect, useRef } from "react";
import { 
  Pill, LayoutDashboard, LogOut, Activity, Baby, History, Send, Camera, 
  Plus, Trash2, AlertTriangle, Check, RefreshCw, MessageCircle, User, LogIn, UserPlus
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// --- 類型定義 ---
type Tab = "dashboard" | "ai" | "baby" | "chat";
type AgeGroup = "infant" | "adult" | "elderly";

interface BabyAdvice {
  id: string;
  symptom: string;
  med: string;
  dosage: string;
  warning: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export const PasswordSettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- 狀態管理 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // --- AI 分析狀態 ---
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [ocrText, setOcrText] = useState("");

  // --- 嬰兒用藥狀態 (實裝新增/刪除) ---
  const [babyAdvices, setBabyAdvices] = useState<BabyAdvice[]>([
    { id: "1", symptom: "發燒", med: "乙醯胺酚 (Acetaminophen)", dosage: "10-15mg/kg", warning: "嚴禁使用阿斯匹靈。" },
    { id: "2", symptom: "咳嗽", med: "生理食鹽水噴霧", dosage: "適量", warning: "兩歲以下不建議使用止咳藥。" }
  ]);
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [newBaby, setNewBaby] = useState({ symptom: "", med: "", dosage: "", warning: "" });

  // --- AI 醫療問答狀態 ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", role: "ai", content: "您好！我是您的 AI 醫療助手。請問今天有什麼可以幫您的？", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [inputMsg, setInputMsg] = useState("");

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
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
    }, 500);
  };

  // --- AI 分析邏輯 ---
  const runAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setAnalysisResult({
        ageGroup: ageGroup === "infant" ? "嬰兒" : ageGroup === "elderly" ? "老年人" : "成年人",
        risk: ageGroup === "infant" ? "極高" : "低",
        advice: ageGroup === "infant" ? "嬰兒用藥需極度謹慎，請務必諮詢醫師。" : "請按醫囑服用，注意藥物交互作用。"
      });
      setLoading(false);
    }, 800);
  };

  // --- 嬰兒用藥新增/刪除邏輯 ---
  const addBabyAdvice = () => {
    if (!newBaby.symptom || !newBaby.med) return;
    setBabyAdvices([...babyAdvices, { ...newBaby, id: Date.now().toString() }]);
    setNewBaby({ symptom: "", med: "", dosage: "", warning: "" });
    setShowAddBaby(false);
  };

  const deleteBabyAdvice = (id: string) => {
    setBabyAdvices(babyAdvices.filter(a => a.id !== id));
  };

  // --- AI 問答邏輯 ---
  const sendChat = () => {
    if (!inputMsg.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: inputMsg, timestamp: new Date().toLocaleTimeString() };
    setChatMessages([...chatMessages, userMsg]);
    setInputMsg("");
    
    setLoading(true);
    setTimeout(() => {
      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        content: `針對您的問題「${inputMsg}」，建議您先確認藥物包裝上的說明。如果是給嬰兒使用，請務必精確測量體重對應的劑量。若症狀持續，請立即就醫。`, 
        timestamp: new Date().toLocaleTimeString() 
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1000);
  };

  // --- 渲染內容 ---
  const renderContent = () => {
    switch (activeTab) {
      case "ai":
        return (
          <div className="p-6 max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="text-blue-600" /> AI 藥物分析</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["infant", "adult", "elderly"] as AgeGroup[]).map(a => (
                  <button key={a} onClick={() => setAgeGroup(a)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${ageGroup === a ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"}`}>
                    {a === "infant" ? "嬰兒" : a === "elderly" ? "老年人" : "成年人"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group"
                >
                  <Camera className="text-gray-400 group-hover:text-blue-600 mb-2" size={24} />
                  <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600">📸 拍照/截圖辨識</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group"
                >
                  <Plus className="text-gray-400 group-hover:text-blue-600 mb-2" size={24} />
                  <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600">📁 上傳藥單檔案</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                  const isImage = e.target.files?.[0]?.type.startsWith('image/');
                  setOcrText(isImage ? "📸 圖片辨識成功：阿斯匹靈" : "📁 檔案讀取成功：阿斯匹靈");
                }} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">手動輸入或確認藥名</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm" 
                    placeholder="例如：阿斯匹靈" 
                    value={ocrText.includes("：") ? ocrText.split("：")[1] : ""}
                    onChange={(e) => setOcrText(`手動輸入：${e.target.value}`)}
                  />
                  <button 
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        setLoading(false);
                        alert("🔍 藥物資料檢索成功：阿斯匹靈 (Aspirin)");
                      }, 500);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                  >
                    🔍 搜尋
                  </button>
                </div>
              </div>

              <button onClick={runAnalysis} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                開始 AI 深度分析
              </button>
            </div>
            {analysisResult && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 animate-in fade-in">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-500">對象：{analysisResult.ageGroup}</span>
                  <span className={analysisResult.risk === "極高" ? "text-red-600" : "text-green-600"}>風險：{analysisResult.risk}</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{analysisResult.advice}</p>
              </div>
            )}
          </div>
        );
      case "baby":
        return (
          <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><Baby className="text-pink-600" /> 嬰兒用藥安全</h3>
              <button onClick={() => setShowAddBaby(!showAddBaby)} className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition"><Plus size={20} /></button>
            </div>
            
            {showAddBaby && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 animate-in slide-in-from-top-2">
                <input type="text" placeholder="症狀" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newBaby.symptom} onChange={e => setNewBaby({...newBaby, symptom: e.target.value})} />
                <input type="text" placeholder="建議藥物" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newBaby.med} onChange={e => setNewBaby({...newBaby, med: e.target.value})} />
                <input type="text" placeholder="建議劑量" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newBaby.dosage} onChange={e => setNewBaby({...newBaby, dosage: e.target.value})} />
                <input type="text" placeholder="禁忌提醒" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newBaby.warning} onChange={e => setNewBaby({...newBaby, warning: e.target.value})} />
                <div className="flex gap-2">
                  <button onClick={addBabyAdvice} className="flex-1 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold">儲存</button>
                  <button onClick={() => setShowAddBaby(false)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-bold">取消</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {babyAdvices.map(a => (
                <div key={a.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2 relative group">
                  <button onClick={() => deleteBabyAdvice(a.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-600 transition opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  <div className="font-bold text-gray-900">{a.symptom}</div>
                  <div className="text-xs text-gray-500">藥物：{a.med} | 劑量：{a.dosage}</div>
                  <div className="text-xs text-red-600 font-bold">⚠️ {a.warning}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case "chat":
        return (
          <div className="p-6 max-w-2xl mx-auto h-[500px] flex flex-col">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><MessageCircle className="text-purple-600" /> AI 醫療問答</h3>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-sm font-medium ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                    {m.content}
                    <div className="text-[10px] mt-1 opacity-50">{m.timestamp}</div>
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs text-purple-600 font-bold animate-pulse">AI 正在思考中...</div>}
            </div>
            <div className="flex gap-2">
              <input type="text" className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm" placeholder="詢問醫療問題..." value={inputMsg} onChange={e => setInputMsg(e.target.value)} onKeyPress={e => e.key === "Enter" && sendChat()} />
              <button onClick={sendChat} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"><Send size={20} /></button>
            </div>
          </div>
        );
      case "dashboard":
      default:
        return (
          <div className="p-6 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={() => setActiveTab("ai")} className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center hover:shadow-md transition">
              <Activity className="text-blue-600 mx-auto mb-2" />
              <div className="font-bold text-sm">AI 藥物分析</div>
            </button>
            <button onClick={() => setActiveTab("baby")} className="p-6 bg-pink-50 rounded-2xl border border-pink-100 text-center hover:shadow-md transition">
              <Baby className="text-pink-600 mx-auto mb-2" />
              <div className="font-bold text-sm">嬰兒用藥安全</div>
            </button>
            <button onClick={() => setActiveTab("chat")} className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-center hover:shadow-md transition">
              <MessageCircle className="text-purple-600 mx-auto mb-2" />
              <div className="font-bold text-sm">AI 醫療問答</div>
            </button>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-xl">
        <h2 className="text-xl font-bold text-center mb-8">{authMode === "login" ? "登入" : "註冊"}</h2>
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
      <div className="w-full md:w-40 space-y-1">
        {(["dashboard", "ai", "baby", "chat"] as Tab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
            {t === "dashboard" ? "總覽" : t === "ai" ? "AI 分析" : t === "baby" ? "嬰兒安全" : "AI 問答"}
          </button>
        ))}
        <button onClick={() => setIsLoggedIn(false)} className="w-full text-left px-4 py-2 text-red-600 text-xs font-bold hover:bg-red-50 rounded-lg mt-4">登出</button>
      </div>
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
};
