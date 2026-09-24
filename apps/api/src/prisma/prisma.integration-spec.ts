import { Test } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaService (integración, Postgres real)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('conecta y consulta el schema aplicado', async () => {
    const resultado = await prisma.$queryRaw<
      Array<{ ok: number }>
    >`SELECT 1 AS ok`;
    expect(resultado[0].ok).toBe(1);
  });

  it('detecta las tablas de la migración init', async () => {
    const tablas = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    const nombres = tablas.map((t) => t.tablename);
    expect(nombres).toEqual(
      expect.arrayContaining([
        'users',
        'parcels',
        'zones',
        'devices',
        'readings',
        'irrigation_events',
        'pest_detections',
        'pest_treatments',
        'notifications',
      ]),
    );
  });
});
