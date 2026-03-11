import React, { useState, useEffect, useRef } from "react";
import { 
  Pill, LayoutDashboard, LogOut, Activity, Baby, History, Send, Camera, 
  Plus, Trash2, AlertTriangle, Check, RefreshCw, MessageCircle, User, LogIn, UserPlus, X, FileText, Search, Info, ChevronRight, ChevronDown
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

interface Medication {
  id: string;
  name: string;
  type: "ocr" | "file" | "manual";
}

// --- 藥物資料庫 (模擬) ---
const MED_DB: Record<string, { cn: string, purpose: string, ingredient: string, risk: string }> = {
  "aspirin": { cn: "阿斯匹靈", purpose: "退燒、止痛、抗發炎", ingredient: "Acetylsalicylic acid", risk: "嬰兒使用可能導致瑞氏症候群 (Reye's syndrome)，極高風險。" },
  "ibuprofen": { cn: "布洛芬", purpose: "緩解發燒與中度疼痛", ingredient: "Ibuprofen", risk: "與阿斯匹靈併用會增加胃出血風險。" },
  "acetaminophen": { cn: "乙醯胺酚 (普拿疼)", purpose: "退燒、緩解輕微疼痛", ingredient: "Paracetamol", risk: "過量使用會造成肝臟損傷。" },
  "amoxicillin": { cn: "阿莫西林 (抗生素)", purpose: "治療細菌感染", ingredient: "Amoxicillin", risk: "需按療程服用完畢，避免產生抗藥性。" },
  "panadol": { cn: "普拿疼", purpose: "退燒、緩解疼痛", ingredient: "Paracetamol", risk: "過量使用會造成肝臟損傷。" },
  "阿斯匹靈": { cn: "阿斯匹靈", purpose: "退燒、止痛、抗發炎", ingredient: "Acetylsalicylic acid", risk: "嬰兒使用可能導致瑞氏症候群 (Reye's syndrome)，極高風險。" },
  "布洛芬": { cn: "布洛芬", purpose: "緩解發燒與中度疼痛", ingredient: "Ibuprofen", risk: "與阿斯匹靈併用會增加胃出血風險。" }
};

export const PasswordSettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- 狀態管理 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // --- AI 分析狀態 ---
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [reportMode, setReportMode] = useState<"simple" | "detail">("simple");

  // --- 嬰兒用藥狀態 ---
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

  // --- 相機邏輯 ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (err) {
      alert("無法啟動相機，請確認是否已授權權限。");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        stopCamera();
        addMedication("Aspirin", "ocr");
      }
    }
  };

  // --- 藥物管理邏輯 ---
  const addMedication = (name: string, type: "ocr" | "file" | "manual") => {
    if (medications.length >= 4) {
      alert("最多只能同時分析 4 種藥物。");
      return;
    }
    if (!name.trim()) return;
    setMedications([...medications, { id: Date.now().toString(), name, type }]);
    setManualInput("");
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.split(".")[0];
      addMedication(fileName, "file");
    }
  };

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
    if (medications.length === 0) {
      alert("請先新增至少一種藥物。");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const medDetails = medications.map(m => {
        const key = m.name.toLowerCase();
        return {
          original: m.name,
          ... (MED_DB[key] || { cn: m.name, purpose: "未知用途", ingredient: "未知成分", risk: "尚無資料" })
        };
      });

      let riskLevel = "低";
      let summary = "藥物組合相對安全，請按醫囑服用。";
      
      // 檢查交互作用
      const names = medDetails.map(d => d.cn);
      if (names.includes("阿斯匹靈") && names.includes("布洛芬")) {
        riskLevel = "高";
        summary = "⚠️ 偵測到藥物相衝：阿斯匹靈與布洛芬併用會增加胃出血風險，請諮詢醫師。";
      } else if (ageGroup === "infant") {
        riskLevel = "極高";
        summary = "⚠️ 嬰兒用藥需極度謹慎，請務必諮詢醫師，嚴禁自行給藥。";
      }

      setAnalysisResult({
        ageGroup: ageGroup === "infant" ? "嬰兒" : ageGroup === "elderly" ? "老年人" : "成年人",
        riskLevel,
        summary,
        medDetails
      });
      setLoading(false);
    }, 1200);
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
              
              {showCamera ? (
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button onClick={takePhoto} className="p-4 bg-white rounded-full shadow-lg text-blue-600"><Camera size={24} /></button>
                    <button onClick={stopCamera} className="p-4 bg-red-600 rounded-full shadow-lg text-white"><X size={24} /></button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={startCamera} 
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group"
                  >
                    <Camera className="text-gray-400 group-hover:text-blue-600 mb-2" size={24} />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600">📸 拍照辨識</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group"
                  >
                    <FileText className="text-gray-400 group-hover:text-blue-600 mb-2" size={24} />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600">📁 上傳藥單</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase">待分析藥物清單 ({medications.length}/4)</label>
                <div className="space-y-2">
                  {medications.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <Pill size={16} className="text-blue-600" />
                        <span className="text-sm font-bold text-gray-800">{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded uppercase">{m.type}</span>
                      </div>
                      <button onClick={() => removeMedication(m.id)} className="text-gray-300 hover:text-red-600 transition"><X size={16} /></button>
                    </div>
                  ))}
                  {medications.length < 4 && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm" 
                        placeholder="手動輸入藥名 (如: Aspirin)..." 
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addMedication(manualInput, "manual")}
                      />
                      <button onClick={() => addMedication(manualInput, "manual")} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><Plus size={20} /></button>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={runAnalysis} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                開始 AI 深度分析
              </button>
            </div>

            {analysisResult && (
              <div className={`p-5 rounded-2xl border space-y-4 animate-in fade-in slide-in-from-bottom-4 ${analysisResult.riskLevel === "高" || analysisResult.riskLevel === "極高" ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button onClick={() => setReportMode("simple")} className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${reportMode === "simple" ? "bg-blue-600 text-white" : "bg-white text-gray-400 border border-gray-100"}`}>簡潔模式</button>
                    <button onClick={() => setReportMode("detail")} className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${reportMode === "detail" ? "bg-blue-600 text-white" : "bg-white text-gray-400 border border-gray-100"}`}>詳細模式</button>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${analysisResult.riskLevel === "高" || analysisResult.riskLevel === "極高" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>風險：{analysisResult.riskLevel}</span>
                </div>

                {reportMode === "simple" ? (
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-gray-900 leading-relaxed">{analysisResult.summary}</div>
                    <div className="space-y-2">
                      {analysisResult.medDetails.map((d: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-white/50 rounded-lg">
                          <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold text-blue-700">{d.cn}</span>：{d.purpose}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysisResult.medDetails.map((d: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-gray-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-900">{d.cn} <span className="text-[10px] text-gray-400 font-normal">({d.original})</span></span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-gray-400 mb-1">主要成分</div>
                            <div className="font-bold text-gray-700">{d.ingredient}</div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-gray-400 mb-1">藥理作用</div>
                            <div className="font-bold text-gray-700">{d.purpose}</div>
                          </div>
                        </div>
                        <div className="p-2 bg-red-50 rounded text-[10px]">
                          <div className="text-red-400 mb-1 font-bold">風險提示</div>
                          <div className="text-red-700">{d.risk}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="font-bold text-blue-900 text-sm">AI 藥物分析</div>
              <div className="text-[10px] text-blue-400 mt-1">多藥物交互作用評估</div>
            </button>
            <button onClick={() => setActiveTab("baby")} className="p-6 bg-pink-50 rounded-2xl border border-pink-100 text-center hover:shadow-md transition">
              <Baby className="text-pink-600 mx-auto mb-2" />
              <div className="font-bold text-pink-900 text-sm">嬰兒用藥安全</div>
              <div className="text-[10px] text-pink-400 mt-1">專屬劑量與禁忌提醒</div>
            </button>
            <button onClick={() => setActiveTab("chat")} className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-center hover:shadow-md transition">
              <MessageCircle className="text-purple-600 mx-auto mb-2" />
              <div className="font-bold text-purple-900 text-sm">AI 醫療問答</div>
              <div className="text-[10px] text-purple-400 mt-1">家長諮詢與對話紀錄</div>
            </button>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8 text-center bg-blue-600 text-white">
            <Pill size={48} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold">MedAssistant Pro</h1>
            <p className="text-blue-100 text-sm mt-2">專業醫療輔助系統</p>
          </div>
          
          <div className="p-8">
            <div className="flex gap-4 mb-8">
              <button onClick={() => setAuthMode("login")} className={`flex-1 pb-2 font-bold text-sm transition ${authMode === "login" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"}`}>登入</button>
              <button onClick={() => setAuthMode("register")} className={`flex-1 pb-2 font-bold text-sm transition ${authMode === "register" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"}`}>註冊</button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">電子信箱</label>
                <input type="email" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="name@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">密碼</label>
                <input type="password" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="animate-spin" size={20} /> : (authMode === "login" ? <LogIn size={20} /> : <UserPlus size={20} />)}
                {authMode === "login" ? "立即登入" : "建立帳號"}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-full border-t border-gray-100"></div>
                <span className="relative bg-white px-4 text-xs text-gray-400 font-bold">或</span>
              </div>
              <button onClick={() => setIsLoggedIn(true)} className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-2">
                🚀 快速登入 (免帳密)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 導覽列 */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
          <div className="p-2 bg-blue-600 rounded-lg text-white"><Pill size={20} /></div>
          <span className="font-bold text-gray-900 hidden sm:inline">MedAssistant Pro</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="text-sm font-bold text-gray-500 hover:text-blue-600 transition">首頁</button>
          <button onClick={() => setIsLoggedIn(false)} className="p-2 text-gray-400 hover:text-red-600 transition"><LogOut size={20} /></button>
        </div>
      </nav>

      {/* 主內容 */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* 底部導覽 (手機版) */}
      <div className="sm:hidden bg-white border-t border-gray-100 flex justify-around py-3 sticky bottom-0">
        <button onClick={() => setActiveTab("dashboard")} className={`p-2 ${activeTab === "dashboard" ? "text-blue-600" : "text-gray-400"}`}><LayoutDashboard size={24} /></button>
        <button onClick={() => setActiveTab("ai")} className={`p-2 ${activeTab === "ai" ? "text-blue-600" : "text-gray-400"}`}><Activity size={24} /></button>
        <button onClick={() => setActiveTab("baby")} className={`p-2 ${activeTab === "baby" ? "text-blue-600" : "text-gray-400"}`}><Baby size={24} /></button>
        <button onClick={() => setActiveTab("chat")} className={`p-2 ${activeTab === "chat" ? "text-blue-600" : "text-gray-400"}`}><MessageCircle size={24} /></button>
      </div>
    </div>
  );
};
