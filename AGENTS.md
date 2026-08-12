# QUY CHUẨN KIẾN TRÚC REACT + VITE (CHUẨN BULLETPROOF)

## 1. Cấu trúc thư mục dự án (Project Structure)
Mã nguồn chính nằm trong thư mục `src/`. Cấm tạo file lộn xộn ở ngoài. Sơ đồ cấu trúc bắt buộc:
- `src/components/ui/`: Chứa các shared UI primitives dùng chung cho toàn dự án (Button, Table, Dialog...)
- `src/config/`: Chứa các biến cấu hình toàn cục, cấu hình Axios client.
- `src/features/`: Chứa các module tính năng độc lập (Ví dụ: `auth`, `users`, `products`...).
- `src/hooks/`: Chỉ chứa các hook dùng chung cho toàn hệ thống (như `useDebounce`, `useLocalStorage`).
- `src/providers/`: Chứa các React Context Providers bọc toàn bộ ứng dụng (QueryClientProvider, ThemeProvider...).

## 2. Cấu trúc chi tiết của một Feature (`src/features/[tên-feature]/`)
Mỗi một tính năng phải tự đóng gói (self-contained) bên trong thư mục của nó:
- `api/`: Chứa các hook fetch data và gọi API (ví dụ: `getProducts.ts` dùng TanStack Query).
- `components/`: Các component chỉ dùng riêng cho tính năng này.
- `hooks/`: Các custom hook chỉ dùng riêng cho tính năng này.
- `types/`: Định nghĩa TypeScript types cho tính năng này.
- `index.ts`: Điểm xuất khẩu (entry point) duy nhất của feature. Chỉ export những gì bên ngoài cần dùng.

## 3. Quy chuẩn viết code & Quản lý dữ liệu
- **State Management**: Ưu tiên sử dụng TanStack Query (React Query) cho server state (data fetch từ API). Chỉ dùng Zustand hoặc React Context cho client UI state thực sự cần thiết.
- **TypeScript**: Bắt buộc định nghĩa Type/Interface rõ ràng cho Props và API Response. Cấm sử dụng kiểu `any`.
- **Form Handling**: Sử dụng React Hook Form kết hợp với Zod để validate dữ liệu biểu mẫu.
