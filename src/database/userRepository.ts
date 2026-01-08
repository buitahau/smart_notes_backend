import { eq } from 'drizzle-orm';
import { db } from './client';
import { users } from './schema/user';
import User from '../models/User';

interface UserRow {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    iamId: string | null;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface UserCreateData {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    iamId?: string | null;
    status?: boolean;
}

interface UserUpdateData {
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: boolean;
    iamId?: string | null;
}

const mapRowToUser = (row: UserRow | undefined): User | null => {
    if (!row) return null;
    return new User(
        row.id,
        row.firstName ?? '',
        row.lastName ?? '',
        row.email,
        row.status ?? true,
        row.createdAt ? new Date(row.createdAt) : undefined,
        row.updatedAt ? new Date(row.updatedAt) : undefined,
        row.iamId ?? null
    );
};

export const userRepository = {
    async create(userData: UserCreateData): Promise<User | null> {
        const [inserted] = await db
            .insert(users)
            .values({
                id: userData.id,
                firstName: userData.firstName ?? '',
                lastName: userData.lastName ?? '',
                email: userData.email,
                iamId: userData.iamId ?? null,
                status: userData.status ?? true,
            })
            .returning();

        return mapRowToUser(inserted as UserRow);
    },

    async getById(id: string): Promise<User | null> {
        const [row] = await db.select().from(users).where(eq(users.id, id));
        return mapRowToUser(row as UserRow);
    },

    async getByEmail(email: string): Promise<User | null> {
        const [row] = await db.select().from(users).where(eq(users.email, email));
        return mapRowToUser(row as UserRow);
    },

    async getByIAMId(id: string): Promise<User | null> {
        const [row] = await db.select().from(users).where(eq(users.iamId, id));
        return mapRowToUser(row as UserRow);
    },

    async update(id: string, updateData: UserUpdateData): Promise<User | null> {
        const updateValues: Partial<typeof users.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };

        if (updateData.firstName !== undefined) {
            updateValues.firstName = updateData.firstName;
        }

        if (updateData.lastName !== undefined) {
            updateValues.lastName = updateData.lastName;
        }

        if (updateData.email !== undefined) {
            updateValues.email = updateData.email;
        }
        if (updateData.status !== undefined) {
            updateValues.status = updateData.status;
        }
        if (updateData.iamId !== undefined) {
            updateValues.iamId = updateData.iamId;
        }

        const [updated] = await db
            .update(users)
            .set(updateValues)
            .where(eq(users.id, id))
            .returning();

        return mapRowToUser(updated as UserRow);
    },

    async delete(id: string): Promise<User | null> {
        const [deleted] = await db
            .delete(users)
            .where(eq(users.id, id))
            .returning();

        return mapRowToUser(deleted as UserRow);
    },
};
