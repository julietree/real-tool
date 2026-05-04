"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import OrderModal from "@/components/OrderModal";
import { formatDate } from "@/lib/utils";

interface Order {
  id: string;
  requester: string;
  quantity: number;
  useDate: string;
  note: string | null;
  status: string;
  createdAt: string;
  material: { name: string };
}

interface Material {
  id: string;
  name: string;
  inventory: { inOffice: number } | null;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  requested: { label: "요청됨",   cls: "bg-yellow-100 text-yellow-700" },
  approved:  { label: "승인됨",   cls: "bg-blue-100 text-blue-700" },
  delivered: { label: "입고 완료", cls: "bg-green-100 text-green-700" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const [oRes, mRes] = await Promise.all([fetch("/api/orders"), fetch("/api/materials")]);
    setOrders(await oRes.json());
    setMaterials(await mRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await fetchOrders();
    setUpdatingId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">발주 이력</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          + 발주 요청
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          발주 이력이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                <th className="text-left py-3 px-4 font-semibold">교보재</th>
                <th className="text-center py-3 px-4 font-semibold">수량</th>
                <th className="text-center py-3 px-4 font-semibold">사용 예정일</th>
                <th className="text-left py-3 px-4 font-semibold">요청자</th>
                <th className="text-left py-3 px-4 font-semibold">특이사항</th>
                <th className="text-center py-3 px-4 font-semibold">상태</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.requested;
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900 text-sm">
                      {order.material.name}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {order.quantity}개
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {formatDate(order.useDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{order.requester}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 max-w-[180px] truncate">
                      {order.note || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 justify-end">
                        {order.status === "requested" && (
                          <button
                            onClick={() => updateStatus(order.id, "approved")}
                            disabled={updatingId === order.id}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
                          >
                            승인
                          </button>
                        )}
                        {order.status === "approved" && (
                          <button
                            onClick={() => updateStatus(order.id, "delivered")}
                            disabled={updatingId === order.id}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                          >
                            입고 완료
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <OrderModal
          materials={materials}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchOrders(); }}
        />
      )}
    </div>
  );
}
