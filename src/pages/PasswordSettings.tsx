import React, { useState } from "react";
import { PasswordInput } from "../components/PasswordInput";
import { Lock, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export const PasswordSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"change" | "reset">("change");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [changeData, setChangeData] = useState({ current: "", new: "", confirm: "" });
  const [resetData, setResetData] = useState({ email: "", code: "", new: "", confirm: "" });
  const [step, setStep] = useState(1);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changeData.new !== changeData.confirm) {
      setMessage({ type: "error", text: "新密碼與確認密碼不一致" });
      return;
    }
    setLoading(true);
    // 這裡應調用後端 API
    setTimeout(() => {
      setMessage({ type: "success", text: "密碼修改成功！" });
      setLoading(false);
      setChangeData({ current: "", new: "", confirm: "" });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!resetData.email) return;
    setLoading(true);
    // 這裡應調用後端 API 發送驗證碼
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
    // 這裡應調用後端 API 重設密碼
    setTimeout(() => {
      setMessage({ type: "success", text: "密碼重設成功，請重新登入" });
      setLoading(false);
      setStep(1);
      setResetData({ email: "", code: "", new: "", confirm: "" });
    }, 1000);
  };

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
