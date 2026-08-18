# Nền tảng Thương mại Điện tử MERN Fullstack (MERN E-Commerce Platform)

Hệ thống E-Commerce Fullstack (Đơn cửa hàng - Single Vendor) hoàn chỉnh được xây dựng trên nền tảng **React, Node.js, Express, TypeScript, MongoDB và Stripe**. Dự án được thiết kế chuẩn kiến trúc Production, chú trọng vào trải nghiệm người dùng, tính an toàn dữ liệu giao dịch và khả năng mở rộng.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

### **Frontend**
- **Core**: React 19, TypeScript, Vite
- **Quản lý State**:
  - TanStack Query (React Query v5) – Quản lý Server State và caching
  - Zustand – Quản lý Client State (Phiên đăng nhập / Authentication)
- **Điều hướng & HTTP Client**: React Router v7, Axios

### **Backend**
- **Core**: Node.js, Express, TypeScript
- **Cơ sở dữ liệu**: MongoDB, Mongoose ORM
- **Bảo mật**: JWT Access Tokens (trong bộ nhớ) & Opaque Refresh Tokens (lưu trong HttpOnly Cookie), Bcryptjs, Helmet, Express Rate Limit
- **Tích hợp dịch vụ**: Stripe API (Thanh toán), Cloudinary (Lưu trữ ảnh sản phẩm)
- **Tài liệu API**: Swagger UI / OpenAPI 3.0

### **DevOps & Testing**
- **Container**: Docker Compose (chạy MongoDB Single-Node Replica Set `rs0` phục vụ MongoDB Transactions)
- **Testing**: Vitest, Supertest, React Testing Library
- **CI/CD & Deployment**: GitHub Actions, Vercel (Frontend), Render (Backend Docker Container), MongoDB Atlas

---

## ✨ Tính năng chính

### 🛒 Dành cho Khách hàng (Customer Storefront)
- **Duyệt & Tìm kiếm Sản phẩm**: Xem danh sách sản phẩm với các bộ lọc theo danh mục, khoảng giá, từ khóa tìm kiếm, sắp xếp và phân trang trực tiếp trên URL search params.
- **Chi tiết sản phẩm**: Hiển thị chi tiết thông tin, hình ảnh, trạng thái còn hàng/hết hàng.
- **Giỏ hàng trực tuyến (Cart)**: Đồng bộ giỏ hàng với Server, tự động cập nhật đơn giá, tổng tiền và cảnh báo khi sản phẩm hết hàng hoặc bị thay đổi trạng thái.
- **Đặt hàng & Thanh toán (Checkout & Stripe)**: Tạo đơn hàng snapshot không thể sửa đổi, tích hợp Stripe Hosted Checkout an toàn.
- **Lịch sử đơn hàng**: Theo dõi trạng thái đơn hàng và thông tin thanh toán chi tiết.

### 🛡 Quản trị viên (Admin Dashboard)
- **Quản lý sản phẩm & danh mục**: Thêm, sửa, ẩn/hiện danh mục và sản phẩm; tải ảnh sản phẩm lên Cloudinary.
- **Quản lý kho hàng (Inventory)**: Cập nhật số lượng tồn kho theo thời gian thực.
- **Quản lý đơn hàng**: Theo dõi danh sách đơn hàng, cập nhật trạng thái đơn hàng theo luồng State Machine nghiêm ngặt (chống xung đột trạng thái).
- **Thống kê tổng quan (Dashboard Summary)**: Hiển thị báo cáo nhanh về doanh thu, số lượng đơn hàng và tình trạng tồn kho.

### 🔐 An toàn dữ liệu & Giao dịch (Transaction Safety)
- **Atomic Inventory Decrement**: Sản phẩm chỉ bị khấu trừ tồn kho khi nhận được xác thực thành công từ **Stripe Webhook** (sử dụng MongoDB Transactions).
- **Idempotent Webhooks**: Đảm bảo xử lý sự kiện webhook từ Stripe không bị trùng lặp.
- **Xử lý ngoại lệ thanh toán**: Trường hợp thanh toán thành công nhưng sản phẩm vừa bị hết hàng, hệ thống tự động đưa đơn hàng vào trạng thái `PAYMENT_REVIEW` để Admin xử lý thủ công.

---

## 📁 Cấu trúc thư mục (Project Structure)

```text
E-Commerce_Fullstack/
├── backend/            # Express API Server (Node.js + TypeScript + Mongoose)
│   ├── src/
│   │   ├── database/   # Database connection & seed scripts
│   │   ├── middleware/ # Auth, Validation, Error Handling, Rate Limiting
│   │   ├── modules/    # Auth, Users, Products, Categories, Cart, Orders, Payments...
│   │   └── server.ts   # Entry point
│   ├── test/           # Integration & Unit tests
│   └── Dockerfile      # Production Dockerfile
├── frontend/           # React Single Page Application (Vite + TypeScript)
│   ├── src/
│   │   ├── components/ # Shared UI Components
│   │   ├── features/   # Auth, Catalog, Cart, Checkout, Orders, Admin features
│   │   ├── hooks/      # TanStack Query & Custom hooks
│   │   └── store/      # Zustand store
├── docs/               # Chi tiết tài liệu kiến trúc & quy trình (Auth, Checkout, Payment...)
└── docker-compose.yml  # Docker Compose cấu hình MongoDB Replica Set
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy cục bộ (Quick Start)

### **Yêu cầu môi trường**
- **Node.js**: v20+
- **pnpm**: v9.15+
- **Docker Desktop**: Cần thiết để khởi chạy MongoDB Replica Set

---

### **Các bước thực hiện**

#### 1. Clone dự án và cài đặt dependencies
```bash
git clone https://github.com/username/E-Commerce_Fullstack.git
cd E-Commerce_Fullstack
pnpm install
```

#### 2. Cấu hình biến môi trường (Environment Variables)

Tạo file `.env` cho cả `backend` và `frontend` từ các file mẫu:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

##### Cấu hình `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mern_ecommerce?replicaSet=rs0
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info

# JWT Secrets
JWT_ACCESS_SECRET=your_long_random_jwt_access_secret_key
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7

# Cookie Settings
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# Stripe Test Mode Credentials
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success?orderId={ORDER_ID}
STRIPE_CANCEL_URL=http://localhost:5173/payment/cancel?orderId={ORDER_ID}

# Cloudinary (Quản lý ảnh)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_PRODUCT_FOLDER=ecommerce/products

# Seed Data Credentials (Tài khoản mẫu)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_CUSTOMER_EMAIL=customer@example.com
SEED_CUSTOMER_PASSWORD=ChangeMe123!
```

##### Cấu hình `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

#### 3. Khởi động MongoDB Replica Set với Docker
Quá trình thanh toán sử dụng MongoDB Transactions nên cần chạy MongoDB dạng Single-Node Replica Set:
```bash
docker compose up -d mongodb
```

Kích hoạt / Kiểm tra trạng thái Replica Set:
```bash
docker compose exec mongodb mongosh --quiet --eval "rs.status().ok"
```
*(Nếu kết quả trả về `1` là MongoDB đã sẵn sàng)*.

---

#### 4. Khởi tạo CSDL & Dữ liệu mẫu (Database Indexing & Seeding)

Đồng bộ các chỉ mục (Indexes) cho MongoDB:
```bash
pnpm db:indexes
```

Tạo dữ liệu tài khoản mẫu, danh mục và sản phẩm demo:
```bash
pnpm db:seed
```

> **Tài khoản mặc định khởi tạo:**
> - **Admin**: `admin@example.com` / `ChangeMe123!`
> - **Customer**: `customer@example.com` / `ChangeMe123!`

---

#### 5. Chạy ứng dụng

Chạy đồng thời cả Backend và Frontend:
```bash
pnpm dev
```

Hoặc chạy riêng biệt:
- **Backend API**: `pnpm dev:backend` (Chạy tại `http://localhost:5000`)
- **Frontend App**: `pnpm dev:frontend` (Chạy tại `http://localhost:5173`)

---

## 📖 Tài liệu API & Health Check

### **Swagger API Documentation**
Khi Backend đang chạy, bạn có thể truy cập giao diện kiểm thử API đầy đủ tại:
```text
http://localhost:5000/api-docs
```

### **Health & Readiness Endpoints**
- `GET /api/v1/health` - Liveness check (Kiểm tra server sống/chết)
- `GET /api/v1/ready` - Readiness check (Kiểm tra kết nối CSDL MongoDB & Stripe Config)

---

## 📜 Các lệnh hỗ trợ (Available Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `pnpm dev` | Chạy đồng thời Backend và Frontend ở chế độ Dev |
| `pnpm dev:backend` | Chạy Backend API (với `tsx watch`) |
| `pnpm dev:frontend` | Chạy Frontend SPA (với `Vite`) |
| `pnpm lint` | Kiểm tra lỗi cú pháp/style (ESLint) cho toàn bộ dự án |
| `pnpm type-check` | Kiểm tra kiểu dữ liệu TypeScript (`tsc`) |
| `pnpm test` | Chạy các bài unit/integration test với Vitest |
| `pnpm test:integration` | Chạy riêng các bài test tích hợp CSDL |
| `pnpm build` | Biên dịch bản Production cho cả Backend và Frontend |
| `pnpm db:indexes` | Đồng bộ chỉ mục MongoDB |
| `pnpm db:seed` | Tạo dữ liệu mẫu (Idempotent Seed) |
| `pnpm db:seed:reset` | Xóa và tạo lại dữ liệu mẫu |

---

## 🌐 Triển khai (Deployment)

Dự án đã được cấu hình sẵn sàng để triển khai lên các nền tảng Cloud:

- **Frontend**: Triển khai trên **Vercel** (Đã cấu hình `vercel.json` rewrite SPA routes).
- **Backend**: Triển khai trên **Render** (Sử dụng Multi-stage `Dockerfile` tối ưu dung lượng).
- **Database**: Sử dụng **MongoDB Atlas** (Managed Cloud Database).
- **CI/CD**: **GitHub Actions** tự động lint, type-check, test và build Docker Image khi tạo Pull Request hoặc Push vào nhánh `main`.

---

## 📝 Giấy phép (License)

Dự án được phát triển cho mục đích học tập và làm Portfolio. Bạn có thể tự do tham khảo và sử dụng code.
