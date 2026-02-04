import { PrismaClient, SessionName, EquipCategory } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// Configuration
// ============================================

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'password123!';
const ENABLE_TEST_DATA = process.env.SEED_TEST_DATA !== 'false';

// ============================================
// Master Data (Required for production)
// ============================================

async function seedMasterData() {
  console.log('\n=== Seeding Master Data ===\n');

  // Sessions - All instrument/role types
  console.log('Seeding sessions...');
  const sessions: SessionName[] = ['VOCAL', 'GUITAR', 'BASS', 'SYNTH', 'DRUM', 'STRINGS', 'WINDS'];

  for (const name of sessions) {
    await prisma.session.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  Created ${sessions.length} sessions`);

  // Generations - 35th to 42nd generation
  console.log('Seeding generations...');
  const generations = [35, 36, 37, 38, 39, 40, 41, 42];

  for (const order of generations) {
    await prisma.generation.upsert({
      where: { order },
      update: {},
      create: { order },
    });
  }
  console.log(`  Created ${generations.length} generations`);

  console.log('\nMaster data seeding completed.');
}

// ============================================
// Test Data (For development/testing)
// ============================================

async function seedTestData() {
  console.log('\n=== Seeding Test Data ===\n');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Get references
  const sessions = await prisma.session.findMany();
  const generations = await prisma.generation.findMany({ orderBy: { order: 'desc' } });

  const getSession = (name: SessionName) => sessions.find((s) => s.name === name)!;
  const getGeneration = (order: number) => generations.find((g) => g.order === order)!;

  // ============================================
  // Users
  // ============================================
  console.log('Seeding users...');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@skku.edu' },
    update: {},
    create: {
      email: 'admin@skku.edu',
      password: hashedPassword,
      name: '관리자',
      nickname: '아망관리자',
      bio: '아망 동아리 관리자입니다.',
      isAdmin: true,
      generationId: getGeneration(39).id,
      sessions: { connect: [{ id: getSession('VOCAL').id }] },
    },
  });

  // Regular members with various sessions
  const memberData = [
    { email: 'vocal1@skku.edu', name: '김보컬', nickname: '보컬왕', gen: 40, sessions: ['VOCAL'] },
    { email: 'vocal2@skku.edu', name: '이노래', nickname: '음치탈출', gen: 41, sessions: ['VOCAL'] },
    { email: 'guitar1@skku.edu', name: '박기타', nickname: '기타리스트', gen: 40, sessions: ['GUITAR'] },
    { email: 'guitar2@skku.edu', name: '최현악', nickname: '손가락요정', gen: 41, sessions: ['GUITAR'] },
    { email: 'bass1@skku.edu', name: '정베이스', nickname: '베이시스트', gen: 40, sessions: ['BASS'] },
    { email: 'bass2@skku.edu', name: '강저음', nickname: '그루브머신', gen: 42, sessions: ['BASS'] },
    { email: 'drum1@skku.edu', name: '조드럼', nickname: '비트메이커', gen: 39, sessions: ['DRUM'] },
    { email: 'drum2@skku.edu', name: '윤타악', nickname: '리듬장인', gen: 41, sessions: ['DRUM'] },
    { email: 'synth1@skku.edu', name: '한신디', nickname: '건반마스터', gen: 40, sessions: ['SYNTH'] },
    { email: 'synth2@skku.edu', name: '서키보드', nickname: '신스왕', gen: 42, sessions: ['SYNTH'] },
    { email: 'multi1@skku.edu', name: '권멀티', nickname: '만능플레이어', gen: 39, sessions: ['VOCAL', 'GUITAR'] },
    { email: 'multi2@skku.edu', name: '임다재', nickname: '올라운더', gen: 40, sessions: ['BASS', 'SYNTH'] },
  ];

  const users: { [key: string]: { id: number; name: string; nickname: string } } = {
    admin: { id: admin.id, name: admin.name, nickname: admin.nickname },
  };

  for (const data of memberData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        nickname: data.nickname,
        generationId: getGeneration(data.gen).id,
        sessions: {
          connect: data.sessions.map((s) => ({ id: getSession(s as SessionName).id })),
        },
      },
    });
    users[data.email.split('@')[0]] = { id: user.id, name: user.name, nickname: user.nickname };
  }
  console.log(`  Created ${Object.keys(users).length} users`);

  // ============================================
  // Performances
  // ============================================
  console.log('Seeding performances...');

  const performanceData = [
    {
      name: '2025 봄 정기공연',
      description: '아망 2025년 봄 정기공연입니다. 새 학기를 맞아 신입생들의 첫 무대와 함께합니다.',
      location: '성균관대학교 600주년 기념관',
      startAt: new Date('2025-05-15T18:00:00'),
      endAt: new Date('2025-05-15T21:00:00'),
    },
    {
      name: '2025 가을 정기공연',
      description: '아망 2025년 가을 정기공연입니다. 한 학기 동안 갈고닦은 실력을 선보입니다.',
      location: '성균관대학교 600주년 기념관',
      startAt: new Date('2025-11-15T18:00:00'),
      endAt: new Date('2025-11-15T21:00:00'),
    },
    {
      name: '2026 신입생 환영 공연',
      description: '2026년 새로운 신입생들을 환영하는 특별 공연입니다.',
      location: '성균관대학교 새천년홀',
      startAt: new Date('2026-03-20T19:00:00'),
      endAt: new Date('2026-03-20T22:00:00'),
    },
  ];

  const performances: { [key: string]: number } = {};

  for (let i = 0; i < performanceData.length; i++) {
    const perf = await prisma.performance.upsert({
      where: { id: i + 1 },
      update: performanceData[i],
      create: performanceData[i],
    });
    performances[perf.name] = perf.id;
  }
  console.log(`  Created ${Object.keys(performances).length} performances`);

  // ============================================
  // Teams with TeamSessions and Members
  // ============================================
  console.log('Seeding teams...');

  const teamData = [
    {
      performanceKey: '2025 봄 정기공연',
      name: 'Imagine Dragons',
      songName: 'Believer',
      songArtist: 'Imagine Dragons',
      description: '강렬한 록 사운드로 무대를 사로잡을 팀입니다.',
      leaderEmail: 'guitar1',
      isFreshmenFixed: false,
      sessions: [
        { session: 'VOCAL', capacity: 1, members: ['vocal1'] },
        { session: 'GUITAR', capacity: 2, members: ['guitar1', 'guitar2'] },
        { session: 'BASS', capacity: 1, members: ['bass1'] },
        { session: 'DRUM', capacity: 1, members: ['drum1'] },
      ],
    },
    {
      performanceKey: '2025 봄 정기공연',
      name: 'HYUKOH Cover',
      songName: 'Tomboy',
      songArtist: '혁오',
      description: '한국 인디 밴드 혁오의 감성을 담아냅니다.',
      leaderEmail: 'vocal1',
      isFreshmenFixed: true,
      sessions: [
        { session: 'VOCAL', capacity: 1, members: ['vocal2'] },
        { session: 'GUITAR', capacity: 1, members: [] },
        { session: 'BASS', capacity: 1, members: ['bass2'] },
        { session: 'SYNTH', capacity: 1, members: ['synth1'] },
        { session: 'DRUM', capacity: 1, members: ['drum2'] },
      ],
    },
    {
      performanceKey: '2025 가을 정기공연',
      name: 'Queen Tribute',
      songName: 'Bohemian Rhapsody',
      songArtist: 'Queen',
      description: '전설적인 Queen의 명곡을 재해석합니다.',
      leaderEmail: 'vocal1',
      isFreshmenFixed: false,
      sessions: [
        { session: 'VOCAL', capacity: 2, members: ['vocal1', 'vocal2'] },
        { session: 'GUITAR', capacity: 2, members: ['guitar1'] },
        { session: 'BASS', capacity: 1, members: ['bass1'] },
        { session: 'SYNTH', capacity: 1, members: ['synth2'] },
        { session: 'DRUM', capacity: 1, members: ['drum1'] },
      ],
    },
    {
      performanceKey: '2025 가을 정기공연',
      name: '자작곡 팀',
      songName: '새벽 3시',
      songArtist: '아망 자작',
      description: '동아리 부원들이 직접 작곡한 오리지널 곡입니다.',
      leaderEmail: 'multi1',
      isFreshmenFixed: false,
      isSelfMade: true,
      sessions: [
        { session: 'VOCAL', capacity: 1, members: ['multi1'] },
        { session: 'GUITAR', capacity: 1, members: ['guitar2'] },
        { session: 'BASS', capacity: 1, members: ['multi2'] },
        { session: 'SYNTH', capacity: 1, members: ['synth1'] },
        { session: 'DRUM', capacity: 1, members: ['drum2'] },
      ],
    },
  ];

  let teamCount = 0;
  for (const data of teamData) {
    const performanceId = performances[data.performanceKey];
    const leaderId = users[data.leaderEmail].id;

    // Check if team already exists
    const existingTeam = await prisma.team.findFirst({
      where: { name: data.name, performanceId },
    });

    let team;
    if (existingTeam) {
      team = existingTeam;
    } else {
      team = await prisma.team.create({
        data: {
          name: data.name,
          songName: data.songName,
          songArtist: data.songArtist,
          description: data.description,
          isFreshmenFixed: data.isFreshmenFixed,
          isSelfMade: data.isSelfMade || false,
          performanceId,
          leaderId,
        },
      });
      teamCount++;
    }

    // Create team sessions and members
    for (const sessionData of data.sessions) {
      const session = getSession(sessionData.session as SessionName);

      const existingTs = await prisma.teamSession.findUnique({
        where: { teamId_sessionId: { teamId: team.id, sessionId: session.id } },
      });

      let teamSession;
      if (existingTs) {
        teamSession = existingTs;
      } else {
        teamSession = await prisma.teamSession.create({
          data: {
            teamId: team.id,
            sessionId: session.id,
            capacity: sessionData.capacity,
          },
        });
      }

      // Add members
      for (let i = 0; i < sessionData.members.length; i++) {
        const memberKey = sessionData.members[i];
        const userId = users[memberKey].id;

        await prisma.teamMember.upsert({
          where: { teamSessionId_userId: { teamSessionId: teamSession.id, userId } },
          update: {},
          create: {
            teamSessionId: teamSession.id,
            userId,
            index: i + 1,
          },
        });
      }
    }
  }
  console.log(`  Created ${teamCount} teams with sessions and members`);

  // ============================================
  // Equipment
  // ============================================
  console.log('Seeding equipment...');

  const equipmentData: { brand: string; model: string; category: EquipCategory; description: string }[] = [
    // Rooms
    { brand: 'AMANG', model: '동아리방 A', category: 'ROOM', description: '1층 메인 합주실 (드럼, 앰프 상시 구비)' },
    { brand: 'AMANG', model: '동아리방 B', category: 'ROOM', description: '2층 보조 합주실 (어쿠스틱 전용)' },
    { brand: 'AMANG', model: '녹음실', category: 'ROOM', description: '녹음 장비가 구비된 소규모 녹음실' },

    // Microphones
    { brand: 'Shure', model: 'SM58', category: 'MICROPHONE', description: '보컬용 다이나믹 마이크' },
    { brand: 'Shure', model: 'SM57', category: 'MICROPHONE', description: '악기용 다이나믹 마이크' },
    { brand: 'Audio-Technica', model: 'AT2020', category: 'MICROPHONE', description: '콘덴서 마이크 (녹음용)' },

    // Guitars
    { brand: 'Fender', model: 'American Professional II Stratocaster', category: 'GUITAR', description: '일렉 기타 (스트라토캐스터)' },
    { brand: 'Gibson', model: 'Les Paul Standard', category: 'GUITAR', description: '일렉 기타 (레스폴)' },
    { brand: 'Martin', model: 'D-28', category: 'GUITAR', description: '어쿠스틱 기타' },

    // Bass
    { brand: 'Fender', model: 'Jazz Bass', category: 'BASS', description: '재즈 베이스' },
    { brand: 'Music Man', model: 'StingRay', category: 'BASS', description: '스팅레이 베이스' },

    // Drums
    { brand: 'Pearl', model: 'Export Series', category: 'DRUM', description: '풀 드럼 세트' },
    { brand: 'Roland', model: 'TD-17KVX', category: 'DRUM', description: '전자 드럼 세트' },

    // Synthesizers
    { brand: 'Roland', model: 'JUNO-DS61', category: 'SYNTHESIZER', description: '61건반 신디사이저' },
    { brand: 'Korg', model: 'Minilogue XD', category: 'SYNTHESIZER', description: '아날로그 신디사이저' },
    { brand: 'Nord', model: 'Stage 3', category: 'SYNTHESIZER', description: '스테이지 키보드' },

    // Amplifiers
    { brand: 'Fender', model: 'Blues Junior IV', category: 'AMPLIFIER', description: '기타 앰프 (튜브)' },
    { brand: 'Marshall', model: 'JCM800', category: 'AMPLIFIER', description: '기타 앰프 (하이게인)' },
    { brand: 'Ampeg', model: 'BA-115', category: 'AMPLIFIER', description: '베이스 앰프' },

    // Audio Interface
    { brand: 'Focusrite', model: 'Scarlett 18i20', category: 'AUDIO_INTERFACE', description: '멀티 입출력 오디오 인터페이스' },
    { brand: 'Universal Audio', model: 'Apollo Twin X', category: 'AUDIO_INTERFACE', description: '프리미엄 오디오 인터페이스' },

    // Mixer
    { brand: 'Yamaha', model: 'MG16XU', category: 'MIXER', description: '16채널 아날로그 믹서' },
    { brand: 'Allen & Heath', model: 'ZED-14', category: 'MIXER', description: '14채널 믹서' },

    // Cables & Misc
    { brand: 'Mogami', model: '기타 케이블 5m', category: 'CABLE', description: '고급 악기 케이블' },
    { brand: 'Hosa', model: 'XLR 케이블 5m', category: 'CABLE', description: 'XLR 마이크 케이블' },
  ];

  // Clear existing equipment and recreate
  const existingCount = await prisma.equipment.count();
  if (existingCount === 0) {
    for (const equip of equipmentData) {
      await prisma.equipment.create({ data: equip });
    }
    console.log(`  Created ${equipmentData.length} equipment items`);
  } else {
    console.log(`  Equipment already exists (${existingCount} items), skipping`);
  }

  // ============================================
  // Equipment Rentals
  // ============================================
  console.log('Seeding equipment rentals...');

  const equipments = await prisma.equipment.findMany({ where: { category: 'ROOM' } });

  if (equipments.length > 0) {
    const rentalData = [
      {
        title: '정기공연 합주',
        equipmentId: equipments[0].id,
        userIds: [users['guitar1'].id, users['vocal1'].id, users['drum1'].id],
        startAt: new Date('2025-05-10T14:00:00'),
        endAt: new Date('2025-05-10T18:00:00'),
      },
      {
        title: '자작곡 녹음',
        equipmentId: equipments.length > 2 ? equipments[2].id : equipments[0].id,
        userIds: [users['multi1'].id, users['synth1'].id],
        startAt: new Date('2025-05-12T10:00:00'),
        endAt: new Date('2025-05-12T14:00:00'),
      },
    ];

    for (const rental of rentalData) {
      const existingRental = await prisma.equipmentRental.findFirst({
        where: { title: rental.title, equipmentId: rental.equipmentId },
      });

      if (!existingRental) {
        await prisma.equipmentRental.create({
          data: {
            title: rental.title,
            equipmentId: rental.equipmentId,
            startAt: rental.startAt,
            endAt: rental.endAt,
            users: { connect: rental.userIds.map((id) => ({ id })) },
          },
        });
      }
    }
    console.log(`  Created equipment rentals`);
  }

  console.log('\nTest data seeding completed.');
}

// ============================================
// Main Entry Point
// ============================================

async function main() {
  console.log('========================================');
  console.log('       AMANG Database Seeding');
  console.log('========================================');
  console.log(`Default password: ${DEFAULT_PASSWORD}`);
  console.log(`Test data: ${ENABLE_TEST_DATA ? 'ENABLED' : 'DISABLED'}`);

  // Always seed master data
  await seedMasterData();

  // Optionally seed test data
  if (ENABLE_TEST_DATA) {
    await seedTestData();
  }

  console.log('\n========================================');
  console.log('       Seeding Completed!');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
