import { spawnSync } from "node:child_process";
import process from "node:process";

const requireConvex = process.argv.includes("--require-convex");
const hasDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY);
const isVercel = Boolean(process.env.VERCEL);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (hasDeployKey) {
  run("pnpm", [
    "exec",
    "convex",
    "deploy",
    "--cmd",
    "pnpm build:web",
    "--cmd-url-env-var-name",
    "NEXT_PUBLIC_CONVEX_URL",
  ]);
  process.exit(0);
}

if (requireConvex || isVercel) {
  console.error(
    "[build] Missing CONVEX_DEPLOY_KEY. Generate a Convex deploy key and add it to Vercel before deploying.",
  );
  process.exit(1);
}

console.warn(
  "[build] CONVEX_DEPLOY_KEY is not set, skipping Convex deploy and running the local Next build only.",
);
run("pnpm", ["build:web"]);
