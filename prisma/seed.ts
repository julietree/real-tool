import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATERIALS = [
  { name: "워크 모티베이션 카드",  qr: "RW-001", total: 20, min: 5,  inOffice: 20, inUse: 0 },
  { name: "팀 경영루틴 카드",      qr: "RW-002", total: 15, min: 3,  inOffice: 3,  inUse: 12 },
  { name: "조직경영루틴 카드",     qr: "RW-003", total: 10, min: 3,  inOffice: 10, inUse: 0 },
  { name: "팀부스트 카드",         qr: "RW-004", total: 12, min: 3,  inOffice: 8,  inUse: 4 },
  { name: "루트파인더 카드",       qr: "RW-005", total: 10, min: 3,  inOffice: 7,  inUse: 3 },
  { name: "이슈파인더 카드",       qr: "RW-006", total: 10, min: 3,  inOffice: 1,  inUse: 9 },
  { name: "컨텍스트 파인더",       qr: "RW-007", total: 8,  min: 2,  inOffice: 8,  inUse: 0 },
  { name: "컨텍스트 파인더 보드",  qr: "RW-008", total: 5,  min: 1,  inOffice: 5,  inUse: 0 },
  { name: "이슈파인더 보드",       qr: "RW-009", total: 5,  min: 1,  inOffice: 5,  inUse: 0 },
];

async function main() {
  await prisma.order.deleteMany();
  await prisma.usageLog.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.material.deleteMany();

  const ids: Record<string, string> = {};

  for (const m of MATERIALS) {
    const record = await prisma.material.create({
      data: {
        name: m.name,
        qrCode: m.qr,
        totalQuantity: m.total,
        minQuantity: m.min,
        unit: "개",
        inventory: { create: { inOffice: m.inOffice, inUse: m.inUse } },
      },
    });
    ids[m.name] = record.id;
  }

  // 팀 경영루틴 카드 — 2명 사용 중
  await prisma.usageLog.createMany({
    data: [
      {
        materialId: ids["팀 경영루틴 카드"],
        userName: "홍길동",
        workshopName: "팀 빌딩 워크숍",
        quantity: 5,
        startDate: new Date("2026-05-01"),
        returnDue: new Date("2026-05-10"),
        status: "in_use",
      },
      {
        materialId: ids["팀 경영루틴 카드"],
        userName: "김철수",
        workshopName: "리더십 역량 강화 워크숍",
        quantity: 7,
        startDate: new Date("2026-05-02"),
        returnDue: new Date("2026-05-14"),
        status: "in_use",
      },
    ],
  });

  // 팀부스트 카드 — D-1 경고 (내일 반납)
  await prisma.usageLog.create({
    data: {
      materialId: ids["팀부스트 카드"],
      userName: "이민준",
      workshopName: "팀 성과 개선 워크숍",
      quantity: 4,
      startDate: new Date("2026-04-28"),
      returnDue: new Date("2026-05-05"),
      status: "in_use",
    },
  });

  // 루트파인더 카드 — 연체 (반납일 초과)
  await prisma.usageLog.create({
    data: {
      materialId: ids["루트파인더 카드"],
      userName: "최수진",
      workshopName: "원인 분석 워크숍",
      quantity: 3,
      startDate: new Date("2026-04-20"),
      returnDue: new Date("2026-04-30"),
      status: "in_use",
    },
  });

  // 이슈파인더 카드 — 2명 사용 중 (재고 1개만 남음)
  await prisma.usageLog.createMany({
    data: [
      {
        materialId: ids["이슈파인더 카드"],
        userName: "박지은",
        workshopName: "문제 해결 워크숍",
        quantity: 4,
        startDate: new Date("2026-05-03"),
        returnDue: new Date("2026-05-20"),
        status: "in_use",
      },
      {
        materialId: ids["이슈파인더 카드"],
        userName: "정하준",
        workshopName: "이슈 관리 심화 과정",
        quantity: 5,
        startDate: new Date("2026-05-04"),
        returnDue: new Date("2026-05-18"),
        status: "in_use",
      },
    ],
  });

  // 샘플 발주 이력
  await prisma.order.create({
    data: {
      materialId: ids["팀 경영루틴 카드"],
      requester: "김담당",
      quantity: 10,
      useDate: new Date("2026-06-01"),
      note: "기업 로고 추가 필요",
      status: "requested",
    },
  });

  console.log("✅ 시드 데이터 생성 완료");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
