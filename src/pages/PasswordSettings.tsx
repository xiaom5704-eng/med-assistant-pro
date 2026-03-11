import React, { useState, useEffect, useRef } from "react";
import { 
  Pill, LayoutDashboard, LogOut, Activity, Baby, History, Send, Camera, 
  Plus, Trash2, AlertTriangle, Check, RefreshCw, MessageCircle, User, LogIn, UserPlus, X, FileText, Search, Info, ChevronRight, ChevronDown, ExternalLink, ShieldCheck, Eye, Download, BookOpen, AlertCircle, MapPin, Phone, Clock, Navigation
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// --- 類型定義 ---
type Tab = "dashboard" | "ai" | "baby" | "map";
type AgeGroup = "infant" | "adult" | "elderly";
type ReportMode = "simple" | "detail";
type RiskLevel = "低" | "中" | "高" | "極高";
type LocationType = "all" | "診所" | "藥局" | "醫院";

interface UploadedFile {
  id: string;
  name: string;
  dataUrl: string;
  extractedText: string;
  timestamp: string;
}

interface MedicalLocation {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  distance: number;
}

interface BabyAdvice {
  id: string;
  symptom: string;
  med: string;
  dosage: string;
  warning: string;
}

interface Medication {
  id: string;
  name: string;
  type: "ocr" | "file" | "manual";
}

// --- 風險等級配色 ---
const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case "低": return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" };
    case "中": return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" };
    case "高": return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" };
    case "極高": return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" };
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // --- 醫療地圖狀態 ---
  const [medicalLocations, setMedicalLocations] = useState<MedicalLocation[]>([]);
  const [locationFilter, setLocationFilter] = useState<LocationType>("all");
  const [loadingLocations, setLoadingLocations] = useState(false);

  // --- 嬰兒用藥狀態 ---
  const [babyAdvices, setBabyAdvices] = useState<BabyAdvice[]>([
    { id: "1", symptom: "發燒", med: "乙醯胺酚 (Acetaminophen)", dosage: "10-15mg/kg", warning: "嚴禁使用阿斯匹靈。" },
    { id: "2", symptom: "咳嗽", med: "生理食鹽水噴霧", dosage: "適量", warning: "兩歲以下不建議使用止咳藥。" }
  ]);
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [newBaby, setNewBaby] = useState({ symptom: "", med: "", dosage: "", warning: "" });

  // --- 初始化 ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "quick") {
      setIsLoggedIn(true);
      const tab = params.get("tab") as Tab;
      if (tab) setActiveTab(tab);
    }
  }, [location]);

  // --- 相機與 OCR 邏輯 ---
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
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        
        const extractedText = "Aspirin (阿斯匹靈)";
        
        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: `拍照_${new Date().toLocaleTimeString()}`,
          dataUrl,
          extractedText,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setUploadedFiles([...uploadedFiles, newFile]);
        addMedication("Aspirin", "ocr");
        stopCamera();
      }
    }
  };

  // --- 檔案管理邏輯 ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const fileName = file.name.split(".")[0];
        
        const extractedText = `${fileName} (已上傳)`;
        
        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: fileName,
          dataUrl,
          extractedText,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setUploadedFiles([...uploadedFiles, newFile]);
        addMedication(fileName, "file");
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteUploadedFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
    setShowFilePreview(false);
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

  // --- 帳號邏輯 ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
    }, 500);
  };

  // --- AI 分析邏輯（呼叫後端 API） ---
  const runAnalysis = async () => {
    if (medications.length === 0) {
      alert("請先新增至少一種藥物。");
      return;
    }
    setLoading(true);
    try {
      const medNames = medications.map(m => m.name);
      const response = await fetch('/api/analyze-medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications: medNames, ageGroup })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
      } else {
        alert('分析失敗，請稍後重試');
      }
    } catch (error) {
      console.error('API 呼叫失敗:', error);
      alert('無法連接到服務器，請檢查網路連線');
    } finally {
      setLoading(false);
    }
  };

  // --- 醫療地點查詢 ---
  const fetchMedicalLocations = async () => {
    setLoadingLocations(true);
    try {
      const typeParam = locationFilter === 'all' ? 'all' : locationFilter;
      const response = await fetch(`/api/nearby-medical-locations?type=${typeParam}`);
      
      if (response.ok) {
        const data = await response.json();
        setMedicalLocations(data.locations);
      } else {
        alert('查詢失敗，請稍後重試');
      }
    } catch (error) {
      console.error('查詢失敗:', error);
      alert('無法連接到服務器，請檢查網路連線');
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'map') {
      fetchMedicalLocations();
    }
  }, [activeTab, locationFilter]);

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

  // --- 渲染 AI 藥物分析頁面 ---
  const renderAIAnalysis = () => {
    const colors = analysisResult ? getRiskColor(analysisResult.riskLevel) : {};
    
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="text-blue-600" size={32} /> 
            AI 藥物分析系統
          </h3>
          <p className="text-sm text-gray-600">醫師級專業分析 • 多藥物交互作用評估 • 權威文獻支持</p>
        </div>

        {/* 患者資訊 */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="text-xs font-bold text-blue-600 uppercase mb-3 block">患者年齡組別</label>
          <div className="flex gap-3">
            {(["infant", "adult", "elderly"] as AgeGroup[]).map(a => (
              <button 
                key={a} 
                onClick={() => setAgeGroup(a)} 
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition ${
                  ageGroup === a 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-white text-gray-600 border border-blue-200 hover:border-blue-400"
                }`}
              >
                {a === "infant" ? "👶 嬰兒 (0-2歲)" : a === "elderly" ? "👴 老年人 (65+)" : "👨 成年人"}
              </button>
            ))}
          </div>
        </div>

        {/* 藥物上傳區域 */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-600 uppercase">藥物辨識與上傳</label>
          
          {!showCamera ? (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={startCamera} 
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <Camera className="text-gray-400 group-hover:text-blue-600 mb-2" size={32} />
                <span className="text-sm font-bold text-gray-600 group-hover:text-blue-600">拍照辨識</span>
                <span className="text-xs text-gray-400 mt-1">自動翻譯中文</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <FileText className="text-gray-400 group-hover:text-blue-600 mb-2" size={32} />
                <span className="text-sm font-bold text-gray-600 group-hover:text-blue-600">上傳藥單</span>
                <span className="text-xs text-gray-400 mt-1">支援圖片與 PDF</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
            </div>
          ) : (
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button onClick={takePhoto} className="p-4 bg-white rounded-full shadow-lg text-blue-600 hover:bg-gray-100 transition"><Camera size={24} /></button>
                <button onClick={stopCamera} className="p-4 bg-red-600 rounded-full shadow-lg text-white hover:bg-red-700 transition"><X size={24} /></button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* 已上傳檔案預覽 */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">已上傳檔案 ({uploadedFiles.length})</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {uploadedFiles.map(file => (
                  <div 
                    key={file.id}
                    className="relative group rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition cursor-pointer"
                    onClick={() => {
                      setSelectedFileId(file.id);
                      setShowFilePreview(true);
                    }}
                  >
                    <img src={file.dataUrl} alt={file.name} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <Eye size={16} className="text-white" />
                      <span className="text-xs text-white font-bold">預覽</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUploadedFile(file.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 檔案預覽彈窗 */}
          {showFilePreview && selectedFileId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                  <h4 className="font-bold text-gray-900">檔案預覽</h4>
                  <button onClick={() => setShowFilePreview(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
                </div>
                <div className="p-4">
                  <img src={uploadedFiles.find(f => f.id === selectedFileId)?.dataUrl} alt="preview" className="w-full rounded-lg" />
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">辨識結果</div>
                    <div className="font-bold text-gray-900">{uploadedFiles.find(f => f.id === selectedFileId)?.extractedText}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 藥物清單 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-600 uppercase">待分析藥物 ({medications.length}/4)</label>
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
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {m.type === "ocr" ? "📸 相機辨識" : m.type === "file" ? "📁 檔案上傳" : "⌨️ 手動輸入"}
                    </div>
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
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
          {loading ? "AI 深度分析中..." : "開始 AI 深度分析"}
        </button>

        {/* 分析結果 */}
        {analysisResult && (
          <div className={`rounded-xl border-2 space-y-0 animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${colors.bg} ${colors.border}`}>
            {/* 報告頭部 */}
            <div className={`px-6 py-4 border-b ${colors.badge} flex justify-between items-center`}>
              <div>
                <div className="text-xs font-bold text-gray-600 uppercase mb-1">風險評估</div>
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {analysisResult.riskLevel}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setReportMode("simple")} 
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                    reportMode === "simple" 
                      ? "bg-white shadow-sm" 
                      : "bg-white/50 hover:bg-white/75"
                  } ${colors.text}`}
                >
                  簡化版
                </button>
                <button 
                  onClick={() => setReportMode("detail")} 
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                    reportMode === "detail" 
                      ? "bg-white shadow-sm" 
                      : "bg-white/50 hover:bg-white/75"
                  } ${colors.text}`}
                >
                  詳細版
                </button>
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
                    <div key={i} className="p-4 bg-white rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div>
                          <div className="font-bold text-blue-700 text-sm">{d.cn}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{d.original}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${getRiskColor(ageGroup === "infant" ? d.infantRisk : d.riskLevel).badge}`}>
                          {ageGroup === "infant" ? d.infantRisk : d.riskLevel}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700 mb-3">{d.purpose}</div>
                      <div className="flex gap-2">
                        <a 
                          href={d.nhi} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100 transition"
                        >
                          <ExternalLink size={12} /> 健保署
                        </a>
                        <a 
                          href={d.tfda} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded text-xs font-bold hover:bg-green-100 transition"
                        >
                          <BookOpen size={12} /> 食藥署
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {analysisResult.medDetails.map((d: any, i: number) => (
                    <div key={i} className="p-4 bg-white rounded-lg border border-gray-100 space-y-3">
                      {/* 藥物基本資訊 */}
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{d.cn}</div>
                          <div className="text-xs text-gray-500 mt-0.5">英文名：{d.original}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${getRiskColor(ageGroup === "infant" ? d.infantRisk : d.riskLevel).badge}`}>
                          {ageGroup === "infant" ? `嬰兒: ${d.infantRisk}` : `成人: ${d.riskLevel}`}
                        </span>
                      </div>

                      {/* 主要用途 */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-blue-700 font-bold text-xs mb-1">💊 主要用途</div>
                        <div className="text-blue-600 text-xs">{d.purpose}</div>
                      </div>

                      {/* Off-label 用途 */}
                      {d.offLabel && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="text-purple-700 font-bold text-xs mb-1">📋 其他用途 (Off-label)</div>
                          <div className="text-purple-600 text-xs">{d.offLabel}</div>
                        </div>
                      )}

                      {/* 成分與機制 */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-gray-600 font-bold mb-1">主要成分</div>
                          <div className="text-gray-800">{d.ingredient}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-gray-600 font-bold mb-1">藥理機制</div>
                          <div className="text-gray-800">{d.mechanism}</div>
                        </div>
                      </div>

                      {/* 劑量 */}
                      <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                        <div className="text-cyan-700 font-bold text-xs mb-1">⏱️ 建議劑量</div>
                        <div className="text-cyan-600 text-xs">{d.dosage}</div>
                      </div>

                      {/* 風險提示 */}
                      <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="text-red-700 font-bold text-xs mb-1">⚠️ 風險提示</div>
                        <div className="text-red-600 text-xs">{d.risk}</div>
                        {d.reyes && (
                          <div className="text-red-700 font-bold text-xs mt-2">🚨 {d.reyes}</div>
                        )}
                      </div>

                      {/* 藥物交互作用 */}
                      {d.interactions && d.interactions.length > 0 && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <div className="text-orange-700 font-bold text-xs mb-1">🔗 可能的交互作用</div>
                          <div className="text-orange-600 text-xs">{d.interactions.join('、')}</div>
                        </div>
                      )}

                      {/* 權威文獻 */}
                      {d.literature && d.literature.length > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="text-blue-700 font-bold text-xs mb-2">📚 權威文獻</div>
                          <div className="space-y-1">
                            {d.literature.map((lit: any, idx: number) => (
                              <a 
                                key={idx}
                                href={lit.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-start gap-2 text-blue-600 hover:text-blue-800 text-xs transition"
                              >
                                <ExternalLink size={10} className="flex-shrink-0 mt-0.5" />
                                <span className="underline">{lit.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 官方資源連結 */}
                      <div className="flex gap-2">
                        <a 
                          href={d.nhi} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200 transition"
                        >
                          <ExternalLink size={12} /> 健保署
                        </a>
                        <a 
                          href={d.tfda} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200 transition"
                        >
                          <BookOpen size={12} /> 食藥署
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 資料來源 */}
              <div className="pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-600">
                <ShieldCheck size={14} />
                <span>資料來源：衛生福利部中央健康保險署 • 食藥署 • 醫學文獻資料庫</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- 渲染醫療地圖導航頁面 ---
  const renderMedicalMap = () => {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="text-red-600" size={32} /> 
            附近醫療機構
          </h3>
          <p className="text-sm text-gray-600">快速找到附近的診所、藥局與醫院</p>
        </div>

        {/* 篩選按鈕 */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-600 uppercase">篩選機構類型</label>
          <div className="flex gap-2 flex-wrap">
            {(["all", "診所", "藥局", "醫院"] as LocationType[]).map(type => (
              <button 
                key={type}
                onClick={() => setLocationFilter(type)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  locationFilter === type
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-red-400"
                }`}
              >
                {type === "all" ? "全部" : type === "診所" ? "🏥 診所" : type === "藥局" ? "💊 藥局" : "🚑 醫院"}
              </button>
            ))}
          </div>
        </div>

        {/* 醫療機構清單 */}
        <div className="space-y-3">
          {loadingLocations ? (
            <div className="text-center py-8">
              <RefreshCw className="animate-spin mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500">查詢中...</p>
            </div>
          ) : medicalLocations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MapPin className="text-gray-300 mx-auto mb-2" size={32} />
              <p className="text-gray-500">未找到符合條件的機構</p>
            </div>
          ) : (
            medicalLocations.map(location => (
              <div key={location.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{location.name}</div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block mt-1 ${
                      location.type === "診所" ? "bg-blue-100 text-blue-700" :
                      location.type === "藥局" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {location.type === "診所" ? "🏥" : location.type === "藥局" ? "💊" : "🚑"} {location.type}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{location.distance.toFixed(1)} km</div>
                    <div className="text-xs text-gray-500">距離</div>
                  </div>
                </div>

                {/* 地址 */}
                <div className="flex items-start gap-2 mb-2">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">{location.address}</div>
                </div>

                {/* 電話 */}
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <a href={`tel:${location.phone}`} className="text-sm text-blue-600 hover:underline font-bold">
                    {location.phone}
                  </a>
                </div>

                {/* 營業時間 */}
                <div className="flex items-start gap-2 mb-3">
                  <Clock size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">{location.hours}</div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2">
                  <a 
                    href={`tel:${location.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                  >
                    <Phone size={16} /> 撥號
                  </a>
                  <a 
                    href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition"
                  >
                    <Navigation size={16} /> 導航
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
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
            onClick={() => setActiveTab("map")} 
            className="p-6 bg-red-50 rounded-xl border border-red-200 text-left hover:shadow-lg hover:border-red-400 transition group"
          >
            <MapPin className="text-red-600 mb-3 group-hover:scale-110 transition" size={32} />
            <div className="font-bold text-red-900 text-lg">附近醫療機構</div>
            <div className="text-xs text-red-600 mt-2">診所、藥局與醫院導航</div>
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
      case "map":
        return renderMedicalMap();
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
          onClick={() => setActiveTab("map")} 
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition ${
            activeTab === "map" 
              ? "text-red-600 bg-red-50" 
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <MapPin size={24} />
          <span className="text-[10px] mt-1 font-bold">醫療</span>
        </button>
      </div>
    </div>
  );
};
