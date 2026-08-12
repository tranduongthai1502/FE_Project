# Báo cáo Audit Kiến trúc (AUDIT_REACT.md)

So với nguyên tắc Bulletproof React được định nghĩa trong `AGENTS.md`, cấu trúc dự án hiện tại có nhiều điểm sai lệch. Dưới đây là kết quả rà soát thư mục `src/`:

## 1. Vi phạm lạm dụng gọi API trực tiếp hoặc import sai cách trong UI
- Hiện tại, các component nằm trong `presentation/pages/` hoặc `presentation/components/` (như `LoginFeature.tsx`, `CreateStaffAccountView.tsx`) đang phụ thuộc trực tiếp vào các logic import từ `core/api/axiosErrorHandler` thay vì thông qua hook của feature.
- Hệ thống đang dùng Clean Architecture (`domain`, `application`, `infrastructure`, `presentation`) làm nội hàm cho từng Feature, điều này làm trái với chuẩn Bulletproof React yêu cầu các thư mục: `api`, `components`, `hooks`, `types`.

## 2. Các file/thư mục đặt sai vị trí
- **`src/core/`**: Chứa rất nhiều thư mục con như `api`, `components`, `hooks`, `styles`, `utils`.
  - `src/core/components` -> Cần chuyển về `src/components/ui/` (các shared components).
  - `src/core/hooks` -> Cần chuyển về `src/hooks/` (global hooks).
  - `src/core/api` -> Cần chia ra: file cấu hình base chuyển vào `src/config/`, phần fetch của ai nấy giữ hoặc về `api/` của từng feature.
- **`src/app/`**: Chứa `App.tsx`, `routes`, `styles`. Khuyên dùng việc đưa Routing hoặc Providers vào `src/providers/` và entry ở gốc `src/`.
- **Cấu trúc bên trong các Features (`src/features/auth`, `src/features/hr`, v.v...)**: Đang chia theo Backend-like structure (`presentation`, `infrastructure`, `application`, `domain`). 
  - Cần quy hoạch chuẩn lại: `api/`, `components/`, `hooks/`, `types/`.

## 3. Đề xuất danh sách thư mục Feature và cải tổ
Các tính năng hiện có cần được giữ nguyên tên nhưng cấu trúc lại bên trong. Bao gồm:
1. `src/features/auth`
2. `src/features/admin`
3. `src/features/candidate`
4. `src/features/hr`
5. `src/features/interviewer`
6. `src/features/tenant`
7. `src/features/landing`

Cấu trúc mới tại root sẽ là:
```text
src/
 ├── components/ui/
 ├── config/
 ├── features/
 │   ├── auth/
 │   │   ├── api/
 │   │   ├── components/
 │   │   ├── hooks/
 │   │   ├── types/
 │   │   └── index.ts
 │   └── ... (các tính năng khác tương tự)
 ├── hooks/
 ├── providers/
```
