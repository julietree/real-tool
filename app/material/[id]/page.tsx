"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import UsageModal from "@/components/UsageModal";
import ReturnModal from "@/components/ReturnModal";
import OrderModal from "@/components/OrderModal";
import { getStockStatus, getEffectiveUsageStatus, formatDate } from "@/lib/utils";

interface Inventory {
  inOffice: number;
  inUse: number;
  updatedAt: string;
}

interface UsageLog {
  id: string;
  userName: string;
  workshopName: string;
  quantity: number;
  startDate: string;
  returnDue: string;
  returnedAt: string | null;
  status: string;
}

interface Material {
  id: string;
  name: string;
  qrCode: string;
  totalQuantity: number;
  minQuantity: number;
  unit: string;
  note: string | null;
  inventory: Inventory | null;
  usageLogs: UsageLog[];
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  in_use:   { label: "사용 중",  cls: "bg-blue-100 text-blue-700" },
  due_soon: { label: "D-1 반납", cls: "bg-yellow-100 text-yellow-700" },
  overdue:  { label: "연체",     cls: "bg-red-100 text-red-700" },
};

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<Material | null>(null);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");
  const [showUsage, setShowUsage] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showOrder, setShowOrder] = useState(false);

  const fetchMaterial = useCallback(async () => {
    const [matRes, allRes] = await Promise.all([
      fetch(`/api/material/${id}`),
      fetch("/api/materials"),
    ]);
    if (matRes.ok) setMaterial(await matRes.json());
    if (allRes.ok) setAllMaterials(await allRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchMaterial(); }, [fetchMaterial]);

  useEffect(() => {
    if (!material) return;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(material.qrCode, { width: 180, margin: 1 }).then(setQrUrl);
    });
  }, [material]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>;
  }
  if (!material) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">교보재를 찾을 수 없습니다.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">← 대시보드</Link>
      </div>
    );
  }

  const inOffice = material.inventory?.inOffice ?? 0;
  const inUse = material.inventory?.inUse ?? 0;
  const status = getStockStatus(inOffice, material.minQuantity);
  const activeUsage = material.usageLogs.filter((log) => !log.returnedAt);

  const statusConfig = {
    ok:       { icon: "🟢", label: "정상", barCls: "bg-green-500" },
    warning:  { icon: "⚠️", label: "부족 주의", barCls: "bg-yellow-500" },
    critical: { icon: "🔴", label: "긴급 발주 필요", barCls: "bg-red-500" },
  }[status];

  return (
    <div className="max-w-2xl mx-auto">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">대시보드</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{material.name}</span>
      </div>

      {/* 메인 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className={`h-1.5 ${statusConfig.barCls}`} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{material.name}</h1>
              <p className="text-sm text-gray-400 mt-1">
                {statusConfig.icon} {statusConfig.label} · 최소 보유 기준 {material.minQuantity}{material.unit}
              </p>
            </div>
            {qrUrl && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <img src={qrUrl} alt="QR 코드" className="w-20 h-20" />
                <span className="text-xs text-gray-400">{material.qrCode}</span>
              </div>
            )}
          </div>

          {/* 재고 현황 */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">총 보유</p>
              <p className="text-2xl font-bold text-gray-900">{material.totalQuantity}</p>
              <p className="text-xs text-gray-400">{material.unit}</p>
            </div>
            <div className={`rounded-lg p-4 text-center ${
              status === "critical" ? "bg-red-50" : status === "warning" ? "bg-yellow-50" : "bg-green-50"
            }`}>
              <p className="text-xs text-gray-500 mb-1">오피스 재고</p>
              <p className={`text-2xl font-bold ${
                status === "critical" ? "text-red-600" : status === "warning" ? "text-yellow-600" : "text-green-700"
              }`}>{inOffice}</p>
              <p className="text-xs text-gray-400">{material.unit}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">사용 중</p>
              <p className="text-2xl font-bold text-blue-700">{inUse}</p>
              <p className="text-xs text-gray-400">{material.unit}</p>
            </div>
          </div>
        </div>

        {/* 사용 현황 */}
        <div className="border-t border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            현재 사용 현황 ({activeUsage.length}건)
          </h2>
          {activeUsage.length === 0 ? (
            <p className="text-sm text-gray-400">현재 사용 중인 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {activeUsage.map((log) => {
                const s = getEffectiveUsageStatus(log.returnDue, log.returnedAt);
                const badge = STATUS_BADGE[s] ?? STATUS_BADGE.in_use;
                return (
                  <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 min-w-[4rem]">{log.userName}</span>
                      <span className="text-gray-500">{log.quantity}{material.unit}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-500">~{formatDate(log.returnDue)}까지</span>
                      <span className="text-gray-400 hidden sm:inline">{log.workshopName}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex gap-2">
          <button
            onClick={() => setShowUsage(true)}
            disabled={inOffice === 0}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            사용 등록하기
          </button>
          <button
            onClick={() => setShowReturn(true)}
            disabled={activeUsage.length === 0}
            className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            반납 처리하기
          </button>
          <button
            onClick={() => setShowOrder(true)}
            className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            발주 요청하기
          </button>
        </div>
      </div>

      {material.note && (
        <p className="mt-3 text-sm text-gray-500 bg-white rounded-lg border border-gray-200 px-4 py-3">
          📝 {material.note}
        </p>
      )}

      {showUsage && (
        <UsageModal
          materials={allMaterials}
          selectedMaterialId={material.id}
          onClose={() => setShowUsage(false)}
          onSuccess={() => { setShowUsage(false); fetchMaterial(); }}
        />
      )}
      {showReturn && (
        <ReturnModal
          materialName={material.name}
          usageLogs={activeUsage}
          onClose={() => setShowReturn(false)}
          onSuccess={() => { setShowReturn(false); fetchMaterial(); }}
        />
      )}
      {showOrder && (
        <OrderModal
          materials={allMaterials}
          selectedMaterialId={material.id}
          onClose={() => setShowOrder(false)}
          onSuccess={() => setShowOrder(false)}
        />
      )}
    </div>
  );
}
