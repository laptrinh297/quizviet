# QuizViet - Hướng dẫn cài đặt và chạy

## Yêu cầu hệ thống
- **Node.js** >= 18.x ([tải tại nodejs.org](https://nodejs.org))
- **npm** >= 9.x (đi kèm với Node.js)
- **Docker Desktop** (chỉ cần cho staging và production)

---

## 3 môi trường làm việc

| Môi trường | Database | Cách chạy |
|------------|----------|-----------|
| **Development** | SQLite (file local) | `npm run dev` |
| **Staging** | PostgreSQL (Docker) | Docker Compose + `npm run dev` |
| **Production** | PostgreSQL (Docker) | Dokploy + `docker-compose.yml` |

---

## 1. Development — SQLite (hàng ngày)

Không cần Docker, không cần cài thêm gì.

### Lần đầu setup
```bash
cd D:/quizlet
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### Chạy hàng ngày
```bash
npm run dev
```

Truy cập: **http://localhost:3000**

### Tài khoản mẫu
| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| User | user@quizviet.com | User123! |
| Admin | admin@quizviet.com | Admin123! |

> Form đăng nhập đã điền sẵn. Chỉ cần bấm "Đăng nhập".

---

## 2. Staging — PostgreSQL trên Docker (test trước khi deploy)

Dùng để kiểm tra app chạy đúng với PostgreSQL thật trước khi đẩy lên production.  
**Không cần copy hay sửa file `.env`** — dùng npm scripts riêng cho staging.

### Bước 1 — Khởi động PostgreSQL bằng Docker
```bash
npm run staging:up
```

Kiểm tra đã chạy:
```bash
docker ps
# Phải thấy: quizviet-staging-db   postgres:16-alpine   Up
```

### Bước 2 — Tạo bảng và seed dữ liệu
```bash
npm run staging:db:push
npm run staging:db:seed
```

Output mong đợi của `staging:db:push`:
```
Prisma schema loaded from prisma\schema.prod.prisma
Datasource "db": PostgreSQL database "quizviet" at "localhost:5432"
Your database is now in sync with your Prisma schema.
```

### Bước 3 — Chạy app kết nối PostgreSQL
```bash
npm run staging:dev
```

### Khi xong, tắt staging
```bash
npm run staging:down
# Quay lại dev bình thường
npm run dev
```

---

## 3. Production — Deploy lên server bằng Dokploy

### Dokploy là gì?
Dokploy là nền tảng tự host giống Heroku/Vercel nhưng chạy trên VPS của bạn.  
Nó đọc file `docker-compose.yml` trong repo và tự build + deploy.

### Chuẩn bị trên Dokploy

**Bước 1 — Tạo project mới trong Dokploy**
- Vào Dokploy UI → **New Project**
- Chọn **Docker Compose**
- Kết nối với Git repository của bạn

**Bước 2 — Set Environment Variables trong Dokploy UI**

Vào tab **Environment** của project, thêm các biến sau:

```
POSTGRES_PASSWORD=<mật-khẩu-mạnh-ngẫu-nhiên>
AUTH_SECRET=<chuỗi-random-32-ký-tự>
NEXTAUTH_URL=https://yourdomain.com
```

Tạo chuỗi random cho `AUTH_SECRET`:
```bash
# Chạy lệnh này để tạo secret ngẫu nhiên
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Bước 3 — Deploy**
- Bấm **Deploy** trong Dokploy
- Dokploy sẽ tự động:
  1. Clone repo
  2. Build Docker image từ `Dockerfile`
  3. Khởi động PostgreSQL container
  4. Chạy `prisma db push` (migrate tự động trong CMD)
  5. Start app

**Bước 4 — Cấu hình domain trong Dokploy**
- Vào tab **Domains**
- Thêm domain của bạn
- Dokploy tự cấp SSL (Let's Encrypt)

### Cấu trúc docker-compose.yml (cho Dokploy)
```
services:
  app   ← Next.js app (build từ Dockerfile)
  db    ← PostgreSQL 16
```
- `app` chờ `db` healthy rồi mới start
- `db` lưu dữ liệu vào Docker volume (không mất khi restart)
- Các biến `${POSTGRES_PASSWORD}`, `${AUTH_SECRET}` lấy từ Dokploy UI

---

## Cấu trúc thư mục chính

```
D:/quizlet/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Đăng nhập, đăng ký
│   │   ├── (dashboard)/      # Dashboard, bộ từ vựng, thư mục, hồ sơ
│   │   │   ├── history/      # Lịch sử học theo ngày/tuần/tháng/năm
│   │   │   └── leaderboard/  # Bảng xếp hạng + tìm kiếm user
│   │   ├── study/[setId]/    # 5 chế độ học
│   │   ├── admin/            # Trang quản trị
│   │   └── api/              # REST API
│   └── components/
├── prisma/
│   ├── schema.prisma         # Schema SQLite (development)
│   ├── schema.prod.prisma    # Schema PostgreSQL (staging/production)
│   ├── dev.db                # File SQLite local
│   └── seed.ts               # Dữ liệu mẫu
├── Dockerfile                # Build image cho production
├── docker-compose.yml        # Production — dùng cho Dokploy
├── docker-compose.staging.yml # Staging — chạy PostgreSQL local
├── prisma.config.ts          # Tự động chọn SQLite/PostgreSQL theo DATABASE_URL
├── .env                      # Dev (SQLite)
└── .env.staging              # Staging (PostgreSQL local)
```

> **prisma.config.ts tự động chọn database:**  
> - `DATABASE_URL` bắt đầu bằng `file:` → dùng SQLite  
> - `DATABASE_URL` bắt đầu bằng `postgresql://` → dùng PostgreSQL

---

## Tính năng chính

### Chế độ học
| Chế độ | Mô tả | Phím tắt |
|--------|-------|---------|
| **Thẻ ghi nhớ** | Lật thẻ xem thuật ngữ/định nghĩa | `←` `→` lướt, `Space` lật |
| **Học** | Spaced Repetition tự động | — |
| **Tự luận** | Gõ lại từ, kiểm tra từng ký tự | — |
| **Kiểm tra** | Bài thi tổng hợp, tính điểm | — |
| **Ghép thẻ** | Trò chơi ghép cặp có tính giờ | — |

### Các trang khác
- `/history` — Lịch sử học theo ngày / tuần / tháng / năm
- `/leaderboard` — Top 10 + tìm kiếm user theo tên
- `/users/[id]` — Hồ sơ công khai của user (streak, lịch sử, học phần)
- `/admin` — Quản trị hệ thống (chỉ admin)

---

## Lệnh hữu ích

```bash
# Xem dữ liệu database qua giao diện web
npx prisma studio

# Reset database dev (SQLite)
npx prisma db push --force-reset
npx prisma db seed

# Build production để kiểm tra lỗi
npm run build

# Xem log Docker staging
docker compose -f docker-compose.staging.yml logs -f

# Tắt staging PostgreSQL
docker compose -f docker-compose.staging.yml down

# Xóa cả dữ liệu staging
docker compose -f docker-compose.staging.yml down -v
```

---

## Xử lý lỗi thường gặp

**Lỗi "Cannot find module '@prisma/client'"**
```bash
npx prisma generate
```

**Lỗi database không tìm thấy**
```bash
npx prisma db push
npx prisma db seed
```

**Port 3000 đã bị dùng**
```bash
npm run dev -- -p 3001
```

**Lỗi kết nối PostgreSQL: "Connection refused"**
```bash
# Kiểm tra container có đang chạy không
docker ps

# Khởi động lại nếu đã tắt
docker compose -f docker-compose.staging.yml up -d
```

**Lỗi "password authentication failed"**
- Kiểm tra `POSTGRES_PASSWORD` trong `docker-compose.staging.yml` và `DATABASE_URL` trong `.env.staging` phải khớp nhau

**Port 5432 đã bị dùng**
- Sửa `docker-compose.staging.yml`: đổi `"5432:5432"` thành `"5433:5432"`
- Sửa `.env.staging`: đổi port trong DATABASE_URL thành `5433`
