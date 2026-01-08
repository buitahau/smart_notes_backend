import { z } from 'zod';

/**
 * User schema for validation
 */
export const UserSchema = z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    status: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    iamId: z.string().nullable(),
});

/**
 * User type inferred from schema
 */
export type User = z.infer<typeof UserSchema>;

/**
 * User class for business logic
 */
class UserClass {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
    iamId: string | null;

    constructor(
        id: string,
        firstName: string,
        lastName: string,
        email: string,
        status: boolean = true,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date(),
        iamId: string | null = null
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.status = typeof status === 'boolean' ? status : Boolean(status);
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.iamId = iamId ?? null;
    }

    toJSON(): User {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            status: this.status,
            iamId: this.iamId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export default UserClass;
