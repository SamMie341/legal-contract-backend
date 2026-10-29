# ລະບົບຄຸ້ມຄອງສັນຍາ, ນິຕິກຳ ແລະ ຄະດີຄວາມ ໄຟຟ້າລາວ (EDL)
## System Architecture, Workflows & Module Specification

---

## 1. ພາບລວມລະບົບ (System Overview)

ລະບົບຄຸ້ມຄອງວຽກງານກົດໝາຍ ຂອງ **ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)** ເປັນລະບົບ Backend ທີ່ພັດທະນາດ້ວຍ **NestJS (Node.js ESM + TypeScript)**, **Prisma ORM 7** ແລະ **PostgreSQL** ພາຍໃຕ້ສະຖາປັດຕະຍະກຳ **Clean Architecture (4 Layers)**.

ລະບົບແບ່ງອອກເປັນ **2 ພະແນກຫຼັກ** ຕາມໂຄງສ້າງການຈັດຕັ້ງຂອງ ຝ່າຍກົດໝາຍ ໄຟຟ້າລາວ:
1. **ພະແນກສັນຍາທົ່ວໄປ (General Contracts Division)**: 
   - ຕິດຕາມສັນຍາ 14 ປະເພດ (O&M, EPC, ເຊົ່າດິນ, MOA, PTA, ແລະອື່ນໆ).
   - ແຈ້ງເຕືອນສັນຍາໃກ້ໝົດອາຍຸອັດຕະໂນມັດ (Automated Cron Job ທຸກທ່ຽງຄືນ &le; 60 ວັນ).
   - ຄຸ້ມຄອງມູນຄ່າສັນຍາ 3 ສະກຸນເງິນ (LAK, USD, CNY).
   - ຈັດເກັບ ແລະ ຈັດການໄຟລ໌ແນບສັນຍາ (Upload, Preview Inline, Download, Delete).
   - ສະຫຼຸບ Dashboard ສະຖິຕິສັນຍາ, ກຣາບສະຖານະ, ສະກຸນເງິນ ແລະ ມູນຄ່າລວມ.
2. **ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal Affairs & Dispute Resolution Division)** ຮັບຜິດຊອບ 2 ວຽກງານຫຼັກ:
   - **ວຽກງານນິຕິກຳ (Legal Documents)**: ຄຸ້ມຄອງນິຕິກຳ, ລະບຽບການ, ຂໍ້ກຳນົດ, ແຈ້ງການ, ປຶ້ມຄູ່ມື, ຈັດໝວດໝູ່ຕາມປີ/ຝ່າຍ, ໄຟລ໌ເອກະສານແນບ, ແລະ Dashboard ສະຖິຕິນິຕິກຳ.
   - **ວຽກງານແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ດຳເນີນຄະດີ (Dispute Resolution & Litigation)**: ຕິດຕາມສຳນວນຄະດີແພ່ງ, ອາຍາ, ການຄ້າ, ບໍລິຫານ; ຂັ້ນຕອນສານ 3 ຂັ້ນ (ສານຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ); ມູນຄ່າການເງິນ 2 ສະກຸນ (LAK & USD: ມູນຄ່າຄວາມເສຍຫາຍ, ຄ່າປັບໃໝ, ລວມຍອດຕ້ອງຊຳລະ, ຍອດກູ້ຄືນໄດ້); ໄຟລ໌ສຳນວນຄະດີ, ແລະ Dashboard ຄະດີຄວາມ.

> [!IMPORTANT]
> **ຫຼັກການແຍກສິດຂາດລະຫວ່າງພະແນກ (Division Isolation):**
> ລະບົບມີກົນໄກ **Division Guard** ແລະ **assertCanAccessModule** ເພື່ອແຍກສິດລະຫວ່າງ 2 ພະແນກຢ່າງເດັດຂາດ:
> - ພະນັກງານ **ພະແນກສັນຍາທົ່ວໄປ** ຈະເຂົ້າເຖິງໄດ້ສະເພາະໂມດູນສັນຍາ (`contracts`, `contract-types`) ແລະ ໂມດູນກາງ. ບໍ່ມີສິດເບິ່ງ ຫຼື ແກ້ໄຂ ໂມດູນນິຕິກຳ ຫຼື ຄະດີຄວາມ.
> - ພະນັກງານ **ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ** ຈະເຂົ້າເຖິງໄດ້ສະເພາະໂມດູນນິຕິກຳ (`legal-documents`) ແລະ ຄະດີຄວາມ (`legal-cases`) ແລະ ໂມດູນກາງ. ບໍ່ມີສິດເບິ່ງ ຫຼື ແກ້ໄຂ ໂມດູນສັນຍາ.
> - **ADMIN** ສາມາດເຂົ້າເຖິງ ແລະ ຈັດການໄດ້ທຸກໂມດູນທົ່ວທັງລະບົບ.

---

## 2. ຜັງສະຖາປັດຕະຍະກຳລວມ (High-Level System Architecture)

```mermaid
graph TD
    subgraph ClientLayer["1. Client Layer (Frontend & Consumers)"]
        WebAdmin["Web Application (React / Next.js / Vue Admin Portal)"]
        MobileApp["Mobile / Tablet Clients"]
        SwaggerUI["Swagger API Docs (/api/docs)"]
    end

    subgraph GatewayLayer["2. API Gateway & Security Layer (Multi-Layer Protection)"]
        JwtGuard["1. JwtAuthGuard (Token Validation & User Profile Extraction)"]
        RolesGuard["2. RolesGuard (RBAC: ADMIN, MAIN_USER, EDITOR, VIEWER)"]
        DivisionGuard["3. DivisionGuard (@RequiredModule: Division Isolation)"]
        FineGrained["4. Use Case Guards (canView, canUpload, canEdit, canDelete, canDownload)"]
    end

    subgraph CoreModules["3. Business Logic Modules (Clean Architecture)"]
        subgraph DivContracts["ໂມດູນສະເພາະ: ພະແນກສັນຍາທົ່ວໄປ"]
            M_Contracts["ContractsModule (Core Contracts & Cron)"]
            M_CTypes["ContractTypesModule (14 Master Types)"]
        end

        subgraph DivLegal["ໂມດູນສະເພາະ: ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ"]
            M_Docs["LegalDocumentsModule (Regulations & Notices)"]
            M_Cases["LegalCasesModule (Disputes & Financials)"]
        end

        subgraph DivCommon["ໂມດູນກາງ (ໃຊ້ຮ່ວມກັນທຸກພະແນກ)"]
            M_Auth["AuthModule (HRM SSO / Local Login + accessibleModules)"]
            M_Depts["DepartmentsModule (HRM Sync & Dropdown)"]
            M_Support["SupportModule (Tickets & Contact Channels)"]
        end

        subgraph DivAdmin["ໂມດູນສະເພາະ: ADMIN"]
            M_Users["UsersModule (User Management, HRM Sync & Fallback)"]
            M_Audit["AuditLogsModule (Activity & Change Tracking)"]
        end
    end

    subgraph InfraLayer["4. Infrastructure & External Services"]
        HRM_API["EDL HRM API (https://api-test.edl.com.la/hrm/api) [ພ້ອມ Local Fallback]"]
        CronService["Cron Scheduler (ທຸກທ່ຽງຄືນ 00:00: ກວດສອບສັນຍາໝົດອາຍຸ)"]
        StorageEngine["Disk Storage Engine (/uploads/contracts, /docs, /cases, /tickets)"]
        PostgresDB[("PostgreSQL Database (Prisma ORM 7 + BigInt JSON Support)")]
    end

    ClientLayer --> GatewayLayer
    GatewayLayer --> CoreModules
    M_Auth --> HRM_API
    M_Users --> HRM_API
    M_Depts --> HRM_API
    M_Contracts --> CronService
    M_Contracts --> StorageEngine
    M_Docs --> StorageEngine
    M_Cases --> StorageEngine
    M_Support --> StorageEngine
    CoreModules --> PostgresDB
```

---

## 3. ການແຍກໂມດູນຫຼັກ (Core Modules Breakdown)

ລະບົບຖືກອອກແບບຕາມ **Clean Architecture 4 Layers**:
- **Domain Layer**: Entity Models, Repository Interfaces, Enums (`Division`, `SystemModule`, `UserRole`, `ContractStatus`, ແລະອື່ນໆ).
- **Infrastructure Layer**: Prisma Repositories, Database Transactions, HRM HTTP Client, File Storage Engine.
- **Application Layer**: Use Cases (Business Logic & Validation), Data Transfer Objects (DTOs), Helpers (`DivisionHelper`, `normalizeLaoText`).
- **Presentation Layer**: REST Controllers (Routing, Swagger, Guard Decorators `@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)`, File Streaming).

```mermaid
flowchart LR
    subgraph Layers["Clean Architecture 4-Layer Pattern"]
        Pres["Presentation Layer<br/>(Controllers, Swagger, Guards)"] --> App["Application Layer<br/>(Use Cases, DTOs, Helpers)"]
        App --> Domain["Domain Layer<br/>(Interfaces, Enums, Entities)"]
        App --> Infra["Infrastructure Layer<br/>(Prisma, HRM API, Storage)"]
        Infra -. implements .-> Domain
    end
```

### ລາຍລະອຽດແຕ່ລະໂມດູນ:

| # | ຊື່ໂມດູນ | ເສັ້ນທາງໂຟລເດີ | ໂມດູນລະບົບ / ສິດພະແນກ | ຕາຕະລາງ DB | ໜ້າທີ່ຫຼັກ ແລະ API Endpoints ສຳຄັນ |
| :- | :--- | :--- | :--- | :--- | :--- |
| **01** | `AuthModule` | `src/modules/auth` | Common (ທຸກຄົນ) | `users` | - Login ຜ່ານ EDL HRM API (`/api/auth/login`) ຫຼື ລະຫັດຜ່ານພາຍໃນ<br/>- ອອກ JWT Token ພ້ອມ Role, Division, ແລະ Permissions<br/>- ສົ່ງຄືນ `accessibleModules` ອັດຕະໂນມັດຕາມ Division ຂອງຜູ້ໃຊ້<br/>- `GET /api/auth/profile` ດຶງຂໍ້ມູນຜູ້ໃຊ້ປັດຈຸບັນ |
| **02** | `UsersModule` | `src/modules/users` | Admin Only | `users` | - ດຶງຂໍ້ມູນພະນັກງານຈາກ HRM (`GET /api/users/hrm/:empCode`)<br/>- ສ້າງຜູ້ໃຊ້ໃໝ່ດ້ວຍ HRM Sync ພ້ອມ **Fallback Mechanism** (ຫາກ HRM ບໍ່ສາມາດເຊື່ອມຕໍ່ໄດ້ ຈະໃຊ້ຂໍ້ມູນ manual: `division`, `department`, `fullName`, `email`, `phone`)<br/>- ກຳນົດບົດບາດ (`role`), ພະແນກ (`division`), ແລະ ສິດລະອຽດ (`canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload`)<br/>- Soft Delete & Update ບັນຊີຜູ້ໃຊ້ |
| **03** | `DepartmentsModule` | `src/modules/departments` | Common (ທຸກຄົນ) | `departments` | - Sync ຫ້ອງການ/ຝ່າຍຈາກ HRM ອັດຕະໂນມັດ (`POST /api/departments/sync`)<br/>- Dropdown ລາຍຊື່ຝ່າຍສຳລັບ Form ທຸກໂມດູນ (`GET /api/departments/dropdown`)<br/>- CRUD ຫ້ອງການ/ຝ່າຍ ພ້ອມລະບົບປ້ອງກັນການລົບຫາກມີຂໍ້ມູນຜູກມັດ |
| **04** | `ContractTypesModule` | `src/modules/contract-types` | `SystemModule.CONTRACT_TYPES`<br/>(ສັນຍາທົ່ວໄປ / ADMIN) | `contract_types` | - ຄຸ້ມຄອງ 14 ປະເພດສັນຍາຫຼັກ (O&M, EPC, ເຊົ່າດິນ, MOA, PTA, ແລະອື່ນໆ)<br/>- Dropdown ປະເພດສັນຍາ (`GET /api/contract-types/dropdown`) |
| **05** | `ContractsModule` | `src/modules/contracts` | `SystemModule.CONTRACTS`<br/>(ສັນຍາທົ່ວໄປ / ADMIN) | `contracts`, `contract_attachments`, `notifications` | - ຄຸ້ມຄອງສັນຍາທັງໝົດ (DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED)<br/>- ຮອງຮັບ 3 ສະກຸນເງິນ: LAK, USD, CNY<br/>- Cron Service ກວດສອບສັນຍາໝົດອາຍຸທຸກທ່ຽງຄືນ ແລະ ແຈ້ງເຕືອນລ່ວງໜ້າ (&le; 60 ວັນ)<br/>- ໄຟລ໌ແນບ (Upload, Preview Inline, Download, Delete)<br/>- Dashboard ສະຖິຕິສັນຍາ (`GET /api/contracts/dashboard`) |
| **06** | `LegalDocumentsModule` | `src/modules/legal-documents` | `SystemModule.LEGAL_DOCUMENTS`<br/>(ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ / ADMIN) | `legal_documents`, `document_attachments` | - ຄຸ້ມຄອງນິຕິກຳ (ລະບຽບການ, ຂໍ້ກຳນົດ, ແຈ້ງການ, ສັນຍາ, ຄູ່ມື, ອື່ນໆ)<br/>- ສະຖານະນິຕິກຳ (ACTIVE / INACTIVE), ປີອອກ, ເລກທີ, ຝ່າຍທີ່ຮັບຜິດຊອບ<br/>- ໄຟລ໌ແນບນິຕິກຳ (Upload, Preview Inline, Download, Soft Delete)<br/>- Dashboard ນິຕິກຳ (`GET /api/legal-documents/dashboard`) |
| **07** | `LegalCasesModule` | `src/modules/legal-cases` | `SystemModule.LEGAL_CASES`<br/>(ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ / ADMIN) | `legal_cases`, `case_attachments` | - ຄຸ້ມຄອງຄະດີ ແລະ ຂໍ້ຂັດແຍ່ງ (ການຄ້າ, ແພ່ງ, ອາຍາ, ບໍລິຫານ)<br/>- ສະຖານະຂັ້ນສານ: ສານຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ, ຈົບຄະດີ, ສຳເລັດ<br/>- ການເງິນແຍກ 2 ສະກຸນ (LAK & USD): ຄວາມເສຍຫາຍ, ຄ່າປັບໃໝ, ລວມຍອດຕ້ອງຊຳລະ (Auto calculate), ຍອດກູ້ຄືນໄດ້<br/>- ໄຟລ໌ສຳນວນຄະດີ (Upload, Preview Inline, Download, Soft Delete)<br/>- Dashboard ຄະດີຄວາມ (`GET /api/legal-cases/dashboard`) |
| **08** | `SupportModule` | `src/modules/support` | Common (ທຸກຄົນ) | `system_contact_channels`, `support_tickets` | - ຊ່ອງທາງຕິດຕໍ່ IT Support, ສາຍດ່ວນ, WhatsApp<br/>- ລະບົບແຈ້ງບັນຫາ/ຂໍປັບປຸງລະບົບ (Open, In Progress, Resolved, Closed) |
| **09** | `AuditLogsModule` | `src/modules/audit-logs` | Admin Only | `audit_logs` | - ບັນທຶກປະຫວັດການດຳເນີນງານທັງໝົດໃນລະບົບ (Create, Update, Delete, Upload, Download)<br/>- ເກັບ Old Values ແລະ New Values ແບບ JSONB ພ້ອມ IP Address ແລະ User ID |

---

## 4. ຂັ້ນຕອນການເຮັດວຽກຂອງລະບົບ (System Workflows)

### 4.1 ຂັ້ນຕອນການຢັ້ງຢືນຕົວຕົນ ແລະ ການແຈ້ງລາຍຊື່ໂມດູນທີ່ມີສິດ (Authentication & Module Discovery Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as ຜູ້ໃຊ້ງານ (Client)
    participant Nest as NestJS (AuthModule)
    participant HRM as EDL HRM API Server
    participant Helper as DivisionHelper (getAccessibleModules)
    participant DB as PostgreSQL Database

    User->>Nest: POST /api/auth/login { username, password }
    Nest->>HRM: POST /hrm/api/hrms/login
    alt ຂໍ້ມູນຖືກຕ້ອງໃນ HRM
        HRM-->>Nest: 200 OK { token, user_info }
        Nest->>DB: ຄົ້ນຫາບັນຊີຜູ້ໃຊ້ຕາມ username
        alt ມີຜູ້ໃຊ້ໃນລະບົບແລ້ວ
            DB-->>Nest: User Data (role, division, permissions)
        else ຍັງບໍ່ມີບັນຊີໃນລະບົບ
            Nest->>DB: ສ້າງບັນຊີໃໝ່ Auto-Sync ຈາກ HRM Profile
            DB-->>Nest: Created User Data
        end
        Nest->>Helper: getAccessibleModules(user)
        Helper-->>Nest: [accessibleModules List] (ເຊັ່ນ: contracts, contract-types, departments, support)
        Nest->>Nest: ສ້າງ JWT Access Token (userId, role, division, permissions)
        Nest-->>User: 200 OK { accessToken, userProfile: { ..., accessibleModules } }
    else ລະຫັດຜ່ານຜິດ / ບໍ່ພົບໃນ HRM
        Nest->>DB: ກວດສອບບັນຊີທ້ອງຖິ່ນ (Local Admin/Fallback User)
        alt ຖືກຕ້ອງ
            Nest->>Helper: getAccessibleModules(user)
            Nest-->>User: 200 OK { accessToken, userProfile: { ..., accessibleModules } }
        else ບໍ່ຖືກຕ້ອງ
            Nest-->>User: 401 Unauthorized (Invalid credentials)
        end
    end
```

---

### 4.2 ວົງຈອນຊີວິດຂອງສັນຍາ ແລະ ການແຈ້ງເຕືອນອັດຕະໂນມັດ (Contract Lifecycle Flow)

```mermaid
stateDiagram-v2
    [*] --> DRAFT: ວັນທີມີຜົນສັກສິດ (effectiveDate) ຢູ່ໃນອະນາຄົດ
    [*] --> ACTIVE: ວັນທີມີຜົນສັກສິດ &le; ປັດຈຸບັນ
    DRAFT --> ACTIVE: ເມື່ອຮອດວັນທີເລີ່ມມີຜົນສັກສິດ

    state "ACTIVE (ມີຜົນບັງຄັບໃຊ້)" as ACTIVE
    state "EXPIRING_SOON (ໃກ້ໝົດອາຍຸ)" as EXPIRING_SOON
    state "EXPIRED (ໝົດອາຍຸແລ້ວ)" as EXPIRED
    state "TERMINATED (ຍົກເລີກກ່ອນກຳນົດ)" as TERMINATED

    ACTIVE --> EXPIRING_SOON: Cron Job (ທຸກທ່ຽງຄືນ) ເມື່ອເຫຼືອ &le; 60 ວັນ
    EXPIRING_SOON --> EXPIRED: Cron Job (ທຸກທ່ຽງຄືນ) ເມື່ອວັນທີກາຍ expirationDate
    ACTIVE --> EXPIRED: Cron Job ກວດພົບວັນທີກາຍກຳນົດ
    ACTIVE --> TERMINATED: ຜູ້ມີສິດ Admin / Main User ກົດຍົກເລີກສັນຍາ
    EXPIRING_SOON --> TERMINATED: ຍົກເລີກກ່ອນກຳນົດ

    note right of EXPIRING_SOON
        ລະບົບສ້າງ Notification 
        ແຈ້ງເຕືອນຜູ້ກ່ຽວຂ້ອງອັດຕະໂນມັດ
    end note
```

---

### 4.3 ຂັ້ນຕອນການຈັດການນິຕິກຳ ແລະ ໄຟລ໌ແນບ (Legal Documents & Attachment Workflow)

```mermaid
flowchart TD
    Start(["ເລີ່ມຕົ້ນ"]) --> CheckAuth{"1. ກວດສອບ JWT<br/>(JwtAuthGuard)"}
    CheckAuth -- "ບໍ່ຜ່ານ" --> Err401["401 Unauthorized"]
    CheckAuth -- "ຜ່ານ" --> CheckDiv{"2. ກວດສອບ Division<br/>(DivisionGuard: LEGAL_DOCUMENTS)"}
    
    CheckDiv -- "ບໍ່ແມ່ນ ພະແນກນິຕິກຳ & ບໍ່ແມ່ນ Admin" --> ErrDiv403["403 Forbidden: ອະນຸຍາດສະເພາະ ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ"]
    CheckDiv -- "ຜ່ານ" --> ActionType{"3. ເລືອກການກະທຳ"}

    %% Action: Create Document
    ActionType -- "ສ້າງນິຕິກຳໃໝ່" --> CheckUploadRole{"ມີສິດ canUpload / Admin?"}
    CheckUploadRole -- "ບໍ່ມີ" --> Err403["403 Forbidden: canUpload required"]
    CheckUploadRole -- "ມີ" --> ValDept{"ກວດສອບ departmentId<br/>ມີໃນລະບົບ ຫຼື ບໍ່?"}
    ValDept -- "ບໍ່ພົບ" --> Err400["400 Bad Request: ບໍ່ພົບຫ້ອງການ/ຝ່າຍ"]
    ValDept -- "ພົບ" --> SaveDoc["ບັນທຶກລົງຕາຕະລາງ legal_documents"]
    SaveDoc --> AuditDoc["ບັນທຶກ AuditLog: CREATE_LEGAL_DOCUMENT"]
    AuditDoc --> ResDoc["ສົ່ງຜົນການສ້າງສຳເລັດ 201 Created"]

    %% Action: Attachments
    ActionType -- "ອັບໂຫຼດໄຟລ໌ແນບ" --> MulterCheck{"ກວດສອບໄຟລ໌<br/>PDF/ຮູບພາບ & &le; 25MB"}
    MulterCheck -- "ບໍ່ຖືກຕ້ອງ" --> ErrFile["400 Bad Request: ອະນຸຍາດສະເພາະ PDF & ຮູບພາບ"]
    MulterCheck -- "ຖືກຕ້ອງ" --> SaveFileDisk["ບັນທຶກໄຟລ໌ລົງ Disk (UPLOAD_DIR_LEGAL_DOCS)"]
    SaveFileDisk --> SaveFileDB["ບັນທຶກລົງຕາຕະລາງ document_attachments"]
    SaveFileDB --> ResFile["200 OK: ອັບໂຫຼດໄຟລ໌ສຳເລັດ"]

    %% Action: Preview / Download
    ActionType -- "Preview / Download" --> CheckPerm{"ກວດສອບສິດ<br/>canView / canDownload"}
    CheckPerm -- "Preview (canView)" --> StreamInline["Stream ໄຟລ໌ແບບ Content-Disposition: inline"]
    CheckPerm -- "Download (canDownload)" --> StreamAtt["Stream ໄຟລ໌ແບບ Content-Disposition: attachment"]
```

---

### 4.4 ຂັ້ນຕອນການດຳເນີນຄະດີ ແລະ ການຕິດຕາມການເງິນ (Legal Case & Dispute Resolution Flow)

```mermaid
flowchart TD
    CreateCase["1. ສ້າງສຳນວນຄະດີ (POST /api/legal-cases)<br/>ກວດສອບ Division: LEGAL_AND_DISPUTE"] --> AutoCalc["ຄຳນວນຍອດລວມອັດຕະໂນມັດ:<br/>totalDueLak = damageLak + fineLak<br/>totalDueUsd = damageUsd + fineUsd"]
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

### 4.5 ລະບົບສິດທິ ແລະ ການຄວບຄຸມການເຂົ້າເຖິງ 3 ຂັ້ນຕອນ (Multi-Layer Access Control & Security Model)

ລະບົບໃຊ້ການຄວບຄຸມຄວາມປອດໄພແບບ 3 ຊັ້ນ (3-Layer Authorization):
1. **ຊັ້ນທີ 1: Token Authentication (`JwtAuthGuard`)** - ກວດສອບຄວາມຖືກຕ້ອງຂອງ Bearer Token ແລະ ດຶງຂໍ້ມູນ User Profile.
2. **ຊັ້ນທີ 2: Division Isolation (`DivisionGuard` + `@RequiredModule`)** - ກວດສອບສິດການເຂົ້າເຖິງໂມດູນຕາມພະແນກ (Division).
3. **ຊັ້ນທີ 3: Fine-Grained Permissions & Role (`RolesGuard` + Use Case Checks)** - ກວດສອບ Role ແລະ Flag ສິດທິລະອຽດ (`canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload`).

```mermaid
graph TD
    subgraph MultiLayerSecurity["3-Layer Access Control Model"]
        L1["ຊັ້ນທີ 1: JwtAuthGuard<br/>(ຢັ້ງຢືນຕົວຕົນ / Active User)"]
        L2["ຊັ້ນທີ 2: DivisionGuard<br/>(ກວດສອບພະແນກ: Contracts vs Legal & Dispute)"]
        L3["ຊັ້ນທີ 3: Roles & Permissions<br/>(ADMIN, MAIN_USER, EDITOR, VIEWER + canUpload, canEdit, canDelete, ...)"]
        
        L1 --> L2
        L2 --> L3
        L3 --> Execute["ດຳເນີນການ Business Logic ໃນ Use Case"]
    end
```

#### ຕາຕະລາງສິດການເຂົ້າເຖິງໂມດູນຕາມ Division (Division Access Matrix):

| ໂມດູນລະບົບ (`SystemModule`) | ພະແນກທີ່ອະນຸຍາດ (`Division`) | ບົດບາດ / ສິດທີ່ຕ້ອງມີ | ລາຍລະອຽດ |
| :--- | :--- | :--- | :--- |
| `contracts` | **ພະແນກສັນຍາທົ່ວໄປ** (ຫຼື `ADMIN`) | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` | ຄຸ້ມຄອງສັນຍາ, ໄຟລ໌ແນບ, Dashboard ສັນຍາ (ພະແນກອື່ນຖືກບລັອກ) |
| `contract-types` | **ພະແນກສັນຍາທົ່ວໄປ** (ຫຼື `ADMIN`) | ເບິ່ງ Dropdown: `canView`<br/>ຈັດການ Type: `ADMIN` | ຄຸ້ມຄອງ 14 ປະເພດສັນຍາ |
| `legal-documents` | **ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ** (ຫຼື `ADMIN`) | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` | ຄຸ້ມຄອງນິຕິກຳ, ໄຟລ໌ແນບ, Dashboard ນິຕິກຳ (ພະແນກອື່ນຖືກບລັອກ) |
| `legal-cases` | **ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ** (ຫຼື `ADMIN`) | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` | ຄຸ້ມຄອງຄະດີຄວາມ, ໄຟລ໌ແນບ, Dashboard ຄະດີ (ພະແນກອື່ນຖືກບລັອກ) |
| `departments` | **ທຸກພະແນກ** (Shared / Master Data) | Dropdown: Login ແລ້ວເຂົ້າໄດ້<br/>Sync ຈາກ HRM: `ADMIN` | ຫ້ອງການ/ຝ່າຍ ສຳລັບ Form ທຸກໂມດູນ |
| `support` | **ທຸກພະແນກ** (Shared) | Login ແລ້ວສ້າງ Ticket / ເບິ່ງຊ່ອງທາງຕິດຕໍ່ໄດ້ | ຕິດຕໍ່ IT Support, ແຈ້ງບັນຫາລະບົບ |
| `users` | **ADMIN ເທົ່ານັ້ນ** | `ADMIN` | ຈັດການຜູ້ໃຊ້, ກຳນົດ Role, Division, Permissions |
| `audit-logs` | **ADMIN ເທົ່ານັ້ນ** | `ADMIN` | ກວດສອບປະຫວັດການດຳເນີນງານທັງໝົດ |

#### ການກວດສອບຊື່ພະແນກພາສາລາວ (Lao Text Normalization):
ຟັງຊັນ `normalizeLaoText` ຊ່ວຍປັບຮູບແບບຂໍ້ຄວາມພາສາລາວໃຫ້ເປັນມາດຕະຖານດຽວກັນ ກ່ອນກວດສອບຊື່ພະແນກ:
- ແປງສະຫຼະອຳປະສົມ (`\u0eb2\u0ecd` ຫຼື `\u0ecd\u0eb2`) ໃຫ້ເປັນສະຫຼະອຳດ່ຽວ (`\u0eb3`).
- ຕັດຊ່ອງຫວ່າງເກີນ (Multiple whitespaces) ແລະ Trim ຫົວ-ທ້າຍ.
- ຮອງຮັບທັງຊື່ເຕັມ ແລະ ຊື່ຫຍໍ້ ເຊັ່ນ: `ພະແນກສັນຍາທົ່ວໄປ`, `ພະແນກສັນຍາ`, `ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ`, `ພະແນກນິຕິກຳ`, `ພະແນກແກ້ໄຂຂໍ້ຂັດແຍ່ງ`.

---

### 4.6 ກົນໄກການເພີ່ມຜູ້ໃຊ້ ແລະ HRM Sync Fallback (User Creation & HRM Fallback Flow)

```mermaid
flowchart TD
    Start(["Admin ສ້າງຜູ້ໃຊ້ໃໝ່ (POST /api/users)"]) --> CheckExist{"ກວດສອບ employeeCode<br/>ມີໃນຖານຂໍ້ມູນແລ້ວ ຫຼື ບໍ່?"}
    CheckExist -- "ມີແລ້ວ" --> Conflict["409 Conflict: ພະນັກງານລະຫັດນີ້ມີໃນລະບົບແລ້ວ"]
    CheckExist -- "ຍັງບໍ່ມີ" --> CallHRM["ເຊື່ອມຕໍ່ EDL HRM API<br/>(login & getEmployeeByCode)"]

    CallHRM -- "HRM ເຊື່ອມຕໍ່ສຳເລັດ" --> UseHRM["ດຶງຂໍ້ມູນອັດຕະໂນມັດຈາກ HRM:<br/>- ຊື່ ແລະ ນາມສະກຸນ<br/>- ພະແນກ (division), ຫ້ອງການ/ຝ່າຍ (department)<br/>- ຕຳແໜ່ງ (position), ອີເມວ (email), ເບີໂທ (phone)"]
    CallHRM -- "HRM ເຊື່ອມຕໍ່ບໍ່ໄດ້ / Error" --> Fallback["Fallback Mode:<br/>ບັນທຶກ Log Warning ແລະ ນຳໃຊ້ຂໍ້ມູນທີ່ Admin ປ້ອນຜ່ານ DTO:<br/>- dto.division, dto.department<br/>- dto.fullName, dto.email, dto.phone"]

    UseHRM --> HashPass["Hash ລະຫັດຜ່ານເລີ່ມຕົ້ນ (EDL@{empCode})"]
    Fallback --> HashPass
    HashPass --> SaveUser["ບັນທຶກຜູ້ໃຊ້ລົງຖານຂໍ້ມູນ<br/>ພ້ອມ Role, Division, ແລະ Permissions ທີ່ກຳນົດ"]
    SaveUser --> Success["201 Created: ເພີ່ມຜູ້ໃຊ້ສຳເລັດ"]
```

---

## 5. ໂຄງສ້າງຖານຂໍ້ມູນສຳພັນ (Entity-Relationship Diagram - ERD)

```mermaid
erDiagram
    departments ||--o{ contracts : "departmentId"
    departments ||--o{ legal_documents : "departmentId"
    departments ||--o{ legal_cases : "departmentId"

    contract_types ||--o{ contracts : "contractTypeId"

    users ||--o{ contracts : "createdById / updatedById"
    users ||--o{ contract_attachments : "uploadedById"
    users ||--o{ legal_documents : "createdById / updatedById"
    users ||--o{ document_attachments : "uploadedById"
    users ||--o{ legal_cases : "createdById / updatedById"
    users ||--o{ case_attachments : "uploadedById"
    users ||--o{ notifications : "userId"
    users ||--o{ audit_logs : "userId"
    users ||--o{ support_tickets : "createdById"

    contracts ||--o{ contract_attachments : "contractId"
    contracts ||--o{ notifications : "contractId"
    contracts ||--o{ audit_logs : "contractId"

    legal_documents ||--o{ document_attachments : "legalDocumentId"
    legal_cases ||--o{ case_attachments : "legalCaseId"

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

    users {
        uuid id PK
        string employee_code UK
        string username UK
        string password_hash
        string full_name
        string department
        string division "ພະແນກສັນຍາທົ່ວໄປ / ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ"
        string unit
        string position
        string email
        string phone
        enum role "ADMIN, MAIN_USER, EDITOR, VIEWER"
        boolean is_active
        boolean can_view
        boolean can_upload
        boolean can_edit
        boolean can_delete
        boolean can_download
        timestamp created_at
        timestamp deleted_at
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

## 6. ສະຫຼຸບຕາຕະລາງ Dashboard ສະຖິຕິແຕ່ລະລະບົບ

### 6.1 Dashboard ສັນຍາ (`GET /api/contracts/dashboard`)
*(ອະນຸຍາດສະເພາະ: ພະແນກສັນຍາທົ່ວໄປ ແລະ ADMIN)*
- **Cards ສະຫຼຸບ**: ສັນຍາທັງໝົດ, ສັນຍາໃກ້ໝົດອາຍຸ (&le; 60 ວັນ), ສັນຍາທີ່ໝົດອາຍຸແລ້ວ.
- **ກຣາບແຍກຕາມສະຖານະ**: DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED.
- **ກຣາບແຍກຕາມສະກຸນເງິນ & ມູນຄ່າ**: LAK, USD, CNY.
- **ກຣາບແຍກຕາມ 14 ປະເພດສັນຍາ**.

### 6.2 Dashboard ນິຕິກຳ (`GET /api/legal-documents/dashboard`)
*(ອະນຸຍາດສະເພາະ: ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ADMIN)*
- **Cards ສະຫຼຸບ**: ນິຕິກຳທັງໝົດ, ນິຕິກຳທີ່ຍັງນຳໃຊ້ (ACTIVE), ນິຕິກຳທີ່ຍົກເລີກ (INACTIVE), ຈຳນວນຝ່າຍທີ່ມີນິຕິກຳ.
- **Donut Chart**: ສັດສ່ວນຕາມ 9 ປະເພດນິຕິກຳ (`DocumentType`).
- **Bar Chart**: ຈຳນວນນິຕິກຳແຍກຕາມຫ້ອງການ/ຝ່າຍ (`Department`).

### 6.3 Dashboard ຄະດີຄວາມ (`GET /api/legal-cases/dashboard`)
*(ອະນຸຍາດສະເພາະ: ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ADMIN)*
- **Cards ສະຫຼຸບສະຖານະ**: ຄະດີທັງໝົດ, ຄະດີກຳລັງດຳເນີນ (ຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ), ຄະດີສຳເລັດ/ຈົບແລ້ວ.
- **Cards ສະຫຼຸບມູນຄ່າການເງິນ (ແຍກ 2 ສະກຸນເງິນ LAK & USD)**:
  - ມູນຄ່າຄວາມເສຍຫາຍລວມ (`damageLak` / `damageUsd`)
  - ມູນຄ່າຄ່າປັບໃໝລວມ (`fineLak` / `fineUsd`)
  - ລວມຍອດທີ່ຕ້ອງຊຳລະທັງໝົດ (`totalDueLak` / `totalDueUsd`)
  - ລວມຍອດທີ່ເກັບກູ້ຄືນໄດ້ແລ້ວ (`recoveredLak` / `recoveredUsd`)
- **Donut Charts**: ສັດສ່ວນຕາມສະຖານະຂັ້ນສານ (`DisputeStatus`) ແລະ ປະເພດຄະດີ (`CaseType`).
- **Bar Chart**: ຈຳນວນຄະດີແຍກຕາມຫ້ອງການ/ຝ່າຍ.

---

## 7. ການກຳນົດສະພາບແວດລ້ອມ ແລະ Docker Deployment (Environment & Deployment)

ລະບົບຮອງຮັບການ Deploy ຜ່ານ **Docker Compose** ແບບ Multi-stage build ພ້ອມຕັດແຍກ Volume ສຳລັບ Uploads:

### 7.1 ຕົວແປສະພາບແວດລ້ອມ (Environment Variables)

| ຊື່ຕົວແປ (Environment Variable) | ຄ່າຕົວຢ່າງ (Development) | ຄ່າຕົວຢ່າງ (Docker) | ຄຳອະທິບາຍ |
| :--- | :--- | :--- | :--- |
| `PORT` | `3001` | `3001` | ພອດທີ່ NestJS Server ຮັບການເຊື່ອມຕໍ່ |
| `API_PORT` | - | `3001` | ພອດທີ່ Expose ອອກມາເທິງ Host |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/legal_contract?schema=public` | `postgresql://user:pass@host.docker.internal:5432/legal_contract?schema=public` | Connection URL ສຳລັບ PostgreSQL |
| `JWT_SECRET` | `super_secret_key...` | `super_secret_key...` | Secret Key ສຳລັບເຊັນ ແລະ ກວດສອບ JWT Token |
| `HRM_SYNC_USERNAME` | `Ton` | `Ton` | Username ບັນຊີລະບົບສຳລັບ Sync ຂໍ້ມູນກັບ HRM |
| `HRM_SYNC_PASSWORD` | `HRM1234` | `HRM1234` | Password ບັນຊີລະບົບສຳລັບ Sync ຂໍ້ມູນກັບ HRM |
| `UPLOAD_DIR` | `./uploads/contracts` | `/app/uploads/contracts` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບສັນຍາ |
| `UPLOAD_DIR_LEGAL_DOCS` | `./uploads/legal-documents` | `/app/uploads/legal-documents` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບນິຕິກຳ |
| `UPLOAD_DIR_LEGAL_CASES` | `./uploads/legal-cases` | `/app/uploads/legal-cases` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບສຳນວນຄະດີ |
| `TICKET_UPLOAD_DIR` | `./uploads/tickets` | `/app/uploads/tickets` | ໂຟລເດີຈັດເກັບໄຟລ໌ແນບແຈ້ງບັນຫາ Support |

### 7.2 ຂັ້ນຕອນການ Deploy ຜ່ານ Docker Compose

```bash
# 1. ສ້າງໄຟລ໌ Environment ສຳລັບ Docker ຈາກ Example
cp .env.docker.example .env.docker

# 2. ແກ້ໄຂ DATABASE_URL, User, Password, Port ໃນ .env.docker ໃຫ້ຖືກຕ້ອງ

# 3. Build Image ແລະ Run Containers ພ້ອມ Auto-migration
docker compose --env-file .env.docker up -d --build

# 4. ກວດສອບສະຖານະການເຮັດວຽກຂອງ Service
docker compose ps
docker compose logs -f api
```

---
*(ເອກະສານສະບັບນີ້ຖືກປັບປຸງລ່າສຸດ ໂດຍອ້າງອີງຕາມລະຫັດໂຄງສ້າງ, Security Guards, Fallback Handling, ແລະ ຖານຂໍ້ມູນຕົວຈິງຂອງລະບົບ)*
