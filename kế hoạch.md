# Kế hoạch refactor Feature-based + Clean Architecture

## 1. Mục tiêu

Refactor dự án theo hướng feature-based architecture kết hợp clean architecture, nhưng triển khai theo từng lát nhỏ để không làm vỡ logic hiện tại.

Mục tiêu chính:

- Giữ nguyên hành vi người dùng, route, payload API, auth flow và UI hiện tại trong từng bước refactor.
- Làm rõ ranh giới giữa `app`, `core` và từng `features/*`.
- Tách dần logic nghiệp vụ khỏi component lớn.
- Chuẩn hóa dependency direction: presentation -> application -> domain; infrastructure chỉ được gọi qua application/repository port khi có thể.
- Tăng khả năng test cho logic normalize, validate, route helper, form state và API mapping.

## 2. Hiện trạng nhanh

Dự án là React + TypeScript + Vite, có các role chính: Super Admin, Tenant Admin, HR, Interviewer, Candidate.

Cấu trúc hiện tại đã đi khá đúng hướng:

```text
src/
  app/
    routes/
  core/
    api/
    components/
    hooks/
    styles/
    utils/
  features/
    admin/
    auth/
    candidate/
    hr/
    interviewer/
    landing/
    tenant/
```

Một số feature đã có layer rõ:

```text
features/<feature>/
  domain/
  application/
  infrastructure/
  presentation/
```

Điểm cần lưu ý:

- `tenant` đã bắt đầu tách tốt với `TenantAdminRepository`, `TenantAdminSession`, `TenantFileDownloader`, controller hook và storage implementation.
- `admin` và `hr` vẫn còn nhiều logic gọi API/state orchestration trực tiếp trong presentation.
- `HrDashboard.tsx`, `SubscriptionPlansView.tsx`, `TenantManagementView.tsx`, `useTenantAdminDashboardController.ts` là các điểm nóng có độ rủi ro cao khi refactor.
- Một số feature khác vẫn import trực tiếp từ `features/auth` để lấy session/account helper. Nên gom contract dùng chung qua `core` hoặc qua public API ổn định của auth.
- README đang mô tả một phần cấu trúc cũ như `services`, `components/common`, `utils`, trong khi code thực tế đã chuyển sang `core`.
- Test hiện tại chưa thấy có file test đáng kể trong `test/`, nên cần thêm characterization/unit tests trước khi di chuyển logic lớn.

## 3. Kiến trúc mục tiêu

Mỗi feature nên có cùng một mẫu tổ chức:

```text
src/features/<feature>/
  domain/
    *.types.ts
    *.entities.ts
    *.valueObjects.ts
    *Rules.ts
  application/
    use*.ts
    *Controller.ts
    *Repository.ts
    *Service.ts
    *Validation.ts
  infrastructure/
    *Api.ts
    *Repository.ts
    *Mappers.ts
    *Storage.ts
  presentation/
    pages/
    components/
    styles/
  index.ts
```

Ý nghĩa layer:

- `domain`: type nghiệp vụ, rule thuần, route/view type riêng feature, không import React, Axios, DOM storage.
- `application`: hook/controller/use-case điều phối state, gọi repository interface, validate, build payload, xử lý flow.
- `infrastructure`: axios API, mapper backend/frontend, localStorage/sessionStorage, file download, adapter cụ thể.
- `presentation`: page/component thuần UI, nhận props và callback từ application, hạn chế gọi API trực tiếp.
- `core`: thành phần dùng chung không thuộc role cụ thể: axios client, toast, layout shell, table, pagination, currency/error utilities.
- `app`: bootstrap, provider, router composition, route guard cấp app.

Dependency mong muốn:

```text
app
  -> features/* public API
  -> core

features/<feature>/presentation
  -> features/<feature>/application
  -> features/<feature>/domain
  -> core

features/<feature>/application
  -> features/<feature>/domain
  -> repository/storage/downloader ports
  -> core utils nếu thật sự dùng chung

features/<feature>/infrastructure
  -> features/<feature>/domain
  -> features/<feature>/application ports
  -> core/api, core/utils
```

Không nên có:

- Feature này import implementation nội bộ của feature khác.
- `presentation` gọi thẳng `axiosClient` hoặc API service lớn nếu flow đã đủ phức tạp.
- `domain` import React, router, axios, localStorage/sessionStorage.
- `core` import từ `features/*`.
- Component lớn chứa cả mapper, validation, route sync, API flow, modal state và rendering chi tiết.

## 4. Nguyên tắc không làm vỡ logic

Refactor theo chiến lược an toàn:

1. Không đổi behavior trong cùng commit với đổi cấu trúc.
2. Mỗi bước chỉ di chuyển một loại logic: type, mapper, validation, hook state, API adapter hoặc UI component.
3. Trước khi tách file lớn, thêm test cho logic thuần hoặc ghi lại behavior cần giữ.
4. Giữ public export cũ trong `index.ts` trong giai đoạn chuyển tiếp.
5. Ưu tiên copy-move-verify rồi mới xóa code cũ.
6. Sau mỗi lát refactor chạy:

```bash
npm run lint
npm run build
npm run test
```

7. Với màn hình chưa có test, kiểm tra thủ công các flow chính trước/sau refactor:

- Login, logout, refresh token, require password change.
- Role routing và guard.
- Super Admin tenant management, subscription plans.
- Tenant Admin staff list/create/edit/delete/activity log/export.
- HR job list/create/edit/delete/status/criteria/revision history.
- Candidate/interviewer dashboard và settings.

## 5. Thứ tự refactor đề xuất

### Phase 0: Chốt baseline

Mục tiêu: biết trạng thái hiện tại trước khi di chuyển code.

Việc cần làm:

- Chạy `npm run lint`, `npm run build`, `npm run test` và ghi lại lỗi hiện tại nếu có.
- Tạo checklist smoke test cho từng role.
- Ghi nhận các file đang có thay đổi chưa commit, đặc biệt khu vực `features/tenant`.
- Không refactor chồng lên thay đổi dở dang nếu chưa xác nhận logic tenant đã ổn.

Kết quả mong muốn:

- Có baseline rõ: build/lint/test pass hoặc danh sách lỗi hiện hữu.
- Có danh sách flow cần giữ nguyên.

### Phase 1: Chuẩn hóa tài liệu và ranh giới thư mục

Mục tiêu: làm README/kiến trúc khớp với code thật.

Việc cần làm:

- Cập nhật README từ cấu trúc cũ `services`, `components/common`, `utils` sang cấu trúc hiện tại `core`.
- Thống nhất quy ước import:
  - App import feature qua `features/<feature>/index.ts`.
  - Feature nội bộ ưu tiên relative import trong cùng feature.
  - Shared import qua `@/core/*`.
- Kiểm tra folder rỗng hoặc folder cũ không còn dùng.
- Ghi rule kiến trúc vào docs hoặc README.

Kết quả mong muốn:

- Người mới đọc README hiểu đúng cấu trúc hiện tại.
- Không còn hướng dẫn trỏ nhầm sang folder không tồn tại.

### Phase 2: Làm sạch shared/core

Mục tiêu: `core` thật sự độc lập với feature.

Việc cần làm:

- Kiểm tra `src/core` không import từ `features/*`.
- Tách các helper generic còn nằm trong feature ra `core/utils` nếu đang được dùng ở nhiều role.
- Xem lại `axiosInterceptors.ts` vì đang chứa logic nhận diện HR/interviewer/staff management context. Nếu logic đó phát triển thêm, cân nhắc tách thành auth/session policy thuần.
- Chuẩn hóa error helpers: phần generic ở `core/utils/errors`, phần message riêng role ở feature application/domain.
- Gỡ `console.log` trong API layer hoặc bọc bằng dev-only logger.

Kết quả mong muốn:

- `core` không biết role cụ thể trừ khi đó là policy auth cấp app được định nghĩa rõ.
- API infrastructure sạch log debug ngoài ý muốn.

### Phase 3: Chuẩn hóa auth boundary

Mục tiêu: các feature khác không phụ thuộc sâu vào implementation nội bộ của auth.

Vấn đề hiện tại:

- `admin`, `hr`, `interviewer`, `candidate`, `tenant` đang dùng `AccountSettingsPanel`, `getStoredDashboardUser`, `isStoredCurrentUserInactive` từ `features/auth`.
- Một số nơi import sâu như `@/features/auth/application/authAccess`.

Việc cần làm:

- Quyết định auth là shared feature hay app-level capability.
- Nếu auth vẫn là feature, chỉ cho phép import qua public API `@/features/auth`.
- Export rõ các contract dùng chung:
  - `AccountSettingsPanel`
  - `getStoredDashboardUser`
  - `isStoredCurrentUserInactive`
  - `DashboardUser`
  - role types
- Tránh import sâu từ `features/auth/application/*` ở feature khác.
- Với logic storage/session generic, cân nhắc chuyển port/type sang `core/api/authStorage` hoặc `core/session`.

Kết quả mong muốn:

- Feature khác không cần biết cấu trúc nội bộ của auth.
- Khi đổi auth implementation, admin/hr/tenant ít bị ảnh hưởng.

### Phase 4: Hoàn thiện pattern cho tenant rồi dùng làm mẫu

Mục tiêu: biến `tenant` thành feature mẫu vì đã gần với clean architecture.

Việc cần làm:

- Rà lại các port:
  - `TenantAdminRepository`
  - `TenantAdminSession`
  - `TenantStaffSelectionStore`
  - `TenantFileDownloader`
- Đảm bảo application chỉ gọi interface/port, infrastructure implement port.
- Tách tiếp `useTenantAdminDashboardController.ts` theo trách nhiệm:
  - route/view state
  - staff list filters + pagination
  - staff detail
  - staff mutations
  - activity log list/export/clear
  - tenant workspace loader
- Giữ `TenantAdminDashboard.tsx` là composition layer nhận controller result.
- Thêm test cho:
  - `tenantStaffFilters`
  - `tenantStaffFormValidation`
  - `tenantStaffQuota`
  - `tenantStaffNormalizers`
  - `tenantAdminRouteHelpers`

Kết quả mong muốn:

- Tenant là reference implementation để admin/HR migrate theo.
- Controller nhỏ hơn, dễ đọc và ít rủi ro khi sửa.

### Phase 5: Refactor Super Admin

Mục tiêu: tách logic khỏi presentation trong `admin`.

Điểm nóng:

- `SuperAdminDashboard.tsx`
- `TenantManagementView.tsx`
- `SubscriptionPlansView.tsx`
- `PromptManagementView.tsx`
- `adminApi.ts`
- `adminMappers.ts`

Việc cần làm:

- Tạo application ports:
  - `AdminRepository`
  - `TenantManagementRepository`
  - `SubscriptionPlanRepository`
- Chuyển gọi `adminApi` từ presentation vào hooks/application:
  - `useSuperAdminDashboard`
  - `useTenantManagement`
  - `useSubscriptionPlans`
  - `usePromptManagement`
- Tách calculations thuần khỏi `SuperAdminDashboard`:
  - active tenants
  - expiring tenants
  - MRR
  - tenants by plan
  - fallback dashboard rows
- Chuyển mapper/backend normalization vào infrastructure, không để component tự hiểu shape backend.
- Với các view đang dùng React Query, giữ React Query nhưng bọc query key/query fn trong application hook.
- Thêm unit test cho dashboard calculations, payload builders, route helpers và mapper.

Kết quả mong muốn:

- Presentation chỉ render và gọi callback.
- API/mutation/query orchestration nằm trong application.
- Infrastructure chỉ lo backend adapter.

### Phase 6: Refactor HR

Mục tiêu: giảm rủi ro từ `HrDashboard.tsx` rất lớn bằng cách tách theo workflow.

Điểm nóng:

- `HrDashboard.tsx` khoảng 2.000 dòng.
- `hrJobLogic.ts` đang chứa nhiều logic hữu ích nhưng vẫn có thể tách nhỏ thêm.
- `hrApi.ts` vừa build request, normalize payload, gọi API, có log debug.

Thứ tự an toàn:

1. Tách helper thuần trong `HrDashboard.tsx` sang application/domain:
   - date input/deadline helpers
   - calendar helpers
   - pagination ellipsis
   - location/status display
2. Tách UI con không có side effect:
   - revision history icons/list
   - job metrics section
   - job list table section
   - job detail tabs
   - criteria editor section
3. Tạo application hooks:
   - `useHrDashboardStats`
   - `useJobPostingList`
   - `useJobPostingDetail`
   - `useJobPostingForm`
   - `useJobCriteriaEditor`
   - `useJobMutations`
4. Tạo repository port:
   - `HrRepository`
   - infrastructure implementation gọi `hrApi`
5. Sau cùng, cân nhắc chuyển data fetching từ effect thủ công sang React Query nếu không đổi behavior.

Test cần ưu tiên:

- `hrJobLogic`
- deadline/date helpers
- build job payload
- validate job form/criteria
- mapper job posting/revision history
- route helper HR

Kết quả mong muốn:

- `HrDashboard.tsx` chỉ còn composition/router shell của HR.
- Các workflow HR có thể test độc lập.

### Phase 7: Refactor Candidate và Interviewer

Mục tiêu: chuẩn hóa các feature nhỏ sau khi admin/HR/tenant có pattern.

Việc cần làm:

- Tạo `application` nếu feature có state/session/flow riêng.
- Chỉ giữ UI trong `presentation`.
- Nếu chỉ là dashboard tĩnh/mock data, giữ domain data trong `domain`, UI trong `presentation`.
- Không import sâu từ auth application.

Kết quả mong muốn:

- Candidate/interviewer tuân thủ cùng dependency rule với các feature lớn.

### Phase 8: Chuẩn hóa public API của feature

Mục tiêu: mỗi feature chỉ expose những gì app/feature khác thật sự cần.

Việc cần làm:

- Rà `features/*/index.ts`.
- Không export toàn bộ API infrastructure nếu không cần thiết.
- App routes chỉ import page/root component và type public.
- Feature khác không import vào `presentation/components` của feature khác.

Gợi ý:

```text
features/admin/index.ts
  export { SuperAdminDashboard }
  export type { ...public types nếu cần }

features/auth/index.ts
  export { LoginFeature, SignupFeature, AccountSettingsPanel }
  export { useAuthSession, getStoredDashboardUser, isStoredCurrentUserInactive }
  export type { AppRole, DashboardUser, AuthUser }
```

Kết quả mong muốn:

- Dễ kiểm soát coupling.
- Đổi cấu trúc nội bộ feature ít ảnh hưởng bên ngoài.

### Phase 9: Test và guard kiến trúc

Mục tiêu: refactor có lưới an toàn.

Việc cần làm:

- Thêm unit tests cho logic thuần trước.
- Thêm integration/light component tests cho các controller hook quan trọng nếu setup cho phép.
- Tạo test cho mapper với nhiều shape response backend vì hiện tại mapper đang xử lý nhiều format khác nhau.
- Cân nhắc thêm rule lint hoặc script kiểm tra import:
  - `core` không import `features`.
  - `domain` không import React/Axios.
  - Feature không import sâu implementation feature khác.

Ví dụ rule kiểm tra thủ công bằng `rg`:

```bash
rg "@/features/.+/application|@/features/.+/infrastructure|@/features/.+/presentation" src/features
rg "@/features" src/core
rg "axiosClient|localStorage|sessionStorage" src/features/*/domain
```

Kết quả mong muốn:

- Có cảnh báo sớm khi dependency direction bị phá.
- Những phần dễ vỡ như auth, mapper, route, form validation được test trước.

## 6. Thứ tự ưu tiên thực tế

Nên làm theo thứ tự này:

1. Baseline build/lint/test.
2. Cập nhật README cho đúng `core` và layer hiện tại.
3. Siết auth public API để bỏ import sâu từ feature khác.
4. Hoàn thiện tenant làm pattern mẫu.
5. Tách Super Admin vì đã có React Query và kích thước vừa phải hơn HR.
6. Tách HR theo workflow nhỏ, không làm một lần.
7. Chuẩn hóa candidate/interviewer.
8. Thêm import-boundary checks.

Không nên bắt đầu bằng `HrDashboard.tsx` nếu chưa có test và baseline, vì đây là file lớn nhất và có nhiều flow đan xen.

## 7. Checklist Definition of Done cho mỗi lát refactor

Một lát refactor chỉ được xem là xong khi:

- Không đổi URL public.
- Không đổi request/response contract với backend.
- Không đổi message lỗi/toast quan trọng.
- Không đổi quyền truy cập role guard.
- Không còn import path chết.
- `npm run build` pass.
- `npm run lint` pass hoặc lỗi còn lại được ghi rõ là lỗi baseline.
- Test liên quan pass.
- Smoke test thủ công flow bị chạm vào đã được kiểm tra.

## 8. Rủi ro và cách giảm rủi ro

| Rủi ro | Cách giảm rủi ro |
| --- | --- |
| Đổi mapper làm sai dữ liệu backend nhiều shape | Viết test mapper trước khi tách |
| Tách component lớn làm mất state hoặc effect order | Tách helper thuần trước, sau đó mới tách hook |
| Import auth bị gãy khi di chuyển | Giữ public export ở `features/auth/index.ts` trong giai đoạn chuyển tiếp |
| React Query cache key thay đổi làm refresh sai | Đóng gói query key thành constant trong application |
| Route sync sai khi tách controller | Test route helper và smoke test deep link |
| Logic tenant đang có thay đổi chưa commit | Không refactor tenant tiếp cho đến khi baseline được xác nhận |

## 9. Cấu trúc thư mục mục tiêu minh họa

```text
src/features/admin/
  domain/
    adminApi.types.ts
    superAdminRouteHelpers.ts
    subscriptionPlanRules.ts
    tenantRules.ts
  application/
    adminPayload.ts
    adminRepository.ts
    useSuperAdminDashboard.ts
    useTenantManagement.ts
    useSubscriptionPlans.ts
  infrastructure/
    adminApi.ts
    adminMappers.ts
    adminRepository.ts
  presentation/
    components/
    pages/
    styles/
  index.ts

src/features/hr/
  domain/
    hrApi.types.ts
    jobPostingRules.ts
    hrRoutePaths.ts
  application/
    hrRepository.ts
    jobFormValidation.ts
    useHrDashboard.ts
    useJobPostingList.ts
    useJobPostingForm.ts
    useJobCriteriaEditor.ts
  infrastructure/
    hrApi.ts
    hrMappers.ts
    hrRepository.ts
  presentation/
    components/
    pages/
    styles/
  index.ts
```

## 10. Kết luận

Dự án đã có nền feature-based khá rõ, đặc biệt ở `tenant`. Hướng refactor tốt nhất là không viết lại toàn bộ, mà chuẩn hóa từng feature theo pattern đã hình thành: domain thuần, application điều phối, infrastructure adapter, presentation render. Làm theo thứ tự nhỏ, có baseline và test trước sẽ giúp nâng kiến trúc mà vẫn giữ nguyên logic sản phẩm hiện tại.
