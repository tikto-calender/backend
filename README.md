# TikTo Backend

Express API for tasks, events, runtime health and Notification Service integration. It does not serve frontend assets.

## Local development

```bash
npm install
npm run dev
```

The API listens on `http://localhost:3000`. Copy `.env.example` values into your environment when you need DynamoDB or Notification Service; Node does not load `.env` automatically in this project.

## Storage

- `STORE_BACKEND=local`: stores data in `data/store.json`.
- `STORE_BACKEND=dynamodb`: uses `DYNAMODB_TABLE` through the AWS SDK default credential chain.

On EKS, the `tikto-app` ServiceAccount receives temporary credentials through EKS Pod Identity. Do not add static AWS keys to the image or Kubernetes Secrets.

## API groups

- System: `/api/health`, `/api/runtime`, `/api/status`
- Planner: `/api/overview`, `/api/tasks`, `/api/events`
- Notifications: `/api/notifications`, `/api/notifications/test`
