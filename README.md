# TikTo Backend

Express REST API cho ứng dụng TikTo Calendar: quản lý công việc (tasks), sự kiện (events), kiểm tra sức khỏe hệ thống và kết nối với Notification Service (Telegram).

---

## 🛠️ Chạy Local (Local Development)

Yêu cầu Node.js `>= 22`.

```bash
npm install
npm run dev
```

Server sẽ lắng nghe tại `http://localhost:3000`.

---

## ⚙️ Cấu hình môi trường (.env)

Tạo file `.env` từ file mẫu `.env.example`:

```bash
cp .env.example .env
```

Các biến môi trường chính:
```dotenv
PORT=3000
APP_ENV=local

# Kiểu lưu trữ database (local hoặc dynamodb)
STORE_BACKEND=local
AWS_REGION=ap-southeast-2
DYNAMODB_TABLE=tikto-app

# Kết nối sang Notification Service
NOTIFICATION_SERVICE_URL=http://localhost:8000
NOTIFICATION_SERVICE_TIMEOUT_MS=2500
```

* `STORE_BACKEND=local`: Dữ liệu lưu trong file `data/store.json`.
* `STORE_BACKEND=dynamodb`: Sử dụng AWS DynamoDB qua IAM Role / Pod Identity.
* `NOTIFICATION_SERVICE_URL`: URL của Notification Service để Backend gọi sang kiểm tra sức khỏe và gửi thông báo Telegram.

---

## 📡 Chi tiết danh sách API (API Endpoints)

Tất cả các route đều bắt đầu bằng tiền tố `/api`.

### 1. Hệ thống & Sức khỏe (System)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Kiểm tra nhanh Backend còn sống không. |
| `GET` | `/api/runtime` | Xem thông tin runtime, phiên bản, database backend đang dùng. |
| `GET` | `/api/status` | **Kiểm tra toàn diện**: Kết nối DB và gọi sang Notification Service đo độ trễ (`latencyMs`). |

### 2. Quản lý công việc & sự kiện (Tasks & Events)
| Method | Endpoint | Mô tả | Request Body mẫu |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/overview` | Lấy toàn bộ danh sách tasks và events. | Không |
| `GET` | `/api/tasks` | Lấy danh sách các task. | Không |
| `POST` | `/api/tasks` | Tạo mới một task. | `{"title": "Họp team", "dueDate": "2026-11-08"}` |
| `PATCH`| `/api/tasks/:id` | Cập nhật task theo ID. | `{"completed": true}` |
| `DELETE`| `/api/tasks/:id`| Xóa task theo ID. | Không |
| `GET` | `/api/events` | Lấy danh sách sự kiện. | Không |
| `POST` | `/api/events` | Tạo mới một event. | `{"title": "Sinh nhật", "date": "2026-11-10"}` |
| `PATCH`| `/api/events/:id`| Cập nhật event theo ID. | `{"title": "Tiệc sinh nhật"}` |
| `DELETE`| `/api/events/:id`| Xóa event theo ID. | Không |

### 3. Thông báo (Notifications - Forward sang Notification Service)
| Method | Endpoint | Mô tả | Request Body mẫu |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Lấy lịch sử thông báo từ Notification Service. | Không |
| `POST`| `/api/notifications` | Lên lịch thông báo mới. | `{"message": "Nhắc việc", "scheduledAt": "2026-11-08T09:00:00Z"}` |
| `POST`| `/api/notifications/test` | **Gửi ngay một tin nhắn test** sang Telegram qua Notification Service. | `{"message": "Tin nhắn thử nghiệm"}` |
| `DELETE`| `/api/notifications/:id` | Hủy thông báo theo ID. | Không |

---

## 🧪 Kiểm tra mã nguồn (Testing & Quality)

```bash
npm test          # Chạy unit tests và kiểm tra độ phủ (coverage)
npm run lint      # Kiểm tra lỗi cú pháp và format với ESLint
npm run check     # Chạy toàn bộ format, lint, test và kiểm tra cú pháp
```

---

## 🚀 CI/CD & Triển khai

Workflows sử dụng bộ workflow dùng chung từ `tikto-calender/reusable-workflow`.

* **Nhánh `dev`**: Tự động build Docker Image và cập nhật manifest vào GitOps repository.
* **Môi trường Prod (EKS)**: Gắn tag release `vMAJOR.MINOR.PATCH` để kích hoạt workflow thăng cấp lên Production qua Argo CD.
