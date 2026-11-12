# TikTo Backend

Express API for TikTo Calendar. It stores tasks and events in a local JSON file or DynamoDB and forwards notification requests to [Notification Service](https://github.com/tikto-calender/notification-service).

## Run locally

Use Node.js 24 or Node.js 22.13+ on the 22.x line. From the repo root on Linux, macOS or Windows:

```sh
npm ci
npm run dev
```

Open [API health](http://localhost:3000/api/health) or [runtime details](http://localhost:3000/api/runtime) to check the version. Local data is stored in `data/store.json`.

To demo notifications, start Notification Service on port 8000, then restart Backend with the service URL.

**Linux/macOS**

```sh
NOTIFICATION_SERVICE_URL=http://localhost:8000 npm run dev
```

**Windows PowerShell**

```powershell
$env:NOTIFICATION_SERVICE_URL = 'http://localhost:8000'
npm run dev
```

Check [system status](http://localhost:3000/api/status) or use **Test notification** in the Frontend dashboard. Run `npm test` to run the tests.

## Deployment

Qualifying pushes to `dev` build a GHCR image and record its digest in Manifest. Verify Dev, then run [Promote Backend](https://github.com/tikto-calender/manifest#promote-backend) to roll out the same digest in Prod. Run **Finalize release** after checking Prod.
