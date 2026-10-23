// prisma/seed.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    // 1. Seed 14 ປະເພດສັນຍາ ຕາມເອກະສານກຳນົດ
    const contractTypes = [
        { nameLo: 'ສັນຍາ ບໍລິການ O&M' },
        { nameLo: 'ສັນຍາ ເຊົ່າອຸປະກອນພາກສະຖານີ-ສາຍສົ່ງ' },
        { nameLo: 'ສັນຍາ ເຊົ່າພື້ນທີ່ດິນ' },
        { nameLo: 'ສັນຍາ ຮັບເໝົາກໍ່ສ້າງ (EPC)' },
        { nameLo: 'ສັນຍາ ບໍລິການເກາະຫ້ອຍ' },
        { nameLo: 'ສັນຍາບໍລິການ ຮັບຊຳລະຄ່າກະແສໄຟຟ້າ' },
        { nameLo: 'ສັນຍາ ບໍລິການເຊົ່າສາຍ OPGW' },
        { nameLo: 'ສັນຍາ ບໍລິການເງິນຝາກກະແສລາຍວັນ' },
        { nameLo: 'ສັນຍາບໍລິການນຳໃຊ້ຜະລິດຕະພັນຊຳລະເງິນ ຂອງ ທະນາຄານ ໃນ EDL App' },
        { nameLo: 'ສັນຍາຮ່ວມມື ແລະ ສັນຍາຮ່ວມທຸລະກິດ' },
        { nameLo: 'ສັນຍາຮ່ວມຫຸ້ນ' },
        { nameLo: 'ສັນຍາບໍລິການຜ່ານສາຍສົ່ງ (PTA)' },
        { nameLo: 'ບົດບັນທຶກຂໍ້ຕົກລົງ (MOA)' },
        { nameLo: 'ສັນຍາອື່ນໆ ທີ່ຖືກມອບໝາຍໂດຍຕົງ' },
    ];

    for (const item of contractTypes) {
        await prisma.contractType.upsert({
            where: { nameLo: item.nameLo },
            update: { nameLo: item.nameLo },
            create: item,
        });
    }

    console.log('✅ Seeded 14 contract types successfully.');

    // 2. Seed Admin User
    const adminPassword = await bcrypt.hash('Admin@1234', 10);

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            canView: true,
            canUpload: true,
            canEdit: true,
            canDelete: true,
            canDownload: true,
        },
        create: {
            username: 'admin',
            employeeCode: 'ADMIN-001',
            email: 'admin@edl.com.la',
            passwordHash: adminPassword,
            fullName: 'System Administrator',
            department: 'IT Department',
            position: 'Admin',
            role: UserRole.ADMIN,
            canView: true,
            canUpload: true,
            canEdit: true,
            canDelete: true,
            canDownload: true,
            isActive: true,
        },
    });

    console.log('✅ Seeded Initial Admin User successfully.');

    // 3. Seed Sample Contact Channels (ຂໍ້ 6)
    const contactChannels = [
        {
            channelName: 'ສາຍດ່ວນ IT Support ພະແນກສັນຍາ',
            contactInfo: '+856 21 316123 / itsupport@edl.com.la',
            description: 'ເວລາລັດຖະການ: ວັນຈັນ - ວັນສຸກ (08:30 - 16:30)',
            sortOrder: 1,
            isActive: true,
        },
        {
            channelName: 'WhatsApp ແຈ້ງບັນຫາລະບົບ',
            contactInfo: '+856 20 5555 9999',
            description: 'ສຳລັບແຈ້ງບັນຫາດ່ວນຕະຫຼອດ 24 ຊົ່ວໂມງ',
            sortOrder: 2,
            isActive: true,
        },
    ];

    for (const ch of contactChannels) {
        const existing = await prisma.systemContactChannel.findFirst({
            where: { channelName: ch.channelName },
        });
        if (!existing) {
            await prisma.systemContactChannel.create({ data: ch });
        }
    }

    console.log('✅ Seeded Sample Contact Channels successfully.');

    // 4. Seed Sample Departments (ຫ້ອງການ/ຝ່າຍ/ສະຖາບັນ ຂອງ ຟຟລ)
    const departments = [
        { name: 'ຫ້ອງການຜູ້ອຳນວຍການໃຫຍ່', code: 'MD-OFFICE' },
        { name: 'ຝ່າຍກົດໝາຍ ແລະ ນິຕິກຳ', code: 'LEGAL-DIV' },
        { name: 'ຝ່າຍບັນຊີ-ການເງິນ', code: 'FIN-DIV' },
        { name: 'ຝ່າຍຈັດຕັ້ງ ແລະ ບຸກຄະລາກອນ', code: 'HR-DIV' },
        { name: 'ຝ່າຍປະຕິບັດການໄຟຟ້າ', code: 'OPS-DIV' },
        { name: 'ຝ່າຍເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ (IT)', code: 'IT-DIV' },
    ];

    for (const dept of departments) {
        await prisma.department.upsert({
            where: { name: dept.name },
            update: { code: dept.code, isActive: true },
            create: dept,
        });
    }

    console.log('✅ Seeded Sample Departments successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
