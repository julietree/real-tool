import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const materials = await prisma.material.findMany({
    include: { inventory: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(materials);
}
