"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const QRScannerClient = dynamic(() => import("@/components/QRScannerClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      카메라 로딩 중...
    </div>
  ),
});

export default function QRPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");

  const handleManualLookup = async () => {
    const code = manualCode.trim();
    if (!code) return;

    setError("");
    try {
      const res = await fetch(`/api/material?qr=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.id) {
        router.push(`/material/${data.id}`);
      } else {
        setError("해당 QR 코드에 대한 교보재를 찾을 수 없습니다.");
      }
    } catch {
      setError("조회 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <h1 className="text-xl font-bold text-gray-900">QR 코드 스캔</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <p className="text-sm text-gray-500 mb-3 text-center">
          교보재에 부착된 QR 코드를 카메라에 비춰주세요
        </p>
        <QRScannerClient />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">QR 코드 직접 입력</p>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
            placeholder="예: RW-001"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleManualLookup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium"
          >
            조회
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">빠른 접근</p>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => `RW-${String(i + 1).padStart(3, "0")}`).map(
              (code) => (
                <button
                  key={code}
                  onClick={() => { setManualCode(code); setError(""); }}
                  className="text-xs py-1.5 px-2 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                >
                  {code}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
