"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import UsageModal from "@/components/UsageModal";
import OrderModal from "@/components/OrderModal";
import { getStockStatus, getEffectiveUsageStatus, formatDate } from "@/lib/utils";

interface Inventory {
  inOffice: number;
  inUse: number;
}

interface Material {
  id: string;
  name: string;
  qrCode: string;
  totalQuantity: number;
  minQuantity: number;
  unit: string;
  inventory: Inventory | null;
}

interface UsageLog {
  id: string;
  userName: string;
  workshopName: string;
  quantity: number;
  returnDue: string;
  returnedAt: string | null;
  material: { name: string };
}

const STATUS_ICON: Record<string, string> = {
  ok: "✅",
  warning: "⚠️",
  critical: "🔴",
};

const STATUS_COLOR: Record<string, string> = {
  ok: "text-green-700",
  warning: "text-yellow-600 font-semibold",
  critical: "text-red-600 font-bold",
};

export default function Dashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [dueSoon, setDueSoon] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUsage, setShowUsage] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    const [matRes, usageRes] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/usage"),
    ]);
    const mats = await matRes.json();
    const usageLogs: UsageLog[] = await usageRes.json();

    setMaterials(mats);
    setDueSoon(
      usageLogs.filter((log) => {
        const s = getEffectiveUsageStatus(log.returnDue, log.returnedAt);
        return s === "due_soon" || s === "overdue";
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openUsage = (id?: string) => { setSelectedId(id); setShowUsage(true); };
  const openOrder = (id?: string) => { setSelectedId(id); setShowOrder(true); };

  const lowStock = materials.filter(
    (m) => getStockStatus(m.inventory?.inOffice ?? 0, m.minQuantity) !== "ok"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        로딩 중...
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">교보재 재고 현황</h1>
        <div className="flex gap-2">
          <Link
            href="/qr"
            className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            📷 QR 스캔
          </Link>
          <button
            onClick={() => openUsage()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + 사용 등록
          </button>
          <button
            onClick={() => openOrder()}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            + 발주 요청
          </button>
        </div>
      </div>

      {/* 경고 배너 — 재고 부족 */}
      {lowStock.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <span className="text-yellow-500 mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-yellow-800 text-sm">재고 부족 경고</p>
            <p className="text-sm text-yellow-700">
              {lowStock.map((m) => `${m.name} (오피스 ${m.inventory?.inOffice ?? 0}개)`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* 경고 배너 — D-1 / 연체 */}
      {dueSoon.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <span className="text-red-500 mt-0.5">🔔</span>
          <div>
            <p className="font-semibold text-red-800 text-sm">반납 알림</p>
            <div className="space-y-0.5 mt-1">
              {dueSoon.map((log) => {
                const s = getEffectiveUsageStatus(log.returnDue, log.returnedAt);
                return (
                  <p key={log.id} className="text-sm text-red-700">
                    {s === "overdue" ? "🔴 연체" : "⚠️ D-1"} {log.material.name} — {log.userName}{" "}
                    {log.quantity}개 (~{formatDate(log.returnDue)})
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 메인 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left py-3 px-4 font-semibold">교보재명</th>
              <th className="text-center py-3 px-4 font-semibold">총 보유</th>
              <th className="text-center py-3 px-4 font-semibold">오피스 재고</th>
              <th className="text-center py-3 px-4 font-semibold">사용 중</th>
              <th className="text-center py-3 px-4 font-semibold">상태</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {materials.map((m) => {
              const inOffice = m.inventory?.inOffice ?? 0;
              const inUse = m.inventory?.inUse ?? 0;
              const status = getStockStatus(inOffice, m.minQuantity);

              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/material/${m.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {m.name}
                    </Link>
                    <span className="ml-2 text-xs text-gray-400">{m.qrCode}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-gray-600 text-sm">
                    {m.totalQuantity}{m.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-sm ${STATUS_COLOR[status]}`}>
                      {inOffice}{m.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-gray-600 text-sm">
                    {inUse}{m.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center text-lg">
                    {STATUS_ICON[status]}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openUsage(m.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        사용
                      </button>
                      <button
                        onClick={() => openOrder(m.id)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        발주
                      </button>
                      <Link href={`/material/${m.id}`} className="text-xs text-gray-400 hover:text-gray-700">
                        상세 →
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-4 text-sm">
        <Link href="/orders" className="text-gray-400 hover:text-gray-600">발주 이력 →</Link>
        <button onClick={fetchData} className="text-gray-400 hover:text-gray-600">새로고침</button>
      </div>

      {showUsage && (
        <UsageModal
          materials={materials}
          selectedMaterialId={selectedId}
          onClose={() => setShowUsage(false)}
          onSuccess={() => { setShowUsage(false); fetchData(); }}
        />
      )}
      {showOrder && (
        <OrderModal
          materials={materials}
          selectedMaterialId={selectedId}
          onClose={() => setShowOrder(false)}
          onSuccess={() => { setShowOrder(false); }}
        />
      )}
    </div>
  );
}
