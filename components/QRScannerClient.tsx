"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function QRScannerClient() {
  const router = useRouter();
  const scannerRef = useRef<unknown>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let scanner: { clear: () => Promise<void> } | null = null;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (!mountedRef.current) return;

      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      ) as { clear: () => Promise<void> };

      (scanner as unknown as { render: (s: (v: string) => void, e: () => void) => void }).render(
        (decodedText: string) => {
          if (!mountedRef.current) return;

          const isUUID = /^[0-9a-f-]{36}$/.test(decodedText);
          if (isUUID) {
            router.push(`/material/${decodedText}`);
            return;
          }

          fetch(`/api/material?qr=${encodeURIComponent(decodedText)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.id) router.push(`/material/${data.id}`);
              else alert("등록되지 않은 QR 코드입니다: " + decodedText);
            })
            .catch(() => alert("QR 코드 조회 중 오류가 발생했습니다"));
        },
        () => {}
      );

      scannerRef.current = scanner;
    });

    return () => {
      mountedRef.current = false;
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [router]);

  return (
    <div>
      <div id="qr-reader" className="w-full" />
      <p className="text-xs text-center text-gray-400 mt-2">
        카메라를 QR 코드에 가까이 대주세요
      </p>
    </div>
  );
}
