interface CloudflareEnv {
  DB: D1Database;
  AUTH_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
}

declare namespace NodeJS {
  interface ProcessEnv extends CloudflareEnv {
    NEXT_RUNTIME?: 'edge' | 'nodejs';
    LOCAL_DB_PATH?: string;
  }
}
