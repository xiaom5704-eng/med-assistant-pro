import React, { useState, useEffect, useRef } from "react";
import { 
  Pill, LayoutDashboard, LogOut, Activity, Baby, History, Send, Camera, 
  Plus, Trash2, AlertTriangle, Check, RefreshCw, MessageCircle, User, LogIn, UserPlus, X, FileText, Search, Info, ChevronRight, ChevronDown, ExternalLink, ShieldCheck, Eye, Download, BookOpen, AlertCircle, MapPin, Phone, Clock, Navigation, Upload
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// --- 類型定義 ---
type Tab = "dashboard" | "symptom" | "scan" | "baby" | "map";
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

  // --- 症狀查藥狀態 ---
  const [symptomInput, setSymptomInput] = useState("");
  const [symptomResult, setSymptomResult] = useState<any>(null);

  // --- 藥盒掃描狀態 ---
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
  const [medications, setMedications] = useState<Medication[]>([]);
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

  // --- 症狀查藥邏輯 ---
  const runSymptomSearch = async () => {
    if (!symptomInput.trim()) return;
    setLoading(true);
    try {
      // 這裡模擬 API 調用，實際可擴展後端
      const response = await fetch('/api/analyze-medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications: [symptomInput], ageGroup: "adult" })
      });
      if (response.ok) {
        const data = await response.json();
        setSymptomResult(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        alert(`分析失敗 (${response.status}): ${errorData.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- 藥盒分析邏輯 ---
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
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        alert(`分析失敗 (${response.status}): ${errorData.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error(error);
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
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'map') {
      fetchMedicalLocations();
    }
  }, [activeTab, locationFilter]);

  // --- 嬰兒用藥邏輯 ---
  const addBabyAdvice = () => {
    if (!newBaby.symptom || !newBaby.med) return;
    setBabyAdvices([...babyAdvices, { ...newBaby, id: Date.now().toString() }]);
    setNewBaby({ symptom: "", med: "", dosage: "", warning: "" });
    setShowAddBaby(false);
  };

  const deleteBabyAdvice = (id: string) => {
    setBabyAdvices(babyAdvices.filter(a => a.id !== id));
  };

  // --- 渲染症狀查藥頁面 ---
  const renderSymptomSearch = () => {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-bold flex items-center gap-3">
            <Search className="text-blue-600" size={32} /> 
            症狀查藥
          </h3>
          <p className="text-sm text-gray-600">輸入您的症狀，AI 為您推薦合適的藥物與建議</p>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 border border-gray-200 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
            placeholder="例如：頭痛、發燒、流鼻水..." 
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && runSymptomSearch()}
          />
          <button 
            onClick={runSymptomSearch} 
            disabled={!symptomInput.trim() || loading}
            className="px-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 font-bold"
          >
            {loading ? <RefreshCw className="animate-spin" size={24} /> : "查詢"}
          </button>
        </div>

        {symptomResult && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info size={20} className="text-blue-600" /> 查詢結果
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-sm font-bold text-blue-800 mb-1">建議用藥方向</div>
                <div className="text-gray-700">{symptomResult.summary}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {symptomResult.medDetails.map((med: any, idx: number) => (
                  <div key={idx} className="p-4 border border-gray-100 rounded-lg">
                    <div className="font-bold text-gray-900">{med.cn}</div>
                    <div className="text-xs text-gray-500 mt-1">{med.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- 渲染藥盒掃描頁面 ---
  const renderScanAnalysis = () => {
    const colors = analysisResult ? getRiskColor(analysisResult.riskLevel) : {};
    
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-bold flex items-center gap-3">
            <Camera className="text-blue-600" size={32} /> 
            藥盒掃描分析
          </h3>
          <p className="text-sm text-gray-600">拍照或上傳藥盒照片，AI 自動辨識成分與風險</p>
        </div>

        {/* 選擇方式 */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={startCamera} 
            className={`flex flex-col items-center justify-center p-8 border-2 rounded-xl transition ${showCamera ? 'border-blue-600 bg-blue-50' : 'border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}
          >
            <Camera className={showCamera ? 'text-blue-600 mb-2' : 'text-gray-400 mb-2'} size={40} />
            <span className="font-bold text-gray-700">拍照辨識</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <Upload className="text-gray-400 mb-2" size={40} />
            <span className="font-bold text-gray-700">上傳照片</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
        </div>

        {showCamera && (
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
              <button onClick={takePhoto} className="p-5 bg-white rounded-full shadow-xl text-blue-600 hover:scale-110 transition active:scale-95"><Camera size={32} /></button>
              <button onClick={stopCamera} className="p-5 bg-red-600 rounded-full shadow-xl text-white hover:scale-110 transition active:scale-95"><X size={32} /></button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* 已上傳/辨識清單 */}
        {medications.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 uppercase">待分析藥物 ({medications.length})</label>
              <button onClick={() => {setMedications([]); setAnalysisResult(null);}} className="text-xs text-red-500 font-bold">清空</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {medications.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <Pill size={20} className="text-blue-600" />
                    <span className="font-bold text-gray-800">{m.name}</span>
                  </div>
                  <button onClick={() => removeMedication(m.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            <button 
              onClick={runAnalysis} 
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2 text-lg"
            >
              {loading ? <RefreshCw className="animate-spin" size={24} /> : <Activity size={24} />}
              {loading ? "分析中..." : "開始深度分析"}
            </button>
          </div>
        )}

        {/* 分析結果 */}
        {analysisResult && (
          <div className={`rounded-xl border-2 overflow-hidden ${colors.bg} ${colors.border} animate-in fade-in slide-in-from-bottom-4`}>
            <div className={`px-6 py-4 border-b ${colors.badge} flex justify-between items-center`}>
              <div>
                <div className="text-xs font-bold opacity-70 uppercase mb-1">風險評估</div>
                <div className={`text-2xl font-bold ${colors.text}`}>{analysisResult.riskLevel}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold opacity-70 uppercase mb-1">分析狀態</div>
                <div className="text-sm font-bold">完成</div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <AlertTriangle className={colors.text} size={24} />
                <p className="text-gray-800 font-medium leading-relaxed">{analysisResult.summary}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- 渲染醫療地圖頁面 ---
  const renderMedicalMap = () => {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold flex items-center gap-3">
              <MapPin className="text-red-600" size={32} /> 
              附近醫療機構
            </h3>
            <p className="text-sm text-gray-600">快速尋找您附近的診所、藥局與醫院</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(["all", "診所", "藥局", "醫院"] as LocationType[]).map(t => (
            <button 
              key={t} 
              onClick={() => setLocationFilter(t)}
              className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                locationFilter === t 
                  ? "bg-red-600 text-white shadow-md" 
                  : "bg-white text-gray-600 border border-gray-200 hover:border-red-300"
              }`}
            >
              {t === "all" ? "全部" : t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingLocations ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl"></div>
            ))
          ) : (
            medicalLocations.map(loc => (
              <div key={loc.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition group">
                <div className="flex justify-between items-start mb-3">
                  <div className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase tracking-wider">
                    {loc.type}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-bold">
                    <Navigation size={12} /> {loc.distance}km
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-red-600 transition">{loc.name}</h4>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><MapPin size={14} /> {loc.address}</div>
                  <div className="flex items-center gap-2"><Phone size={14} /> {loc.phone}</div>
                  <div className="flex items-center gap-2"><Clock size={14} /> {loc.hours}</div>
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
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold flex items-center gap-3">
              <Baby className="text-pink-600" size={32} /> 
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <button 
            onClick={() => setActiveTab("symptom")} 
            className="p-8 bg-blue-50 rounded-2xl border border-blue-200 text-left hover:shadow-xl hover:border-blue-400 transition group"
          >
            <Search className="text-blue-600 mb-4 group-hover:scale-110 transition" size={40} />
            <div className="font-bold text-blue-900 text-xl">症狀查藥</div>
            <div className="text-sm text-blue-600 mt-2">輸入症狀，獲取專業用藥建議</div>
          </button>

          <button 
            onClick={() => setActiveTab("scan")} 
            className="p-8 bg-indigo-50 rounded-2xl border border-indigo-200 text-left hover:shadow-xl hover:border-indigo-400 transition group"
          >
            <Camera className="text-indigo-600 mb-4 group-hover:scale-110 transition" size={40} />
            <div className="font-bold text-indigo-900 text-xl">藥盒掃描分析</div>
            <div className="text-sm text-indigo-600 mt-2">拍照或上傳，自動辨識藥物成分</div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setActiveTab("baby")} 
            className="p-8 bg-pink-50 rounded-2xl border border-pink-200 text-left hover:shadow-xl hover:border-pink-400 transition group"
          >
            <Baby className="text-pink-600 mb-4 group-hover:scale-110 transition" size={40} />
            <div className="font-bold text-pink-900 text-xl">嬰兒用藥安全</div>
            <div className="text-sm text-pink-600 mt-2">專屬劑量與禁忌提醒</div>
          </button>

          <button 
            onClick={() => setActiveTab("map")} 
            className="p-8 bg-red-50 rounded-2xl border border-red-200 text-left hover:shadow-xl hover:border-red-400 transition group"
          >
            <MapPin className="text-red-600 mb-4 group-hover:scale-110 transition" size={40} />
            <div className="font-bold text-red-900 text-xl">附近醫療機構</div>
            <div className="text-sm text-red-600 mt-2">診所、藥局與醫院導航</div>
          </button>
        </div>
      </div>
    );
  };

  // --- 主渲染邏輯 ---
  const renderContent = () => {
    switch (activeTab) {
      case "symptom":
        return renderSymptomSearch();
      case "scan":
        return renderScanAnalysis();
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
          onClick={() => setActiveTab("symptom")} 
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition ${
            activeTab === "symptom" 
              ? "text-blue-600 bg-blue-50" 
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Search size={24} />
          <span className="text-[10px] mt-1 font-bold">查藥</span>
        </button>
        <button 
          onClick={() => setActiveTab("scan")} 
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition ${
            activeTab === "scan" 
              ? "text-blue-600 bg-blue-50" 
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Camera size={24} />
          <span className="text-[10px] mt-1 font-bold">掃描</span>
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
