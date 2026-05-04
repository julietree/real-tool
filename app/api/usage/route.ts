import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.usageLog.findMany({
    where: { returnedAt: null },
    include: { material: true },
    orderBy: { returnDue: "asc" },
  });
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { materialId, userName, workshopName, quantity, startDate, returnDue } = body;

  if (!materialId || !userName || !workshopName || !quantity || !startDate || !returnDue) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요" }, { status: 400 });
  }

  const qty = Number(quantity);

  const inventory = await prisma.inventory.findUnique({ where: { materialId } });
  if (!inventory) return NextResponse.json({ error: "재고 정보를 찾을 수 없습니다" }, { status: 404 });
  if (inventory.inOffice < qty) {
    return NextResponse.json(
      { error: `오피스 재고가 부족합니다. 현재 ${inventory.inOffice}개 가능` },
      { status: 400 }
    );
  }

  const [usageLog] = await prisma.$transaction([
    prisma.usageLog.create({
      data: {
        materialId,
        userName,
        workshopName,
        quantity: qty,
        startDate: new Date(startDate),
        returnDue: new Date(returnDue),
        status: "in_use",
      },
    }),
    prisma.inventory.update({
      where: { materialId },
      data: {
        inOffice: { decrement: qty },
        inUse: { increment: qty },
      },
    }),
  ]);

  return NextResponse.json(usageLog, { status: 201 });
}
