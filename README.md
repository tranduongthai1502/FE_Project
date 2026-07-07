# JobFusion - AI Talent Suite

JobFusion la giao dien frontend cho he thong ho tro tuyen dung nhan su tich hop AI. Du an duoc thiet ke theo mo hinh SaaS da doanh nghiep, giup cac cong ty quan ly quy trinh tuyen dung, sang loc CV, theo doi ung vien va ho tro cac vai tro trong phong nhan su bang cac man hinh dashboard truc quan.

Theo dac ta he thong, JobFusion huong toi viec tu dong hoa phieu tuyen dung tu dau den cuoi: HR tao JD, ung vien nop CV, AI doc va cham diem CV, chatbot phong van so van thu thap them thong tin, HR/Interviewer danh gia, sau do he thong ho tro gui email va bao cao xu huong tuyen dung. Nguyen tac thiet ke chinh la human-in-the-loop: AI dua ra goi y, con quyet dinh cuoi cung van thuoc ve con nguoi.

## Tinh nang hien co trong frontend

- Man hinh dang nhap va dang ky tai khoan.
- Dashboard JobFusion voi sidebar, header, thong bao toast va menu tai khoan.
- Bo chuyen vai tro demo gom Super Admin, Tenant Admin, HR, Interviewer va Candidate.
- Super Admin: xem tong quan he thong, quan ly tenant, goi dich vu, prompt va cai dat.
- Tenant Admin: xem funnel tuyen dung, quota, quan ly nhan su noi bo va phan quyen HR/Interviewer.
- HR: xem thong ke ung vien, danh sach job, candidate pool, email template, lich phong van va analytics.
- Interviewer: xem lich phong van, danh sach ung vien va scorecard danh gia phong van.
- Candidate: xem don ung tuyen, lich phong van va goi y cai thien CV tu AI.
- Form doi mat khau co kiem tra do manh, modal xac nhan va mock API.

Luu y: phan frontend hien tai dang la prototype voi du lieu mau va cac service mock trong `src/features/*/services`. Chua co backend that, database hay API AI duoc ket noi truc tiep trong project nay.

## Cong nghe su dung

- React 19
- TypeScript
- Vite
- Oxlint
- CSS thu cong trong `src/styles`
- Font Awesome class icons va mot so SVG/icon component noi bo

## Cau truc thu muc chinh

```text
FE_Project/
+-- public/                 # favicon, icon sprite va anh public
+-- src/
|   +-- app/                # App shell va dieu huong trang noi bo
|   +-- assets/             # anh dung trong frontend
|   +-- components/         # component dung chung: layout, modal, toast, icons
|   +-- features/
|   |   +-- admin/          # dashboard, flow theo vai tro va admin settings
|   |   +-- auth/           # form dang nhap/dang ky/OTP/reset password va validation
|   +-- hooks/              # hook dung chung
|   +-- pages/              # cac trang Login, Signup, Admin Dashboard
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

## Cach cai dat va chay du an

1. Cai dependencies:

```bash
npm install
```

2. Chay moi truong phat trien:

```bash
npm run dev
```

Sau khi chay, Vite se hien thi URL dang nhu:

```text
http://localhost:5173/
```

Mo URL nay tren trinh duyet de xem ung dung.

3. Dang nhap vao dashboard:

- O man hinh login, co the nhap email/password bat ky.
- Bam `Sign in`.
- Ung dung se chuyen vao dashboard demo.
- Trong dashboard, dung dropdown `ROLE FLOW` o sidebar de xem giao dien theo tung vai tro.

## Cac lenh huu ich

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

- App khong dung React Router; viec chuyen trang login/signup/admin dang duoc quan ly bang state trong `src/app/routes/AppRoutes.tsx`.
- Cac API hien tai la mock, vi du `authApi` va `adminApi` luon tra ve `{ ok: true }`.
- Du lieu dashboard va bang bieu dang duoc khai bao truc tiep trong component/flow de phuc vu demo UI.
- Khi tich hop backend that, nen thay cac mock service trong `src/features/auth/services` va `src/features/admin/services` bang request HTTP toi API.

- tài khoản demo 
email: anhquocps@gmail.com
mật khẩu: Quoc12345*