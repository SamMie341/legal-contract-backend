# ລະບົບຄຸ້ມຄອງສັນຍາ, ນິຕິກຳ ແລະ ຄະດີຄວາມ ໄຟຟ້າລາວ (EDL Legal Management System)

Backend API ລະບົບຄຸ້ມຄອງວຽກງານກົດໝາຍ ຂອງ **ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)** ພັດທະນາດ້ວຍ **NestJS (Node.js ESM + TypeScript)**, **Prisma ORM 7** ແລະ **PostgreSQL**.

> 📖 **ເອກະສານລະອຽດກ່ຽວກັບ Flow ຂອງລະບົບ ແລະ ການແຍກໂມດູນ:**  
> ເບິ່ງໄດ້ທີ່ໄຟລ໌ [**`SYSTEM_FLOW_AND_MODULES.md`**](./SYSTEM_FLOW_AND_MODULES.md)

---

## 🏛️ 3 ພາກສ່ວນຫຼັກຂອງລະບົບ (Core Pillars)

1. **ພະແນກສັນຍາທົ່ວໄປ (`ContractsModule`)**:
   - ຕິດຕາມ ແລະ ຄຸ້ມຄອງສັນຍາ 14 ປະເພດ
   - ແຈ້ງເຕືອນສັນຍາໃກ້ໝົດອາຍຸອັດຕະໂນມັດຜ່ານ Cron Job (ທຸກທ່ຽງຄືນ, ແຈ້ງລ່ວງໜ້າ &le; 60 ວັນ)
   - ຮອງຮັບ 3 ສະກຸນເງິນ: ກີບ (LAK), ໂດລາ (USD) ແລະ ຢວນ (CNY)
   - ໄຟລ໌ແນບສັນຍາ (Upload, Preview PDF/Image, Download, Delete)
   - Dashboard ສະຖິຕິສັນຍາ ແລະ ມູນຄ່າລວມ

2. **ພະແນກນິຕິກຳ (`LegalDocumentsModule`)**:
   - ຄຸ້ມຄອງນິຕິກຳ, ລະບຽບການ, ຂໍ້ກຳນົດ, ແຈ້ງການ, ສັນຍາ, ປຶ້ມຄູ່ມື
   - ຈັດໝວດໝູ່ຕາມປີ, ເລກທີ, ວັນທີ ແລະ ຫ້ອງການ/ຝ່າຍທີ່ຮັບຜິດຊອບ
   - ໄຟລ໌ເອກະສານແນບ (Upload, Preview Inline, Download, Soft Delete)
   - Dashboard ນິຕິກຳ (Donut Chart ຕາມປະເພດ, Bar Chart ຕາມຝ່າຍ)

3. **ພະແນກແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ດຳເນີນຄະດີ (`LegalCasesModule`)**:
   - ຕິດຕາມສຳນວນຄະດີ ແລະ ຂໍ້ຂັດແຍ່ງ (ການຄ້າ, ແພ່ງ, ອາຍາ, ບໍລິຫານ)
   - ຂັ້ນຕອນສານ: ສານຂັ້ນຕົ້ນ (`FIRST_INSTANCE`), ອຸທອນ (`APPEAL`), ລົບລ້າງ (`SUPREME`), ຈົບຄະດີ (`CLOSED`), ສຳເລັດ (`RESOLVED`)
   - ຕິດຕາມການເງິນ 2 ສະກຸນ (LAK & USD): ມູນຄ່າເສຍຫາຍ, ຄ່າປັບໃໝ, ລວມຍອດທີ່ຕ້ອງຊຳລະ (Auto-calc), ຍອດກູ້ຄືນໄດ້
   - ຄົ້ນຫາໄດ້ທັງ UUID ແລະ `caseCode` (ເຊັ່ນ: `EDL-2026-005`)
   - ໄຟລ໌ສຳນວນຄະດີ (Upload, Preview, Download, Soft Delete)
   - Dashboard ຄະດີ: ຍອດລວມການເງິນ LAK/USD, Donut & Bar Charts

---

## 🛠️ ໂມດູນສະໜັບສະໜູນ (Platform & Support Modules)

- **`AuthModule`**: ຢັ້ງຢືນຕົວຕົນຜ່ານ EDL HRM API (`https://api-test.edl.com.la/hrm/api`) ແລະ ອອກ JWT
- **`UsersModule`**: ຈັດການຜູ້ໃຊ້, ດຶງຂໍ້ມູນພະນັກງານຈາກ HRM, ກຳນົດສິດລະອຽດ (`canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload`)
- **`DepartmentsModule`**: Sync ຫ້ອງການ/ຝ່າຍຈາກ HRM, Dropdown ລາຍຊື່ຝ່າຍ
- **`ContractTypesModule`**: Master Data 14 ປະເພດສັນຍາ
- **`SupportModule`**: ຊ່ອງທາງຕິດຕໍ່ສາຍດ່ວນ, WhatsApp, ລະບົບແຈ້ງບັນຫາ (Ticket)
- **`AuditLogsModule`**: ບັນທຶກປະຫວັດການດຳເນີນງານທັງໝົດໃນລະບົບ (Audit Trail)

---

## 🚀 ການຕິດຕັ້ງ ແລະ ເປີດໃຊ້ງານ (Getting Started)

### 1. ຕິດຕັ້ງ Dependencies
```bash
npm install
```

### 2. ຕັ້ງຄ່າ Environment Variables
ສ້າງໄຟລ໌ `.env` ໂດຍອ້າງອີງຈາກ `.env.example`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edl_legal_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION="7d"
HRM_BASE_URL="https://api-test.edl.com.la/hrm/api"
HRM_SYNC_USERNAME="Ton"
HRM_SYNC_PASSWORD="HRM1234"
UPLOAD_DIR="../uploads/contracts"
UPLOAD_DIR_LEGAL_DOCS="../uploads/legal-documents"
UPLOAD_DIR_LEGAL_CASES="../uploads/legal-cases"
PORT=3000
```

### 3. Prisma Generate & Migrate
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run Application
```bash
# Development
npm run start:dev

# Production Build & Start
npm run build
npm run start:prod
```

### 5. Swagger API Documentation
ເມື່ອເປີດ Server ແລ້ວ ສາມາດເຂົ້າເບິ່ງ API Docs ໄດ້ທີ່:
👉 **`http://localhost:3000/api/docs`**

---

## 📁 ໂຄງສ້າງລະຫັດ (Clean Architecture Pattern)

```text
src/
├── core/                   <-- Decorators, Guards, Interceptors, Pipes
├── infrastructure/         <-- Database (PrismaModule), Global Config
└── modules/
    ├── auth/               <-- HRM SSO, JWT Token
    ├── users/              <-- Users & HRM Sync
    ├── departments/        <-- Departments & HRM Sync
    ├── contract-types/     <-- Master Data Contract Types
    ├── contracts/          <-- Core Contracts, Attachments, Expiry Cron
    ├── legal-documents/    <-- Legal Documents, Attachments, Dashboard
    ├── legal-cases/        <-- Legal Cases, Financials, Attachments, Dashboard
    ├── support/            <-- Support Tickets & Contact Channels
    └── audit-logs/         <-- System Audit Trail
```

---

## 📮 Postman Collection
ໄຟລ໌ Postman Collection ພ້ອມ Request ຕົວຢ່າງຄົບທຸກ Endpoints:
- [`legal-contract-management.postman_collection.json`](./legal-contract-management.postman_collection.json)
