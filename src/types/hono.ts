import type { User } from '../models/User';

/**
 * Variables stored in Hono context
 */
export type Variables = {
    user: User;
};
