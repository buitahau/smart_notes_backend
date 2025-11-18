import { eq } from 'drizzle-orm';
import { db } from './client.js';
import { users } from './schema/user.js';
import User from '../models/User.js';

const mapRowToUser = row => {
  if (!row) return null;
  return new User(
    row.id,
    row.firstName ?? '',
    row.lastName ?? '',
    row.email,
    row.status ?? true,
    row.createdAt ? new Date(row.createdAt) : undefined,
    row.updatedAt ? new Date(row.updatedAt) : undefined
  );
};

export const userRepository = {
  async create(userData) {
    const [inserted] = await db
      .insert(users)
      .values({
        id: userData.id,
        firstName: userData.firstName ?? '',
        lastName: userData.lastName ?? '',
        email: userData.email,
        status: userData.status ?? true,
      })
      .returning();

    return mapRowToUser(inserted);
  },

  async getById(id) {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return mapRowToUser(row);
  },

  async getByEmail(email) {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return mapRowToUser(row);
  },

  async update(id, updateData) {
    const updateValues = { updatedAt: new Date() };

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

    const [updated] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, id))
      .returning();

    return mapRowToUser(updated);
  },

  async delete(id) {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return mapRowToUser(deleted);
  },
};
