import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { material: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { materialId, requester, quantity, useDate, note } = body;

  if (!materialId || !requester || !quantity || !useDate) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      materialId,
      requester,
      quantity: Number(quantity),
      useDate: new Date(useDate),
      note: note || null,
      status: "requested",
    },
    include: { material: { select: { name: true } } },
  });

  return NextResponse.json(order, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) return NextResponse.json({ error: "id와 status가 필요합니다" }, { status: 400 });

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { material: { select: { name: true } } },
  });

  return NextResponse.json(order);
}
