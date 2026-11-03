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

Open pull requests from working branches to `dev`. CI checks the prospective merge, and every eligible same-repository pull request targeting `dev` is squash-merged after CI succeeds. Documentation-only changes skip the expensive format, lint, test and syntax job.

Merges to `dev` publish an immutable `dev-<commit>` image. Production has no `main` promotion branch: run the **Release production** workflow from `dev` with a new semantic version such as `v1.2.3`. The workflow verifies the source, promotes the exact development image to that version after approval in the protected `prod` environment, scans it again, and creates the immutable GitHub release. SonarQube analysis is handled automatically outside GitHub Actions.

Configure these GitHub organization or repository settings:

- Make `dev` the default branch and protect it with the `CI` checks required and branches required to be up to date.
- Enable repository auto-merge.
- Allow GitHub Actions workflow permissions to read and write so the auto-merge job can update pull requests.
- Variable `AWS_BUILD_ROLE_ARN`: Terraform output `github_build_role_arn` from the shared stack.
- Variable `AWS_REGION`: `ap-southeast-2`.
- Protect the `prod` GitHub Environment with required reviewers.
