This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Convex model-test backend

The `/prompts/test` model test lab uses Convex for production persistence. Local `pnpm build` remains a plain Next.js build so it can run without deployment credentials. Vercel builds require a Convex deploy key because `vercel.json` runs:

```bash
pnpm convex:deploy:vercel
```

That command deploys Convex first, then runs `pnpm build:web` with `NEXT_PUBLIC_CONVEX_URL` populated by `convex deploy`.

### Required setup

1. Log in and connect the project locally:

```bash
pnpm convex:dev
```

2. Set the model-test write password in Convex:

```bash
pnpm exec convex env set MODEL_TEST_ADMIN_PASSWORD "your-password"
```

3. Generate a Convex deploy key in the Convex dashboard or with the Convex CLI, then add it to Vercel as `CONVEX_DEPLOY_KEY` for Production and Preview. Vercel must keep this as a sensitive environment variable.

4. Add no app runtime secrets to Vercel except Convex deploy/build variables. Model-test secrets and upload credentials live in Convex env.

### Cloudflare R2 uploads

Image shots are uploaded by a Convex Node action. Set these values in Convex env:

```bash
pnpm exec convex env set R2_S3_URL "https://<account-id>.r2.cloudflarestorage.com"
pnpm exec convex env set R2_S3_ACCESS_KEY_ID "YOUR_ACCESS_KEY_ID"
pnpm exec convex env set R2_S3_SECRET_ACCESS_KEY "YOUR_SECRET_ACCESS_KEY"
pnpm exec convex env set R2_S3_BUCKET_NAME "YOUR_BUCKET_NAME"
pnpm exec convex env set R2_URL "https://files.yourdomain.com"
```

If R2 env is missing, the UI still supports model tests, but shot uploads are marked unavailable.

### Vercel environment checklist

Add these in Vercel:

```text
CONVEX_DEPLOY_KEY=...
```

Set these in Convex, not Vercel:

```text
MODEL_TEST_ADMIN_PASSWORD=...
R2_S3_URL=...
R2_S3_ACCESS_KEY_ID=...
R2_S3_SECRET_ACCESS_KEY=...
R2_S3_BUCKET_NAME=...
R2_URL=...
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
