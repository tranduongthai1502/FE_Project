# JobFusion - AI Talent Suite

JobFusion la giao dien frontend cho he thong ho tro tuyen dung nhan su tich hop AI. Du an duoc thiet ke theo mo hinh SaaS da doanh nghiep, giup cac cong ty quan ly quy trinh tuyen dung, sang loc CV, theo doi ung vien va ho tro cac vai tro trong phong nhan su bang cac man hinh dashboard truc quan.

Theo dac ta he thong, JobFusion huong toi viec tu dong hoa quy trinh tuyen dung tu dau den cuoi: HR tao JD, ung vien nop CV, AI doc va cham diem CV, chatbot phong van so van thu thap them thong tin, HR/Interviewer danh gia, sau do he thong ho tro email va bao cao xu huong tuyen dung. Nguyen tac thiet ke chinh la human-in-the-loop: AI dua ra goi y, con quyet dinh cuoi cung van thuoc ve con nguoi.

## Tinh nang hien co trong frontend

- Landing page, login, signup, forgot password, OTP va reset password.
- Dashboard JobFusion voi sidebar, header, toast va menu tai khoan.
- Phan quyen giao dien theo role: Super Admin, Tenant Admin, HR, Interviewer va Candidate.
- Super Admin: xem tong quan he thong, quan ly tenant, goi dich vu, prompt va cai dat.
- Tenant Admin: xem funnel tuyen dung, quota, quan ly nhan su noi bo va phan quyen HR/Interviewer.
- HR: xem thong ke ung vien, danh sach job, candidate pool, email template, lich phong van va analytics.
- Interviewer: xem lich phong van, danh sach ung vien va scorecard danh gia phong van.
- Candidate: xem don ung tuyen, lich phong van va goi y cai thien CV tu AI.
- Auth flow co luu access token, refresh token, logout va tu dong refresh token khi backend tra ve `401`.

## Cong nghe su dung

- React 19
- TypeScript
- Vite
- Axios
- Oxlint
- CSS thu cong trong `src/styles`
- Font Awesome class icons va mot so SVG/icon component noi bo

## Cau truc thu muc chinh

```text
FE_Project/
+-- public/                 # favicon, icon sprite va anh public
+-- src/
|   +-- app/                # App shell, axios client va dieu huong trang noi bo
|   +-- assets/             # anh dung trong frontend
|   +-- components/         # component dung chung: layout, modal, toast, icons
|   +-- features/
|   |   +-- admin/          # service va kieu du lieu admin
|   |   +-- auth/           # auth API, form dang nhap/dang ky/OTP/reset password
|   +-- hooks/              # hook dung chung
|   +-- pages/              # Landing, Login, Signup, Candidate, Role Dashboard
|   +-- styles/             # CSS toan cuc va CSS cua app
+-- index.html
+-- package.json
+-- vite.config.ts
```

## Yeu cau moi truong

- Node.js 20 tro len khuyen nghi.
- npm, di kem khi cai Node.js.

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

Gia tri tren la base URL cua backend. Frontend se goi cac API dang:

```text
POST /api/auth/signin
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/signup
POST /api/auth/forgot-password
POST /api/auth/check-otp
POST /api/auth/reset-password
POST /api/auth/change-password
```

## Cach cai dat va chay du an

1. Cai dependencies:

```bash
npm install
````

2. Chay moi truong phat trien:

```bash
npm run dev
```

Sau khi chay, Vite se hien thi URL dang nhu:

```text
http://localhost:5173/
```

Mo URL nay tren trinh duyet de xem ung dung.

3. Dang nhap:

- Mo trang login.
- Nhap tai khoan backend da cap.
- Sau khi dang nhap thanh cong, app se dieu huong theo role cua user.

## Auth va refresh token

Frontend dung `src/app/api/axiosClient.ts` lam axios client dung chung.

- Khi login thanh cong, app lay `access_token` va `refresh_token` tu response backend.
- Neu chon ghi nho dang nhap, token duoc luu trong `localStorage`; neu khong, token duoc luu trong `sessionStorage`.
- Moi request API tu `axiosClient` se tu dong gan header:

```http
Authorization: Bearer <access_token>
```

- Neu backend tra ve `401`, app se goi `POST /api/auth/refresh-token` bang refresh token hien co.
- Neu refresh thanh cong, app luu access token moi va retry request bi loi ban dau.
- Neu nhieu request cung bi `401` cung luc, app chi tao mot request refresh token va dung chung ket qua.
- Neu refresh token het han hoac backend khong tra ve access token moi, app xoa auth storage va dua user ve `/#/login`.
- Khi logout, app goi `POST /api/auth/logout`, xoa token local va dua user ve `/#/login`.

## Dieu huong trang

App hien khong dung React Router. Viec chuyen trang duoc quan ly bang state trong:

```text
src/app/routes/AppRoutes.tsx
```

Mot so route dang dung:

```text
/#/login
/#/signup
/#/candidate
/tenant-admin
/hr
/interviewer
/super-admin/dashboard
```

Luu y: Super Admin dung path `/super-admin/...`. Khi logout hoac session het han, app se replace URL ve `/#/login` de tranh truong hop URL bi thanh `/super-admin/dashboard#/login`.

## Cac lenh huu ic

Chay lint:

```bash
npm run lint
```

Build production:

```bash
npm run build
```

Xem ban build production tren local:

```bash
npm run preview
```

## Ghi chu phat trien

- Cac man hinh dashboard van con nhieu du lieu demo de phuc vu UI prototype.
- Mot so service admin da goi backend qua `axiosClient`; mot so phan UI van hien thi du lieu mau trong component.
- Khi backend thay doi format response auth, can kiem tra lai cac ham doc token trong `LoginPage.tsx` va `axiosClient.ts`.
- Response refresh token nen tra ve access token moi o mot trong cac field: `token`, `access_token`, `accessToken` hoac `jwt`.
- Neu backend co rotate refresh token, co the tra ve `refresh_token` hoac `refreshToken`; frontend se tu cap nhat token moi.

## Tai khoan demo

Candidate:

```text
email: anhquocps@gmail.com
password: Quoc123451*
````

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
