# ລະບົບຄຸ້ມຄອງສັນຍາ, ນິຕິກຳ ແລະ ຄະດີຄວາມ ໄຟຟ້າລາວ (EDL)
## System Architecture, Workflows & Module Specification
**Version:** 2.0 (Dynamic Custom Roles, 3 Core Pillars RBAC & Stateless Token Versioning)  
**ວັນທີປັບປຸງ:** 03/11/2026  
**ສະຖານະລະບົບ:** Production Ready (Clean Architecture 4 Layers + Prisma ORM 7 + NestJS ESM)

---

## 1. ພາບລວມລະບົບ (System Overview)

ລະບົບຄຸ້ມຄອງວຽກງານກົດໝາຍ ຂອງ **ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)** ເປັນລະບົບ Backend ທີ່ພັດທະນາດ້ວຍ **NestJS (Node.js ESM + TypeScript)**, **Prisma ORM 7** ແລະ **PostgreSQL** ພາຍໃຕ້ສະຖາປັດຕະຍະກຳ **Clean Architecture (4 Layers)**.

ໂຄງສ້າງລະບົບຖືກອອກແບບ ແລະ ຈັດແບ່ງຕາມ **3 ເສົາຫຼັກ / 3 ພະແນກຫຼັກ (3 Core Pillars / Divisions)** ຕາມໂຄງສ້າງຕົວຈິງຂອງ ຝ່າຍກົດໝາຍ ໄຟຟ້າລາວ:

```mermaid
graph TD
    subgraph EDL_Legal["🏢 ຝ່າຍກົດໝາຍ ໄຟຟ້າລາວ (EDL Legal Department)"]
        P1["📘 1. ພະແນກສັນຍາທົ່ວໄປ<br/><b>Key: CONTRACTS</b><br/>(General Contracts)"]
        P2["⚡ 2. ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ<br/><b>Key: POWER_CONTRACTS</b><br/>(Power Contracts - PPA/PSA)"]
        P3["⚖️ 3. ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ<br/><b>Key: LEGAL_AND_DISPUTE</b><br/>(Legal Affairs & Disputes)"]
    end

    subgraph SubWork["ວຽກງານຍ່ອຍພາຍໃຕ້ເສົາຫຼັກທີ 3"]
        Docs["📄 ນິຕິກຳ (LEGAL_DOCUMENTS)"]
        Cases["⚖️ ຄະດີຄວາມ ແລະ ຂໍ້ຂັດແຍ່ງ (LEGAL_CASES)"]
    end

    P3 -.-> Docs
    P3 -.-> Cases
```

1. **ພະແນກສັນຍາທົ່ວໄປ (General Contracts Division - `CONTRACTS`)**: 
   - ຕິດຕາມສັນຍາ 14 ປະເພດ (O&M, EPC, ເຊົ່າດິນ, MOA, PTA, ແລະອື່ນໆ).
   - ແຈ້ງເຕືອນສັນຍາໃກ້ໝົດອາຍຸອັດຕະໂນມັດ (Automated Cron Job ທຸກທ່ຽງຄືນ &le; 60 ວັນ).
   - ຄຸ້ມຄອງມູນຄ່າສັນຍາ 3 ສະກຸນເງິນ (LAK, USD, CNY).
   - ຈັດເກັບ ແລະ ຈັດການໄຟລ໌ແນບສັນຍາ (Upload, Preview Inline, Download, Delete).
   - Dashboard ສະຖິຕິສັນຍາ, ກຣາບສະຖານະ, ສະກຸນເງິນ ແລະ ມູນຄ່າລວມ.

2. **ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Purchase & Sale Contracts Division - `POWER_CONTRACTS`)**:
   - ຈັດການສັນຍາຊື້ໄຟຟ້າ (PPA) ແລະ ສັນຍາຂາຍໄຟຟ້າ (PSA).
   - ຮອງຮັບ 5 ປະເພດໂຄງການໄຟຟ້າ (ໄຟຟ້ານໍ້າຕົກ, ແສງຕາເວັນ, ລົມ, ຄວາມຮ້ອນ/ຖ່ານຫີນ, ຊີວະມວນ).
   - ຕິດຕາມກຳລັງການຕິດຕັ້ງ (Installed Capacity: MW/kW), ອັດຕາຄ່າໄຟຟ້າ (Tariff).
   - ແຈ້ງເຕືອນສັນຍາໄຟຟ້າໃກ້ໝົດອາຍຸອັດຕະໂນມັດ (&le; 60 ວັນ).
   - Dashboard ສະຖິຕິສັນຍາໄຟຟ້າ, ກຳລັງຕິດຕັ້ງລວມ ແລະ ສະຖານະໂຄງການ.

3. **ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal Affairs & Dispute Resolution Division - `LEGAL_AND_DISPUTE`)**:
   - **ວຽກງານນິຕິກຳ (`LEGAL_DOCUMENTS`)**: ຄຸ້ມຄອງນິຕິກຳ, ລະບຽບການ, ຂໍ້ກຳນົດ, ແຈ້ງການ, ປຶ້ມຄູ່ມື, ຈັດໝວດໝູ່ຕາມປີ/ຝ່າຍ, ໄຟລ໌ເອກະສານແນບ, ແລະ Dashboard ສະຖິຕິນິຕິກຳ.
   - **ວຽກງານແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ດຳເນີນຄະດີ (`LEGAL_CASES`)**: ຕິດຕາມສຳນວນຄະດີແພ່ງ, ອາຍາ, ການຄ້າ, ບໍລິຫານ; ຂັ້ນຕອນສານ 3 ຂັ້ນ (ສານຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ); ມູນຄ່າການເງິນ 2 ສະກຸນ (LAK & USD: ຄວາມເສຍຫາຍ, ຄ່າປັບໃໝ, ລວມຍອດຕ້ອງຊຳລະ Auto-calculated, ຍອດກູ້ຄືນໄດ້); ໄຟລ໌ສຳນວນຄະດີ, ແລະ Dashboard ຄະດີຄວາມ.

> [!IMPORTANT]
> **ຫຼັກການແຍກສິດ ແລະ Dynamic RBAC Matrix (Division & Role Isolation):**
> - ລະບົບຮອງຮັບການສ້າງ Custom Role ໃໝ່ໄດ້ແບບບໍ່ຈຳກັດ (`POST /api/roles`) ພ້ອມກຳນົດສິດ 5 Actions (`canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload`) ໃນແຕ່ລະໂມດູນ.
> - ເທິງ UI Matrix ຈະສະແດງພຽງ **3 ແຖວຫຼັກ (3 Pillars)** ເພື່ອຄວາມກະທັດຮັດ. ສິດໃນແຖວ `LEGAL_AND_DISPUTE` ຈະຄຸມທັງ `LEGAL_DOCUMENTS` ແລະ `LEGAL_CASES`.
> - ຜູ້ໃຊ້ຈະເຂົ້າເຖິງໄດ້ສະເພາະໂມດູນທີ່ຕົນເອງໄດ້ຮັບອະນຸຍາດເທົ່ານັ້ນ. ຫາກພະຍາຍາມເຂົ້າເຖິງໂມດູນອື່ນ ລະບົບຈະຕອບກັບດ້ວຍ `403 Forbidden`.
> - **ADMIN** ສາມາດເຂົ້າເຖິງ ແລະ ຈັດການໄດ້ທຸກໂມດູນທົ່ວທັງລະບົບ.

---

## 2. ຜັງສະຖາປັດຕະຍະກຳລວມ (High-Level System Architecture)

```mermaid
graph TD
    subgraph ClientLayer["1. Client Layer (Frontend & Consumers)"]
        WebAdmin["Web Application (Next.js / React Portal)"]
        MobileApp["Mobile / Tablet Clients"]
        SwaggerUI["Swagger API Docs (/api/docs)"]
    end

    subgraph GatewayLayer["2. Security & Guard Layer (Stateless Multi-Layer Protection)"]
        JwtGuard["1. JwtAuthGuard (Pure Stateless JWT + tokenVersion Check)"]
        RolesGuard["2. RolesGuard (Role-Based Authorization)"]
        DivisionGuard["3. DivisionGuard (Module Isolation: @RequiredModule)"]
        ActionGuard["4. Use Case Permission Checks (canView, canUpload, canEdit, canDelete, canDownload)"]
    end

    subgraph CoreModules["3. Business Logic Modules (Clean Architecture)"]
        subgraph DivContracts["1. ພະແນກສັນຍາທົ່ວໄປ"]
            M_Contracts["ContractsModule (Core Contracts & Cron)"]
            M_CTypes["ContractTypesModule (14 Master Types)"]
        end

        subgraph DivPower["2. ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ"]
            M_Power["PowerContractsModule (PPA/PSA & 5 Project Types)"]
        end

        subgraph DivLegal["3. ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ"]
            M_Docs["LegalDocumentsModule (Regulations & Notices)"]
            M_Cases["LegalCasesModule (Disputes, Courts & Financials)"]
        end

        subgraph DivCommon["ໂມດູນກາງ (Shared Modules)"]
            M_Auth["AuthModule (Pure Stateless JWT + Seamless Auto-Refresh)"]
            M_Depts["DepartmentsModule (HRM Sync & Dropdown)"]
            M_Support["SupportModule (Tickets & Contact Channels)"]
        end

        subgraph DivAdmin["ໂມດູນຜູ້ດູແລລະບົບ (Admin Only)"]
            M_Roles["RolesModule (Dynamic Custom Roles & Matrix RBAC)"]
            M_Users["UsersModule (User Management, HRM Sync & Fallback)"]
            M_Audit["AuditLogsModule (Activity & Change Tracking)"]
        end
    end

    subgraph InfraLayer["4. Infrastructure & External Services"]
        HRM_API["EDL HRM API (https://api-test.edl.com.la/hrm/api) [ພ້ອມ Fallback]"]
        CronService["Cron Scheduler (ທຸກທ່ຽງຄືນ 00:00: ກວດສອບສັນຍາທົ່ວໄປ & ສັນຍາໄຟຟ້າ)"]
        StorageEngine["Disk Storage Engine (/uploads/contracts, /power, /docs, /cases, /tickets)"]
        PostgresDB[("PostgreSQL Database (Prisma ORM 7 + Stateless token_version)")]
        TokenCache["In-Memory TokenVersion Cache (Nano-second Fast Lookup)"]
    end

    ClientLayer --> GatewayLayer
    GatewayLayer --> CoreModules
    M_Auth --> TokenCache
    M_Auth --> HRM_API
    M_Users --> HRM_API
    M_Depts --> HRM_API
    M_Contracts --> CronService
    M_Power --> CronService
    M_Contracts --> StorageEngine
    M_Power --> StorageEngine
    M_Docs --> StorageEngine
    M_Cases --> StorageEngine
    M_Support --> StorageEngine
    CoreModules --> PostgresDB
```

---

## 3. ລາຍລະອຽດແຕ່ລະໂມດູນ (Core Modules Breakdown)

ລະບົບຖືກອອກແບບຕາມ **Clean Architecture 4 Layers**:
- **Domain Layer**: Entity Models, Repository Interfaces, Enums (`Division`, `SystemModule`, `UserRole`, `ContractStatus`, `ContractType`, `DisputeStatus`, `CaseType`, ແລະອື່ນໆ).
- **Infrastructure Layer**: Prisma Repositories, Database Transactions, HRM HTTP Client, Disk File Storage Engine.
- **Application Layer**: Use Cases (Business Logic & Validation), Data Transfer Objects (DTOs), Helpers (`DivisionHelper`, `normalizeLaoText`).
- **Presentation Layer**: REST Controllers (Routing, Swagger, Guard Decorators `@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)`, File Streaming).

| # | ຊື່ໂມດູນ | ເສັ້ນທາງໂຟລເດີ | ສິດໂມດູນ / ພະແນກ | ຕາຕະລາງ DB | ໜ້າທີ່ຫຼັກ ແລະ API Endpoints ສຳຄັນ |
| :- | :--- | :--- | :--- | :--- | :--- |
| **01** | `AuthModule` | `src/modules/auth` | Common (ທຸກຄົນ) | `users` | - Login ຜ່ານ HRM ຫຼື Local User (`POST /api/auth/login`)<br/>- ອອກ Pure Stateless JWT (`accessToken` + `refreshToken`) ບັນຈຸ `permissionsByModule`<br/>- Instant Invalidation ຜ່ານ `tokenVersion`<br/>- ຕໍ່ອາຍຸ Token ແບບ Seamless (`POST /api/auth/refresh`)<br/>- ດຶງຂໍ້ມູນ Profile & Permissions (`GET /api/auth/me`) |
| **02** | `RolesModule` | `src/modules/roles` | Admin Only | `roles`, `role_module_permissions` | - ຄຸ້ມຄອງບົດບາດແບບ Dynamic RBAC (`/api/roles`)<br/>- ສ້າງ, ແກ້ໄຂ, ລົບ Custom Role ພ້ອມກຳນົດສິດ Matrix ລາຍໂມດູນ<br/>- ລະບົບປ້ອງກັນ System Roles ບໍ່ໃຫ້ລົບ/ແກ້ໄຂຜິດພາດ<br/>- ອັດຕະໂນມັດ Invalidate Session ຂອງ User ທຸກຄົນທີ່ຖື Role ເມື່ອ Role ຖືກແກ້ໄຂ |
| **03** | `UsersModule` | `src/modules/users` | Admin Only | `users`, `user_module_permissions` | - ຄົ້ນຫາຂໍ້ມູນພະນັກງານ HRM ແບບ Auto-fill (`GET /api/users/hrm/:empCode`)<br/>- ສ້າງ/ແກ້ໄຂຜູ້ໃຊ້ ຜູກກັບ Role (`roleId`) ຫຼື ກຳນົດ Custom Module Permissions<br/>- HRM Sync ພ້ອມ Fallback Mechanism ຫາກ HRM Offline<br/>- ອັດຕະໂນມັດ Invalidate Session ຂອງ User ທັນທີເມື່ອສິດຖືກປ່ຽນ |
| **04** | `DepartmentsModule` | `src/modules/departments` | Common (ທຸກຄົນ) | `departments` | - Sync ຫ້ອງການ/ຝ່າຍຈາກ HRM ອັດຕະໂນມັດ (`POST /api/departments/sync`)<br/>- Dropdown ລາຍຊື່ຝ່າຍສຳລັບ Form ທຸກໂມດູນ (`GET /api/departments/dropdown`)<br/>- CRUD ຫ້ອງການ/ຝ່າຍ ພ້ອມລະບົບປ້ອງກັນການລົບຫາກມີຂໍ້ມູນຜູກມັດ |
| **05** | `ContractTypesModule` | `src/modules/contract-types` | `CONTRACTS` / ADMIN | `contract_types` | - ຄຸ້ມຄອງ 14 ປະເພດສັນຍາຫຼັກ (O&M, EPC, ເຊົ່າດິນ, MOA, PTA, ແລະອື່ນໆ)<br/>- Dropdown ປະເພດສັນຍາ (`GET /api/contract-types/dropdown`) |
| **06** | `ContractsModule` | `src/modules/contracts` | `CONTRACTS` / ADMIN | `contracts`, `contract_attachments`, `notifications` | - ຄຸ້ມຄອງສັນຍາທົ່ວໄປ (DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED)<br/>- ຮອງຮັບ 3 ສະກຸນເງິນ: LAK, USD, CNY<br/>- Cron Service ກວດສອບສັນຍາໝົດອາຍຸທຸກທ່ຽງຄືນ ແລະ ແຈ້ງເຕືອນລ່ວງໜ້າ (&le; 60 ວັນ)<br/>- ໄຟລ໌ແນບ (Upload, Preview Inline, Download, Delete)<br/>- Dashboard ສະຖິຕິສັນຍາ (`GET /api/contracts/dashboard`) |
| **07** | `PowerContractsModule` | `src/modules/power-contracts` | `POWER_CONTRACTS` / ADMIN | `power_contracts`, `power_contract_attachments`, `power_notifications` | - ຄຸ້ມຄອງສັນຍາຊື້ໄຟຟ້າ (PPA) ແລະ ຂາຍໄຟຟ້າ (PSA)<br/>- 5 ປະເພດໂຄງການໄຟຟ້າ (`GET /api/power-contracts/project-types`) ສຳລັບ PPA<br/>- ຕິດຕາມກຳລັງຕິດຕັ້ງ (Installed Capacity: MW) ແລະ ອັດຕາຄ່າໄຟຟ້າ (Tariff)<br/>- Cron Service ແຈ້ງເຕືອນສັນຍາໄຟຟ້າໃກ້ໝົດອາຍຸ (&le; 60 ວັນ)<br/>- ໄຟລ໌ແນບ (Upload, Preview, Download, Delete)<br/>- Dashboard ສັນຍາຊື້-ຂາຍໄຟຟ້າ (`GET /api/power-contracts/dashboard`) |
| **08** | `LegalDocumentsModule` | `src/modules/legal-documents` | `LEGAL_AND_DISPUTE` / ADMIN | `legal_documents`, `document_attachments` | - ຄຸ້ມຄອງນິຕິກຳ (ລະບຽບການ, ຂໍ້ກຳນົດ, ແຈ້ງການ, ສັນຍາ, ຄູ່ມື, ອື່ນໆ)<br/>- ສະຖານະນິຕິກຳ (ACTIVE / INACTIVE), ປີອອກ, ເລກທີ, ຝ່າຍທີ່ຮັບຜິດຊອບ<br/>- ໄຟລ໌ແນບນິຕິກຳ (Upload, Preview Inline, Download, Soft Delete)<br/>- Dashboard ນິຕິກຳ (`GET /api/legal-documents/dashboard`) |
| **09** | `LegalCasesModule` | `src/modules/legal-cases` | `LEGAL_AND_DISPUTE` / ADMIN | `legal_cases`, `case_attachments` | - ຄຸ້ມຄອງຄະດີ ແລະ ຂໍ້ຂັດແຍ່ງ (ການຄ້າ, ແພ່ງ, ອາຍາ, ບໍລິຫານ)<br/>- ສະຖານະຂັ້ນສານ 3 ຂັ້ນ: ສານຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ, ຈົບຄະດີ, ສຳເລັດ<br/>- ການເງິນແຍກ 2 ສະກຸນ (LAK & USD): ຄວາມເສຍຫາຍ, ຄ່າປັບໃໝ, ລວມຍອດຕ້ອງຊຳລະ (Auto-calc), ຍອດກູ້ຄືນໄດ້<br/>- ໄຟລ໌ສຳນວນຄະດີ (Upload, Preview, Download, Soft Delete)<br/>- Dashboard ຄະດີຄວາມ (`GET /api/legal-cases/dashboard`) |
| **10** | `SupportModule` | `src/modules/support` | Common (ທຸກຄົນ) | `system_contact_channels`, `support_tickets` | - ຊ່ອງທາງຕິດຕໍ່ IT Support, ສາຍດ່ວນ, WhatsApp<br/>- ລະບົບແຈ້ງບັນຫາ/ຂໍປັບປຸງລະບົບ (Open, In Progress, Resolved, Closed) |
| **11** | `AuditLogsModule` | `src/modules/audit-logs` | Admin Only | `audit_logs` | - ບັນທຶກປະຫວັດການດຳເນີນງານທັງໝົດໃນລະບົບ (Create, Update, Delete, Upload, Download)<br/>- ເກັບ Old Values ແລະ New Values ແບບ JSONB ພ້ອມ IP Address ແລະ User ID |

---

## 4. ຂັ້ນຕອນການເຮັດວຽກຂອງລະບົບ (System Workflows)

### 4.1 ຂັ້ນຕອນການຢັ້ງຢືນຕົວຕົນ, Pure Stateless JWT & Seamless Auto-Refresh

ລະບົບນຳໃຊ້ສະຖາປັດຕະຍະກຳ **Pure Stateless JWT + In-Memory Token Versioning**:
- **Stateless Access Token**: ບັນຈຸ `sub`, `empCode`, `fullName`, `role`, `roleId`, `roleTitle`, `tokenVersion`, `accessibleModules`, ແລະ `permissionsByModule` ເຮັດໃຫ້ Backend Guard ກວດສອບສິດໄດ້ທັນທີ 0 DB Queries.
- **Instant Invalidation**: ເມື່ອ Admin ແກ້ໄຂ Role ຫຼື User Permissions, ລະບົບຈະເພີ່ມ `token_version` ທັນທີ. Access Token ເກົ່າຈະຖືກປະຕິເສດດ້ວຍ `401 TOKEN_OUTDATED`.
- **Seamless Auto-Refresh**: Frontend Axios Interceptor ດັກຈັບ `TOKEN_OUTDATED` ແລ້ວຍິງ `POST /api/auth/refresh` ເພື່ອດຶງ Token ແລະ ສິດໃໝ່ລ່າສຸດ ແລ້ວ Replay Request ເດີມອັດຕະໂນມັດ ໂດຍຜູ້ໃຊ້ບໍ່ຕ້ອງ Login ໃໝ່!

```mermaid
sequenceDiagram
    autonumber
    actor User as ຜູ້ໃຊ້ງານ (Client)
    participant Front as Frontend (Axios Interceptor)
    participant Nest as NestJS Backend (JwtStrategy & Guard)
    participant Cache as TokenVersionService (In-Memory Cache)
    participant DB as PostgreSQL Database
    actor Admin as Admin (ຜູ້ດູແລລະບົບ)

    Note over User,DB: 1. ຂັ້ນຕອນ Login ແລະ ຮັບ Pure Stateless JWT
    User->>Nest: POST /api/auth/login { username, password }
    Nest->>DB: ກວດສອບບັນຊີ + ດຶງສິດທິ Matrix
    DB-->>Nest: User Data + token_version + permissions
    Nest->>Nest: ສ້າງ accessToken (ບັນຈຸ permissionsByModule) & refreshToken
    Nest-->>Front: 200 OK { accessToken, refreshToken, user }

    Note over Front,Nest: 2. ການຍິງ Request ປົກກະຕິ (0 Database Queries)
    Front->>Nest: GET /api/contracts (Bearer accessToken)
    Nest->>Cache: ກວດສອບ tokenVersion (In-Memory Fast Lookup)
    Cache-->>Nest: Match! (Valid Version)
    Nest-->>Front: 200 OK (Contract List Data)

    Note over Admin,DB: 3. Admin ແກ້ໄຂສິດທິ (Instant Invalidation)
    Admin->>Nest: PATCH /api/roles/:id (ແກ້ໄຂສິດ Matrix)
    Nest->>DB: UPDATE roles & role_module_permissions
    Nest->>DB: UPDATE users SET token_version = token_version + 1
    Nest->>Cache: invalidateRole(roleId) / invalidateUser(userId)
    Nest-->>Admin: 200 OK (Role updated)

    Note over Front,DB: 4. Seamless Auto-Refresh (ບໍ່ຕ້ອງ Login ໃໝ່)
    Front->>Nest: GET /api/contracts (Bearer accessToken ເກົ່າ)
    Nest->>Cache: ກວດສອບ tokenVersion
    Cache-->>Nest: Outdated! (tokenVersion ໃນ Token ນ້ອຍກວ່າ Cache)
    Nest-->>Front: 401 Unauthorized { code: "TOKEN_OUTDATED" }
    
    Note over Front: Interceptor ດັກຈັບ TOKEN_OUTDATED
    Front->>Nest: POST /api/auth/refresh { refreshToken }
    Nest->>DB: ກວດສອບ refreshToken + ດຶງສິດໃໝ່ລ່າສຸດ
    DB-->>Nest: Fresh User Permissions + New token_version
    Nest-->>Front: 200 OK { accessToken: newAccessToken, refreshToken: newRefreshToken, user }
    
    Note over Front: Replay Request ເດີມດ້ວຍ newAccessToken
    Front->>Nest: GET /api/contracts (Bearer newAccessToken)
    Nest-->>Front: 200 OK (Contract List Data)
    Front-->>User: ສະແດງຜົນລຽບງ່າຍ ໂດຍ User ບໍ່ຮູ້ສຶກສະດຸດ!
```

---

### 4.2 ວົງຈອນຊີວິດຂອງສັນຍາ ແລະ ການແຈ້ງເຕືອນອັດຕະໂນມັດ (Contract Lifecycle Flow)

ໃຊ້ຮ່ວມກັນທັງ **ສັນຍາທົ່ວໄປ (`Contracts`)** ແລະ **ສັນຍາຊື້-ຂາຍໄຟຟ້າ (`PowerContracts`)**:

```mermaid
stateDiagram-v2
    [*] --> DRAFT: ວັນທີເລີ່ມມີຜົນ (effectiveDate) ຢູ່ໃນອະນາຄົດ
    [*] --> ACTIVE: ວັນທີເລີ່ມມີຜົນ &le; ປັດຈຸບັນ
    DRAFT --> ACTIVE: ເມື່ອຮອດວັນທີເລີ່ມມີຜົນສັກສິດ

    state "ACTIVE (ມີຜົນບັງຄັບໃຊ້)" as ACTIVE
    state "EXPIRING_SOON (ໃກ້ໝົດອາຍຸ)" as EXPIRING_SOON
    state "EXPIRED (ໝົດອາຍຸແລ້ວ)" as EXPIRED
    state "TERMINATED (ຍົກເລີກກ່ອນກຳນົດ)" as TERMINATED

    ACTIVE --> EXPIRING_SOON: Cron Job (ທຸກທ່ຽງຄືນ 00:00) ເມື່ອເຫຼືອ &le; 60 ວັນ
    EXPIRING_SOON --> EXPIRED: Cron Job ເມື່ອວັນທີກາຍ expirationDate
    ACTIVE --> EXPIRED: Cron Job ກວດພົບວັນທີກາຍກຳນົດ
    ACTIVE --> TERMINATED: ຜູ້ມີສິດ Admin / Main User ກົດຍົກເລີກສັນຍາ
    EXPIRING_SOON --> TERMINATED: ຍົກເລີກກ່ອນກຳນົດ

    note right of EXPIRING_SOON
        ລະບົບສ້າງ Notification 
        ແຈ້ງເຕືອນຜູ້ກ່ຽວຂ້ອງອັດຕະໂນມັດ
    end note
```

---

### 4.3 ຂັ້ນຕອນການຈັດການສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Contracts Conditional Flow)

```mermaid
flowchart TD
    Start(["ເລີ່ມຕົ້ນສ້າງສັນຍາໄຟຟ້າ (POST /api/power-contracts)"]) --> CheckDiv{"ກວດສອບສິດ:<br/>POWER_CONTRACTS + canUpload"}
    CheckDiv -- "ບໍ່ມີສິດ" --> Err403["403 Forbidden"]
    CheckDiv -- "ມີສິດ" --> CheckType{"ເລືອກປະເພດສັນຍາ<br/>(contractType)"}

    CheckType -- "PURCHASE (ສັນຍາຊື້ໄຟຟ້າ - PPA)" --> PPAFlow["UI ສະແດງ Dropdown 5 ປະເພດໂຄງການ:<br/>1. ໄຟຟ້ານໍ້າຕົກ (Hydro)<br/>2. ພະລັງງານແສງຕາເວັນ (Solar)<br/>3. ພະລັງງານລົມ (Wind)<br/>4. ພະລັງງານຄວາມຮ້ອນ / ຖ່ານຫີນ (Thermal)<br/>5. ພະລັງງານຊີວະມວນ (Biomass)"]
    CheckType -- "SALE (ສັນຍາຂາຍໄຟຟ້າ - PSA)" --> PSAFlow["UI ສະແດງ Text Input:<br/>ປ້ອນຊື່ລູກຄ້າ ຫຼື ໂຄງການຜູ້ຊື້ດ້ວຍມື"]

    PPAFlow --> FormInput["ປ້ອນຂໍ້ມູນກຳລັງຕິດຕັ້ງ (MW), ອັດຕາຄ່າໄຟ (Tariff), ສະຖານທີ່, ອາຍຸສັນຍາ"]
    PSAFlow --> FormInput
    FormInput --> SavePower["ບັນທຶກລົງຕາຕະລາງ power_contracts"]
    SavePower --> AuditPower["ບັນທຶກ AuditLog: CREATE_POWER_CONTRACT"]
    AuditPower --> SuccessPower["201 Created: ສ້າງສັນຍາໄຟຟ້າສຳເລັດ"]
```

---

### 4.4 ຂັ້ນຕອນການດຳເນີນຄະດີ ແລະ ການຕິດຕາມການເງິນ (Legal Cases & Financial Flow)

```mermaid
flowchart TD
    CreateCase["1. ສ້າງສຳນວນຄະດີ (POST /api/legal-cases)<br/>ກວດສອບສິດ: LEGAL_AND_DISPUTE + canUpload"] --> AutoCalc["ຄຳນວນຍອດລວມອັດຕະໂນມັດ:<br/>totalDueLak = damageLak + fineLak<br/>totalDueUsd = damageUsd + fineUsd"]
    AutoCalc --> Stage1["2. ສານຂັ້ນຕົ້ນ (DisputeStatus: FIRST_INSTANCE)"]

    Stage1 --> Verdict1{"ຜົນການຕັດສິນ<br/>ຂັ້ນຕົ້ນ"}
    Verdict1 -- "ໄກ່ເກ່ຍສຳເລັດ / ຍອມຮັບ" --> Resolved["ສຳເລັດຄະດີ (RESOLVED / CLOSED)<br/>ບັນທຶກ recoveredLak / recoveredUsd"]
    Verdict1 -- "ຍື່ນອຸທອນ" --> Stage2["3. ສານຂັ້ນອຸທອນ (DisputeStatus: APPEAL)"]

    Stage2 --> Verdict2{"ຜົນການຕັດສິນ<br/>ຂັ້ນອຸທອນ"}
    Verdict2 -- "ສິ້ນສຸດການອຸທອນ" --> Resolved
    Verdict2 -- "ຍື່ນຕໍ່ສານລົບລ້າງ" --> Stage3["4. ສານຂັ້ນລົບລ້າງ (DisputeStatus: SUPREME)"]

    Stage3 --> FinalVerdict["5. ຄຳຕັດສິນຂັ້ນສຸດທ້າຍ<br/>ຈົບຄະດີ (CLOSED / RESOLVED)"]
    FinalVerdict --> Resolved

    subgraph AttachmentsAndProgress["ການຕິດຕາມ ແລະ ເອກະສານ"]
        DocDossier["ອັບໂຫຼດເອກະສານສຳນວນຄະດີ (CaseAttachment)"]
        AuditTrack["ບັນທຶກປະຫວັດການແກ້ໄຂທຸກຂັ້ນຕອນ (AuditLog)"]
        DashboardUpdate["ອັບເດດສະຖິຕິ Dashboard ການເງິນ LAK & USD ແບບ Real-time"]
    end

    Stage1 -.-> AttachmentsAndProgress
    Stage2 -.-> AttachmentsAndProgress
    Stage3 -.-> AttachmentsAndProgress
```

---

### 4.5 ລະບົບຄວບຄຸມຄວາມປອດໄພ Multi-Layer & Dynamic RBAC Model

```mermaid
graph TD
    subgraph MultiLayerSecurity["4-Layer Security & Dynamic RBAC Model"]
        L1["ຊັ້ນທີ 1: JwtAuthGuard<br/>- ກວດສອບ Bearer Token Signature<br/>- ກວດສອບ tokenVersion ກັບ In-Memory Cache<br/>(ຫາກ Outdated ສົ່ງ 401 TOKEN_OUTDATED)"]
        L2["ຊັ້ນທີ 2: RolesGuard<br/>- ກວດສອບບົດບາດຂັ້ນສູງ (Admin bypass / Role matching)"]
        L3["ຊັ້ນທີ 3: DivisionGuard (@RequiredModule)<br/>- ກວດສອບການເຂົ້າເຖິງ 3 ເສົາຫຼັກ<br/>(CONTRACTS, POWER_CONTRACTS, LEGAL_AND_DISPUTE)"]
        L4["ຊັ້ນທີ 4: Action-Level Permissions<br/>- ກວດສອບສິດລະອຽດ: canView, canUpload, canEdit, canDelete, canDownload"]

        L1 --> L2
        L2 --> L3
        L3 --> L4
        L4 --> Execute["ດຳເນີນການ Business Logic ໃນ Use Case"]
    end
```

#### ຕາຕະລາງສິດການເຂົ້າເຖິງໂມດູນຕາມ Division (Division Access Matrix):

| ໂມດູນລະບົບ (`SystemModule`) | ພະແນກທີ່ອະນຸຍາດ (`Division`) | ບົດບາດ / ສິດທີ່ຕ້ອງມີ | ລາຍລະອຽດ |
| :--- | :--- | :--- | :--- |
| `CONTRACTS` | **ພະແນກສັນຍາທົ່ວໄປ** (ຫຼື `ADMIN`) | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` | ຄຸ້ມຄອງສັນຍາ, ໄຟລ໌ແນບ, Dashboard ສັນຍາ (ພະແນກອື່ນຖືກບລັອກ) |
| `CONTRACT_TYPES` | **ພະແນກສັນຍາທົ່ວໄປ** (ຫຼື `ADMIN`) | ເບິ່ງ Dropdown: `canView`<br/>ຈັດການ Type: `ADMIN` | ຄຸ້ມຄອງ 14 ປະເພດສັນຍາ |
| `POWER_CONTRACTS` | **ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ** (ຫຼື `ADMIN`) | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` | ຄຸ້ມຄອງສັນຍາ PPA/PSA, ໄຟລ໌ແນບ, Dashboard ໄຟຟ້າ (ພະແນກອື່ນຖືກບລັອກ) |
| `LEGAL_DOCUMENTS` | **ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ** (ຫຼື `ADMIN`) | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` | ຄຸ້ມຄອງນິຕິກຳ, ໄຟລ໌ແນບ, Dashboard ນິຕິກຳ (ພະແນກອື່ນຖືກບລັອກ) |
| `LEGAL_CASES` | **ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ** (ຫຼື `ADMIN`) | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` | ຄຸ້ມຄອງຄະດີຄວາມ, ໄຟລ໌ແນບ, Dashboard ຄະດີ (ພະແນກອື່ນຖືກບລັອກ) |
| `DEPARTMENTS` | **ທຸກພະແນກ** (Shared / Master Data) | Dropdown: Login ແລ້ວເຂົ້າໄດ້<br/>Sync ຈາກ HRM: `ADMIN` | ຫ້ອງການ/ຝ່າຍ ສຳລັບ Form ທຸກໂມດູນ |
| `SUPPORT` | **ທຸກພະແນກ** (Shared) | Login ແລ້ວສ້າງ Ticket / ເບິ່ງຊ່ອງທາງຕິດຕໍ່ໄດ້ | ຕິດຕໍ່ IT Support, ແຈ້ງບັນຫາລະບົບ |
| `ROLES` | **ADMIN ເທົ່ານັ້ນ** | `ADMIN` | ຈັດການ Custom Roles, ກຳນົດສິດ Matrix |
| `USERS` | **ADMIN ເທົ່ານັ້ນ** | `ADMIN` | ຈັດການຜູ້ໃຊ້, ຜູກ Role, ກຳນົດສິດສະເພາະບຸກຄົນ |
| `AUDIT_LOGS` | **ADMIN ເທົ່ານັ້ນ** | `ADMIN` | ກວດສອບປະຫວັດການດຳເນີນງານທັງໝົດ |

---

## 5. ໂຄງສ້າງຖານຂໍ້ມູນສຳພັນ (Entity-Relationship Diagram - ERD)

```mermaid
erDiagram
    departments ||--o{ contracts : "departmentId"
    departments ||--o{ power_contracts : "departmentId"
    departments ||--o{ legal_documents : "departmentId"
    departments ||--o{ legal_cases : "departmentId"

    contract_types ||--o{ contracts : "contractTypeId"

    roles ||--o{ role_module_permissions : "roleId"
    roles ||--o{ users : "roleId"

    users ||--o{ user_module_permissions : "userId"
    users ||--o{ contracts : "createdById / updatedById"
    users ||--o{ contract_attachments : "uploadedById"
    users ||--o{ power_contracts : "createdById / updatedById"
    users ||--o{ power_contract_attachments : "uploadedById"
    users ||--o{ legal_documents : "createdById / updatedById"
    users ||--o{ document_attachments : "uploadedById"
    users ||--o{ legal_cases : "createdById / updatedById"
    users ||--o{ case_attachments : "uploadedById"
    users ||--o{ notifications : "userId"
    users ||--o{ power_notifications : "userId"
    users ||--o{ audit_logs : "userId"
    users ||--o{ support_tickets : "createdById"

    contracts ||--o{ contract_attachments : "contractId"
    contracts ||--o{ notifications : "contractId"
    contracts ||--o{ audit_logs : "contractId"

    power_contracts ||--o{ power_contract_attachments : "powerContractId"
    power_contracts ||--o{ power_notifications : "powerContractId"

    legal_documents ||--o{ document_attachments : "legalDocumentId"
    legal_cases ||--o{ case_attachments : "legalCaseId"

    roles {
        uuid id PK
        string name UK "CONTRACT_AUDITOR, etc."
        string title "ຊື່ສະແດງພາສາລາວ"
        string description
        boolean is_system "ປ້ອງກັນການລົບ System Roles"
        timestamp created_at
        timestamp updated_at
    }

    role_module_permissions {
        uuid id PK
        uuid role_id FK
        enum module "CONTRACTS, POWER_CONTRACTS, LEGAL_DOCUMENTS, LEGAL_CASES"
        boolean can_view
        boolean can_upload
        boolean can_edit
        boolean can_delete
        boolean can_download
    }

    user_module_permissions {
        uuid id PK
        uuid user_id FK
        enum module "CONTRACTS, POWER_CONTRACTS, LEGAL_DOCUMENTS, LEGAL_CASES"
        boolean can_view
        boolean can_upload
        boolean can_edit
        boolean can_delete
        boolean can_download
    }

    users {
        uuid id PK
        string employee_code UK
        string username UK
        string password_hash
        string full_name
        string department
        string division "3 ພະແນກຫຼັກ"
        string unit
        string position
        string email
        string phone
        string role "ADMIN, MAIN_USER, EDITOR, VIEWER ຫຼື Custom Role"
        uuid role_id FK
        int token_version "Stateless Invalidation Counter"
        string refresh_token "Hashed Refresh Token"
        boolean is_active
        boolean can_view
        boolean can_upload
        boolean can_edit
        boolean can_delete
        boolean can_download
        timestamp created_at
        timestamp deleted_at
    }

    departments {
        uuid id PK
        string name UK
        string code UK
        boolean is_active
        timestamp created_at
    }

    contract_types {
        int id PK
        string name UK
        string description
        boolean is_active
        timestamp created_at
    }

    contracts {
        uuid id PK
        string contract_number UK
        string title
        int contract_type_id FK
        enum currency "LAK, USD, CNY"
        decimal contract_value
        enum status "DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED"
        date effective_date
        date expiration_date
        int notify_days_before
        uuid department_id FK
        uuid created_by_id FK
        timestamp deleted_at
    }

    power_contracts {
        uuid id PK
        enum contract_type "PURCHASE, SALE"
        string contract_number UK
        string project_name
        string project_type_or_customer
        string duration_text
        int duration_months
        date signed_date
        date effective_date
        date expiration_date
        string installed_capacity
        decimal capacity_value
        string capacity_unit
        string project_location
        string tariff
        decimal tariff_value
        string tariff_currency
        string additional_details
        int notify_days_before
        enum status "DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED"
        uuid department_id FK
        uuid created_by_id FK
        timestamp deleted_at
    }

    legal_documents {
        uuid id PK
        string doc_title
        enum doc_type "REGULATION, PROVISION, AGREEMENT, ..."
        int issue_year
        string doc_number_date
        enum status "ACTIVE, INACTIVE"
        string responsible_person
        uuid department_id FK
        uuid created_by_id FK
        timestamp deleted_at
    }

    legal_cases {
        uuid internal_id PK
        string id UK "caseCode (e.g. EDL-2026-005)"
        string defendant
        string allegation
        uuid department_id FK
        enum case_type "COMMERCIAL, CIVIL, CRIMINAL, ..."
        decimal damage_lak
        decimal damage_usd
        decimal fine_lak
        decimal fine_usd
        decimal total_due_lak
        decimal total_due_usd
        enum dispute_status "FIRST_INSTANCE, APPEAL, SUPREME, CLOSED, RESOLVED"
        decimal recovered_lak
        decimal recovered_usd
        date date
        uuid created_by_id FK
        timestamp deleted_at
    }

    contract_attachments {
        uuid id PK
        uuid contract_id FK
        string file_name
        string file_url
        string file_type
        int file_size
        uuid uploaded_by_id FK
        timestamp deleted_at
    }

    power_contract_attachments {
        uuid id PK
        uuid power_contract_id FK
        string file_name
        string file_url
        string file_type
        int file_size
        uuid uploaded_by_id FK
        timestamp deleted_at
    }

    document_attachments {
        uuid id PK
        uuid legal_document_id FK
        string file_name
        string file_url
        string file_type
        int file_size
        uuid uploaded_by_id FK
        timestamp deleted_at
    }

    case_attachments {
        uuid id PK
        uuid legal_case_id FK
        string file_name
        string file_url
        string file_type
        int file_size
        uuid uploaded_by_id FK
        timestamp deleted_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        uuid contract_id FK
        string title
        string message
        boolean is_read
        timestamp created_at
    }

    power_notifications {
        uuid id PK
        uuid user_id FK
        uuid power_contract_id FK
        string title
        string message
        boolean is_read
        timestamp created_at
    }

    audit_logs {
        bigint id PK
        uuid user_id FK
        uuid contract_id
        string action
        string entity_name
        string record_id
        jsonb old_values
        jsonb new_values
        string ip_address
        timestamp created_at
    }
```

---

## 6. ສະຫຼຸບ Dashboard ສະຖິຕິແຕ່ລະລະບົບ

### 6.1 Dashboard ສັນຍາທົ່ວໄປ (`GET /api/contracts/dashboard`)
*(ອະນຸຍາດ: ພະແນກສັນຍາທົ່ວໄປ ແລະ ADMIN)*
- **Cards ສະຫຼຸບ**: ສັນຍາທັງໝົດ, ສັນຍາໃກ້ໝົດອາຍຸ (&le; 60 ວັນ), ສັນຍາທີ່ໝົດອາຍຸແລ້ວ.
- **ກຣາບແຍກຕາມສະຖານະ**: DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED.
- **ກຣາບແຍກຕາມສະກຸນເງິນ & ມູນຄ່າ**: LAK, USD, CNY.
- **ກຣາບແຍກຕາມ 14 ປະເພດສັນຍາ**.

### 6.2 Dashboard ສັນຍາຊື້-ຂາຍໄຟຟ້າ (`GET /api/power-contracts/dashboard`)
*(ອະນຸຍາດ: ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ ແລະ ADMIN)*
- **Cards ສະຫຼຸບ**: ສັນຍາໄຟຟ້າທັງໝົດ, ສັນຍາຊື້ (PPA), ສັນຍາຂາຍ (PSA), ສັນຍາໃກ້ໝົດອາຍຸ (&le; 60 ວັນ).
- **ກຣາບກຳລັງຕິດຕັ້ງລວມ (Installed Capacity)**: ແຍກຕາມ MW / kW.
- **Donut Chart**: ສັດສ່ວນຕາມ 5 ປະເພດໂຄງການໄຟຟ້າ (Hydro, Solar, Wind, Thermal, Biomass).
- **ກຣາບແຍກຕາມສະຖານະສັນຍາ**.

### 6.3 Dashboard ນິຕິກຳ (`GET /api/legal-documents/dashboard`)
*(ອະນຸຍາດ: ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ADMIN)*
- **Cards ສະຫຼຸບ**: ນິຕິກຳທັງໝົດ, ນິຕິກຳທີ່ຍັງນຳໃຊ້ (ACTIVE), ນິຕິກຳທີ່ຍົກເລີກ (INACTIVE), ຈຳນວນຝ່າຍທີ່ມີນິຕິກຳ.
- **Donut Chart**: ສັດສ່ວນຕາມ 9 ປະເພດນິຕິກຳ (`DocumentType`).
- **Bar Chart**: ຈຳນວນນິຕິກຳແຍກຕາມຫ້ອງການ/ຝ່າຍ (`Department`).

### 6.4 Dashboard ຄະດີຄວາມ (`GET /api/legal-cases/dashboard`)
*(ອະນຸຍາດ: ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ADMIN)*
- **Cards ສະຫຼຸບສະຖານະ**: ຄະດີທັງໝົດ, ຄະດີກຳລັງດຳເນີນ (ຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ), ຄະດີສຳເລັດ/ຈົບແລ້ວ.
- **Cards ສະຫຼຸບມູນຄ່າການເງິນ (ແຍກ 2 ສະກຸນເງິນ LAK & USD)**:
  - ມູນຄ່າຄວາມເສຍຫາຍລວມ (`damageLak` / `damageUsd`)
  - ມູນຄ່າຄ່າປັບໃໝລວມ (`fineLak` / `fineUsd`)
  - ລວມຍອດທີ່ຕ້ອງຊຳລະທັງໝົດ (`totalDueLak` / `totalDueUsd`)
  - ລວມຍອດທີ່ເກັບກູ້ຄືນໄດ້ແລ້ວ (`recoveredLak` / `recoveredUsd`)
- **Donut Charts**: ສັດສ່ວນຕາມສະຖານະຂັ້ນສານ (`DisputeStatus`) ແລະ ປະເພດຄະດີ (`CaseType`).
- **Bar Chart**: ຈຳນວນຄະດີແຍກຕາມຫ້ອງການ/ຝ່າຍ.

---

## 7. ການກຳນົດສະພາບແວດລ້ອມ ແລະ Docker Deployment

### 7.1 ຕົວແປສະພາບແວດລ້ອມ (Environment Variables)

| ຊື່ຕົວແປ (Environment Variable) | ຄ່າຕົວຢ່າງ (Development) | ຄ່າຕົວຢ່າງ (Docker) | ຄຳອະທິບາຍ |
| :--- | :--- | :--- | :--- |
| `PORT` | `3001` | `3001` | ພອດທີ່ NestJS Server ຮັບການເຊື່ອມຕໍ່ |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/legal_contract_db?schema=public` | `postgresql://user:pass@host.docker.internal:5432/legal_contract_db?schema=public` | Connection URL ສຳລັບ PostgreSQL |
| `JWT_SECRET` | `super_secret_key...` | `super_secret_key...` | Secret Key ສຳລັບເຊັນ ແລະ ກວດສອບ JWT Token |
| `HRM_SYNC_USERNAME` | `Ton` | `Ton` | Username ບັນຊີລະບົບສຳລັບ Sync ຂໍ້ມູນກັບ HRM |
| `HRM_SYNC_PASSWORD` | `HRM1234` | `HRM1234` | Password ບັນຊີລະບົບສຳລັບ Sync ຂໍ້ມູນກັບ HRM |
| `UPLOAD_DIR` | `./uploads/contracts` | `/app/uploads/contracts` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບສັນຍາທົ່ວໄປ |
| `UPLOAD_DIR_POWER_CONTRACTS` | `./uploads/power-contracts` | `/app/uploads/power-contracts` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບສັນຍາຊື້-ຂາຍໄຟຟ້າ |
| `UPLOAD_DIR_LEGAL_DOCS` | `./uploads/legal-documents` | `/app/uploads/legal-documents` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບນິຕິກຳ |
| `UPLOAD_DIR_LEGAL_CASES` | `./uploads/legal-cases` | `/app/uploads/legal-cases` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບສຳນວນຄະດີ |
| `TICKET_UPLOAD_DIR` | `./uploads/tickets` | `/app/uploads/tickets` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບແຈ້ງບັນຫາ Support |

### 7.2 ຂັ້ນຕອນການ Deploy ຜ່ານ Docker Compose

```bash
# 1. ສ້າງໄຟລ໌ Environment ສຳລັບ Docker
cp .env.docker.example .env.docker

# 2. Build Image ແລະ Run Containers
docker compose --env-file .env.docker up -d --build

# 3. ກວດສອບສະຖານະການເຮັດວຽກຂອງ Service
docker compose ps
docker compose logs -f api
```

---
*(ເອກະສານສະບັບນີ້ຖືກປັບປຸງລ່າສຸດ ໂດຍອ້າງອີງຕາມສະຖາປັດຕະຍະກຳ 3 ເສົາຫຼັກ, Dynamic Custom Roles, Pure Stateless JWT Token Versioning, ແລະ ຖານຂໍ້ມູນຕົວຈິງຂອງລະບົບ)*
