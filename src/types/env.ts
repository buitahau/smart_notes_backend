/**
 * Environment variable bindings for the application
 */
export type Env = {
    Bindings: {
        DATABASE_URL: string;
        SUPABASE_URL: string;
        SUPABASE_ANON_KEY: string;
        SUPABASE_SERVICE_ROLE_KEY: string;
        PORT: string;
        OPENROUTER_API_KEY: string;
        CLOUDFLARE_ACCOUNT_ID: string;
        CLOUDFLARE_API_TOKEN: string;
        CLOUDFLARE_VECTORIZE_INDEX_NAME: string;
        INNGEST_EVENT_KEY: string;
        INNGEST_SIGNING_KEY: string;
        GOOGLE_APPLICATION_CREDENTIALS: string;
        GOOGLE_CLOUD_PROJECT: string;
        GOOGLE_CLOUD_LOCATION: string;
    };
};

/**
 * Helper to get typed environment variables
 */
export function getEnv<K extends keyof Env['Bindings']>(key: K): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

/**
 * Helper to get optional environment variables
 */
export function getOptionalEnv<K extends keyof Env['Bindings']>(
    key: K
): string | undefined {
    return process.env[key];
}
