import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const qr = request.nextUrl.searchParams.get("qr");
  if (!qr) return NextResponse.json({ error: "qr 파라미터가 필요합니다" }, { status: 400 });

  const material = await prisma.material.findUnique({ where: { qrCode: qr } });
  if (!material) return NextResponse.json({ error: "교보재를 찾을 수 없습니다" }, { status: 404 });

  return NextResponse.json({ id: material.id });
}
