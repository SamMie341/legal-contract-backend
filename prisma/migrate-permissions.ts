import { PrismaClient, UserRole, SystemModule } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

// Read .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?(.*?)["']?(\r?\n|$)/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function normalizeLaoText(text?: string | null): string {
    if (!text) return '';
    return text
        .normalize('NFC')
        .replace(/[\u0eb2][\u0ecd]|[\u0ecd][\u0eb2]/g, '\u0eb3')
        .replace(/\s+/g, ' ')
        .trim();
}

function isPowerContractDivision(division?: string | null): boolean {
    if (!division) return false;
    const normalized = normalizeLaoText(division);
    return (
        normalized.includes('ຊື້-ຂາຍໄຟ') ||
        normalized.includes('ຊື້ຂາຍໄຟ') ||
        (normalized.includes('ສັນຍາ') && (normalized.includes('ໄຟ') || normalized.includes('ໄຟຟ້າ')))
    );
}

function isGeneralContractDivision(division?: string | null): boolean {
    if (!division) return false;
    if (isPowerContractDivision(division)) return false;
    const normalized = normalizeLaoText(division);
    return normalized.includes('ສັນຍາ') || normalized.includes('ທົ່ວໄປ');
}

function isLegalAndDisputeDivision(division?: string | null): boolean {
    if (!division) return false;
    const normalized = normalizeLaoText(division);
    return (
        normalized.includes('ນິຕິກຳ') ||
        normalized.includes('ນິຕິກໍາ') ||
        normalized.includes('ຂັດແຍ່ງ') ||
        normalized.includes('ຄະດີ')
    );
}

async function migratePermissions() {
    console.log('--- Starting User Module Permissions Migration ---');

    const users = await prisma.user.findMany({
        where: { deletedAt: null },
    });

    console.log(`Found ${users.length} active users to migrate.`);

    let createdCount = 0;

    for (const user of users) {
        const modulesToAssign: SystemModule[] = [];

        if (user.role === UserRole.ADMIN || user.role === UserRole.DEPARTMENT_HEAD) {
            modulesToAssign.push(
                SystemModule.CONTRACTS,
                SystemModule.POWER_CONTRACTS,
                SystemModule.LEGAL_DOCUMENTS,
                SystemModule.LEGAL_CASES,
            );
        } else {
            if (isGeneralContractDivision(user.division)) {
                modulesToAssign.push(SystemModule.CONTRACTS);
            }
            if (isPowerContractDivision(user.division)) {
                modulesToAssign.push(SystemModule.POWER_CONTRACTS);
            }
            if (isLegalAndDisputeDivision(user.division)) {
                modulesToAssign.push(SystemModule.LEGAL_DOCUMENTS, SystemModule.LEGAL_CASES);
            }
        }

        for (const module of modulesToAssign) {
            const isDeptHead = user.role === UserRole.DEPARTMENT_HEAD;
            const isAdmin = user.role === UserRole.ADMIN;

            const canView = isAdmin || isDeptHead || user.canView !== false;
            const canUpload = isAdmin || (!isDeptHead && (user.role === UserRole.MAIN_USER || user.role === UserRole.DIVISION_HEAD || user.canUpload === true));
            const canEdit = isAdmin || (!isDeptHead && (user.role === UserRole.MAIN_USER || user.role === UserRole.DIVISION_HEAD || user.canEdit === true));
            const canDelete = isAdmin || (!isDeptHead && (user.role === UserRole.MAIN_USER || user.role === UserRole.DIVISION_HEAD || user.canDelete === true));
            const canDownload = isAdmin || isDeptHead || user.canDownload === true;

            await prisma.userModulePermission.upsert({
                where: {
                    userId_module: {
                        userId: user.id,
                        module,
                    },
                },
                update: {
                    canView,
                    canUpload,
                    canEdit,
                    canDelete,
                    canDownload,
                },
                create: {
                    userId: user.id,
                    module,
                    canView,
                    canUpload,
                    canEdit,
                    canDelete,
                    canDownload,
                },
            });

            createdCount++;
        }
    }

    console.log(`Successfully migrated ${createdCount} permission records across ${users.length} users.`);
}

migratePermissions()
    .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
