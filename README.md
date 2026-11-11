# TikTo Backend

Express-based REST API for TikTo Calendar. Manages tasks, calendar events, system runtime diagnostics, and forwards notification alerts to the Telegram Notification Service.

---

## 🛠️ Local Development

### Prerequisites
* **Node.js** `>= 22`
* **npm** `>= 10`

### Installation & Startup
```bash
# 1. Install dependencies
npm install

# 2. Start development server with live-reloading
npm run dev
```

The server listens on `http://localhost:3000`.

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file based on the provided `.env.example`:

```bash
cp .env.example .env
```

### Configuration Parameters

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port the server listens on |
| `APP_ENV` | `local` | Environment identifier (`local`, `dev`, `prod`) |
| `STORE_BACKEND` | `local` | Storage engine: `local` (file-based JSON) or `dynamodb` (AWS DynamoDB) |
| `AWS_REGION` | `ap-southeast-2` | AWS region when using DynamoDB |
| `DYNAMODB_TABLE` | `tikto-app` | DynamoDB table name |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:8000` | URL of the Notification Service |
| `NOTIFICATION_SERVICE_TIMEOUT_MS`| `2500` | Request timeout for Notification Service calls (in milliseconds) |

> [!NOTE]
> * When `STORE_BACKEND=local`, data is persisted in `data/store.json`.
> * When deployed on Kubernetes (EKS), the `tikto-app` ServiceAccount uses EKS Pod Identity for temporary IAM credentials. Never store static AWS keys in repository files or container images.

---

## 📡 REST API Reference

All application endpoints are prefixed with `/api`.

### 1. System & Diagnostics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Fast healthcheck returning service status and runtime info. |
| `GET` | `/api/runtime` | Returns runtime configuration (environment, version, store backend). |
| `GET` | `/api/status` | **Full system diagnostic**: Validates database connectivity and actively probes Notification Service, reporting response latency (`latencyMs`). |

### 2. Planner (Tasks & Events)
| Method | Endpoint | Description | Sample Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/overview` | Retrieves all tasks and events in a single payload. | *None* |
| `GET` | `/api/tasks` | Lists all tasks. | *None* |
| `POST` | `/api/tasks` | Creates a new task. | `{"title": "Sprint Review", "dueDate": "2026-11-10"}` |
| `PATCH` | `/api/tasks/:id` | Updates an existing task by ID. | `{"completed": true}` |
| `DELETE` | `/api/tasks/:id` | Deletes a task by ID. | *None* |
| `GET` | `/api/events` | Lists all calendar events. | *None* |
| `POST` | `/api/events` | Creates a new event. | `{"title": "Team Birthday", "date": "2026-11-12"}` |
| `PATCH` | `/api/events/:id`| Updates an event by ID. | `{"title": "Team Birthday Dinner"}` |
| `DELETE` | `/api/events/:id`| Deletes an event by ID. | *None* |

### 3. Notifications (Forwarded to Notification Service)
| Method | Endpoint | Description | Sample Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Fetches notification history from Notification Service. | *None* |
| `POST` | `/api/notifications` | Schedules a new notification. | `{"message": "Task deadline approaching", "scheduledAt": "2026-11-10T09:00:00Z"}` |
| `POST` | `/api/notifications/test` | **Triggers an immediate test alert** sent via Telegram bot. | `{"message": "TikTo manual test alert"}` |
| `DELETE` | `/api/notifications/:id` | Cancels a notification by ID. | *None* |

---

## 🧪 Testing & Code Quality

```bash
# Run unit tests with code coverage (c8 + node:test)
npm test

# Check code formatting and linting
npm run lint

# Run all verification checks (format, lint, unit tests, syntax checks)
npm run check
```

---

## 🚀 CI/CD & Deployment

Workflows in this repository reference shared GitHub Actions from `tikto-calender/reusable-workflow`.

* **Development (`dev`)**: Commits pushed to `dev` build immutable Docker images tagged with `sha-<commit>` and push updates to the GitOps repository.
* **Production (`prod`)**: Tagged releases (`vX.Y.Z`) promote verified development images to the Production overlay, triggering automated sync via Argo CD.
