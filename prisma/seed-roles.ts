import { PrismaClient, UserRole, SystemModule } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?(.*?)["']?(\r?\n|$)/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ALL_MODULES = [
    SystemModule.CONTRACTS,
    SystemModule.POWER_CONTRACTS,
    SystemModule.LEGAL_DOCUMENTS,
    SystemModule.LEGAL_CASES,
];

const SYSTEM_ROLES = [
    {
        name: 'ADMIN',
        title: 'ຜູ້ບໍລິຫານລະບົບສູງສຸດ',
        description: 'ມີສິດຄົບທຸກຢ່າງໃນທຸກໂມດູນ (Super Admin)',
        permissions: ALL_MODULES.map((module) => ({
            module,
            canView: true,
            canUpload: true,
            canEdit: true,
            canDelete: true,
            canDownload: true,
        })),
    },
    {
        name: 'DEPARTMENT_HEAD',
        title: 'ຫົວໜ້າຝ່າຍ / ຮອງຫົວໜ້າຝ່າຍ',
        description: 'ສາມາດເຂົ້າເບິ່ງ ແລະ ດາວໂຫຼດເອກະສານໄດ້ຄົບທັງ 4 ໂມດູນຫຼັກ (Audit/Read-only)',
        permissions: ALL_MODULES.map((module) => ({
            module,
            canView: true,
            canUpload: false,
            canEdit: false,
            canDelete: false,
            canDownload: true,
        })),
    },
    {
        name: 'DIVISION_HEAD',
        title: 'ຫົວໜ້າພະແນກ',
        description: 'ຈັດການຂໍ້ມູນເຕັມຮູບແບບພາຍໃນພະແນກຂອງຕົນເອງ',
        permissions: ALL_MODULES.map((module) => ({
            module,
            canView: true,
            canUpload: true,
            canEdit: true,
            canDelete: true,
            canDownload: true,
        })),
    },
    {
        name: 'MAIN_USER',
        title: 'ຜູ້ໃຊ້ຫຼັກປະຈຳພະແນກ',
        description: 'ສ້າງ, ອັບໂຫຼດ, ແກ້ໄຂ, ລົບ ແລະ ດາວໂຫຼດເອກະສານພາຍໃນພະແນກ',
        permissions: ALL_MODULES.map((module) => ({
            module,
            canView: true,
            canUpload: true,
            canEdit: true,
            canDelete: true,
            canDownload: true,
        })),
    },
    {
        name: 'EDITOR',
        title: 'ຜູ້ແກ້ໄຂຂໍ້ມູນ (Editor)',
        description: 'ສ້າງ, ອັບໂຫຼດ ແລະ ແກ້ໄຂຂໍ້ມູນຕາມທີ່ໄດ້ຮັບມອບໝາຍ',
        permissions: ALL_MODULES.map((module) => ({
            module,
            canView: true,
            canUpload: true,
            canEdit: true,
            canDelete: false,
            canDownload: true,
        })),
    },
    {
        name: 'VIEWER',
        title: 'ຜູ້ເບິ່ງຂໍ້ມູນ (Viewer)',
        description: 'ເບິ່ງຂໍ້ມູນໄດ້ຢ່າງດຽວ ບໍ່ສາມາດດາວໂຫຼດ ຫຼື ແກ້ໄຂໄດ້',
        permissions: ALL_MODULES.map((module) => ({
            module,
            canView: true,
            canUpload: false,
            canEdit: false,
            canDelete: false,
            canDownload: false,
        })),
    },
];

async function seedRoles() {
    console.log('--- Seeding System Roles & Permissions ---');

    for (const roleDef of SYSTEM_ROLES) {
        let role = await prisma.role.findUnique({
            where: { name: roleDef.name },
        });

        if (!role) {
            role = await prisma.role.create({
                data: {
                    name: roleDef.name,
                    title: roleDef.title,
                    description: roleDef.description,
                    isSystem: true,
                },
            });
            console.log(`Created system role: ${role.name} (${role.id})`);
        } else {
            await prisma.role.update({
                where: { id: role.id },
                data: {
                    title: roleDef.title,
                    description: roleDef.description,
                    isSystem: true,
                },
            });
            console.log(`Updated system role: ${role.name}`);
        }

        // Upsert permissions for this role
        for (const perm of roleDef.permissions) {
            await prisma.roleModulePermission.upsert({
                where: {
                    roleId_module: {
                        roleId: role.id,
                        module: perm.module,
                    },
                },
                create: {
                    roleId: role.id,
                    module: perm.module,
                    canView: perm.canView,
                    canUpload: perm.canUpload,
                    canEdit: perm.canEdit,
                    canDelete: perm.canDelete,
                    canDownload: perm.canDownload,
                },
                update: {
                    canView: perm.canView,
                    canUpload: perm.canUpload,
                    canEdit: perm.canEdit,
                    canDelete: perm.canDelete,
                    canDownload: perm.canDownload,
                },
            });
        }
    }

    // Link existing users to roles based on user.role
    const users = await prisma.user.findMany({
        where: { roleId: null },
    });

    console.log(`Found ${users.length} users needing role linkage.`);
    for (const user of users) {
        const targetRoleName = user.role ? String(user.role) : 'VIEWER';
        const role = await prisma.role.findUnique({ where: { name: targetRoleName } });
        if (role) {
            await prisma.user.update({
                where: { id: user.id },
                data: { roleId: role.id },
            });
            console.log(`Linked user ${user.username} to role ${role.name}`);
        }
    }

    console.log('--- Role seeding completed successfully ---');
    await prisma.$disconnect();
    await pool.end();
}

seedRoles().catch((err) => {
    console.error('Seed roles error:', err);
    process.exit(1);
});
