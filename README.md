# JobFusion - AI Talent Suite

JobFusion la giao dien frontend cho he thong ho tro tuyen dung nhan su tich hop AI. Du an duoc thiet ke theo mo hinh SaaS da doanh nghiep, ho tro cac role Super Admin, Tenant Admin, HR, Interviewer va Candidate trong quy trinh tuyen dung.

Nguyen tac thiet ke chinh la human-in-the-loop: AI dua ra goi y, con quyet dinh cuoi cung van thuoc ve con nguoi.

## Tinh nang hien co

- Landing page, login, signup, forgot password, OTP va reset password.
- Routing bang React Router.
- Protected route theo role.
- Dashboard theo role: Super Admin, Tenant Admin, HR, Interviewer va Candidate.
- Super Admin: dashboard, tenant management, subscription plans, prompt management, settings.
- Tenant Admin: dashboard, staff management, activity log, settings.
- HR: dashboard, job management, settings.
- Interviewer: dashboard, interview views, settings.
- Candidate: portal ung vien va account settings.
- Auth flow co access token, refresh token, logout va auto refresh token khi backend tra ve `401`.

## Cong nghe su dung

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Oxlint
- Vitest
- CSS thu cong
- Font Awesome class icons va mot so SVG/icon component noi bo

## Cau truc thu muc theo chuan Bulletproof React

```text
FE_Project/
├── public/
├── src/
│   ├── app/                     # Route composition & App layout
│   ├── assets/                  # Images/static assets
│   ├── components/
│   │   └── ui/                  # Shared UI primitives (Button, Table, Modal, Dialog...)
│   ├── config/                  # Global configuration, Axios client, env settings
│   ├── features/                # Self-contained feature modules
│   │   ├── auth/                # Auth feature (api, components, hooks, types, index.ts)
│   │   ├── admin/               # Super Admin feature
│   │   ├── candidate/           # Candidate feature
│   │   ├── hr/                  # HR feature
│   │   ├── interviewer/         # Interviewer feature
│   │   ├── landing/             # Landing page
│   │   └── tenant/              # Tenant Admin feature
│   ├── hooks/                   # System-wide global custom hooks (useDebounce, useLocalStorage...)
│   └── providers/               # Global React Context & QueryClient Providers
├── test/                        # Vitest unit tests
├── AGENTS.md                    # Quy chuan kien truc React + Vite (Bulletproof)
├── AUDIT_REACT.md               # Bao cao Audit kien truc & lo trinh tai cau truc
├── index.html
├── package.json
└── vite.config.ts
```

## Kien truc & Quy chuan Module (Bulletproof React)

Du an tuan thu quy chuan kien truc **Bulletproof React**:

1. **Cua ngo duy nhat (Public API)**: Moi feature chi xuat khau (export) cac thanh phan can thiet ra ngoai thong qua file `src/features/<feature>/index.ts`. Cấm import file noi bo cua feature khac.
2. **Tu dong goi (Self-contained)**: Moi feature phai tu dong goi ben trong thu muc cua minh theo 4 phan:
   - `api/`: Dua tren TanStack Query / Axios client de fetch data va goi API.
   - `components/`: Chua cac UI components, pages, guards dung rieng cho feature.
   - `hooks/`: Custom hooks dung rieng cho feature.
   - `types/`: Dinh nghia TypeScript types/interfaces cho feature.
3. **Shared UI & Global Hooks**:
   - Shared UI primitives khong mang logic nghiep vu dat tai `src/components/ui/`.
   - Global custom hooks dat tai `src/hooks/`.
   - Global config & Axios client dat tai `src/config/`.
   - Context providers va QueryClientProvider bọc ung dung dat tai `src/providers/`.

## Vai tro tung layer

### `src/app`

Chua routing cap ung dung va layout wrapper.

- `AppRouteContent.tsx`
- `App.tsx`

Quy tac:
- App chi import feature thong qua public API `features/<feature>/index.ts`.

### `src/components/ui` & `src/config`

Chua UI component nguyen thuy va cau hinh dung chung toan he thong.

- `src/config/axiosClient.ts`
- `src/config/axiosInterceptors.ts`
- `src/components/ui/` (Button, Table, Modal, Dialog...)

### `src/features/<feature-name>`

Moi feature tu dong goi 4 phan chính:

```text
src/features/auth/
├── api/             # authApi.ts, authStorageRepository.ts
├── components/      # pages (LoginFeature, SignupFeature), guards, UI components
├── hooks/           # useAuthSession, useLoginFeature, useSignupForm...
├── types/           # auth.types.ts, role.types.ts, user.types.ts
└── index.ts         # Public entry point duy nhat
```

Quy tac:
- Feature A KHONG DUOC import truc tiep tu phan noi bo cua Feature B.
- State server uu tien dung TanStack Query.
- Form handling dung React Hook Form + Zod.
- TypeScript: dinh nghia type ro rang, cam dung `any`.

## Quy tac code theo Clean Architecture

1. Khong import cheo feature

Khong de `hr`, `tenant`, `interviewer`, `candidate` import truc tiep tu `features/admin`.

Sai:

```ts
import { normalizeTenantAdminUser } from '@/features/admin/utils/adminMappers'
```

Dung:

```ts
import { normalizeTenantAdminUser } from '@/features/admin/infrastructure/adminMappers'
```

2. `core` khong phu thuoc feature

`src/core` khong import tu `src/features`.

3. Payload va API response type dat dung layer

Dung:

```ts
import type { AdminListParams } from '@/core/api/api.types'
import type { Tenant, SubscriptionPlan } from '@/features/admin/domain/adminApi.types'
```

4. Route helper dat dung ownership

Route helper rieng role co the dat trong feature domain/presentation cua role do. Route composition cap app dat trong `src/app/routes`.

```ts
import { getSuperAdminViewPath } from '@/features/admin/domain/superAdminRouteHelpers'
import { getTenantAdminViewPath } from '@/features/tenant/domain/tenantAdminRouteHelpers'
```

5. Pagination dung chung dat trong `core/utils/pagination`

Dung:

```ts
import { getListPageCount, getListTotalElements } from '@/core/utils/pagination'
```

6. API rieng cua role dat trong infrastructure cua role do

Dung:

```ts
import { hrApi } from '@/features/hr/infrastructure/hrApi'
import { tenantAdminApi } from '@/features/tenant/infrastructure/tenantAdminApi'
import { adminApi } from '@/features/admin/infrastructure/adminApi'
```

7. Component khong nen chua helper logic lon

Neu helper la validate/filter/build params/sort/normalize:

- Dung rieng trong feature: dua vao `features/<feature>/application`, `domain` hoac `infrastructure` tuy trach nhiem.
- Dung chung: dua vao `core`.

8. CSS theo vi tri dung

- CSS global/import chung: `src/core/styles`.
- CSS rieng cua feature: `features/<feature>/presentation` hoac file module gan component.
- CSS module rieng component: dat gan component neu chi phuc vu component do.

9. Khong de folder rong

Neu da chuyen het file, xoa folder rong de cau truc gon.

## Auth va refresh token

Frontend dung:

```text
src/core/api/axiosClient.ts
src/core/api/axiosInterceptors.ts
src/core/api/authStorage.ts
```

Luon goi API qua `axiosClient` hoac service API da boc san.

- Khi login thanh cong, app luu `access_token` va `refresh_token`.
- Neu chon ghi nho dang nhap, token luu trong `localStorage`; neu khong, token luu trong `sessionStorage`.
- Moi request API tu `axiosClient` tu dong gan:

```http
Authorization: Bearer <access_token>
```

- Neu backend tra ve `401`, app goi `POST /api/auth/refresh-token`.
- Neu refresh thanh cong, app retry request cu.
- Neu refresh that bai, app clear auth storage va thong bao auth expired.

## Dieu huong trang

App dung React Router.

Route config chinh:

```text
src/app/routes/AppRoutes.tsx
src/app/routes/RouteConfig.tsx
src/app/routes/RoleRoutes.tsx
src/app/routes/ProtectedRoute.tsx
```

Mot so route:

```text
/login
/signup
/candidate
/tenant-admin/dashboard
/hr/dashboard
/interviewer/dashboard
/super-admin/dashboard
/super-admin/tenant-management
/super-admin/subscription-plans
/super-admin/prompt-management
```

Khong dung hash URL cu dang `/#/login`.

## Test

Du an dung Vitest. Test unit dat trong folder:

```text
test/
```

Lenh chay test:

```bash
npm.cmd run test
```

Tren Windows PowerShell, neu `npm run test` bi chan execution policy, dung `npm.cmd run test`.

## Yeu cau moi truong

- Node.js 20 tro len khuyen nghi.
- npm di kem Node.js.

Kiem tra nhanh:

```bash
node -v
npm -v
```

## Cau hinh bien moi truong

Tao file `.env` o thu muc goc neu chua co:

```env
VITE_BACKEND_API_URL=http://localhost:8080
```

## Cach cai dat va chay du an

1. Cai dependencies:

```bash
npm install
```

2. Chay moi truong phat trien:

```bash
npm run dev
```

3. Build production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Ghi chu phat trien

- Khi them feature/role moi, tao thu muc rieng trong `src/features/<feature_name>` voi day du 4 phan: `api/`, `components/`, `hooks/`, `types/` va `index.ts`.
- Public entry point: Moi giao tiep giua cac feature phai thong qua `src/features/<feature>/index.ts`.
- Khi them UI component dung chung (button, table, dialog...), dat trong `src/components/ui`.
- Khi them global hook dung chung, dat trong `src/hooks/`.
- Khi them cau hinh toàn cục hoặc Axios client, dat trong `src/config/`.
- Khi build refactor hoac them code moi, luon chay `npm run build` hoac `npm.cmd run build` de kiem tra type/import.

## Tai khoan demo

Candidate:

```text
email: anhquocps@gmail.com
password: Quoc123451*
```

Super Admin:

```text
email: dienpro0708@gmail.com
password: Dien@2004
```

Tenant Admin:

```text
email: huynhanhquoc15022005@gmail.com
password: c6-yFUVU!9-U
```
