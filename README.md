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
- Notifications: `/api/notifications`, `/api/notifications/test` (gửi ngay một notification kiểm tra qua Notification Service)

## CI/CD

Application workflows only call `tikto-calender/reusable-workflow`.

- Pull requests into `dev`: format, lint, tests and build/compile run in parallel. Require `checks / CI result` and an up-to-date branch before merging. There is no automatic merge.
- Push to `dev`: build and deploy the development version.
- Push a `vMAJOR.MINOR.PATCH` tag: release the exact commit that already passed development deployment. The commit must exist on both `dev` and `main`. Pushes to `main` do not deploy.

After testing dev, fast-forward `main` to that tested commit and tag it (do not squash or create a different merge commit):

```bash
git fetch origin
git switch main
git merge --ff-only <tested-dev-commit>
git push origin main
git tag v1.2.3 <tested-dev-commit>
git push origin v1.2.3
```

Protect `main`, `dev`, version tags and the `prod` GitHub Environment. If branch rules prohibit direct fast-forward updates, configure an approved promotion method that preserves the tested commit SHA. Publish shared workflows before merging these callers; cross-repository workflow changes are not available until pushed. Shared references currently use `@main`; pin them to a published shared-workflow commit when rolling out.

Dev publishes immutable `sha-<full SHA>` images to `tikto/backend`, registers an ECS task revision containing the digest URI, updates the service and verifies that exact revision completed (including detecting circuit-breaker rollback). Terraform bootstraps ECS; CI/CD owns subsequent service task revisions.

Production retains EKS. Release adds `v1.2.3` to the tested image digest and opens a PR in the GitOps repository. Merge that PR to trigger Argo CD. A successful release workflow means **promotion PR created**, not production rollout completed; inspect Argo health/analysis after merge. Revert the GitOps change for an application rollback, accounting for any data changes separately.

Configure:

- Repository variable `AWS_BUILD_ROLE_ARN` and `AWS_REGION`.
- Dev Environment: `AWS_DEPLOY_ROLE_ARN`, `ECS_CLUSTER`, `ECS_SERVICE`; optional `SMOKE_URL` (HTTPS endpoint returning JSON `status: ok`). Notification remains private, so ECS container health and revision checks are mandatory even without a public smoke URL.
- Prod Environment: `AWS_BUILD_ROLE_ARN` (or inherit the repository value), optional `GITOPS_REPOSITORY` (default `Flavoriy/gitops-manifest`), and secret `GITOPS_TOKEN` scoped to Contents/Pull requests write on that GitOps repository.
- OIDC build-role trust: dev branch for publishing, prod Environment for promotion. Dev deploy-role trust: dev Environment.

The GitOps patch currently targets container `tikto` in `apps/tikto/overlays/prod/patch-image.yaml`. Confirm that this existing workload/configuration matches the split service before approving the production PR. GitOps PRs are not auto-merged.
