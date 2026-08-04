# Kế hoạch Refactor `src/features/admin` theo Clean Architecture

## 1. Mục tiêu & Định hướng

Refactor toàn bộ thư mục `src/features/admin` theo chuẩn **Clean Architecture kết hợp Feature-based Architecture**, nhằm:

- **Giữ nguyên 100%** giao diện UI, trải nghiệm người dùng, route URL, payload API backend và toast notifications.
- **Tách bạch hoàn toàn trách nhiệm** giữa 4 tầng: `domain`, `application`, `infrastructure`, `presentation`.
- **Giải quyết 2 điểm nóng lớn nhất**:
  - `SubscriptionPlansView.tsx` (~65 KB code hỗn hợp UI + State + API calls).
  - `TenantManagementView.tsx` (~51 KB code hỗn hợp UI + State + API calls).
- **Presentation Layer thuần UI**: Không import Axios API client, không tự thực hiện DTO mapping hay validation phức tạp; mọi tương tác và state orchestration được quản lý thông qua **Application Controller Hooks** và **Repository Ports**.
- **Tăng khả năng Test**: Đảm bảo các quy tắc nghiệp vụ (Calculations, Validation, Rules, Mappers) đều có unit test tự động phủ kín.

---

## 2. Ranh giới Kiến trúc Mục tiêu (Target Clean Architecture Layers)

```text
src/features/admin/
├── domain/                                 # Layer 1: Domain Entities, Value Objects, Pure Rules
│   ├── adminApi.types.ts                   # Types chuẩn cho Tenant, SubscriptionPlan, Prompt
│   ├── superAdminMetrics.ts                # Pure functions tính MRR, active tenants, plan distribution
│   ├── superAdminRouteHelpers.ts           # Pure functions giải mã URL view & route navigation
│   ├── subscriptionPlanRules.ts            # Quy tắc nghiệp vụ gói dịch vụ & tính giá cước
│   └── tenantRules.ts                      # Quy tắc trạng thái tenant, thời hạn hết hạn & quota
│
├── application/                            # Layer 2: Use Cases, Controllers, Ports & Validation
│   ├── ports/                              # Abstraction Interfaces (Contracts)
│   │   ├── adminRepository.ts              # Port gọi dữ liệu Tenant, SubscriptionPlan, Prompt
│   │   └── adminSessionPort.ts             # Port truy xuất thông tin Admin Session
│   ├── useSuperAdminDashboardController.ts # Controller điều phối Dashboard tổng quan
│   ├── useTenantManagementController.ts    # Controller điều phối quản lý Tenant (list, filter, crud, modal)
│   ├── useSubscriptionPlansController.ts   # Controller điều phối quản lý Gói cước (list, edit, feature, modal)
│   ├── usePromptManagementController.ts    # Controller điều phối quản lý Prompt hệ thống
│   ├── tenantFormValidation.ts             # Quy tắc kiểm tra form tạo/chỉnh sửa Tenant
│   └── planFormValidation.ts               # Quy tắc kiểm tra form tạo/chỉnh sửa Gói cước
│
├── infrastructure/                         # Layer 3: Adapters (Axios API, Mappers, Repositories)
│   ├── adminApi.ts                         # Axios HTTP client endpoints cho Admin
│   ├── adminMappers.ts                     # Transform DTO Backend <-> Domain Models
│   ├── adminRepositoryImpl.ts              # Triển khai AdminRepository Port gọi adminApi & adminMappers
│   ├── subscriptionPlansService.ts         # Service adapter nâng cao cho Gói cước
│   └── tenantManagementService.ts         # Service adapter nâng cao cho Tenant
│
├── presentation/                           # Layer 4: Presentation UI (Components & Subviews)
│   ├── components/
│   │   ├── tenant/                         # Các UI Subcomponents nhỏ gọn của Tenant Management
│   │   │   ├── TenantFilterBar.tsx         # Thanh tìm kiếm & lọc trạng thái tenant
│   │   │   ├── TenantListTable.tsx         # Bảng hiển thị danh sách Tenant & pagination
│   │   │   ├── TenantFormModal.tsx         # Modal tạo mới/chỉnh sửa Tenant
│   │   │   └── TenantDetailModal.tsx       # Modal xem chi tiết thông tin Tenant
│   │   ├── plan/                           # Các UI Subcomponents nhỏ gọn của Subscription Plans
│   │   │   ├── PlanGridCard.tsx            # Card hiển thị thông tin từng gói cước
│   │   │   ├── PlanFormModal.tsx           # Modal tạo mới/sửa gói cước
│   │   │   └── PlanFeatureEditor.tsx       # Component chỉnh sửa tính năng tính điểm
│   │   ├── prompt/                         # Các UI Subcomponents của System Prompts
│   │   │   └── PromptListTable.tsx         # Bảng xem & chỉnh sửa prompt hệ thống
│   │   ├── SuperAdminDashboard.tsx         # Main View Dashboard Shell
│   │   ├── TenantManagementView.tsx        # Composition View điều phối các subcomponents Tenant
│   │   ├── SubscriptionPlansView.tsx       # Composition View điều phối các subcomponents Plan
│   │   └── PromptManagementView.tsx        # Composition View điều phối Prompt
│   └── styles/
│
└── index.ts                                # Barrel Public API (Chỉ export Component & Types công khai)
```

---

## 3. Lộ trình Triển khai Refactor Chi tiết (Phase-by-Phase)

### 🔴 Phase A: Chuẩn hóa Domain Layer (Pure Logic)
- **Mục tiêu**: Đảm bảo 100% file trong `domain` không dính React, Axios hay Browser Storage.
- **Nhiệm vụ**:
  1. Hoàn thiện [superAdminMetrics.ts](file:///c:/Users/ADMIN/Desktop/intern/Intern_project/FE_Project/src/features/admin/domain/superAdminMetrics.ts) (Đã tạo trong đợt refactor trước).
  2. Tạo `tenantRules.ts`: Tách các hàm kiểm tra tính hợp lệ của Tenant status, ngày hết hạn (expiration warning), giới hạn quota.
  3. Tạo `subscriptionPlanRules.ts`: Tách các hàm phân loại gói cước (High-priced/Enterprise), tính toán giá theo tháng/năm.

### 🔴 Phase B: Định nghĩa Application Repository Ports & Use Cases
- **Mục tiêu**: Tạo ranh giới giao tiếp độc lập giữa `application` và `infrastructure`.
- **Nhiệm vụ**:
  1. Tạo `application/ports/adminRepository.ts`: Khai báo interface đầy đủ cho các hành động fetching & mutating Tenant, Plan, Prompt.
  2. Tạo `application/tenantFormValidation.ts`: Chứa logic validate form thêm/sửa Tenant.
  3. Tạo `application/planFormValidation.ts`: Chứa logic validate form thêm/sửa Gói cước.

### 🔴 Phase C: Triển khai Infrastructure Repository Adapter
- **Mục tiêu**: Đóng gói Axios API và Mapper đằng sau Repository Implementation.
- **Nhiệm vụ**:
  1. Tạo `infrastructure/adminRepositoryImpl.ts` triển khai `AdminRepository` port.
  2. Đảm bảo mọi chuyển đổi dữ liệu DTO từ Backend đều đi qua [adminMappers.ts](file:///c:/Users/ADMIN/Desktop/intern/Intern_project/FE_Project/src/features/admin/infrastructure/adminMappers.ts).

### 🔴 Phase D: Refactor Tenant Management Workflow
- **Mục tiêu**: Giải nén file `TenantManagementView.tsx` (~51 KB).
- **Nhiệm vụ**:
  1. Tạo Hook controller `useTenantManagementController.ts` đóng gói toàn bộ state: list filter, modal visibility, search, pagination, delete confirm, detail query.
  2. Tách UI trong `TenantManagementView.tsx` thành 4 subcomponents:
     - `TenantFilterBar.tsx`
     - `TenantListTable.tsx`
     - `TenantFormModal.tsx`
     - `TenantDetailModal.tsx`
  3. `TenantManagementView.tsx` chỉ còn nhiệm vụ Composition (kết nối controller với 4 subcomponents).

### 🔴 Phase E: Refactor Subscription Plans Workflow
- **Mục tiêu**: Giải nén file `SubscriptionPlansView.tsx` (~65 KB).
- **Nhiệm vụ**:
  1. Tạo Hook controller `useSubscriptionPlansController.ts` đóng gói state: plan selection, form state, feature matrix, save mutation, toggle active status.
  2. Tách UI trong `SubscriptionPlansView.tsx` thành 3 subcomponents:
     - `PlanGridCard.tsx`
     - `PlanFormModal.tsx`
     - `PlanFeatureEditor.tsx`
  3. `SubscriptionPlansView.tsx` trở thành Composition View nhận dữ liệu từ controller.

### 🔴 Phase F: Viết Unit Tests tự động cho Admin Feature
- **Mục tiêu**: Đảm bảo toàn bộ logic không vỡ sau khi tách.
- **Nhiệm vụ**:
  1. Mở rộng [test/admin.test.ts](file:///c:/Users/ADMIN/Desktop/intern/Intern_project/FE_Project/test/admin.test.ts) để test thêm `tenantRules`, `subscriptionPlanRules`, `tenantFormValidation`, `planFormValidation`.
  2. Thêm test case cho `adminMappers` với các dạng payload dữ liệu khác nhau của backend.

### 🔴 Phase G: Kiểm tra & Xác nhận (Definition of Done)
- Chạy `npm run lint` đạt **0 warning, 0 error**.
- Chạy `npm run test` toàn bộ suite **100% Pass**.
- Chạy `npm run build` tạo bản build sản phẩm thành công.

---

## 4. Bảng Kiểm soát Rủi ro (Risk Mitigation Matrix)

| Rủi ro | Nguy cơ | Giải pháp Khắc phục |
| --- | --- | --- |
| **Mất state form khi tách Modal** | Người dùng nhập form bị mất dữ liệu giữa chừng khi chuyển tab | Đóng gói state form trong controller hook cấp cao, truyền props xuống modal UI |
| **Gãy React Query cache** | Refresh dữ liệu tenant/plan không đồng bộ sau khi update | Đóng gói Query Keys thống nhất trong `adminRepository` & Controller |
| **Sai lệch DTO backend** | API trả về thiếu field `subscriptionPlanId` | Test kỹ các trường hợp fallback trong `adminMappers` & `tenantRules` |
| **Lỗi UI Styling Module** | `TenantManagementView.module.css` không ăn style sau khi tách | Đảm bảo class name và CSS modules được truyền đầy đủ vào subcomponents |

---

## 5. Quy tắc Kiểm tra Kiến trúc Tự động (Architecture Guard Rules)

Mỗi lát cắt sau khi refactor phải vượt qua các lệnh kiểm tra ranh giới sau:

```bash
# 1. Domain không được import React / Axios / Browser Storage
rg "from 'react'|from 'axios'|localStorage|sessionStorage" src/features/admin/domain/

# 2. Presentation không được gọi trực tiếp adminApi
rg "adminApi\." src/features/admin/presentation/components/tenant/
rg "adminApi\." src/features/admin/presentation/components/plan/

# 3. Linter, Unit Tests & Production Build
npm run lint
npm run test
npm run build
```
