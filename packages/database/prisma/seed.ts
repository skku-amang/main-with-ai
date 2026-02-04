import { PrismaClient, SessionName, EquipCategory } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedSessions() {
  console.log('Seeding sessions...');
  const sessions: SessionName[] = ['VOCAL', 'GUITAR', 'BASS', 'SYNTH', 'DRUM', 'STRINGS', 'WINDS'];

  for (const name of sessions) {
    await prisma.session.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Sessions seeded.');
}

async function seedGenerations() {
  console.log('Seeding generations...');
  const generations = [39, 40, 41];

  for (const order of generations) {
    await prisma.generation.upsert({
      where: { order },
      update: {},
      create: { order },
    });
  }
  console.log('Generations seeded.');
}

async function seedUsers() {
  console.log('Seeding users...');
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'admin1234!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const vocalSession = await prisma.session.findUnique({ where: { name: 'VOCAL' } });
  const guitarSession = await prisma.session.findUnique({ where: { name: 'GUITAR' } });
  const bassSession = await prisma.session.findUnique({ where: { name: 'BASS' } });
  const drumSession = await prisma.session.findUnique({ where: { name: 'DRUM' } });

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: '관리자',
      nickname: 'admin',
      isAdmin: true,
      generationId: 1,
      sessions: {
        connect: vocalSession ? [{ id: vocalSession.id }] : [],
      },
    },
  });

  // Regular users
  const users = [
    { email: 'user1@example.com', name: '홍길동', nickname: 'user1', generationId: 2, sessionId: guitarSession?.id },
    { email: 'user2@example.com', name: '김철수', nickname: 'user2', generationId: 2, sessionId: bassSession?.id },
    { email: 'user3@example.com', name: '이영희', nickname: 'user3', generationId: 3, sessionId: drumSession?.id },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
        nickname: user.nickname,
        generationId: user.generationId,
        sessions: {
          connect: user.sessionId ? [{ id: user.sessionId }] : [],
        },
      },
    });
  }
  console.log('Users seeded.');
}

async function seedPerformances() {
  console.log('Seeding performances...');
  const performances = [
    {
      name: '2025 봄 정기공연',
      description: '아망 2025년 봄 정기공연입니다.',
      location: '성균관대학교 600주년 기념관',
      startAt: new Date('2025-05-15T18:00:00'),
      endAt: new Date('2025-05-15T21:00:00'),
    },
    {
      name: '2025 가을 정기공연',
      description: '아망 2025년 가을 정기공연입니다.',
      location: '성균관대학교 600주년 기념관',
      startAt: new Date('2025-11-15T18:00:00'),
      endAt: new Date('2025-11-15T21:00:00'),
    },
  ];

  for (const perf of performances) {
    await prisma.performance.upsert({
      where: { id: performances.indexOf(perf) + 1 },
      update: {},
      create: perf,
    });
  }
  console.log('Performances seeded.');
}

async function seedEquipments() {
  console.log('Seeding equipments...');
  const equipments = [
    { brand: 'AMANG', model: '동아리방 A', category: 'ROOM' as EquipCategory, description: '1층 합주실' },
    { brand: 'AMANG', model: '동아리방 B', category: 'ROOM' as EquipCategory, description: '2층 합주실' },
    { brand: 'Shure', model: 'SM58', category: 'MICROPHONE' as EquipCategory, description: '보컬용 다이나믹 마이크' },
    { brand: 'Fender', model: 'American Professional II', category: 'GUITAR' as EquipCategory, description: '일렉 기타' },
  ];

  for (const equip of equipments) {
    await prisma.equipment.create({
      data: equip,
    });
  }
  console.log('Equipments seeded.');
}

async function main() {
  console.log('Starting seed...');

  await seedSessions();
  await seedGenerations();
  await seedUsers();
  await seedPerformances();
  await seedEquipments();

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
