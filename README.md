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
|   |   +-- routes/              # route config, route guard, route helper
|   +-- assets/                  # anh/static asset import trong app
|   +-- components/
|   |   +-- common/              # component dung chung, khong phu thuoc feature
|   |   +-- icons/
|   |   +-- layout/
|   +-- features/
|   |   +-- admin/               # Super Admin feature
|   |   +-- auth/                # login/signup/auth screens va auth-specific logic
|   |   +-- candidate/           # Candidate feature
|   |   +-- hr/                  # HR feature
|   |   +-- interviewer/         # Interviewer feature
|   |   +-- landing/             # Landing page
|   |   +-- tenant/              # Tenant Admin feature
|   +-- hooks/                   # hook dung chung
|   +-- services/
|   |   +-- api/                 # axios, API types, API mappers, API constants
|   |   +-- error/               # shared error messages/helpers
|   +-- styles/                  # global CSS imports
|   +-- utils/                   # helper thuan, khong phu thuoc React
+-- test/                        # Vitest unit tests
+-- index.html
+-- package.json
+-- vite.config.ts
```

## Kien truc

Du an dang theo huong **Feature-based Architecture** ket hop voi cac quy tac **Clean Architecture** cho frontend.

Luon uu tien dependency mot chieu:

```text
app/routes
  -> features
  -> components/common
  -> services/api, services/error
  -> utils
```

Feature co the dung shared layer:

```text
features/hr -> services/api, services/error, utils, app/routes
features/tenant -> services/api, services/error, utils, app/routes
features/admin -> services/api, services/error, utils, app/routes
```

Feature khong nen import logic noi bo cua feature khac.

Sai:

```ts
import { getListPageCount } from '@/features/admin/utils/adminMappers'
```

Dung:

```ts
import { getListPageCount } from '@/utils/pagination'
```

## Vai tro tung layer

### `src/app/routes`

Chua route config, protected route va route helper.

Vi du:

- `RouteConfig.tsx`
- `RoleRoutes.tsx`
- `ProtectedRoute.tsx`
- `roleRouteHelpers.ts`
- `superAdminRouteHelpers.ts`
- `tenantAdminRouteHelpers.ts`
- `route.types.ts`

Quy tac:

- URL/path helper dat o `src/app/routes`.
- Khong dat route helper trong feature rieng neu helper do duoc dung boi nhieu role.
- Component feature khong tu update URL bang `window.history.pushState`; dung React Router.

### `src/components/common`

Chua UI component dung chung.

Vi du:

- `Breadcrumb`
- `SearchInput`
- `MetricCard`
- `DashboardShell`
- `ConfirmActionModal`
- `ScrollableSelect`
- `AccountSettingsPanel`
- `ChangePasswordView`

Quy tac:

- Common component khong duoc import nguoc vao `features/*`.
- Common component chi nen phu thuoc `services`, `utils`, hoac component common khac.
- Neu component co nghiep vu rieng cua role, dat trong feature cua role do.

Sai:

```ts
import { LoginFeature } from '@/features/auth'
```

trong `src/components/common`.

Dung:

```ts
import { authApi } from '@/services/api/authApi'
import { getPasswordStrength } from '@/utils/passwordStrength'
```

### `src/features`

Moi feature tu quan ly UI, service rieng, styles rieng va logic rieng cua feature do.

Vi du:

```text
features/hr/
+-- components/
+-- services/

features/tenant/
+-- components/
+-- services/

features/admin/
+-- components/
+-- services/
+-- styles/
+-- utils/
```

Quy tac:

- `features/admin` chi chua logic Super Admin.
- `features/hr` khong import `features/admin`.
- `features/tenant` khong import `features/admin`.
- API rieng theo role dat trong feature service cua role:
  - `features/admin/services/adminApi.ts`
  - `features/hr/services/hrApi.ts`
  - `features/tenant/services/tenantAdminApi.ts`
- Logic dung chung thi dua ra `services`, `utils`, `components/common`, hoac `app/routes`.

### `src/services/api`

Chua API infrastructure va cac type/mapper lien quan den API.

File chinh:

- `axiosClient.ts`
- `axiosInterceptors.ts`
- `axiosErrorHandler.ts`
- `authApi.ts`
- `authStorage.ts`
- `api.types.ts`
- `apiMappers.ts`
- `apiConstants.ts`

Quy tac:

- Payload/response/request type dung chung dat trong `api.types.ts`.
- Mapper normalize response API dat trong `apiMappers.ts`.
- Axios client/interceptor dat trong `services/api`.
- Khong dat API type dung chung trong `features/admin`.

Vi du payload dung chung:

```ts
import type { CreateTenantPayload, JobPostingPayload } from '@/services/api/api.types'
```

### `src/services/error`

Chua error message/helper dung chung.

File chinh:

- `errorMessages.ts`
- `authErrorMessages.ts`
- `inputErrorHandler.ts`

Quy tac:

- Loi chung khong dat trong `features/admin`.
- Feature co the import helper loi tu `services/error`.

### `src/utils`

Chua helper thuan, khong phu thuoc React.

Vi du:

- `pagination.ts`
- `passwordStrength.ts`
- `passwordRequirements.ts`
- `errorManager.ts`
- `httpStatusManager.ts`

Quy tac:

- Function format, normalize, calculate neu dung chung thi dua vao `utils`.
- `utils` khong import React component.
- `utils` khong import feature.

## Quy tac code theo Clean Architecture

1. Khong import cheo feature

Khong de `hr`, `tenant`, `interviewer`, `candidate` import truc tiep tu `features/admin`.

Sai:

```ts
import { normalizeTenantAdminUser } from '@/features/admin/utils/adminMappers'
```

Dung:

```ts
import { normalizeTenantAdminUser } from '@/services/api/apiMappers'
```

2. Common khong phu thuoc feature

`src/components/common` khong import tu `src/features`.

3. Payload va API response type dat trong `services/api`

Dung:

```ts
import type { Tenant, SubscriptionPlan, AdminListParams } from '@/services/api/api.types'
```

4. Route helper dat trong `app/routes`

Dung:

```ts
import { getSuperAdminViewPath } from '@/app/routes/superAdminRouteHelpers'
import { getRoleHomeViewPath } from '@/app/routes/roleRouteHelpers'
```

5. Pagination dung chung dat trong `utils/pagination`

Dung:

```ts
import { getListPageCount, getListTotalElements } from '@/utils/pagination'
```

6. API rieng cua role dat trong feature service cua role do

Dung:

```ts
import { hrApi } from '@/features/hr/services/hrApi'
import { tenantAdminApi } from '@/features/tenant/services/tenantAdminApi'
import { adminApi } from '@/features/admin/services/adminApi'
```

7. Component khong nen chua helper logic lon

Neu helper la validate/filter/build params/sort/normalize:

- Dung rieng trong feature: dua vao `features/<feature>/services` hoac `features/<feature>/utils`.
- Dung chung: dua vao `services` hoac `utils`.

8. CSS theo vi tri dung

- CSS global/import chung: `src/styles`.
- CSS rieng cua feature: `features/<feature>/styles`.
- CSS module rieng component: co the dat trong `features/<feature>/styles` neu la style cua feature.

9. Khong de folder rong

Neu da chuyen het file, xoa folder rong de cau truc gon.

## Auth va refresh token

Frontend dung:

```text
src/services/api/axiosClient.ts
src/services/api/axiosInterceptors.ts
src/services/api/authStorage.ts
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
- Khi them API payload/response type, uu tien dat trong `src/services/api/api.types.ts`.
- Khi them mapper response API, uu tien dat trong `src/services/api/apiMappers.ts`.
- Khi them route helper, dat trong `src/app/routes`.
- Khi tao component dung chung, dat trong `src/components/common` va dam bao khong import tu `features`.
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
