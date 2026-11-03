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

## CI/CD

Pull requests targeting `dev` or `main` run formatting, lint, unit tests and coverage. Pushes to those branches repeat the quality gate, build the container, block HIGH/CRITICAL fixable vulnerabilities with Trivy, then push an immutable image to Amazon ECR. SonarQube analysis is handled automatically outside the GitHub Actions workflow.

Configure these GitHub organization or repository settings:

- Variable `AWS_BUILD_ROLE_ARN`: Terraform output `github_build_role_arn` from the shared stack.
- Variable `AWS_REGION`: `ap-southeast-2`.
