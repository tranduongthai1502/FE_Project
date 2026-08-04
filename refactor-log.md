# Refactor log

## 2026-08-04

### Baseline truoc refactor

- Kiem tra `git status --short`.
  - Phat hien nhieu thay doi co san trong `src/features/tenant/*`.
  - Quyet dinh khong refactor sau vao tenant o buoc dau de tranh de len thay doi dang co.
- Chay `npm run lint`.
  - Ket qua: pass, co warning.
  - Warning hien co:
    - `src/features/auth/presentation/pages/ChangePasswordView.tsx`: `nextStrength` unused.
    - `src/features/admin/infrastructure/adminMappers.ts`: `getResponsePayload` unused.
    - `src/app/routes/RouteConfig.tsx`: `react(only-export-components)`.
    - `src/features/auth/application/useLoginFeature.ts`: `FIELD_LENGTH_LIMITS` unused.
- Chay `npm run build`.
  - Ket qua: pass.
  - Warning hien co: bundle JS lon hon 500 kB.
- Chay `npm run test`.
  - Ket qua: fail do PowerShell execution policy chan `npm.ps1`.
- Chay `npm.cmd run test`.
  - Ket qua: Vitest chay duoc nhung fail vi chua co file test khop `test/**/*.test.ts`.

### Nguyen tac cho cac buoc tiep theo

- Chi sua theo lat nho.
- Khong revert thay doi co san cua nguoi dung.
- Khong doi behavior UI/API/route khi chi refactor cau truc.
- Sau moi nhom sua se chay lai `lint` va `build`; `test` duoc ghi nhan hien fail do chua co test file.

### Phase 1 - Cap nhat README theo cau truc hien tai

- Sua `README.md`.
  - Cap nhat cay thu muc tu cau truc cu `components/services/utils` sang cau truc hien tai `core` va `features`.
  - Mo ta dependency direction theo clean architecture: `presentation -> application -> domain`, `infrastructure` implement port va dung `core/api`.
  - Cap nhat vai tro cua `src/app`, `src/core`, `src/features`.
  - Doi cac duong dan cu `src/services/api/*` thanh `src/core/api/*`.
  - Cap nhat ghi chu phat trien ve noi dat API type, mapper, route helper va component dung chung.
  - Khong sua logic code.

### Phase 3 - Chuan hoa public API auth

- Sua `src/features/auth/application/index.ts`.
  - Export `isStoredCurrentUserInactive` tu application barrel.
- Sua `src/features/auth/index.ts`.
  - Export `isStoredCurrentUserInactive` qua public API cua feature auth.
- Sua `src/features/interviewer/presentation/components/InterviewerDashboard.tsx`.
  - Doi import `isStoredCurrentUserInactive` tu path sau `@/features/auth/application/authAccess` sang public API `@/features/auth`.
- Sua `src/features/hr/presentation/components/HrDashboard.tsx`.
  - Doi import `isStoredCurrentUserInactive` tu path sau `@/features/auth/application/authAccess` sang public API `@/features/auth`.
- Sua `src/features/tenant/infrastructure/tenantAdminSessionStorage.ts`.
  - Gom `getStoredDashboardUser` va `isStoredCurrentUserInactive` ve cung public import `@/features/auth`.
- Khong doi logic auth/session; chi doi boundary import/export.

### Clean-up warning lint baseline

- Sua `src/features/admin/infrastructure/adminMappers.ts`.
  - Xoa import `getResponsePayload` khong duoc su dung.
- Sua `src/features/auth/application/useLoginFeature.ts`.
  - Xoa import `FIELD_LENGTH_LIMITS` khong duoc su dung.
- Sua `src/features/auth/presentation/pages/ChangePasswordView.tsx`.
  - Xoa bien `nextStrength` khong duoc su dung trong handler password.
  - Xoa import `getPasswordStrength` sau khi bien thua da duoc xoa.
- Sua `src/app/routes/RouteConfig.tsx`.
  - Xoa export `pathByPage` khong co noi su dung de giam warning fast-refresh.
- Tat ca thay doi trong nhom nay la xoa code thua, khong doi behavior.

### Phase 9 - Them baseline test cho core utils

- Them `test/pagination.test.ts`.
  - Test `getPaginationMeta` voi payload nested.
  - Test `attachPaginationMeta` giu nguyen item list va gan `__pagination`.
  - Test `getListPageCount` va `getListTotalElements` dung server meta truoc fallback.
  - Test fallback khi khong co server meta.
  - Test `getCompactPageItems` voi ellipsis.
- Muc tieu: bien `npm.cmd run test` tu fail vi khong co test file thanh baseline test co ich cho refactor tiep theo.

### Route helper ownership cho HR va Interviewer

- Di chuyen `src/features/hr/presentation/pages/roleHome.types.ts` sang `src/features/hr/domain/roleHome.types.ts`.
- Di chuyen `src/features/hr/presentation/hrRoutePaths.ts` sang `src/features/hr/domain/hrRoutePaths.ts`.
  - Cap nhat import type noi bo tu `./pages/roleHome.types` sang `./roleHome.types`.
- Di chuyen `src/features/interviewer/presentation/pages/interviewerHome.types.ts` sang `src/features/interviewer/domain/interviewerHome.types.ts`.
- Di chuyen `src/features/interviewer/presentation/interviewerRoutePaths.ts` sang `src/features/interviewer/domain/interviewerRoutePaths.ts`.
  - Cap nhat import type noi bo tu `./pages/interviewerHome.types` sang `./interviewerHome.types`.
- Sua `src/features/hr/presentation/components/HrDashboard.tsx`.
  - Doi import route helper va view type HR sang `domain`.
- Sua `src/features/hr/presentation/components/hrNavigation.ts`.
  - Doi import `RoleHomeView` sang `domain`.
- Sua `src/features/interviewer/presentation/components/InterviewerDashboard.tsx`.
  - Doi import route helper va view type Interviewer sang `domain`.
- Sua `src/features/interviewer/presentation/components/interviewerNavigation.ts`.
  - Doi import `InterviewerHomeView` sang `domain`.
- Rationale: route/view type la logic dieu huong thuan, khong phai presentation UI.

### Public API cleanup cho admin

- Sua `src/features/admin/index.ts`.
  - Xoa export `adminApi` tu public barrel cua feature.
  - Giu `SuperAdminDashboard` va cac public type.
- Rationale: infrastructure API khong can duoc expose qua feature public API; cac usage hien tai khong import `adminApi` tu `@/features/admin`.

### Complete Refactor Execution (Phases 1 - 9)

- **Phase 1, 2, 3**:
  - Rà soát `src/core`, xác nhận 0 import vi phạm từ `src/features`.
  - Rà soát auth boundary, loại bỏ toàn bộ import sâu vào internal application/infrastructure auth từ các feature khác.
- **Phase 4 (Tenant)**:
  - Bổ sung unit tests `test/tenant.test.ts` cho `tenantStaffFilters`, `tenantStaffFormValidation`, `tenantStaffQuota`.
- **Phase 5 (Super Admin)**:
  - Tách logic tính toán dashboard stats, MRR, expiring tenants, highest priced plan khỏi UI sang `src/features/admin/domain/superAdminMetrics.ts`.
  - Cập nhật `SuperAdminDashboard.tsx` sử dụng `calculateAdminDashboardMetrics`.
  - Bổ sung unit test `test/admin.test.ts`.
- **Phase 6 (HR)**:
  - Bổ sung unit test `test/hr.test.ts` kiểm thử `hrJobLogic` (status normalizer, payload builder, criteria mapper).
- **Phase 8 & 9**:
  - Rà soát toàn bộ public barrels `index.ts` ở tất cả các feature.
  - Chạy bộ kiểm thử tự động architecture import check: `src/core` và `src/features/*/domain` hoàn toàn sạch, không dính dependency vi phạm.
- **Verification**: `npm run lint` (0 error, 0 warning), `npm run test` (Pass 20/20 tests), `npm run build` (Pass).

### Clean Architecture Refactor - Feature `src/features/admin`

- **Phase A (Domain Layer Rules)**:
  - Tạo `src/features/admin/domain/tenantRules.ts`: đóng gói các quy tắc expiry warning (hạn 30 ngày), active tenant status check, badge class formatters.
  - Tạo `src/features/admin/domain/subscriptionPlanRules.ts`: đóng gói quy tắc Enterprise plan check, tính % chiết khấu theo năm, format hiển thị giá cước.
- **Phase B (Application Ports & Validation)**:
  - Tạo `src/features/admin/application/ports/adminRepository.ts`: định nghĩa hợp đồng interface repository cho Tenant, Plan, Prompt capabilities.
  - Tạo `src/features/admin/application/tenantFormValidation.ts`: quy tắc validate form thông tin Tenant.
  - Tạo `src/features/admin/application/planFormValidation.ts`: quy tắc validate form Gói cước.
- **Phase C (Infrastructure Adapter)**:
  - Tạo `src/features/admin/infrastructure/adminRepositoryImpl.ts`: triển khai `AdminRepository` port gọi `adminApi` và `adminMappers`.
- **Phase D & E (Presentation Subcomponents)**:
  - Tạo `src/features/admin/presentation/components/tenant/TenantFilterBar.tsx` làm UI subcomponent lọc Tenant.
  - Tạo `src/features/admin/presentation/components/plan/PlanGridCard.tsx` làm UI subcomponent hiển thị thẻ Gói cước.
- **Phase F (Unit Tests Expansion)**:
  - Cập nhật `test/admin.test.ts` bổ sung các test cases cho `tenantRules`, `subscriptionPlanRules`, `tenantFormValidation`, `planFormValidation`.
- **Verification**:
  - `npm run lint`: Pass (0 error, 0 warning).
  - `npm run test`: Pass 27/27 tests (4 test files).
  - `npm run build`: Pass (926ms).

### Code Formatting Cleanup - Feature `src/features/admin`

- Chuẩn hóa format key/object properties (loại bỏ double quote dư thừa quanh key).
- Chuẩn hóa khoảng trắng, import statement & linter style trong `src/features/admin/infrastructure/adminApi.ts` và các file liên quan.
- **Verification**: `npm run lint` (0 error, 0 warning), `npm run test` (Pass 27/27 tests), `npm run build` (Pass 966ms).

### Import Consistency Audit - Feature `src/features/admin`

- Kiểm tra toàn bộ đường dẫn import trong `src/features/admin/`:
  - Đồng nhất sử dụng relative import cho các module nội bộ cùng feature (`../../domain/...`).
  - Loại bỏ hoàn toàn các import dư thừa hoặc khai báo unused imports (`npx oxlint --deny=no-unused-vars` - 0 error).
### TypeScript Type Fix - `tenantFormValidation.ts`

- Cập nhật `CreateTenantPayload` và `Tenant` trong [adminApi.types.ts](file:///c:/Users/ADMIN/Desktop/intern/Intern_project/FE_Project/src/features/admin/domain/adminApi.types.ts) bổ sung các trường tùy chọn `name`, `companyName`, `subscriptionPlanId`, `subscriptionPlan`.
- Cập nhật [tenantFormValidation.ts](file:///c:/Users/ADMIN/Desktop/intern/Intern_project/FE_Project/src/features/admin/application/tenantFormValidation.ts) hỗ trợ kiểm tra linh hoạt tên tenant và gói cước.
- **Verification**: `npm run lint` (0 error, 0 warning), `npm run test` (Pass 27/27 tests), `npm run build` (Pass 910ms).

### Clean Architecture Refactor - Feature `src/features/hr`

- **Phase A (Domain Layer Rules)**:
  - Tạo `src/features/hr/domain/jobPostingRules.ts`: đóng gói các quy tắc kiểm tra deadline (phải từ hôm nay trở đi), quy tắc khoảng lương (maxSalary >= minSalary), status check.
  - Tạo `src/features/hr/domain/jobCriteriaRules.ts`: đóng gói quy tắc chuẩn hóa % trọng số (`normalizeWeightInput`), giới hạn tối đa 20 tiêu chí, tổng trọng số 100%.
- **Phase B (Application Ports & Validation)**:
  - Tạo `src/features/hr/application/ports/hrRepository.ts`: định nghĩa hợp đồng interface repository cho Job Posting, Criteria, Revision History.
  - Tạo `src/features/hr/application/jobFormValidation.ts`: quy tắc validate form đăng tuyển công việc.
  - Tạo `src/features/hr/application/criteriaFormValidation.ts`: quy tắc validate form tiêu chí đánh giá.
- **Phase C (Infrastructure Adapter)**:
  - Tạo `src/features/hr/infrastructure/hrRepositoryImpl.ts`: triển khai `HrRepository` port gọi `hrApi` và `hrMappers`.
- **Phase D & E (Presentation Subcomponents)**:
  - Tạo `src/features/hr/presentation/components/job/JobFilterBar.tsx` làm UI subcomponent lọc tin tuyển dụng.
- **Phase G (Unit Tests Expansion)**:
  - Cập nhật `test/hr.test.ts` bổ sung các test cases cho `jobPostingRules`, `jobCriteriaRules`, `jobFormValidation`, `criteriaFormValidation`.
- **Verification**:
  - `npm run lint`: Pass (0 error, 0 warning).
  - `npm run test`: Pass 32/32 tests (4 test files).
  - `npm run build`: Pass (1.14s).







