"use client";

import { useState } from "react";
import { formatDate, getEffectiveUsageStatus } from "@/lib/utils";

interface UsageLog {
  id: string;
  userName: string;
  workshopName: string;
  quantity: number;
  startDate: string;
  returnDue: string;
  returnedAt: string | null;
}

interface Props {
  materialName: string;
  usageLogs: UsageLog[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnModal({ materialName, usageLogs, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const activeUsage = usageLogs.filter((log) => !log.returnedAt);

  const handleReturn = async (usageId: string) => {
    setLoading(usageId);
    setError("");
    try {
      const res = await fetch(`/api/usage/${usageId}/return`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "오류가 발생했습니다"); return; }
      onSuccess();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(null);
    }
  };

  const statusLabel = (log: UsageLog) => {
    const s = getEffectiveUsageStatus(log.returnDue, log.returnedAt);
    if (s === "overdue") return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">연체</span>;
    if (s === "due_soon") return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">D-1</span>;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">반납 처리 — {materialName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-5">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3 mb-4">{error}</p>}

          {activeUsage.length === 0 ? (
            <p className="text-center text-gray-500 py-8">현재 사용 중인 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {activeUsage.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{log.userName}</span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-700">{log.quantity}개</span>
                      {statusLabel(log)}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {log.workshopName} · ~{formatDate(log.returnDue)}까지
                    </div>
                  </div>
                  <button
                    onClick={() => handleReturn(log.id)}
                    disabled={loading === log.id}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
                  >
                    {loading === log.id ? "처리 중..." : "반납 완료"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
