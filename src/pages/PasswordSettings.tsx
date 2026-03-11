import React, { useState, useEffect, useRef } from "react";
import { 
  Pill, LayoutDashboard, LogOut, Activity, Baby, History, Send, Camera, 
  Plus, Trash2, AlertTriangle, Check, RefreshCw, MessageCircle, User, LogIn, UserPlus, X, FileText, Search, Info, ChevronRight, ChevronDown, ExternalLink, ShieldCheck
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// --- 類型定義 ---
type Tab = "dashboard" | "ai" | "baby" | "chat";
type AgeGroup = "infant" | "adult" | "elderly";
type ReportMode = "simple" | "detail";

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

// --- 擴充藥物資料庫 (模擬健保用藥品項) ---
const MED_DB: Record<string, { cn: string, purpose: string, ingredient: string, risk: string, link: string }> = {
  "aspirin": { 
    cn: "阿斯匹靈", 
    purpose: "退燒、止痛、抗發炎", 
    ingredient: "Acetylsalicylic acid", 
    risk: "嬰兒使用可能導致瑞氏症候群 (Reye's syndrome)，極高風險。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Aspirin"
  },
  "ibuprofen": { 
    cn: "布洛芬 (伊普)", 
    purpose: "緩解發燒與中度疼痛", 
    ingredient: "Ibuprofen", 
    risk: "與阿斯匹靈併用會增加胃出血風險。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Ibuprofen"
  },
  "acetaminophen": { 
    cn: "乙醯胺酚 (普拿疼)", 
    purpose: "退燒、緩解輕微疼痛", 
    ingredient: "Paracetamol", 
    risk: "過量使用會造成肝臟損傷。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Acetaminophen"
  },
  "amoxicillin": { 
    cn: "阿莫西林 (萬古黴素類)", 
    purpose: "治療細菌感染", 
    ingredient: "Amoxicillin", 
    risk: "需按療程服用完畢，避免產生抗藥性。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Amoxicillin"
  },
  "panadol": { 
    cn: "普拿疼", 
    purpose: "退燒、緩解疼痛", 
    ingredient: "Paracetamol", 
    risk: "過量使用會造成肝臟損傷。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Acetaminophen"
  },
  "diclofenac": {
    cn: "待克菲那 (非類固醇消炎藥)",
    purpose: "緩解發炎與疼痛",
    ingredient: "Diclofenac Sodium",
    risk: "可能引起胃腸不適，需飯後服用。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Diclofenac"
  },
  "mefenamic": {
    cn: "博疏痛 (止痛藥)",
    purpose: "緩解經痛與輕度疼痛",
    ingredient: "Mefenamic Acid",
    risk: "氣喘患者需謹慎使用。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Mefenamic"
  },
  "阿斯匹靈": { 
    cn: "阿斯匹靈", 
    purpose: "退燒、止痛、抗發炎", 
    ingredient: "Acetylsalicylic acid", 
    risk: "嬰兒使用可能導致瑞氏症候群 (Reye's syndrome)，極高風險。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Aspirin"
  },
  "布洛芬": { 
    cn: "布洛芬", 
    purpose: "緩解發燒與中度疼痛", 
    ingredient: "Ibuprofen", 
    risk: "與阿斯匹靈併用會增加胃出血風險。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Ibuprofen"
  },
  "普拿疼": { 
    cn: "普拿疼", 
    purpose: "退燒、緩解疼痛", 
    ingredient: "Paracetamol", 
    risk: "過量使用會造成肝臟損傷。",
    link: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Acetaminophen"
  }
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
  const [reportMode, setReportMode] = useState<ReportMode>("simple");

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
          ... (MED_DB[key] || { 
            cn: m.name, 
            purpose: "未知用途", 
            ingredient: "未知成分", 
            risk: "尚無資料",
            link: `https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=${m.name}`
          })
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

  // --- 渲染 AI 藥物分析頁面 ---
  const renderAIAnalysis = () => {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="text-blue-600" size={28} /> 
            AI 藥物分析
          </h3>
          <p className="text-sm text-gray-500">上傳或輸入藥物名稱，進行交互作用與安全性評估</p>
        </div>

        {/* 年齡組別選擇 */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 uppercase">患者年齡組別</label>
          <div className="flex gap-3">
            {(["infant", "adult", "elderly"] as AgeGroup[]).map(a => (
              <button 
                key={a} 
                onClick={() => setAgeGroup(a)} 
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition ${
                  ageGroup === a 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                }`}
              >
                {a === "infant" ? "👶 嬰兒" : a === "elderly" ? "👴 老年人" : "👨 成年人"}
              </button>
            ))}
          </div>
        </div>

        {/* 藥物上傳區域 */}
        {!showCamera ? (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={startCamera} 
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group"
            >
              <Camera className="text-gray-400 group-hover:text-blue-600 mb-2" size={28} />
              <span className="text-sm font-bold text-gray-600 group-hover:text-blue-600 text-center">拍照辨識</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group"
            >
              <FileText className="text-gray-400 group-hover:text-blue-600 mb-2" size={28} />
              <span className="text-sm font-bold text-gray-600 group-hover:text-blue-600 text-center">上傳藥單</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
          </div>
        ) : (
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button onClick={takePhoto} className="p-4 bg-white rounded-full shadow-lg text-blue-600 hover:bg-gray-100 transition"><Camera size={24} /></button>
              <button onClick={stopCamera} className="p-4 bg-red-600 rounded-full shadow-lg text-white hover:bg-red-700 transition"><X size={24} /></button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* 藥物清單與手動輸入 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-500 uppercase">待分析藥物 ({medications.length}/4)</label>
            {medications.length > 0 && (
              <button 
                onClick={() => setMedications([])}
                className="text-xs text-gray-400 hover:text-red-600 transition font-medium"
              >
                清空全部
              </button>
            )}
          </div>

          <div className="space-y-2">
            {medications.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition">
                <div className="flex items-center gap-3">
                  <Pill size={18} className="text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800">{m.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{m.type === "ocr" ? "相機辨識" : m.type === "file" ? "檔案上傳" : "手動輸入"}</div>
                  </div>
                </div>
                <button 
                  onClick={() => removeMedication(m.id)} 
                  className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {medications.length < 4 && (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="輸入藥名 (如: Aspirin)..." 
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addMedication(manualInput, "manual")}
                />
                <button 
                  onClick={() => addMedication(manualInput, "manual")} 
                  disabled={!manualInput.trim()}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 分析按鈕 */}
        <button 
          onClick={runAnalysis} 
          disabled={medications.length === 0 || loading}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
          {loading ? "分析中..." : "開始分析"}
        </button>

        {/* 分析結果 */}
        {analysisResult && (
          <div className={`rounded-xl border-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${
            analysisResult.riskLevel === "高" || analysisResult.riskLevel === "極高" 
              ? "bg-red-50 border-red-200" 
              : "bg-green-50 border-green-200"
          }`}>
            {/* 報告頭部 */}
            <div className={`px-6 py-4 border-b ${
              analysisResult.riskLevel === "高" || analysisResult.riskLevel === "極高" 
                ? "bg-red-100 border-red-200" 
                : "bg-green-100 border-green-200"
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-gray-600 uppercase mb-1">風險評估</div>
                  <div className={`text-lg font-bold ${
                    analysisResult.riskLevel === "高" || analysisResult.riskLevel === "極高" 
                      ? "text-red-700" 
                      : "text-green-700"
                  }`}>
                    {analysisResult.riskLevel}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setReportMode("simple")} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                      reportMode === "simple" 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "bg-white/50 text-gray-500 hover:bg-white/75"
                    }`}
                  >
                    簡化版
                  </button>
                  <button 
                    onClick={() => setReportMode("detail")} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                      reportMode === "detail" 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "bg-white/50 text-gray-500 hover:bg-white/75"
                    }`}
                  >
                    詳細版
                  </button>
                </div>
              </div>
            </div>

            {/* 報告內容 */}
            <div className="px-6 py-4 space-y-4">
              <div className="text-sm font-medium text-gray-800 leading-relaxed">
                {analysisResult.summary}
              </div>

              {reportMode === "simple" ? (
                <div className="space-y-3">
                  {analysisResult.medDetails.map((d: any, i: number) => (
                    <div key={i} className="flex items-start justify-between gap-3 p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <div className="font-bold text-blue-700 text-sm">{d.cn}</div>
                        <div className="text-xs text-gray-600 mt-1">{d.purpose}</div>
                      </div>
                      <a 
                        href={d.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="查看官方資料"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {analysisResult.medDetails.map((d: any, i: number) => (
                    <div key={i} className="p-4 bg-white rounded-lg border border-gray-100 space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{d.cn}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{d.original}</div>
                        </div>
                        <a 
                          href={d.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline flex-shrink-0"
                        >
                          <ExternalLink size={12} /> 官方資料
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-gray-500 font-bold mb-1">主要成分</div>
                          <div className="text-gray-800">{d.ingredient}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-gray-500 font-bold mb-1">藥理作用</div>
                          <div className="text-gray-800">{d.purpose}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="text-red-700 font-bold text-xs mb-1">⚠️ 風險提示</div>
                        <div className="text-red-600 text-xs">{d.risk}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 資料來源 */}
              <div className="pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={14} />
                <span>資料來源：衛生福利部中央健康保險署</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- 渲染嬰兒用藥安全頁面 ---
  const renderBabySafety = () => {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <Baby className="text-pink-600" size={28} /> 
              嬰兒用藥安全
            </h3>
            <p className="text-sm text-gray-500">嬰幼兒用藥劑量與禁忌提醒</p>
          </div>
          <button 
            onClick={() => setShowAddBaby(!showAddBaby)} 
            className="p-3 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition font-bold"
          >
            <Plus size={20} />
          </button>
        </div>

        {showAddBaby && (
          <div className="p-5 bg-white rounded-lg border border-gray-200 space-y-3 animate-in slide-in-from-top-2">
            <h4 className="font-bold text-gray-900">新增用藥指南</h4>
            <input 
              type="text" 
              placeholder="症狀" 
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none" 
              value={newBaby.symptom} 
              onChange={e => setNewBaby({...newBaby, symptom: e.target.value})} 
            />
            <input 
              type="text" 
              placeholder="建議藥物" 
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none" 
              value={newBaby.med} 
              onChange={e => setNewBaby({...newBaby, med: e.target.value})} 
            />
            <input 
              type="text" 
              placeholder="建議劑量" 
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none" 
              value={newBaby.dosage} 
              onChange={e => setNewBaby({...newBaby, dosage: e.target.value})} 
            />
            <input 
              type="text" 
              placeholder="禁忌提醒" 
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none" 
              value={newBaby.warning} 
              onChange={e => setNewBaby({...newBaby, warning: e.target.value})} 
            />
            <div className="flex gap-2">
              <button 
                onClick={addBabyAdvice} 
                className="flex-1 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold hover:bg-pink-700 transition"
              >
                儲存
              </button>
              <button 
                onClick={() => setShowAddBaby(false)} 
                className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-300 transition"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {babyAdvices.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg border border-gray-200">
              <Baby className="text-gray-300 mx-auto mb-2" size={32} />
              <div className="text-gray-500 text-sm">尚無用藥指南，點擊上方按鈕新增</div>
            </div>
          ) : (
            babyAdvices.map(a => (
              <div key={a.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition group">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-sm">{a.symptom}</div>
                    <div className="text-xs text-gray-600 mt-2">
                      <span className="font-bold">藥物：</span> {a.med}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-bold">劑量：</span> {a.dosage}
                    </div>
                    <div className="text-xs text-red-600 font-bold mt-2">⚠️ {a.warning}</div>
                  </div>
                  <button 
                    onClick={() => deleteBabyAdvice(a.id)} 
                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // --- 渲染 AI 醫療問答頁面 ---
  const renderChat = () => {
    return (
      <div className="p-6 max-w-3xl mx-auto h-[600px] flex flex-col">
        <div className="space-y-2 mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <MessageCircle className="text-purple-600" size={28} /> 
            AI 醫療問答
          </h3>
          <p className="text-sm text-gray-500">向 AI 助手諮詢用藥與健康問題</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 bg-white rounded-lg p-4 border border-gray-200">
          {chatMessages.map(m => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 rounded-lg text-sm font-medium ${
                m.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}>
                {m.content}
                <div className="text-[10px] mt-1 opacity-60">{m.timestamp}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium animate-pulse">
                AI 正在思考中...
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
            placeholder="輸入您的問題..." 
            value={inputMsg} 
            onChange={e => setInputMsg(e.target.value)} 
            onKeyPress={e => e.key === "Enter" && sendChat()}
            disabled={loading}
          />
          <button 
            onClick={sendChat} 
            disabled={!inputMsg.trim() || loading}
            className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    );
  };

  // --- 渲染儀表板 ---
  const renderDashboard = () => {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">歡迎使用 MedAssistant Pro</h2>
          <p className="text-gray-600">專業的家庭醫療輔助系統</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveTab("ai")} 
            className="p-6 bg-blue-50 rounded-xl border border-blue-200 text-left hover:shadow-lg hover:border-blue-400 transition group"
          >
            <Activity className="text-blue-600 mb-3 group-hover:scale-110 transition" size={32} />
            <div className="font-bold text-blue-900 text-lg">AI 藥物分析</div>
            <div className="text-xs text-blue-600 mt-2">多藥物交互作用評估</div>
          </button>

          <button 
            onClick={() => setActiveTab("baby")} 
            className="p-6 bg-pink-50 rounded-xl border border-pink-200 text-left hover:shadow-lg hover:border-pink-400 transition group"
          >
            <Baby className="text-pink-600 mb-3 group-hover:scale-110 transition" size={32} />
            <div className="font-bold text-pink-900 text-lg">嬰兒用藥安全</div>
            <div className="text-xs text-pink-600 mt-2">專屬劑量與禁忌提醒</div>
          </button>

          <button 
            onClick={() => setActiveTab("chat")} 
            className="p-6 bg-purple-50 rounded-xl border border-purple-200 text-left hover:shadow-lg hover:border-purple-400 transition group"
          >
            <MessageCircle className="text-purple-600 mb-3 group-hover:scale-110 transition" size={32} />
            <div className="font-bold text-purple-900 text-lg">AI 醫療問答</div>
            <div className="text-xs text-purple-600 mt-2">家長諮詢與對話紀錄</div>
          </button>
        </div>
      </div>
    );
  };

  // --- 主渲染邏輯 ---
  const renderContent = () => {
    switch (activeTab) {
      case "ai":
        return renderAIAnalysis();
      case "baby":
        return renderBabySafety();
      case "chat":
        return renderChat();
      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-8 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <Pill size={48} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold">MedAssistant Pro</h1>
            <p className="text-blue-100 text-sm mt-2">專業醫療輔助系統</p>
          </div>
          
          <div className="p-8">
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setAuthMode("login")} 
                className={`flex-1 pb-2 font-bold text-sm transition ${
                  authMode === "login" 
                    ? "text-blue-600 border-b-2 border-blue-600" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                登入
              </button>
              <button 
                onClick={() => setAuthMode("register")} 
                className={`flex-1 pb-2 font-bold text-sm transition ${
                  authMode === "register" 
                    ? "text-blue-600 border-b-2 border-blue-600" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                註冊
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">電子信箱</label>
                <input 
                  type="email" 
                  required 
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="name@example.com" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">密碼</label>
                <input 
                  type="password" 
                  required 
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="••••••••" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : (authMode === "login" ? <LogIn size={20} /> : <UserPlus size={20} />)}
                {authMode === "login" ? "立即登入" : "建立帳號"}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-full border-t border-gray-200"></div>
                <span className="relative bg-white px-4 text-xs text-gray-500 font-bold">或</span>
              </div>
              <button 
                onClick={() => setIsLoggedIn(true)} 
                className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                🚀 快速登入
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
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" 
          onClick={() => setActiveTab("dashboard")}
        >
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Pill size={20} />
          </div>
          <span className="font-bold text-gray-900 hidden sm:inline">MedAssistant Pro</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")} 
            className="text-sm font-bold text-gray-600 hover:text-blue-600 transition"
          >
            首頁
          </button>
          <button 
            onClick={() => setIsLoggedIn(false)} 
            className="p-2 text-gray-400 hover:text-red-600 transition hover:bg-red-50 rounded-lg"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* 主內容 */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* 底部導覽 (手機版) */}
      <div className="sm:hidden bg-white border-t border-gray-200 flex justify-around py-2 sticky bottom-0 shadow-lg">
        <button 
          onClick={() => setActiveTab("dashboard")} 
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition ${
            activeTab === "dashboard" 
              ? "text-blue-600 bg-blue-50" 
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] mt-1 font-bold">首頁</span>
        </button>
        <button 
          onClick={() => setActiveTab("ai")} 
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition ${
            activeTab === "ai" 
              ? "text-blue-600 bg-blue-50" 
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Activity size={24} />
          <span className="text-[10px] mt-1 font-bold">分析</span>
        </button>
        <button 
          onClick={() => setActiveTab("baby")} 
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition ${
            activeTab === "baby" 
              ? "text-blue-600 bg-blue-50" 
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Baby size={24} />
          <span className="text-[10px] mt-1 font-bold">嬰兒</span>
        </button>
        <button 
          onClick={() => setActiveTab("chat")} 
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition ${
            activeTab === "chat" 
              ? "text-blue-600 bg-blue-50" 
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <MessageCircle size={24} />
          <span className="text-[10px] mt-1 font-bold">問答</span>
        </button>
      </div>
    </div>
  );
};
