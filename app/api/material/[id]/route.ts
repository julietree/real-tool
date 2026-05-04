import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const material = await prisma.material.findUnique({
    where: { id: params.id },
    include: {
      inventory: true,
      usageLogs: {
        where: { returnedAt: null },
        orderBy: { returnDue: "asc" },
      },
    },
  });

  if (!material) return NextResponse.json({ error: "교보재를 찾을 수 없습니다" }, { status: 404 });

  return NextResponse.json(material);
}
