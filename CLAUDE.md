# Hướng dẫn Vận hành Dự án React + Vite (Claude Code Rules)

## 1. Lệnh Vận Hành Tiêu Chuẩn (Vite Setup)
- Khởi chạy Dev Server: `npm run dev` (chạy Vite local dev)
- Build Production: `npm run build` (kiểm tra lỗi build tĩnh biên dịch bundle)
- Chạy Linter: `npm run lint` hoặc `npx eslint .`
- Chạy Type check: `npx tsc --noEmit`

## 2. Quy Trình Refactor & Kiểm Tra Bắt Buộc
- BẮT BUỘC chạy `npm run build` hoặc `npx tsc --noEmit` sau khi sửa đổi mã nguồn để đảm bảo TypeScript không bị lỗi.
- Đọc kỹ cấu trúc Feature-based trong AGENTS.md trước khi đề xuất tạo thư mục hoặc file mới.
- Không fetch dữ liệu trực tiếp trong `useEffect` của Component; bắt buộc chuyển qua hooks quản lý API của Feature.
