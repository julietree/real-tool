"use client";

import { useState } from "react";
import { formatFullDate } from "@/lib/utils";

interface Material {
  id: string;
  name: string;
  inventory: { inOffice: number } | null;
}

interface Props {
  materials: Material[];
  selectedMaterialId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UsageModal({ materials, selectedMaterialId, onClose, onSuccess }: Props) {
  const today = formatFullDate(new Date());
  const [form, setForm] = useState({
    materialId: selectedMaterialId || materials[0]?.id || "",
    userName: "",
    workshopName: "",
    quantity: "1",
    startDate: today,
    returnDue: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedMaterial = materials.find((m) => m.id === form.materialId);
  const maxQty = selectedMaterial?.inventory?.inOffice ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (Number(form.quantity) > maxQty) {
      setError(`오피스 재고가 부족합니다. 현재 ${maxQty}개 가능`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "오류가 발생했습니다"); return; }
      onSuccess();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">사용 등록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">교보재</label>
            <select
              value={form.materialId}
              onChange={(e) => setForm({ ...form, materialId: e.target.value, quantity: "1" })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (오피스 {m.inventory?.inOffice ?? 0}개)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사용자명</label>
              <input
                type="text"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="홍길동"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수량 <span className="text-gray-400">(최대 {maxQty})</span>
              </label>
              <input
                type="number"
                min="1"
                max={maxQty}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">워크숍명</label>
            <input
              type="text"
              value={form.workshopName}
              onChange={(e) => setForm({ ...form, workshopName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="팀 빌딩 워크숍"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사용 시작일</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반납 예정일</label>
              <input
                type="date"
                value={form.returnDue}
                min={form.startDate}
                onChange={(e) => setForm({ ...form, returnDue: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || maxQty === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? "처리 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
