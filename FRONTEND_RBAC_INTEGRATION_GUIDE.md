# ຄູ່ມືການປັບປຸງ ແລະ ເຊື່ອມຕໍ່ລະບົບກຳນົດສິດໃໝ່ສຳລັບທີມ Frontend
## Frontend Integration Guide: Dynamic RBAC & 3 Core Modules Permission Matrix

> **ລະບົບ:** Legal Contract Management System (EDL - ຟຟລ)  
> **ເວີຊັນ:** 2.2 (Nullable Email Support, Division Head Boundary Safeguards & Full API Response Payloads)  
> **ວັນທີປັບປຸງ:** 09/11/2026  
> **ສະຖານະ Backend:** ພ້ອມໃຊ້ງານ (Deployed & Verified 100%)

> [!IMPORTANT]
> **🚨 ຈຸດປັບປຸງລ່າສຸດ (Latest Updates - 09/11/2026):**
> 1. **ຮອງຮັບ `email: null` (Nullable Email):** ປັດຈຸບັນພະນັກງານທີ່ບໍ່ມີອີເມວໃນ HRM ຫຼື ບໍ່ໄດ້ປ້ອນອີເມວມາ (ເຊັ່ນ ພະນັກງານລະຫັດ `43597`), ຖານຂໍ້ມູນ ແລະ API ຈະບັນທຶກ ແລະ ສົ່ງຄ່າເປັນ `null` ໄດ້ຢ່າງປອດໄພ (ບໍ່ຕິດ Unique Constraint `users_email_key` ອີກຕໍ່ໄປ). ຟອມ Frontend ສາມາດປ່ອຍຫວ່າງ `email` ໄດ້ ແລະ Backend ຈະແປງ `""` ໃຫ້ເປັນ `null` ອັດຕະໂນມັດ.
> 2. **ປັບປຸງ HRM Lookup (`GET /api/users/hrm/:empCode`):** ຫາກ HRM ບໍ່ມີອີເມວ ຈະສົ່ງ `email: null` (ບໍ່ສ້າງອີເມວສົມມຸດ).
> 3. **ແນບຕົວຢ່າງ API Response Payloads ຄົບຊຸດ:** ເພີ່ມຕົວຢ່າງ JSON ຕົວຈິງຄົບທຸກ Endpoint ສຳລັບການຈັດການ Users (`GET /hrm/:empCode`, `POST /users`, `PATCH /users/:id`, `GET /users`, `GET /users/:id`, `GET /audit-logs`).
> 4. **ລະບົບກວດສອບຂອບເຂດສິດ ຫົວໜ້າພະແນກ (DIVISION_HEAD):** ຫົວໜ້າພະແນກຈະຈັດການໄດ້ສະເພາະພະນັກງານໃນພະແນກ ແລະ ຝ່າຍ ຂອງຕົນເອງ, ຖືກຕັດ Role `ADMIN` ແລະ `DEPARTMENT_HEAD` ອອກຈາກ Dropdown, ແລະ ບໍ່ສາມາດກຳນົດສິດໂມດູນນອກພະແນກຕົນເອງໄດ້.

---

## 📑 ສາລະບານ (Table of Contents)
1. [ພາບລວມສະຖາປັດຕະຍະກຳ 3 ໂມດູນຫຼັກ (3 Core Modules Architecture)](#1-ພາບລວມສະຖາປັດຕະຍະກຳ-3-ໂມດູນຫຼັກ-3-core-modules-architecture)
2. [ໂຄງສ້າງ Auth / Login Response ໃໝ່](#2-ໂຄງສ້າງ-auth--login-response-ໃໝ່)
3. [ຕາຕະລາງ 3 ໂມດູນຫຼັກ ແລະ Action Matrix](#3-ຕາຕະລາງ-3-ໂມດູນຫຼັກ-ແລະ-action-matrix)
4. [ການປັບປຸງ Sidebar, Navigation & Route Guard](#4-ການປັບປຸງ-sidebar-navigation--route-guard)
5. [ການຄວບຄຸມປຸ່ມ Action (Button-Level Permissions)](#5-ການຄວບຄຸມປຸ່ມ-action-button-level-permissions)
6. [ໜ້າໃໝ່: ການຈັດການບົດບາດ (Roles Management UI: `/roles`)](#6-ໜ້າໃໝ່-ການຈັດການບົດບາດ-roles-management-ui-roles)
7. [ການປັບປຸງໜ້າຈັດການຜູ້ໃຊ້ (User Management UI: `/users` - Admin & Division Head)](#7-ການປັບປຸງໜ້າຈັດການຜູ້ໃຊ້-user-management-ui-users---admin--division-head)
   - 7.1 [ການກວດສອບ Auto-fill ຈາກ HRM (`GET /api/users/hrm/:empCode`) ພ້ອມ Nullable Email](#71-ການກວດສອບ-auto-fill-ຈາກ-hrm-get-apiusershrmempcode-ພ້ອມ-nullable-email)
   - 7.2 [Dropdown ເລືອກ Role (Dynamic Roles & Division Head Filtering)](#72-dropdown-ເລືອກ-role-dynamic-roles--division-head-filtering)
   - 7.3 [API ສ້າງ User ໃໝ່ (`POST /api/users`) ພ້ອມ Response Payload](#73-api-ສ້າງ-user-ໃໝ່-post-apiusers-ພ້ອມ-response-payload)
   - 7.4 [API ແກ້ໄຂ User (`PATCH /api/users/:id`) ພ້ອມ Response Payload](#74-api-ແກ້ໄຂ-user-patch-apiusersid-ພ້ອມ-response-payload)
   - 7.5 [API ດຶງລາຍຊື່ ແລະ ລາຍລະອຽດ User (`GET /api/users` & `GET /api/users/:id`)](#75-api-ດຶງລາຍຊື່-ແລະ-ລາຍລະອຽດ-user-get-apiusers--get-apiusersid)
   - 7.6 [Audit Logs ສຳລັບ User Management (`GET /api/audit-logs`) ພ້ອມ Target User](#76-audit-logs-ສຳລັບ-user-management-get-apiaudit-logs-ພ້ອມ-target-user)
   - 7.7 [ການຈັດການ Error Codes ສະເພາະໜ້າ Users (409 Conflict & 403 Forbidden)](#77-ການຈັດການ-error-codes-ສະເພາະໜ້າ-users-409-conflict--403-forbidden)
8. [ຕົວຢ່າງ TypeScript Interfaces & Code Examples](#8-ຕົວຢ່າງ-typescript-interfaces--code-examples)
9. [ການຈັດການ Error Codes ຈາກ Backend](#9-ການຈັດການ-error-codes-ຈາກ-backend)
10. [ສິ່ງທີ່ Frontend ສາມາດທົດສອບໄດ້ທັນທີຜ່ານ Postman](#10-ສິ່ງທີ່-frontend-ສາມາດທົດສອບໄດ້ທັນທີຜ່ານ-postman)

---

## 1. ພາບລວມສະຖາປັດຕະຍະກຳ 3 ໂມດູນຫຼັກ (3 Core Modules Architecture)

ລະບົບຄຸ້ມຄອງວຽກງານກົດໝາຍຂອງ ໄຟຟ້າລາວ (EDL) ຖືກຈັດແບ່ງຕາມ **3 ພະແນກຫຼັກ (3 Core Modules / Pillars)** ຢ່າງຈະແຈ້ງ:

```mermaid
graph TD
    subgraph EDL_Legal_Department["🏢 ຝ່າຍກົດໝາຍ ໄຟຟ້າລາວ (EDL Legal Department)"]
        M1["📘 1. ໂມດູນ ສັນຍາທົ່ວໄປ (General Contracts)<br/><b>Key: CONTRACTS</b><br/>ພະແນກສັນຍາທົ່ວໄປ"]
        M2["⚡ 2. ໂມດູນ ສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Contracts)<br/><b>Key: POWER_CONTRACTS</b><br/>ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ"]
        M3["⚖️ 3. ໂມດູນ ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal Affairs & Disputes)<br/><b>Key: LEGAL_AND_DISPUTE</b><br/>ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ"]
    end

    subgraph SubWork["ວຽກງານຍ່ອຍພາຍໃຕ້ໂມດູນ 3"]
        Docs["📄 ນິຕິກຳ (LEGAL_DOCUMENTS)"]
        Cases["⚖️ ຄະດີ ແລະ ຂໍ້ຂັດແຍ່ງ (LEGAL_CASES)"]
    end

    M3 -.-> Docs
    M3 -.-> Cases
```

| # | ໂມດູນຫຼັກ (UI Pillar) | Key ໂມດູນ | ພະແນກຕົ້ນສັງກັດ | ວຽກງານທີ່ຮັບຜິດຊອບ |
| :- | :--- | :--- | :--- | :--- |
| **1** | **ສັນຍາທົ່ວໄປ** | **`CONTRACTS`** | ພະແນກສັນຍາທົ່ວໄປ | ສັນຍາ 14 ປະເພດ, ແຈ້ງເຕືອນສັນຍາໃກ້ໝົດອາຍຸ (60 ວັນ), ມູນຄ່າ 3 ສະກຸນເງິນ, ໄຟລ໌ແນບ |
| **2** | **ສັນຍາຊື້-ຂາຍໄຟຟ້າ** | **`POWER_CONTRACTS`** | ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ | ສັນຍາ PPA / PSA, ໂຄງການໄຟຟ້າ 5 ປະເພດ, MW/kW, Tariff, ແຈ້ງເຕືອນໝົດອາຍຸ |
| **3** | **ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ** | **`LEGAL_AND_DISPUTE`** | ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ | ຄຸ້ມຄອງທັງ 2 ວຽກງານ: **ນິຕິກຳ** (`LEGAL_DOCUMENTS`) ແລະ **ສຳນວນຄະດີ/ຂໍ້ຂັດແຍ່ງ** (`LEGAL_CASES`) |

> [!NOTE]
> **ຈຸດສຳຄັນສຳລັບ UI / UX ຝັ່ງ Frontend:**
> ໃນຕາຕະລາງກຳນົດສິດ (Permission Matrix) ທັງໃນໜ້າ **ຈັດການບົດບາດ (`/roles`)** ແລະ **ຈັດການຜູ້ໃຊ້ (`/users`)**, Frontend ຈະສະແດງພຽງ **3 ແຖວ (3 ໂມດູນຫຼັກ)** ເທົ່ານັ້ນ ເພື່ອໃຫ້ຜູ້ໃຊ້ງານ ແລະ Admin ເຂົ້າໃຈງ່າຍ ບໍ່ສັບສົນ. ເມື່ອຕິກເລືອກສິດໃນແຖວທີ 3 (`LEGAL_AND_DISPUTE`), ລະບົບຈະຄຸມສິດທັງວຽກງານນິຕິກຳ ແລະ ວຽກງານຄະດີຄວາມພ້ອມກັນໂດຍອັດຕະໂນມັດ!

---

## 2. ໂຄງສ້າງ Auth / Login Response ໃໝ່

ທັງ Endpoint **`POST /api/auth/login`** (Local Login) ແລະ **`POST /api/auth/login-hrm`** (HRM Sync Login) ຈະສົ່ງຂໍ້ມູນສິດທີ່ຄຳນວນແລ້ວຄືນມາໃນ Object `user`:

### Response Payload ຕົວຢ່າງ:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1d6580b1-781a-45a6-83ac-203f66c3c04a",
    "employeeCode": "EDL-44652",
    "username": "EDL-44652",
    "email": "somsak@edl.com.la",
    "fullName": "ສົມສັກ ສີສຸວັນ",
    "department": "ຫ້ອງການສຳນັກງານໃຫຍ່",
    "division": "ພະແນກສັນຍາທົ່ວໄປ",
    "unit": "ໜ່ວຍງານຄຸ້ມຄອງສັນຍາ",
    "position": "ວິຊາການ",
    "phone": "02055555555",
    "role": "MAIN_USER",
    "roleId": "94029266-d1a0-4c2c-b1df-c51e8b3ea626",
    "roleTitle": "ຜູ້ໃຊ້ຫຼັກປະຈຳພະແນກ",
    "accessibleModules": [
      "CONTRACTS",
      "CONTRACT_TYPES",
      "DEPARTMENTS",
      "SUPPORT"
    ],
    "permissionsByModule": {
      "CONTRACTS": {
        "canView": true,
        "canUpload": true,
        "canEdit": true,
        "canDelete": true,
        "canDownload": true
      },
      "POWER_CONTRACTS": {
        "canView": false,
        "canUpload": false,
        "canEdit": false,
        "canDelete": false,
        "canDownload": false
      },
      "LEGAL_AND_DISPUTE": {
        "canView": false,
        "canUpload": false,
        "canEdit": false,
        "canDelete": false,
        "canDownload": false
      },
      "LEGAL_DOCUMENTS": {
        "canView": false,
        "canUpload": false,
        "canEdit": false,
        "canDelete": false,
        "canDownload": false
      },
      "LEGAL_CASES": {
        "canView": false,
        "canUpload": false,
        "canEdit": false,
        "canDelete": false,
        "canDownload": false
      }
    }
  }
}
```

### 2.1 ກົນໄກ Auto-Refresh ເມື່ອສິດຖືກປ່ຽນກາງຄັນ (Instant Permissions Invalidation & Seamless Refresh)

ລະບົບໄດ້ອອກແບບຕາມຫຼັກການ **Pure Stateless JWT + Token Versioning**:
1. **ສິດທິທັງໝົດຖືກບັນຈຸໄວ້ໃນ `accessToken`:** ເຮັດໃຫ້ Backend Guard ກວດສອບສິດໄດ້ໄວລະດັບ Nanosecond (0 Database Queries).
2. **ເມື່ອ Admin ມີການແກ້ໄຂສິດ (Role ຫຼື User Permissions):**
   - Backend ຈະເຮັດການ Increment `tokenVersion` ທັນທີ.
   - `accessToken` ເກົ່າຂອງ User ຈະໝົດອາຍຸທັນທີ! (Invalidated ທັນທີໂດຍບໍ່ຕ້ອງລໍຖ້າໃຫ້ເວລາ 8 ຊົ່ວໂມງໝົດ).
   - Request ຖັດໄປທີ່ User ຍິງເຂົ້າມາ Backend ຈະຕອບກັບດ້ວຍ: `401 Unauthorized` ພ້ອມ `code: "TOKEN_OUTDATED"`.
3. **Frontend Axios Interceptor ຈັດການ Auto-Refresh ແບບ Seamless:**
   - ເມື່ອເຈີ `401 TOKEN_OUTDATED`, Frontend ຈະ **ບໍ່ເຕະ User ອອກໄປໜ້າ Login**.
   - Interceptor ຈະດັກຈັບແລ້ວເອີ້ນ **`POST /api/auth/refresh`** ໂດຍອັດຕະໂນມັດ ໂດຍສົ່ງ `refreshToken` ທີ່ເກັບໄວ້ໄປຂໍ Access Token ໃໝ່.
   - Backend ຈະອອກ `accessToken` ໃໝ່ທີ່ບັນຈຸ **ສິດທິໃໝ່ລ່າສຸດ** ກັບຄືນມາ.
   - Frontend ຈະນຳ Token ໃໝ່ໄປ Replay Request ເດີມໃຫ້ສຳເລັດ.
   - **User ຈະເຫັນສິດໃໝ່ມີຜົນທັນທີ ໂດຍບໍ່ຮູ້ສຶກເຖິງການສະດຸດ ຫຼື ຕ້ອງ Login ໃໝ່ເລີຍ!**

> [!TIP]
> Backend ໄດ້ສົ່ງຄ່າ **`LEGAL_AND_DISPUTE`** ມາໃຫ້ໂດຍກົງໃນ `permissionsByModule` ພ້ອມກັບ `LEGAL_DOCUMENTS` ແລະ `LEGAL_CASES`. Frontend ສາມາດເລືອກໃຊ້ key `LEGAL_AND_DISPUTE` ສຳລັບຈັດການ 3 ໂມດູນໄດ້ທັນທີ!

---

## 3. ຕາຕະລາງ 3 ໂມດູນຫຼັກ ແລະ Action Matrix

ແຕ່ລະໂມດູນຫຼັກຈະມີ 5 Actions ທີ່ຄວບຄຸມ:

| # | ໂມດູນ (Pillar) | Key ໂມດູນ | Path URL ຫຼັກ | Actions ທີ່ຮອງຮັບ |
| :- | :--- | :--- | :--- | :--- |
| **1** | **ສັນຍາທົ່ວໄປ** | `CONTRACTS` | `/contracts` | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` |
| **2** | **ສັນຍາຊື້-ຂາຍໄຟຟ້າ** | `POWER_CONTRACTS` | `/power-contracts` | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` |
| **3** | **ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ** | `LEGAL_AND_DISPUTE` | `/legal-documents`<br/>`/legal-cases` | `canView`, `canUpload`, `canEdit`, `canDelete`, `canDownload` |

### ຄວາມໝາຍຂອງແຕ່ລະ Action:
* **`canView`**: ສິດເຂົ້າເບິ່ງໜ້າ Dashboard, ລາຍການຕາຕະລາງ ແລະ ລາຍລະອຽດ
* **`canUpload`**: ສິດກົດປຸ່ມສ້າງໃໝ່, ອັບໂຫຼດໄຟລ໌ແນບ
* **`canEdit`**: ສິດກົດປຸ່ມແກ້ໄຂຂໍ້ມູນ
* **`canDelete`**: ສິດກົດປຸ່ມລົບຂໍ້ມູນ (Soft delete) ຫຼື ລົບໄຟລ໌ແນບ
* **`canDownload`**: ສິດກົດປຸ່ມດາວໂຫຼດໄຟລ໌ເອກະສານແນບ

---

## 4. ການປັບປຸງ Sidebar, Navigation & Route Guard

### 4.1 Sidebar Visibility (ການສະແດງເມນູຂ້າງ)
Frontend ສາມາດກວດສອບສິດເປີດ/ປິດກຸ່ມເມນູ 3 ພະແນກໄດ້ງ່າຍໆ:

```typescript
// 1. ໂມດູນສັນຍາທົ່ວໄປ
const canSeeContracts = user.permissionsByModule?.CONTRACTS?.canView;

// 2. ໂມດູນສັນຍາຊື້-ຂາຍໄຟຟ້າ
const canSeePowerContracts = user.permissionsByModule?.POWER_CONTRACTS?.canView;

// 3. ໂມດູນນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (ກວດສອບຜ່ານ LEGAL_AND_DISPUTE ໄດ້ເລີຍ)
const canSeeLegalAndDispute = user.permissionsByModule?.LEGAL_AND_DISPUTE?.canView;

// ເມນູ Admin Only (ຈັດການລະບົບ)
const isAdmin = user.role === 'ADMIN';

// ເມນູ ຈັດການຜູ້ໃຊ້ (User Management: /users): Admin ຫຼື ຫົວໜ້າພະແນກ (Division Head)
const canManageUsers = 
  user.role === 'ADMIN' || 
  user.role === 'DIVISION_HEAD' || 
  user.accessibleModules?.includes('users');
```

### 4.2 Route Guard ຝັ່ງ Frontend
ຫາກ User ພະຍາຍາມພິມ URL ເຂົ້າໜ້າທີ່ຕົນເອງບໍ່ມີສິດ `canView` ໃຫ້ Redirect ໄປໜ້າ 403 ຫຼື Dashboard:

```typescript
// Next.js Middleware ຫຼື React / Vue Navigation Guard
const modulePathMap: Record<string, string> = {
  '/contracts': 'CONTRACTS',
  '/power-contracts': 'POWER_CONTRACTS',
  '/legal-documents': 'LEGAL_AND_DISPUTE',
  '/legal-cases': 'LEGAL_AND_DISPUTE',
};

export function checkPageAccess(pathname: string, user: UserProfile): boolean {
  if (user.role === 'ADMIN') return true;
  
  const matchedPrefix = Object.keys(modulePathMap).find(prefix => pathname.startsWith(prefix));
  if (!matchedPrefix) return true; // ໜ້າທົ່ວໄປ (Dashboard, Profile, Support)

  const targetModule = modulePathMap[matchedPrefix];
  return Boolean(user.permissionsByModule?.[targetModule]?.canView);
}
```

---

## 5. ການຄວບຄຸມປຸ່ມ Action (Button-Level Permissions)

### 5.1 ໂມດູນ ສັນຍາທົ່ວໄປ (`CONTRACTS`)
* **ປຸ່ມ "ສ້າງສັນຍາໃໝ່"** / **"ອັບໂຫຼດໄຟລ໌ແນບ"**: `user.permissionsByModule.CONTRACTS.canUpload`
* **ປຸ່ມ "ແກ້ໄຂສັນຍາ"**: `user.permissionsByModule.CONTRACTS.canEdit`
* **ປຸ່ມ "ລົບສັນຍາ"** / **"ລົບໄຟລ໌ແນບ"**: `user.permissionsByModule.CONTRACTS.canDelete`
* **ປຸ່ມ "ດາວໂຫຼດໄຟລ໌"**: `user.permissionsByModule.CONTRACTS.canDownload`

### 5.2 ໂມດູນ ສັນຍາຊື້-ຂາຍໄຟຟ້າ (`POWER_CONTRACTS`)
* **ປຸ່ມ "ສ້າງສັນຍາຊື້-ຂາຍໄຟໃໝ່"** / **"ອັບໂຫຼດ"**: `user.permissionsByModule.POWER_CONTRACTS.canUpload`
* **ປຸ່ມ "ແກ້ໄຂສັນຍາ"**: `user.permissionsByModule.POWER_CONTRACTS.canEdit`
* **ປຸ່ມ "ລົບສັນຍາ"** / **"ລົບໄຟລ໌ແນບ"**: `user.permissionsByModule.POWER_CONTRACTS.canDelete`
* **ປຸ່ມ "ດາວໂຫຼດໄຟລ໌"**: `user.permissionsByModule.POWER_CONTRACTS.canDownload`

### 5.3 ໂມດູນ ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (`LEGAL_AND_DISPUTE`)
* **ປຸ່ມ "ສ້າງນິຕິກຳ / ສ້າງຄະດີ"** / **"ອັບໂຫຼດ"**: `user.permissionsByModule.LEGAL_AND_DISPUTE.canUpload`
* **ປຸ່ມ "ແກ້ໄຂ"**: `user.permissionsByModule.LEGAL_AND_DISPUTE.canEdit`
* **ປຸ່ມ "ລົບ"**: `user.permissionsByModule.LEGAL_AND_DISPUTE.canDelete`
* **ປຸ່ມ "ດາວໂຫຼດໄຟລ໌"**: `user.permissionsByModule.LEGAL_AND_DISPUTE.canDownload`

> [!NOTE]
> **ສຳລັບຜູ້ໃຊ້ `DEPARTMENT_HEAD` (ຫົວໜ້າຝ່າຍ):**  
> ຫົວໜ້າຝ່າຍຈະມີສິດ `canView = true` ແລະ `canDownload = true` ສຳລັບທັງ 3 ໂມດູນຫຼັກ, ແຕ່ສິດ `canUpload`, `canEdit`, `canDelete` ຈະເປັນ `false` ທັງໝົດ (ສິດກວດສອບແບບ Read-only Audit). ດັ່ງນັ້ນ ໜ້າຈໍຈະບໍ່ສະແດງປຸ່ມສ້າງ/ແກ້ໄຂ/ລົບ ໃຫ້ຫົວໜ້າຝ່າຍເຫັນ.

---

## 6. ໜ້າໃໝ່: ການຈັດການບົດບາດ (Roles Management UI: `/roles`)

Admin ສາມາດສ້າງ, ແກ້ໄຂ ແລະ ກຳນົດສິດ Matrix 3 ໂມດູນຫຼັກໃຫ້ກັບແຕ່ລະ Role ໄດ້ຢ່າງອິດສະຫຼະ:

### 6.1 Endpoints ສຳລັບ Roles
| Method | Path | ລາຍລະອຽດ | ສິດທີ່ຕ້ອງການ |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/roles` | ດຶງລາຍຊື່ Role ທັງໝົດ ພ້ອມສິດ Matrix ແລະ ຈຳນວນ User | Authenticated |
| **GET** | `/api/roles/:id` | ດຶງລາຍລະອຽດຂອງ Role ຕາມ ID | Authenticated |
| **POST** | `/api/roles` | ສ້າງ Role ໃໝ່ ພ້ອມກຳນົດສິດ 3 ໂມດູນ | Admin Only |
| **PATCH** | `/api/roles/:id` | ແກ້ໄຂຊື່, ຄຳອະທິບາຍ ຫຼື ສິດ Matrix | Admin Only |
| **DELETE** | `/api/roles/:id` | ລົບ Role (ຫ້າມລົບ System Role ຫຼື Role ທີ່ມີ User ຜູກຢູ່) | Admin Only |

### 6.2 ໂຄງສ້າງ Payload ສ້າງ Role ໃໝ່ (`POST /api/roles`):
Frontend ສາມາດສົ່ງ Payload ດ້ວຍ key 3 ໂມດູນ ຫຼື key ລະອຽດ 4 ໂມດູນກໍໄດ້:

```json
{
  "name": "POWER_AUDITOR",
  "title": "ນາຍຊ່າງກວດສອບສັນຍາໄຟຟ້າ",
  "description": "ຮັບຜິດຊອບກວດກາ ແລະ ດາວໂຫຼດເອກະສານສັນຍາຊື້-ຂາຍໄຟຟ້າ",
  "permissions": [
    {
      "module": "CONTRACTS",
      "canView": true,
      "canUpload": false,
      "canEdit": false,
      "canDelete": false,
      "canDownload": false
    },
    {
      "module": "POWER_CONTRACTS",
      "canView": true,
      "canUpload": true,
      "canEdit": true,
      "canDelete": false,
      "canDownload": true
    },
    {
      "module": "LEGAL_AND_DISPUTE",
      "canView": false,
      "canUpload": false,
      "canEdit": false,
      "canDelete": false,
      "canDownload": false
    }
  ]
}
```

> [!TIP]
> ຫາກ Frontend ໃຊ້ `PILLAR_MODULES` config (ເຊັ່ນໃນ `role-modal.tsx`), ເມື່ອສົ່ງ `LEGAL_AND_DISPUTE`, Backend ຮອງຮັບທັງການສົ່ງ `LEGAL_AND_DISPUTE` ໂດຍກົງ ຫຼື ແຍກເປັນ `LEGAL_DOCUMENTS` + `LEGAL_CASES`!

---

## 7. ການປັບປຸງໜ້າຈັດການຜູ້ໃຊ້ (User Management UI: `/users` - Admin & Division Head)

ໜ້າຈັດການຜູ້ໃຊ້ຮອງຮັບ 2 ບົດບາດຫຼັກ:
* **`ADMIN`**: ຈັດການຜູ້ໃຊ້ໄດ້ທຸກພະແນກ ແລະ ທຸກ Role (ລວມທັງ Soft Delete ແລະ Reset Password)
* **`DIVISION_HEAD` (ຫົວໜ້າພະແນກ)**: ເພີ່ມ, ແກ້ໄຂ ແລະ ເບິ່ງລາຍຊື່ຜູ້ໃຊ້ໄດ້ **ສະເພາະພະແນກ ແລະ ຝ່າຍ ຂອງຕົນເອງເທົ່ານັ້ນ**

---

### 7.1 ການກວດສອບ Auto-fill ຈາກ HRM (`GET /api/users/hrm/:empCode`) ພ້ອມ Nullable Email
ເມື່ອກົດຄົ້ນຫາລະຫັດພະນັກງານ, Backend ຈະກວດສອບພະແນກ ແລະ ຝ່າຍ ອັດຕະໂນມັດ ພ້ອມສົ່ງ Flag ມາໃຫ້ Frontend:

#### Interface ຂອງ HrmLookupResponse:
```typescript
interface HrmLookupResponse {
  message: string;
  data: {
    employeeCode: string;
    fullName: string;
    department: string;
    division: string;
    unit: string;
    position: string;
    email: string | null;              // ✨ Nullable: null ຫາກ HRM ບໍ່ມີອີເມວ
    phone: string;
    alreadyInSystem: boolean;
    isSameDivision: boolean;           // true ຫາກຢູ່ພະແນກດຽວກັນກັບຜູ້ກວດສອບ
    canAdd: boolean;                   // true ຫາກສາມາດເພີ່ມເຂົ້າລະບົບໄດ້
    divisionMismatchWarning: string | null; // ຂໍ້ຄວາມແຈ້ງເຕືອນພາສາລາວ ເມື່ອຢູ່ຕ່າງພະແນກ
  };
}
```

#### ຕົວຢ່າງ API Response 1: ພະນັກງານທີ່ "ບໍ່ມີອີເມວ" ໃນ HRM (ເຊັ່ນ ລະຫັດ 43597)
> [!NOTE]
> ຫາກ HRM ບໍ່ມີຂໍ້ມູນອີເມວ, Backend ຈະສົ່ງ `email: null` ກັບຄືນມາ:

```json
// GET /api/users/hrm/43597 -> HTTP 200 OK
{
  "message": "ດຶງຂໍ້ມູນພະນັກງານຈາກ HRM ສຳເລັດ",
  "data": {
    "employeeCode": "43597",
    "fullName": "ບຸນທະວີ ກຳມະວົງສາ",
    "department": "ຝ່າຍກົດໝາຍ-ສັນຍາ",
    "division": "ພະແນກສັນຍາທົ່ວໄປ (ຝກສ)",
    "unit": "",
    "position": "ຮອງຫົວໜ້າພະແນກ",
    "email": null,
    "phone": "02078080118",
    "alreadyInSystem": false,
    "isSameDivision": true,
    "canAdd": true,
    "divisionMismatchWarning": null
  }
}
```

#### ຕົວຢ່າງ API Response 2: ພະນັກງານທີ່ "ມີອີເມວ" ປົກກະຕິ (ເຊັ່ນ ລະຫັດ 44404)
```json
// GET /api/users/hrm/44404 -> HTTP 200 OK
{
  "message": "ດຶງຂໍ້ມູນພະນັກງານຈາກ HRM ສຳເລັດ",
  "data": {
    "employeeCode": "44404",
    "fullName": "ພົງພະສິດ ສຸກໃສ",
    "department": "ຝ່າຍກົດໝາຍ-ສັນຍາ",
    "division": "ພະແນກສັນຍາທົ່ວໄປ (ຝກສ)",
    "unit": "",
    "position": "ວິຊາການ",
    "email": "sphongphasith@gmail.com",
    "phone": "02055555555",
    "alreadyInSystem": true,
    "isSameDivision": true,
    "canAdd": false,
    "divisionMismatchWarning": null
  }
}
```

> [!TIP]
> **ຄຳແນະນຳສຳລັບ Form ຝັ່ງ Frontend:**
> 1. ຊ່ອງກອກ **ອີເມວ (Email)** ໃນ Form ເພີ່ມຜູ້ໃຊ້ ໃຫ້ຕັ້ງເປັນ **Optional** (ບໍ່ຕ້ອງບັງຄັບ Required).
> 2. ເມື່ອກົດຄົ້ນຫາແລ້ວ `data.email` ເປັນ `null`, ໃຫ້ສະແດງຊ່ອງ Email ເປັນຄ່າຫວ່າງ `""`.
> 3. ຫາກ User ບໍ່ໄດ້ກອກອີເມວເພີ່ມເຕີມ Frontend ສາມາດສົ່ງ `null` ຫຼື `""` ຫຼື ບໍ່ສົ່ງຟິວ `email` ໄປໃນ Payload ໄດ້ເລີຍ Backend ຈະບັນທຶກເປັນ `null` ອັດຕະໂນມັດ ໂດຍບໍ່ເກີດ Error Unique Constraint.
> 4. ຫາກ `canAdd === false`:
>    - ຖ້າ `alreadyInSystem === true`: ສະແດງ Alert: *"ພະນັກງານລະຫັດນີ້ມີໃນລະບົບແລ້ວ"* ແລະ Disable ປຸ່ມ Save.
>    - ຖ້າ `divisionMismatchWarning` ບໍ່ເປັນ null: ສະແດງ Alert ສີແດງດ້ວຍຂໍ້ຄວາມຈາກ Backend ແລະ Disable ປຸ່ມ Save.

---

### 7.2 Dropdown ເລືອກ Role (Dynamic Roles & Division Head Filtering)
* ປ່ຽນ Dropdown ເລືອກ Role ຈາກ Hardcoded Enum ເປັນ **Dropdown ດຶງຂໍ້ມູນມາຈາກ `GET /api/roles`**.
* **ກໍລະນີຜູ້ Login ເປັນ `DIVISION_HEAD`:** ໃຫ້ **Filter ຕັດ Role `ADMIN` ແລະ `DEPARTMENT_HEAD` ອອກຈາກ Dropdown** (ອະນຸຍາດໃຫ້ເລືອກສະເພາະ `MAIN_USER`, `EDITOR`, `VIEWER`).
* ເມື່ອເລືອກ Role ໃດໜຶ່ງ ໃຫ້ສົ່ງ **`roleId`** ໄປໃນ Payload.

---

### 7.3 API ສ້າງ User ໃໝ່ (`POST /api/users`) ພ້ອມ Response Payload

#### Request Payload:
```json
// POST /api/users
{
  "employeeCode": "43597",
  "roleId": "94029266-d1a0-4c2c-b1df-c51e8b3ea626",
  "division": "ພະແນກສັນຍາທົ່ວໄປ (ຝກສ)",
  "department": "ຝ່າຍກົດໝາຍ-ສັນຍາ",
  "email": null,
  "phone": "02078080118",
  "fullName": "ບຸນທະວີ ກຳມະວົງສາ",
  "modulePermissions": [
    {
      "module": "CONTRACTS",
      "canView": true,
      "canUpload": true,
      "canEdit": true,
      "canDelete": false,
      "canDownload": true
    }
  ]
}
```

> [!NOTE]
> * ຟິວ `email` ສາມາດສົ່ງເປັນ `null`, `""` ຫຼື ລະເວັ້ນ (Omit) ໄດ້.
> * ຟິວ `modulePermissions` ເປັນ Option (ຫາກບໍ່ໃສ່ມາ ຈະໄດ້ຮັບສິດຕາມ Role ທີ່ເລືອກ).
> * ລະຫັດຜ່ານຕັ້ງຕົ້ນ (Default Password) ຂອງຜູ້ໃຊ້ໃໝ່ຈະຖືກຕັ້ງເປັນ: `EDL@{employeeCode}` (ເຊັ່ນ: `EDL@43597`).

#### API Response Payload ຕົວຈິງ (HTTP 201 Created):
```json
{
  "message": "ເພີ່ມຜູ້ໃຊ້ໂດຍການ Sync ຂໍ້ມູນຈາກ HRM ສຳເລັດ",
  "data": {
    "id": "e8b09b53-ec52-4740-8ea7-a7ebf93282eb",
    "employeeCode": "43597",
    "username": "43597",
    "email": null,
    "fullName": "ບຸນທະວີ ກຳມະວົງສາ",
    "department": "ຝ່າຍກົດໝາຍ-ສັນຍາ",
    "division": "ພະແນກສັນຍາທົ່ວໄປ (ຝກສ)",
    "unit": "",
    "position": "ຮອງຫົວໜ້າພະແນກ",
    "phone": "02078080118",
    "role": "MAIN_USER",
    "roleId": "94029266-d1a0-4c2c-b1df-c51e8b3ea626",
    "roleRef": {
      "id": "94029266-d1a0-4c2c-b1df-c51e8b3ea626",
      "name": "MAIN_USER",
      "title": "ຜູ້ໃຊ້ຫຼັກປະຈຳພະແນກ",
      "isSystem": true,
      "permissions": []
    },
    "canView": true,
    "canUpload": true,
    "canEdit": true,
    "canDelete": false,
    "canDownload": true,
    "isActive": true,
    "createdAt": "2026-11-09T10:15:51.000Z",
    "modulePermissions": [
      {
        "module": "CONTRACTS",
        "canView": true,
        "canUpload": true,
        "canEdit": true,
        "canDelete": false,
        "canDownload": true
      }
    ]
  }
}
```

---

### 7.4 API ແກ້ໄຂ User (`PATCH /api/users/:id`) ພ້ອມ Response Payload

#### Request Payload:
```json
// PATCH /api/users/e8b09b53-ec52-4740-8ea7-a7ebf93282eb
{
  "roleId": "33def50d-ba6f-41b3-823d-1357684ecf56",
  "isActive": true,
  "canView": true,
  "canUpload": true,
  "canEdit": true,
  "canDelete": false,
  "canDownload": true,
  "modulePermissions": [
    {
      "module": "CONTRACTS",
      "canView": true,
      "canUpload": true,
      "canEdit": true,
      "canDelete": false,
      "canDownload": true
    }
  ]
}
```

#### API Response Payload ຕົວຈິງ (HTTP 200 OK):
```json
{
  "message": "ອັບເດດຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດ",
  "data": {
    "id": "e8b09b53-ec52-4740-8ea7-a7ebf93282eb",
    "employeeCode": "43597",
    "username": "43597",
    "email": null,
    "fullName": "ບຸນທະວີ ກຳມະວົງສາ",
    "department": "ຝ່າຍກົດໝາຍ-ສັນຍາ",
    "division": "ພະແນກສັນຍາທົ່ວໄປ (ຝກສ)",
    "unit": "",
    "position": "ຮອງຫົວໜ້າພະແນກ",
    "phone": "02078080118",
    "role": "MAIN_USER",
    "roleId": "33def50d-ba6f-41b3-823d-1357684ecf56",
    "roleRef": {
      "id": "33def50d-ba6f-41b3-823d-1357684ecf56",
      "name": "MAIN_USER",
      "title": "ຜູ້ໃຊ້ຫຼັກປະຈຳພະແນກ",
      "isSystem": true,
      "permissions": []
    },
    "canView": true,
    "canUpload": true,
    "canEdit": true,
    "canDelete": false,
    "canDownload": true,
    "isActive": true,
    "lastLoginAt": null,
    "createdAt": "2026-11-09T10:15:51.000Z",
    "updatedAt": "2026-11-09T10:20:00.000Z",
    "modulePermissions": [
      {
        "module": "CONTRACTS",
        "canView": true,
        "canUpload": true,
        "canEdit": true,
        "canDelete": false,
        "canDownload": true
      }
    ]
  }
}
```

---

### 7.5 API ດຶງລາຍຊື່ ແລະ ລາຍລະອຽດ User (`GET /api/users` & `GET /api/users/:id`)

#### 1. ດຶງລາຍຊື່ຜູ້ໃຊ້ທັງໝົດ (`GET /api/users`)
* **Query Parameters ທີ່ຮອງຮັບ:**
  * `page` (default: 1)
  * `limit` (default: 10)
  * `search` (ຄົ້ນຫາຊື່ເຕັມ, ລະຫັດພະນັກງານ, username, email)
  * `role` (Filter ຕາມ Role: ADMIN, DIVISION_HEAD, MAIN_USER, EDITOR, VIEWER)
  * `isActive` (Filter: `true` ຫຼື `false`)
  * `division` (ສະເພາະ Admin: ສາມາດກັ່ນຕອງຕາມພະແນກໄດ້)
  * `department` (ສະເພາະ Admin: ສາມາດກັ່ນຕອງຕາມຝ່າຍໄດ້)

> [!NOTE]
> ສຳລັບ `DIVISION_HEAD` (ຫົວໜ້າພະແນກ), Backend ຈະບັງຄັບກັ່ນຕອງໃຫ້ເຫັນສະເພາະ User ທີ່ຢູ່ໃນ `division` ຂອງຕົນເອງໂດຍອັດຕະໂນມັດ ເຖິງແມ່ນວ່າຈະບໍ່ໄດ້ສົ່ງ query param ມາກໍຕາມ.

#### API Response Payload ຕົວຈິງ (`GET /api/users` - HTTP 200 OK):
```json
{
  "data": [
    {
      "id": "c5a7dda4-0326-4395-80ac-ebaf32bea668",
      "employeeCode": "ADMIN-001",
      "username": "admin",
      "email": "admin@edl.com.la",
      "fullName": "System Administrator",
      "department": "ຫ້ອງການສຳນັກງານໃຫຍ່",
      "division": "ພະແນກສັນຍາທົ່ວໄປ",
      "unit": "ໜ່ວຍງານບໍລິຫານ",
      "position": "ຜູ້ດູແລລະບົບ",
      "phone": "02099999999",
      "role": "ADMIN",
      "roleId": null,
      "roleRef": null,
      "canView": true,
      "canUpload": true,
      "canEdit": true,
      "canDelete": true,
      "canDownload": true,
      "isActive": true,
      "lastLoginAt": "2026-11-09T09:00:00.000Z",
      "createdAt": "2026-10-20T02:30:20.000Z",
      "modulePermissions": []
    },
    {
      "id": "e8b09b53-ec52-4740-8ea7-a7ebf93282eb",
      "employeeCode": "43597",
      "username": "43597",
      "email": null,
      "fullName": "ບຸນທະວີ ກຳມະວົງສາ",
      "department": "ຝ່າຍກົດໝາຍ-ສັນຍາ",
      "division": "ພະແນກສັນຍາທົ່ວໄປ (ຝກສ)",
      "unit": "",
      "position": "ຮອງຫົວໜ້າພະແນກ",
      "phone": "02078080118",
      "role": "MAIN_USER",
      "roleId": "94029266-d1a0-4c2c-b1df-c51e8b3ea626",
      "roleRef": {
        "id": "94029266-d1a0-4c2c-b1df-c51e8b3ea626",
        "name": "MAIN_USER",
        "title": "ຜູ້ໃຊ້ຫຼັກປະຈຳພະແນກ",
        "isSystem": true,
        "permissions": []
      },
      "canView": true,
      "canUpload": true,
      "canEdit": true,
      "canDelete": false,
      "canDownload": true,
      "isActive": true,
      "lastLoginAt": null,
      "createdAt": "2026-11-09T10:15:51.000Z",
      "modulePermissions": [
        {
          "module": "CONTRACTS",
          "canView": true,
          "canUpload": true,
          "canEdit": true,
          "canDelete": false,
          "canDownload": true
        }
      ]
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### 2. ດຶງຂໍ້ມູນລາຍລະອຽດຜູ້ໃຊ້ຕາມ ID (`GET /api/users/:id`)
#### API Response Payload ຕົວຈິງ (`GET /api/users/:id` - HTTP 200 OK):
```json
{
  "id": "e8b09b53-ec52-4740-8ea7-a7ebf93282eb",
  "employeeCode": "43597",
  "username": "43597",
  "email": null,
  "fullName": "ບຸນທະວີ ກຳມະວົງສາ",
  "department": "ຝ່າຍກົດໝາຍ-ສັນຍາ",
  "division": "ພະແນກສັນຍາທົ່ວໄປ (ຝກສ)",
  "unit": "",
  "position": "ຮອງຫົວໜ້າພະແນກ",
  "phone": "02078080118",
  "role": "MAIN_USER",
  "canView": true,
  "canUpload": true,
  "canEdit": true,
  "canDelete": false,
  "canDownload": true,
  "isActive": true,
  "lastLoginAt": null,
  "createdAt": "2026-11-09T10:15:51.000Z",
  "updatedAt": "2026-11-09T10:20:00.000Z",
  "modulePermissions": [
    {
      "module": "CONTRACTS",
      "canView": true,
      "canUpload": true,
      "canEdit": true,
      "canDelete": false,
      "canDownload": true
    }
  ],
  "_count": {
    "createdContracts": 0,
    "uploadedAttachments": 0,
    "downloadLogs": 0
  }
}
```

---

### 7.6 Audit Logs ສຳລັບ User Management (`GET /api/audit-logs`) ພ້ອມ Target User
ທຸກການກະທຳກ່ຽວກັບຜູ້ໃຊ້ (ສ້າງ User, ແກ້ໄຂ Role, ແກ້ໄຂສິດ Matrix, ເປີດ/ປິດ ບັນຊີ, Soft Delete, Reset Password), Backend ຈະບັນທຶກ Audit Log ອັດຕະໂນມັດພ້ອມຜູກ Relation **`targetUser`** (ຜູ້ຖືກກະທຳ):

#### API Request:
```http
GET /api/audit-logs?targetUserId=e8b09b53-ec52-4740-8ea7-a7ebf93282eb&action=USER_PERMISSION_CHANGE&page=1&limit=10
```

#### API Response Payload ຕົວຈິງ (HTTP 200 OK):
```json
{
  "data": [
    {
      "id": "9f3c1782-9653-4dc9-9833-2ba393a74da4",
      "action": "USER_PERMISSION_CHANGE",
      "entityId": null,
      "details": null,
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "timestamp": "2026-11-09T10:15:51.000Z",
      "user": {
        "id": "c5a7dda4-0326-4395-80ac-ebaf32bea668",
        "fullName": "System Administrator",
        "username": "admin",
        "employeeCode": "ADMIN-001"
      },
      "targetUser": {
        "id": "e8b09b53-ec52-4740-8ea7-a7ebf93282eb",
        "fullName": "ບຸນທະວີ ກຳມະວົງສາ",
        "username": "43597",
        "employeeCode": "43597"
      },
      "newValues": {
        "action": "CREATE_USER",
        "targetUser": {
          "id": "e8b09b53-ec52-4740-8ea7-a7ebf93282eb",
          "employeeCode": "43597",
          "username": "43597",
          "fullName": "ບຸນທະວີ ກຳມະວົງສາ",
          "department": "ຝ່າຍກົດໝາຍ-ສັນຍາ",
          "division": "ພະແນກສັນຍາທົ່ວໄປ (ຝກສ)",
          "role": "MAIN_USER",
          "roleId": "94029266-d1a0-4c2c-b1df-c51e8b3ea626",
          "isActive": true
        },
        "permissions": {
          "canView": true,
          "canUpload": true,
          "canEdit": true,
          "canDelete": false,
          "canDownload": true,
          "modulePermissions": [
            {
              "module": "CONTRACTS",
              "canView": true,
              "canUpload": true,
              "canEdit": true,
              "canDelete": false,
              "canDownload": true
            }
          ]
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 7.7 ການຈັດການ Error Codes ສະເພາະໜ້າ Users (409 Conflict & 403 Forbidden)

#### 1. ກໍລະນີພະນັກງານມີໃນລະບົບແລ້ວ (HTTP 409 Conflict):
```json
{
  "statusCode": 409,
  "message": "ພະນັກງານລະຫັດ 43597 ມີໃນລະບົບແລ້ວ",
  "error": "Conflict"
}
```
* **Frontend Action:** ສະແດງ Toast / Alert ສີແດງ: *"ພະນັກງານລະຫັດນີ້ມີບັນຊີໃນລະບົບແລ້ວ ບໍ່ສາມາດເພີ່ມຊ້ຳໄດ້"*.

#### 2. ກໍລະນີຫົວໜ້າພະແນກພະຍາຍາມເພີ່ມພະນັກງານຕ່າງພະແນກ (HTTP 403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "ທ່ານບໍ່ມີສິດເພີ່ມພະນັກງານຕ່າງພະແນກ (ພະນັກງານລະຫັດ \"43597\" ສັງກັດພະແນກ: \"ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ\", ຝ່າຍ: \"ຝ່າຍກົດໝາຍ-ສັນຍາ\" ແຕ່ທ່ານສັງກັດພະແນກ: \"ພະແນກສັນຍາທົ່ວໄປ\")",
  "error": "Forbidden"
}
```
* **Frontend Action:** ສະແດງ Modal ຫຼື Banner ແຈ້ງເຕືອນສີແດງຕາມ `message` ທີ່ Backend ສົ່ງມາ.

#### 3. ກໍລະນີຫົວໜ້າພະແນກພະຍາຍາມຕັ້ງ Role ເປັນ ADMIN ຫຼື DEPARTMENT_HEAD (HTTP 403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "ຫົວໜ້າພະແນກ ບໍ່ສາມາດສ້າງ ຫຼື ກຳນົດບົດບາດ ADMIN ໄດ້ (ອະນຸຍາດສະເພາະ: MAIN_USER, EDITOR, VIEWER)",
  "error": "Forbidden"
}
```

#### 4. ກໍລະນີຫົວໜ້າພະແນກພະຍາຍາມກຳນົດສິດໂມດູນນອກພະແນກຕົນເອງ (HTTP 403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "ຫົວໜ້າພະແນກ ບໍ່ສາມາດກຳນົດສິດໃນໂມດູນ \"POWER_CONTRACTS\" ທີ່ຢູ່ນອກພະແນກຂອງຕົນເອງໄດ້",
  "error": "Forbidden"
}
```

---

## 8. ຕົວຢ່າງ TypeScript Interfaces & Code Examples

### 8.1 TypeScript Types (`types/auth.ts`)
```typescript
/**
 * 3 Core Modules (Pillars) in EDL Legal System
 */
export type CoreModuleKey = 'CONTRACTS' | 'POWER_CONTRACTS' | 'LEGAL_AND_DISPUTE';

/**
 * All Module Keys supported by Backend
 */
export type SystemModuleKey = CoreModuleKey | 'LEGAL_DOCUMENTS' | 'LEGAL_CASES';

export type PermissionActionKey = 'canView' | 'canUpload' | 'canEdit' | 'canDelete' | 'canDownload';

export interface ModulePermission {
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

export interface UserProfile {
  id: string;
  employeeCode: string;
  username: string;
  email: string | null;
  fullName: string;
  department?: string;
  division?: string;
  unit?: string;
  position?: string;
  phone?: string;
  role: string;
  roleId?: string;
  roleTitle?: string;
  accessibleModules: string[];
  permissionsByModule: Record<SystemModuleKey, ModulePermission>;
}

/**
 * Types ສຳລັບໜ້າ User Management (/users)
 */
export interface CreateUserPayload {
  employeeCode: string;
  roleId?: string;
  role?: string;
  division?: string;
  department?: string;
  fullName?: string;
  email?: string | null;
  phone?: string;
  canView?: boolean;
  canUpload?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
  modulePermissions?: Array<{
    module: SystemModuleKey;
    canView?: boolean;
    canUpload?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canDownload?: boolean;
  }>;
}

export interface UpdateUserPayload {
  roleId?: string;
  role?: string;
  division?: string;
  department?: string;
  isActive?: boolean;
  canView?: boolean;
  canUpload?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
  modulePermissions?: Array<{
    module: SystemModuleKey;
    canView?: boolean;
    canUpload?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canDownload?: boolean;
  }>;
}

export interface UserListItem {
  id: string;
  employeeCode: string;
  username: string;
  email: string | null;
  fullName: string;
  department?: string;
  division?: string;
  unit?: string;
  position?: string;
  phone?: string;
  role: string;
  roleId?: string | null;
  roleRef?: {
    id: string;
    name: string;
    title: string;
    isSystem: boolean;
    permissions: any[];
  } | null;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  modulePermissions: Array<{
    module: string;
    canView: boolean;
    canUpload: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canDownload: boolean;
  }>;
}
```

### 8.2 UI Pillar Configuration ສຳລັບ Modal / Matrix Table
```typescript
export interface PillarRowConfig {
  key: CoreModuleKey;
  label: string;
  divisionLabel: string;
  backendKeys: SystemModuleKey[];
}

export const PILLAR_MODULES: PillarRowConfig[] = [
  {
    key: 'CONTRACTS',
    label: '1. ສັນຍາທົ່ວໄປ (General Contracts)',
    divisionLabel: 'ພະແນກສັນຍາທົ່ວໄປ',
    backendKeys: ['CONTRACTS'],
  },
  {
    key: 'POWER_CONTRACTS',
    label: '2. ສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Contracts)',
    divisionLabel: 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ',
    backendKeys: ['POWER_CONTRACTS'],
  },
  {
    key: 'LEGAL_AND_DISPUTE',
    label: '3. ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal Affairs & Disputes)',
    divisionLabel: 'ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
    backendKeys: ['LEGAL_AND_DISPUTE', 'LEGAL_DOCUMENTS', 'LEGAL_CASES'],
  },
];
```

### 8.3 Custom Hook ສຳລັບກວດສອບສິດ (`usePermissions.ts`)
```typescript
import { useAuthStore } from '@/application/store/auth.store';
import type { SystemModuleKey, PermissionActionKey } from '@core/entities';

export function usePermissions(scopedModule?: SystemModuleKey) {
  const user = useAuthStore((s) => s.user);

  const can = (module: SystemModuleKey, action: PermissionActionKey = 'canView'): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'DEPARTMENT_HEAD' && (action === 'canView' || action === 'canDownload')) {
      return true;
    }
    return Boolean(user.permissionsByModule?.[module]?.[action]);
  };

  const hasModule = (module: SystemModuleKey): boolean => {
    return can(module, 'canView');
  };

  return {
    can,
    hasModule,
    // ສິດປຸ່ມກົດຕາມໂມດູນທີ່ກຳລັງເປີດຢູ່ (Scoped Actions)
    canView: scopedModule ? can(scopedModule, 'canView') : false,
    canUpload: scopedModule ? can(scopedModule, 'canUpload') : false,
    canEdit: scopedModule ? can(scopedModule, 'canEdit') : false,
    canDelete: scopedModule ? can(scopedModule, 'canDelete') : false,
    canDownload: scopedModule ? can(scopedModule, 'canDownload') : false,
  };
}
```

---

## 9. ການຈັດການ Error Codes ຈາກ Backend

| Status Code | Error Response Code | ຄວາມໝາຍ | ສິ່ງທີ່ Frontend ຄວນສະແດງ / ປະຕິບັດ |
| :--- | :--- | :--- | :--- |
| **`401 Unauthorized`** | **`TOKEN_OUTDATED`** | **ສິດທິ ຫຼື Role ຂອງ User ໄດ້ຮັບການປ່ຽນແປງ** (TokenVersion ບໍ່ກົງກັນ) | **Auto-Refresh ທັນທີ:** ດັກຈັບໃນ Axios Interceptor ແລ້ວຍິງໄປ `POST /api/auth/refresh` ດ້ວຍ `refreshToken` ເພື່ອຂໍ Token ໃໝ່ທີ່ບັນຈຸສິດລ່າສຸດ ໂດຍບໍ່ຕ້ອງ Logout! |
| **`401 Unauthorized`** | `UNAUTHORIZED` | Token ໝົດອາຍຸ ຫຼື Refresh Token ບໍ່ຖືກຕ້ອງ | Clear LocalStorage/Cookie ແລ້ວ Redirect ໄປໜ້າ Login (`/login?expired=true`) |
| **`403 Forbidden`** | `PATH_DIVISION_MISMATCH` | ຜູ້ໃຊ້ພະຍາຍາມປ່ຽນ Path URL ຂ້າມໄປໂມດູນທີ່ບໍ່ມີສິດ | ສະແດງ Alert / Modal: *"ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໂມດູນນີ້"* ແລ້ວ Redirect ໄປ Dashboard |
| **`403 Forbidden`** | `FORBIDDEN` | ບໍ່ມີສິດໃນການກະທຳ (ເຊັ່ນ: ບໍ່ມີສິດລົບ ຫຼື ດາວໂຫຼດ, ຫຼື ຫົວໜ້າພະແນກຈັດການຂ້າມພະແນກ) | ສະແດງ Toast Notification ສີແດງ: ແຈ້ງເຕືອນບໍ່ມີສິດດຳເນີນການ ຕາມ `message` ທີ່ໄດ້ຮັບ |
| **`409 Conflict`** | `CONFLICT` | ພະນັກງານລະຫັດນີ້ມີບັນຊີໃນລະບົບແລ້ວ | ສະແດງ Toast / Alert ສີແດງ: *"ພະນັກງານລະຫັດນີ້ມີໃນລະບົບແລ້ວ"* |
| **`400 Bad Request`** | `BAD_REQUEST` | ພະຍາຍາມລົບ System Role, Role ທີ່ມີ User ຜູກຢູ່ ຫຼື ຂໍ້ມູນບໍ່ຖືກຕ້ອງ | ສະແດງ Alert ແຈ້ງເຕືອນຂໍ້ຜິດພາດຕາມ `message` ຂອງ Backend |

---

## 10. ສິ່ງທີ່ Frontend ສາມາດທົດສອບໄດ້ທັນທີຜ່ານ Postman

Postman Collection ໄດ້ຮັບການອັບເດດໃຫ້ພ້ອມທົດສອບແລ້ວໃນໄຟລ໌:
* [`legal-contract-management.postman_collection.json`](file:///d:/SM/Project/backend/NestJS/legal-contract-management/legal-contract-management.postman_collection.json)
* ເບິ່ງ Folder **`01. Auth`**:
  * `Login (POST /auth/login)` (ສົ່ງຄືນທັງ `accessToken`, `refreshToken` ແລະ `user`)
  * `Refresh Token (POST /auth/refresh)` (ຕໍ່ອາຍຸ ແລະ ດຶງສິດໃໝ່ລ່າສຸດເມື່ອສິດຖືກປ່ຽນ)
  * `Get My Profile & Permissions (GET /auth/me)`
* ເບິ່ງ Folder **`11. Roles Management`**:
  * `List All Roles (GET /roles)`
  * `Get Role by ID (GET /roles/:id)`
  * `Create Custom Role (POST /roles)`
  * `Update Role & Permissions (PATCH /roles/:id)` (ເມື່ອ Update ຈະ Invalidate Token ຂອງ User ທັນທີ)
  * `Delete Custom Role (DELETE /roles/:id)`
* ເບິ່ງ Folder **`10. Users & HRM Sync`**:
  * `Create User by HRM Sync` (ພ້ອມຕົວຢ່າງ `roleId` ແລະ `modulePermissions`)
  * `Update User Role & Permissions` (ເມື່ອ Update ຈະ Invalidate Token ຂອງ User ທັນທີ)

---
*ຫາກມີຂໍ້ສົງໄສເພີ່ມເຕີມໃນການເຊື່ອມຕໍ່ API ສາມາດຕິດຕໍ່ທີມງານ Backend ໄດ້ທັນທີ.*
