# Kế hoạch Refactor `src/features/hr` theo Clean Architecture

## 1. Mục tiêu & Định hướng

Refactor toàn bộ thư mục `src/features/hr` theo chuẩn **Clean Architecture kết hợp Feature-based Architecture**, nhằm:

- **Giữ nguyên 100%** giao diện UI, trải nghiệm người dùng, route URL, payload API backend và toast notifications của nhân sự (HR).
- **Tách bạch hoàn toàn trách nhiệm** giữa 4 tầng: `domain`, `application`, `infrastructure`, `presentation`.
- **Giải quyết điểm nóng lớn nhất hệ thống**:
  - `HrDashboard.tsx` (~110 KB code / ~2.000 dòng code hỗn hợp UI + Form State + Criteria Editor + Search/Filter + API orchestration).
- **Presentation Layer thuần UI**: Không gọi trực tiếp `hrApi` hay Axios client; mọi state orchestration và dữ liệu được điều phối thông qua **Application Controller Hooks** và **Repository Ports**.
- **Tăng khả năng Test**: Viết unit test phủ các quy tắc kiểm tra hạn nộp (`deadline`), tính lương (`salary`), tổng trọng số tiêu chí (`criteria weight`), status normalization và payload mapping.

---

## 2. Ranh giới Kiến trúc Mục tiêu (Target Clean Architecture Layers)

```text
src/features/hr/
├── domain/                                 # Layer 1: Domain Entities, Value Objects, Pure Rules
│   ├── hrApi.types.ts                      # Types chuẩn cho JobPosting, JobCriteria, RevisionHistory
│   ├── hrRoutePaths.ts                     # Route helper & URL resolvers
│   ├── roleHome.types.ts                   # View types chính cho HR Dashboard
│   ├── jobPostingRules.ts                  # Pure rules: Deadline validation, Salary range/order, Status check (Open/Closed/Draft)
│   └── jobCriteriaRules.ts                 # Pure rules: Weight normalization, Category limits, Criteria count limit (Max 20)
│
├── application/                            # Layer 2: Use Cases, Controllers, Ports & Validation
│   ├── ports/                              # Abstraction Interfaces (Contracts)
│   │   ├── hrRepository.ts                 # Port giao tiếp quản lý Job Posting, Criteria, Revision History
│   │   └── hrFileAttachmentPort.ts         # Port quản lý upload/download file đính kèm
│   ├── useHrDashboardController.ts         # Controller chính điều phối View & Navigation
│   ├── useJobPostingListController.ts     # Controller điều phối Danh sách Tin tuyển dụng (List, Filter, Search, Pagination)
│   ├── useJobPostingFormController.ts     # Controller điều phối Form Tạo mới/Chỉnh sửa Tin tuyển dụng
│   ├── useJobCriteriaController.ts        # Controller điều phối Trình chỉnh sửa Tiêu chí tuyển dụng (Criteria Editor)
│   ├── useJobPostingDetailController.ts    # Controller điều phối Chi tiết Tin tuyển dụng & Lịch sử chỉnh sửa
│   ├── jobFormValidation.ts                # Validate form tạo/sửa tin tuyển dụng (Salary, Deadline, Title length)
│   └── criteriaFormValidation.ts           # Validate form tiêu chí đánh giá (Weight total, Name length, Description length)
│
├── infrastructure/                         # Layer 3: Adapters (Axios API, Mappers, Repositories)
│   ├── hrApi.ts                            # Axios HTTP client call endpoints cho HR
│   ├── hrMappers.ts                        # Transform DTO Backend <-> Domain Models
│   ├── hrRepositoryImpl.ts                 # Triển khai HrRepository Port gọi hrApi & hrMappers
│   ├── hrJobLogic.ts                       # Infrastructure helper logic
│   ├── hrFileAttachmentLogic.ts            # Storage/Attachment adapter
│   └── hrRichTextUtils.ts                  # Rich text parser utils
│
├── presentation/                           # Layer 4: Presentation UI (Components, Views & Styles)
│   ├── components/
│   │   ├── job/                            # Subcomponents UI cho Quản lý Công việc
│   │   │   ├── JobFilterBar.tsx            # Thanh tìm kiếm & bộ lọc tin tuyển dụng
│   │   │   ├── JobListTable.tsx            # Bảng danh sách công việc & phân trang
│   │   │   ├── JobMetricsCard.tsx          # Card chỉ số thống kê tuyển dụng
│   │   │   ├── JobFormModal.tsx            # Modal form tạo/sửa công việc
│   │   │   └── JobActionModal.tsx          # Modal xác nhận Đóng/Mở/Xóa công việc
│   │   ├── criteria/                       # Subcomponents UI cho Trình chỉnh sửa Tiêu chí
│   │   │   ├── CriteriaEditor.tsx          # Bảng quản lý tiêu chí đánh giá
│   │   │   └── CriteriaRowItem.tsx         # Hàng nhập tiêu chí đánh giá
│   │   ├── detail/                         # Subcomponents UI cho Chi tiết Công việc
│   │   │   ├── JobOverviewTab.tsx          # Tab tổng quan công việc
│   │   │   └── RevisionHistoryTab.tsx     # Tab lịch sử chỉnh sửa & icon audit log
│   │   ├── HrRichTextEditor.tsx            # Editor Rich Text
│   │   └── HrDashboard.tsx                 # Main Composition Shell (điều phối subcomponents)
│   └── styles/
│       └── HrDashboard.module.css
│
└── index.ts                                # Barrel Public API (Export công khai HrDashboard & Public Types)
```

---

## 3. Lộ trình Triển khai Refactor Chi tiết (Phase-by-Phase)

### 🔴 Phase A: Chuẩn hóa Domain Layer Rules
- **Mục tiêu**: Đưa toàn bộ quy tắc nghiệp vụ thuần túy về `domain/`.
- **Nhiệm vụ**:
  1. Tạo `domain/jobPostingRules.ts`: Tách các hàm kiểm tra deadline (phải là ngày hôm nay hoặc tương lai), quy tắc lương (lương tối đa >= lương tối thiểu, số dương), phân loại status (`OPEN`, `CLOSED`, `DRAFT`).
  2. Tạo `domain/jobCriteriaRules.ts`: Tách các hàm chuẩn hóa % trọng số (`normalizeWeightInput`), kiểm tra giới hạn danh mục tiêu chí, giới hạn tối đa 20 tiêu chí.

### 🔴 Phase B: Định nghĩa Application Ports & Form Validations
- **Mục tiêu**: Định nghĩa các hợp đồng giao tiếp (Interfaces) và hàm validate form.
- **Nhiệm vụ**:
  1. Tạo `application/ports/hrRepository.ts`: Khai báo interface cho các chức năng fetch/create/update/delete Job Posting, Criteria, Revision History.
  2. Tạo `application/jobFormValidation.ts`: Hàm validate thông tin form tạo/sửa công việc.
  3. Tạo `application/criteriaFormValidation.ts`: Hàm validate tiêu chí tuyển dụng.

### 🔴 Phase C: Triển khai Infrastructure Repository Adapter
- **Mục tiêu**: Đóng gói Axios API và Mapper đằng sau `HrRepositoryImpl`.
- **Nhiệm vụ**:
  1. Tạo `infrastructure/hrRepositoryImpl.ts` triển khai `HrRepository` port.
  2. Đảm bảo toàn bộ DTO chuyển đổi thông qua [hrMappers.ts](file:///c:/Users/ADMIN/Desktop/intern/Intern_project/FE_Project/src/features/hr/infrastructure/hrMappers.ts).

### 🔴 Phase D: Refactor Job List & Filter Workflow (Giải nén Phase 1 của `HrDashboard.tsx`)
- **Mục tiêu**: Tách phần quản lý danh sách công việc & bộ lọc.
- **Nhiệm vụ**:
  1. Tạo Hook controller `useJobPostingListController.ts` điều phối state: search, filter status/department, pagination, selected job.
  2. Tách UI components:
     - `JobFilterBar.tsx` (Thanh tìm kiếm & lọc).
     - `JobListTable.tsx` (Bảng hiển thị danh sách công việc).
     - `JobMetricsCard.tsx` (Chỉ số tổng quan).

### 🔴 Phase E: Refactor Criteria Editor Workflow (Giải nén Phase 2 của `HrDashboard.tsx`)
- **Mục tiêu**: Tách phần chỉnh sửa tiêu chí đánh giá tuyển dụng.
- **Nhiệm vụ**:
  1. Tạo Hook controller `useJobCriteriaController.ts` điều phối state: criteria rows, weight normalization, drag/sort, add/remove, save mutation.
  2. Tách UI components:
     - `CriteriaEditor.tsx`
     - `CriteriaRowItem.tsx`

### 🔴 Phase F: Refactor Job Form & Detail Workflow (Giải nén Phase 3 của `HrDashboard.tsx`)
- **Mục tiêu**: Tách form tạo/sửa và tab chi tiết công việc.
- **Nhiệm vụ**:
  1. Tạo Hook controller `useJobPostingFormController.ts` và `useJobPostingDetailController.ts`.
  2. Tách UI components:
     - `JobFormModal.tsx`
     - `JobActionModal.tsx`
     - `JobOverviewTab.tsx`
     - `RevisionHistoryTab.tsx`
  3. Đơn giản hóa [HrDashboard.tsx](file:///c:/Users/ADMIN/Desktop/intern/Intern_project/FE_Project/src/features/hr/presentation/components/HrDashboard.tsx) thành Composition Shell kết nối các controllers và UI subcomponents.

### 🔴 Phase G: Viết Unit Test Suite cho HR Feature
- **Mục tiêu**: Đảm bảo 100% logic HR hoạt động chính xác sau khi tách.
- **Nhiệm vụ**:
  1. Mở rộng [test/hr.test.ts](file:///c:/Users/ADMIN/Desktop/intern/Intern_project/FE_Project/test/hr.test.ts) test thêm `jobPostingRules`, `jobCriteriaRules`, `jobFormValidation`, `criteriaFormValidation`.

### 🔴 Phase H: Verification (Check Linter, Tests & Production Build)
- Chạy `npm run lint` đạt **0 warning, 0 error**.
- Chạy `npm run test` đạt **100% Pass**.
- Chạy `npm run build` tạo bản build thành công.

---

## 4. Bảng Kiểm soát Rủi ro (Risk Mitigation Matrix)

| Rủi ro | Nguy cơ | Giải pháp Khắc phục |
| --- | --- | --- |
| **Mất state Rich Text Editor** | Nội dung mô tả/mô tả công việc bị xóa khi đóng form modal | Đóng gói state rich text trong controller hook cấp cao, đồng bộ với `HrRichTextEditor.tsx` |
| **Sai lệch tổng trọng số tiêu chí (Weight %)** | Người dùng lưu tiêu chí có tổng % khác 100% | Sử dụng `jobCriteriaRules.ts` kiểm tra và cảnh báo trước khi thực hiện mutation |
| **Xung đột Revision History ID** | Không lấy được icon/dữ liệu thay đổi của audit log | Đảm bảo `hrMappers.ts` chuẩn hóa đúng định dạng mảng lịch sử chỉnh sửa |
| **Gãy CSS Module `HrDashboard.module.css`** | Style giao diện bị đứt khi tách thành subcomponents | Truyền class names và CSS moduleprops đầy đủ xuống các subcomponents UI |

---

## 5. Quy tắc Kiểm tra Kiến trúc Tự động (Architecture Guard Rules)

Mỗi lát cắt sau khi refactor phải vượt qua các lệnh kiểm tra ranh giới sau:

```bash
# 1. Domain không được import React / Axios / Browser Storage
rg "from 'react'|from 'axios'|localStorage|sessionStorage" src/features/hr/domain/

# 2. Presentation không được gọi trực tiếp hrApi
rg "hrApi\." src/features/hr/presentation/components/job/
rg "hrApi\." src/features/hr/presentation/components/criteria/
rg "hrApi\." src/features/hr/presentation/components/detail/

# 3. Linter, Unit Tests & Production Build
npm run lint
npm run test
npm run build
```
