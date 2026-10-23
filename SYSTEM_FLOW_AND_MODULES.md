# ລະບົບຄຸ້ມຄອງສັນຍາ, ນິຕິກຳ ແລະ ຄະດີຄວາມ ໄຟຟ້າລາວ (EDL)
## System Architecture, Workflows & Module Specification

---

## 1. ພາບລວມລະບົບ (System Overview)

ລະບົບຄຸ້ມຄອງວຽກງານກົດໝາຍ ຂອງ **ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)** ເປັນລະບົບ Backend ທີ່ພັດທະນາດ້ວຍ **NestJS (Node.js ESM + TypeScript)**, **Prisma ORM 7** ແລະ **PostgreSQL** ພາຍໃຕ້ສະຖາປັດຕະຍະກຳ **Clean Architecture (4 Layers)**.

ລະບົບແບ່ງອອກເປັນ **3 ພາກສ່ວນຫຼັກ (Core Pillars)** ຕາມໂຄງສ້າງການຈັດຕັ້ງ:
1. **ພະແນກສັນຍາທົ່ວໄປ (General Contracts Division)**: ຕິດຕາມສັນຍາ 14 ປະເພດ, ແຈ້ງເຕືອນສັນຍາໃກ້ໝົດອາຍຸ (Automated Cron Job), ມູນຄ່າສັນຍາ 3 ສະກຸນເງິນ (LAK, USD, CNY), ແລະ ໄຟລ໌ແນບ.
2. **ພະແນກນິຕິກຳ (Legal Documents Division)**: ຄຸ້ມຄອງນິຕິກຳ, ລະບຽບການ, ຂໍ້ກຳນົດ, ແຈ້ງການ, ປຶ້ມຄູ່ມື, ຈັດໝວດໝູ່ຕາມປີ/ຝ່າຍ, ແລະ ໄຟລ໌ເອກະສານແນບ.
3. **ພະແນກແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ດຳເນີນຄະດີ (Dispute Resolution & Litigation Division)**: ຕິດຕາມສຳນວນຄະດີແພ່ງ/ອາຍາ/ການຄ້າ, ຂັ້ນຕອນສານ (ສານຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ), ມູນຄ່າຄວາມເສຍຫາຍ/ຄ່າປັບໃໝ/ຍອດກູ້ຄືນໄດ້ (LAK ແລະ USD), ແລະ ໄຟລ໌ສຳນວນຄະດີ.

---

## 2. ຜັງສະຖາປັດຕະຍະກຳລວມ (High-Level System Architecture)

```mermaid
graph TD
    subgraph ClientLayer["1. Client Layer (Frontend & Consumers)"]
        WebAdmin["Web Application (React / Vue Admin Portal)"]
        MobileApp["Mobile / Tablet Clients"]
        SwaggerUI["Swagger API Docs (/api/docs)"]
    end

    subgraph GatewayLayer["2. API Gateway & Security Layer"]
        JwtGuard["JwtAuthGuard (Bearer Token Verification)"]
        RolesGuard["RolesGuard (RBAC: ADMIN, MAIN_USER, EDITOR, VIEWER)"]
        FineGrained["Fine-Grained Permissions (canView, canUpload, canEdit, canDelete, canDownload)"]
    end

    subgraph CoreModules["3. Business Logic Modules (Clean Architecture)"]
        M_Auth["AuthModule (HRM SSO & JWT)"]
        M_Users["UsersModule (User Management & HRM Sync)"]
        M_Depts["DepartmentsModule (HRM Sync & Dropdown)"]
        M_CTypes["ContractTypesModule (14 Master Types)"]
        M_Contracts["ContractsModule (Core Contracts & Cron)"]
        M_Docs["LegalDocumentsModule (Regulations & Notices)"]
        M_Cases["LegalCasesModule (Disputes & Financials)"]
        M_Support["SupportModule (Tickets & Channels)"]
        M_Audit["AuditLogsModule (Activity Tracking)"]
    end

    subgraph InfraLayer["4. Infrastructure & External Services"]
        HRM_API["EDL HRM API (https://api-test.edl.com.la/hrm/api)"]
        CronService["Cron Scheduler (Everyday at 00:00)"]
        StorageEngine["Disk Storage Engine (/uploads/contracts, /docs, /cases)"]
        PostgresDB[("PostgreSQL Database (Prisma ORM 7)")]
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
    CoreModules --> PostgresDB
```

---

## 3. ການແຍກໂມດູນຫຼັກ (Core Modules Breakdown)

ລະບົບຖືກອອກແບບຕາມ **Clean Architecture 4 Layers**:
- **Domain Layer**: Entity Models, Repository Interfaces, Enum Types.
- **Infrastructure Layer**: Prisma Repositories, Database Transactions, HRM HTTP Client.
- **Application Layer**: Use Cases (Business Rules), Data Transfer Objects (DTOs).
- **Presentation Layer**: REST Controllers (Routing, Swagger, Guard Decorators, File Streaming).

```mermaid
flowchart LR
    subgraph Layers["Clean Architecture 4-Layer Pattern"]
        Pres["Presentation Layer<br/>(Controllers, Swagger)"] --> App["Application Layer<br/>(Use Cases, DTOs)"]
        App --> Domain["Domain Layer<br/>(Interfaces, Enums)"]
        App --> Infra["Infrastructure Layer<br/>(Prisma Repositories)"]
        Infra -. implements .-> Domain
    end
```

### ລາຍລະອຽດແຕ່ລະໂມດູນ:

| # | ຊື່ໂມດູນ | ເສັ້ນທາງໂຟລເດີ | ຕາຕະລາງ DB ທີ່ຮັບຜິດຊອບ | ໜ້າທີ່ຫຼັກ ແລະ API Endpoint ສຳຄັນ |
| :- | :--- | :--- | :--- | :--- |
| **01** | `AuthModule` | `src/modules/auth` | `users` | - ຢັ້ງຢືນຕົວຕົນຜ່ານ EDL HRM API (`/hrm/api/hrms/login`)<br/>- ອອກ JWT Access Token ພ້ອມ Role & Permissions<br/>- Cache HRM Admin Token ສຳລັບ Sync ຂໍ້ມູນ |
| **02** | `UsersModule` | `src/modules/users` | `users` | - ດຶງຂໍ້ມູນພະນັກງານຈາກ HRM ດ້ວຍລະຫັດ (`GET /users/hrm/:empCode`)<br/>- ເພີ່ມຜູ້ໃຊ້ໃໝ່ ແລະ Auto-fill ຂໍ້ມູນຈາກ HRM<br/>- ກຳນົດບົດບາດ ແລະ ສິດລະອຽດ (`canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload`)<br/>- Soft Delete ບັນຊີ |
| **03** | `DepartmentsModule` | `src/modules/departments` | `departments` | - Sync ຫ້ອງການ/ຝ່າຍຈາກ HRM ອັດຕະໂນມັດ (`GET` & `POST /departments/sync`)<br/>- Dropdown ລາຍຊື່ຝ່າຍສຳລັບ Form ທຸກໂມດູນ (`GET /departments/dropdown`)<br/>- CRUD ຫ້ອງການ/ຝ່າຍ ແລະ ປ້ອງກັນການລົບຫາກມີຂໍ້ມູນຜູກມັດ |
| **04** | `ContractTypesModule` | `src/modules/contract-types` | `contract_types` | - ຄຸ້ມຄອງ 14 ປະເພດສັນຍາຫຼັກ (O&M, EPC, ເຊົ່າດິນ, MOA, PTA, ແລະອື່ນໆ)<br/>- Dropdown ສຳລັບ Form ສ້າງສັນຍາ (`GET /contract-types/dropdown`) |
| **05** | `ContractsModule` | `src/modules/contracts` | `contracts`, `contract_attachments`, `notifications` | - ຄຸ້ມຄອງສັນຍາທັງໝົດ (DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED)<br/>- ຮອງຮັບ 3 ສະກຸນເງິນ: LAK, USD, CNY<br/>- Cron Service ກວດສອບສັນຍາໝົດອາຍຸທຸກທ່ຽງຄືນ ແລະ ແຈ້ງເຕືອນລ່ວງໜ້າ (&le; 60 ວັນ)<br/>- ໄຟລ໌ແນບສັນຍາ (Upload, Preview Inline, Download, Delete)<br/>- Dashboard ສະຖິຕິສັນຍາ, ກຣາບສະຖານະ, ສະກຸນເງິນ ແລະ ມູນຄ່າລວມ |
| **06** | `LegalDocumentsModule` | `src/modules/legal-documents` | `legal_documents`, `document_attachments` | - ຄຸ້ມຄອງນິຕິກຳ (ລະບຽບການ, ຂໍ້ກຳນົດ, ແຈ້ງການ, ສັນຍາ, ຄູ່ມື, ອື່ນໆ)<br/>- ສະຖານະນິຕິກຳ (ACTIVE / INACTIVE), ປີອອກ, ເລກທີ, ຝ່າຍທີ່ຮັບຜິດຊອບ<br/>- ໄຟລ໌ແນບນິຕິກຳ (Upload, Preview Inline, Download, Soft Delete)<br/>- Dashboard ນິຕິກຳ: Donut Chart ຕາມປະເພດ, Bar Chart ຕາມຝ່າຍ |
| **07** | `LegalCasesModule` | `src/modules/legal-cases` | `legal_cases`, `case_attachments` | - ຄຸ້ມຄອງຄະດີ ແລະ ຂໍ້ຂັດແຍ່ງ (ການຄ້າ, ແພ່ງ, ອາຍາ, ບໍລິຫານ)<br/>- ສະຖານະຂັ້ນສານ: ສານຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ, ຈົບຄະດີ, ສຳເລັດ<br/>- ການເງິນແຍກ 2 ສະກຸນ (LAK & USD): ມູນຄ່າເສຍຫາຍ, ປັບໃໝ, ລວມຍອດທີ່ຕ້ອງຊຳລະ (Auto calculate), ຍອດກູ້ຄືນໄດ້<br/>- ຄົ້ນຫາໄດ້ທັງ UUID ແລະ `caseCode` (ເຊັ່ນ: `EDL-2026-005`)<br/>- ໄຟລ໌ສຳນວນຄະດີ (Upload, Preview, Download, Soft Delete)<br/>- Dashboard ຄະດີ: ຍອດລວມການເງິນ LAK/USD, Donut Charts, Bar Chart |
| **08** | `SupportModule` | `src/modules/support` | `system_contact_channels`, `support_tickets` | - ຊ່ອງທາງຕິດຕໍ່ IT Support / ສາຍດ່ວນ / WhatsApp 24h<br/>- ລະບົບແຈ້ງບັນຫາ/ຂໍປັບປຸງລະບົບ (Open, In Progress, Resolved, Closed) |
| **09** | `AuditLogsModule` | `src/modules/audit-logs` | `audit_logs` | - ບັນທຶກປະຫວັດການດຳເນີນງານທັງໝົດໃນລະບົບ (Create, Update, Delete, Upload, Download)<br/>- ເກັບ Old Values ແລະ New Values ແບບ JSONB ພ້ອມ IP Address ແລະ User ID |

---

## 4. ຂັ້ນຕອນການເຮັດວຽກຂອງລະບົບ (System Workflows)

### 4.1 ຂັ້ນຕອນການຢັ້ງຢືນຕົວຕົນຜ່ານ HRM (Authentication & Single Sign-On Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as ຜູ້ໃຊ້ງານ (Client)
    participant Nest as NestJS (AuthModule)
    participant HRM as EDL HRM API Server
    participant DB as PostgreSQL Database

    User->>Nest: POST /api/auth/login { username, password }
    Nest->>HRM: POST /hrm/api/hrms/login
    alt ຂໍ້ມູນຖືກຕ້ອງໃນ HRM
        HRM-->>Nest: 200 OK { token, user_info }
        Nest->>DB: ຄົ້ນຫາບັນຊີຜູ້ໃຊ້ຕາມ username
        alt ມີຜູ້ໃຊ້ໃນລະບົບແລ້ວ
            DB-->>Nest: User Data & Roles / Permissions
        else ຍັງບໍ່ມີບັນຊີໃນລະບົບ
            Nest->>DB: ສ້າງບັນຊີໃໝ່ Auto-Sync ຈາກ HRM Profile
            DB-->>Nest: Created User Data
        end
        Nest->>Nest: ສ້າງ JWT Access Token (ບັນຈຸ userId, role, permissions)
        Nest-->>User: 200 OK { accessToken, userProfile }
    else ລະຫັດຜ່ານຜິດ / ບໍ່ພົບໃນ HRM
        HRM-->>Nest: 401 Unauthorized
        Nest-->>User: 401 Unauthorized (Invalid credentials)
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
    Start(["ເລີ່ມຕົ້ນ"]) --> CheckAuth{"ກວດສອບ JWT<br/>& ສິດທິ"}
    CheckAuth -- "ບໍ່ຜ່ານ" --> Err401["401 Unauthorized / 403 Forbidden"]
    CheckAuth -- "ຜ່ານ" --> ActionType{"ເລືອກການກະທຳ"}

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
    MulterCheck -- "ຖືກຕ້ອງ" --> SaveFileDisk["ບັນທຶກໄຟລ໌ລົງ Disk (/uploads/legal-documents)"]
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
    CreateCase["1. ສ້າງສຳນວນຄະດີ (POST /api/legal-cases)"] --> AutoCalc["ຄຳນວນຍອດລວມອັດຕະໂນມັດ:<br/>totalDueLak = damageLak + fineLak<br/>totalDueUsd = damageUsd + fineUsd"]
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

### 4.5 ລະບົບສິດທິການນຳໃຊ້ (Role-Based Access Control & Fine-Grained Permissions)

```mermaid
graph TD
    subgraph Roles["1. ບົດບາດຫຼັກ (User Roles)"]
        R_ADMIN["ADMIN<br/>(ຜູ້ດູແລລະບົບສູງສຸດ)"]
        R_MAIN["MAIN_USER<br/>(User ຫຼັກຂອງພະແນກ)"]
        R_EDITOR["EDITOR<br/>(ຜູ້ແກ້ໄຂຂໍ້ມູນ)"]
        R_VIEWER["VIEWER<br/>(ຜູ້ເບິ່ງຂໍ້ມູນ)"]
    end

    subgraph Permissions["2. ສິດທິລະອຽດ (Fine-grained Permissions)"]
        P_VIEW["canView (ເບິ່ງຂໍ້ມູນ & Preview)"]
        P_UPLOAD["canUpload (ສ້າງ & ອັບໂຫຼດໄຟລ໌)"]
        P_EDIT["canEdit (ແກ້ໄຂຂໍ້ມູນ)"]
        P_DELETE["canDelete (Soft Delete ຂໍ້ມູນ)"]
        P_DOWNLOAD["canDownload (ດາວໂຫຼດໄຟລ໌ຕົ້ນສະບັບ)"]
    end

    R_ADMIN -->|ມີຄົບທຸກສິດ| P_VIEW & P_UPLOAD & P_EDIT & P_DELETE & P_DOWNLOAD
    R_MAIN -->|ມີສິດຫຼັກ| P_VIEW & P_UPLOAD & P_EDIT & P_DELETE
    R_MAIN -.->|ກຳນົດເພີ່ມໄດ້| P_DOWNLOAD
    R_EDITOR -->|ກຳນົດຕາມວຽກ| P_VIEW & P_UPLOAD & P_EDIT
    R_VIEWER -->|ສະເພາະເບິ່ງ| P_VIEW
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
```

---

## 6. ສະຫຼຸບຕາຕະລາງ Dashboard ສະຖິຕິແຕ່ລະລະບົບ

### 6.1 Dashboard ສັນຍາ (`GET /api/contracts/dashboard`)
- **Cards ສະຫຼຸບ**: ສັນຍາທັງໝົດ, ສັນຍາໃກ້ໝົດອາຍຸ (&le; 60 ວັນ), ສັນຍາທີ່ໝົດອາຍຸແລ້ວ.
- **ກຣາບແຍກຕາມສະຖານະ**: DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED.
- **ກຣາບແຍກຕາມສະກຸນເງິນ & ມູນຄ່າ**: LAK, USD, CNY.
- **ກຣາບແຍກຕາມ 14 ປະເພດສັນຍາ**.

### 6.2 Dashboard ນິຕິກຳ (`GET /api/legal-documents/dashboard`)
- **Cards ສະຫຼຸບ**: ນິຕິກຳທັງໝົດ, ນິຕິກຳທີ່ຍັງນຳໃຊ້ (ACTIVE), ນິຕິກຳທີ່ຍົກເລີກ (INACTIVE), ຈຳນວນຝ່າຍທີ່ມີນິຕິກຳ.
- **Donut Chart**: ສັດສ່ວນຕາມ 9 ປະເພດນິຕິກຳ (`DocumentType`).
- **Bar Chart**: ຈຳນວນນິຕິກຳແຍກຕາມຫ້ອງການ/ຝ່າຍ (`Department`).

### 6.3 Dashboard ຄະດີຄວາມ (`GET /api/legal-cases/dashboard`)
- **Cards ສະຫຼຸບສະຖານະ**: ຄະດີທັງໝົດ, ຄະດີກຳລັງດຳເນີນ (ຂັ້ນຕົ້ນ, ອຸທອນ, ລົບລ້າງ), ຄະດີສຳເລັດ/ຈົບແລ້ວ.
- **Cards ສະຫຼຸບມູນຄ່າການເງິນ (ແຍກ 2 ສະກຸນເງິນ LAK & USD)**:
  - ມູນຄ່າຄວາມເສຍຫາຍລວມ (`damageLak` / `damageUsd`)
  - ມູນຄ່າຄ່າປັບໃໝລວມ (`fineLak` / `fineUsd`)
  - ລວມຍອດທີ່ຕ້ອງຊຳລະທັງໝົດ (`totalDueLak` / `totalDueUsd`)
  - ລວມຍອດທີ່ເກັບກູ້ຄືນໄດ້ແລ້ວ (`recoveredLak` / `recoveredUsd`)
- **Donut Charts**: ສັດສ່ວນຕາມສະຖານະຂັ້ນສານ (`DisputeStatus`) ແລະ ປະເພດຄະດີ (`CaseType`).
- **Bar Chart**: ຈຳນວນຄະດີແຍກຕາມຫ້ອງການ/ຝ່າຍ.

---
*(ເອກະສານສະບັບນີ້ຖືກສ້າງຂຶ້ນອັດຕະໂນມັດ ໂດຍອ້າງອີງຕາມລະຫັດໂຄງສ້າງ ແລະ ຖານຂໍ້ມູນຕົວຈິງຂອງລະບົບ)*
