/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as modelTestAuth from "../modelTestAuth.js";
import type * as modelTestUploads from "../modelTestUploads.js";
import type * as modelTests from "../modelTests.js";
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  modelTestAuth: typeof modelTestAuth;
  modelTestUploads: typeof modelTestUploads;
  modelTests: typeof modelTests;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
