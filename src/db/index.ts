import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import * as schema from './schema';

export function getDb() {
  let binding: D1Database | undefined;

  try {
    const context = getRequestContext();
    binding = context.env.DB;
  } catch (e) {
    // Fallback if accessed via process.env in worker shell
    binding = (process.env as any).DB as D1Database | undefined;
  }

  if (!binding) {
    throw new Error(
      "Cloudflare D1 database binding 'DB' is undefined. " +
      "Make sure you have configured the D1 database binding in wrangler.toml " +
      "and are running in a Cloudflare Workers/Pages environment (like wrangler dev or next-dev with setupDevPlatform)."
    );
  }

  return drizzle(binding, { schema });
}
