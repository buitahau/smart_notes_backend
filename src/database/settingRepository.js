import { eq } from 'drizzle-orm';
import { db } from './client.js';
import { settings } from './schema/setting.js';
import Setting from '../models/Setting.js';

const mapRowToSetting = row => {
  if (!row) return null;
  return new Setting(
    row.id,
    row.userId,
    row.receiveReminder,
    row.intervalMinutes,
    row.createdAt ? new Date(row.createdAt) : undefined,
    row.updatedAt ? new Date(row.updatedAt) : undefined
  );
};

export const settingRepository = {
  async create(settingData) {
    const [inserted] = await db
      .insert(settings)
      .values({
        id: settingData.id,
        userId: settingData.userId,
        receiveReminder: settingData.receiveReminder,
        intervalMinutes: settingData.intervalMinutes,
      })
      .returning();

    return mapRowToSetting(inserted);
  },

  async getById(id) {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.id, id));
    return mapRowToSetting(row);
  },

  async getByUserId(userId) {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));
    return mapRowToSetting(row);
  },

  async existingByUserId(userId) {
    const res = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);

    return res.length > 0;
  },

  async getAll() {
    const rows = await db.select().from(settings);
    return rows.map(mapRowToSetting).filter(Boolean);
  },

  async update(id, updateData) {
    const updateValues = { updatedAt: new Date() };
    if (updateData.receiveReminder !== undefined) {
      updateValues.receiveReminder = updateData.receiveReminder;
    }
    if (updateData.intervalMinutes !== undefined) {
      updateValues.intervalMinutes = updateData.intervalMinutes;
    }

    const [updated] = await db
      .update(settings)
      .set(updateValues)
      .where(eq(settings.id, id))
      .returning();

    return mapRowToSetting(updated);
  },

  async delete(id) {
    const [deleted] = await db
      .delete(settings)
      .where(eq(settings.id, id))
      .returning();

    return mapRowToSetting(deleted);
  },

  async deleteByUserId(userId) {
    const [deleted] = await db
      .delete(settings)
      .where(eq(settings.userId, userId))
      .returning();

    return mapRowToSetting(deleted);
  },
};
