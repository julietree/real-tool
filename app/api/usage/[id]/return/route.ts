import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const usageLog = await prisma.usageLog.findUnique({ where: { id: params.id } });

  if (!usageLog) return NextResponse.json({ error: "사용 이력을 찾을 수 없습니다" }, { status: 404 });
  if (usageLog.returnedAt) return NextResponse.json({ error: "이미 반납 처리된 항목입니다" }, { status: 400 });

  const [updated] = await prisma.$transaction([
    prisma.usageLog.update({
      where: { id: params.id },
      data: { returnedAt: new Date(), status: "returned" },
    }),
    prisma.inventory.update({
      where: { materialId: usageLog.materialId },
      data: {
        inOffice: { increment: usageLog.quantity },
        inUse: { decrement: usageLog.quantity },
      },
    }),
  ]);

  return NextResponse.json(updated);
}
