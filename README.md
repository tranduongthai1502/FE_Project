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

## Cau truc thu muc hien tai

```text
FE_Project/
+-- public/
+-- src/
|   +-- app/
|   |   +-- routes/              # route config va route composition cap app
|   +-- assets/                  # anh/static asset import trong app
|   +-- core/
|   |   +-- api/                 # axios client, interceptor, API type/mapper dung chung
|   |   +-- components/          # UI component dung chung, khong phu thuoc feature
|   |   +-- hooks/               # hook/helper dung chung
|   |   +-- styles/              # global CSS imports
|   |   +-- utils/               # helper thuan, khong phu thuoc React/feature
|   +-- features/
|   |   +-- admin/               # Super Admin feature
|   |   +-- auth/                # login/signup/auth screens va auth-specific logic
|   |   +-- candidate/           # Candidate feature
|   |   +-- hr/                  # HR feature
|   |   +-- interviewer/         # Interviewer feature
|   |   +-- landing/             # Landing page
|   |   +-- tenant/              # Tenant Admin feature
+-- test/                        # Vitest unit tests
+-- index.html
+-- package.json
+-- vite.config.ts
```

## Kien truc

Du an dang theo huong **Feature-based Architecture** ket hop voi cac quy tac **Clean Architecture** cho frontend.

Luon uu tien dependency mot chieu:

```text
app
  -> features public API
  -> core

features/<feature>/presentation
  -> features/<feature>/application
  -> features/<feature>/domain
  -> core

features/<feature>/application
  -> features/<feature>/domain
  -> repository/storage/downloader ports
  -> core utils

features/<feature>/infrastructure
  -> features/<feature>/domain
  -> features/<feature>/application ports
  -> core/api, core/utils
```

Feature co the dung shared layer:

```text
features/hr -> core/api, core/components, core/utils
features/tenant -> core/api, core/components, core/utils
features/admin -> core/api, core/components, core/utils
```

Feature khong nen import logic noi bo cua feature khac.

Sai:

```ts
import { getListPageCount } from '@/features/admin/utils/adminMappers'
```

Dung:

```ts
import { getListPageCount } from '@/core/utils/pagination'
```

## Vai tro tung layer

### `src/app`

Chua bootstrap app, provider va route composition cap app.

Vi du:

- `App.tsx`
- `RouteConfig.tsx`
- `RoleRoutes.tsx`
- `AppRouteContent.tsx`

Quy tac:

- App chi nen import feature qua public API `features/<feature>/index.ts`.
- App co the ghep route, provider va guard cap ung dung.
- Component feature khong tu update URL bang `window.history.pushState`; dung React Router.

### `src/core`

Chua code dung chung khong thuoc rieng role nao.

Vi du:

- `core/api/axiosClient.ts`
- `core/api/axiosInterceptors.ts`
- `core/api/api.types.ts`
- `core/components/Breadcrumb.tsx`
- `core/components/DashboardShell.tsx`
- `core/components/ListTable.tsx`
- `core/utils/pagination.ts`
- `core/utils/errorManager.ts`

Quy tac:

- `core` khong import tu `features/*`.
- `core/components` chi chua UI dung chung, khong chua nghiep vu cua role.
- `core/api` chua axios client/interceptor va type/mapper API dung chung.
- `core/utils` chua helper thuan, khong import React component, axios implementation hoac feature.

Sai:

```ts
import { LoginFeature } from '@/features/auth'
```

trong `src/core/components`.

Dung:

```ts
import { getPasswordStrength } from '@/core/utils/passwordStrength'
```

### `src/features`

Moi feature tu quan ly domain, application logic, infrastructure adapter, UI va style rieng cua feature do.

Vi du:

```text
features/hr/
+-- domain/
+-- application/
+-- infrastructure/
+-- presentation/

features/tenant/
+-- domain/
+-- application/
+-- infrastructure/
+-- presentation/

features/admin/
+-- domain/
+-- application/
+-- infrastructure/
+-- presentation/
```

Quy tac:

- `features/admin` chi chua logic Super Admin.
- `features/hr` khong import `features/admin`.
- `features/tenant` khong import `features/admin`.
- API rieng theo role dat trong `infrastructure` cua feature:
  - `features/admin/infrastructure/adminApi.ts`
  - `features/hr/infrastructure/hrApi.ts`
  - `features/tenant/infrastructure/tenantAdminApi.ts`
- Logic dieu phoi flow/state dat trong `application`.
- Type/rule thuan dat trong `domain`.
- UI dat trong `presentation`.
- Logic dung chung thi dua ra `core`.

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

- Khi them role moi, tao feature rieng trong `src/features/<role>`.
- Khi them API payload/response type dung chung, uu tien dat trong `src/core/api/api.types.ts`.
- Khi them API payload/response type rieng role, dat trong `src/features/<feature>/domain`.
- Khi them mapper response API dung chung, dat trong `src/core/api/apiMappers.ts`.
- Khi them mapper rieng role, dat trong `src/features/<feature>/infrastructure`.
- Khi them route helper rieng role, dat trong feature so huu route do. Route composition cap app dat trong `src/app/routes`.
- Khi tao component dung chung, dat trong `src/core/components` va dam bao khong import tu `features`.
- Khi build refactor, chay `npm.cmd run build` de kiem tra import/type.

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
