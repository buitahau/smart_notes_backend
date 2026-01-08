import { eq } from 'drizzle-orm';
import { db } from './client';
import { settings } from './schema/setting';
import Setting from '../models/Setting';

interface SettingRow {
    id: string;
    userId: string;
    receiveReminder: boolean;
    intervalMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}

interface SettingCreateData {
    id: string;
    userId: string;
    receiveReminder: boolean;
    intervalMinutes: number;
}

interface SettingUpdateData {
    receiveReminder?: boolean;
    intervalMinutes?: number;
}

const mapRowToSetting = (row: SettingRow | undefined): Setting | null => {
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
    async create(settingData: SettingCreateData): Promise<Setting | null> {
        const [inserted] = await db
            .insert(settings)
            .values({
                id: settingData.id,
                userId: settingData.userId,
                receiveReminder: settingData.receiveReminder,
                intervalMinutes: settingData.intervalMinutes,
            })
            .returning();

        return mapRowToSetting(inserted as SettingRow);
    },

    async getById(id: string): Promise<Setting | null> {
        const [row] = await db.select().from(settings).where(eq(settings.id, id));
        return mapRowToSetting(row as SettingRow);
    },

    async getByUserId(userId: string): Promise<Setting | null> {
        const [row] = await db
            .select()
            .from(settings)
            .where(eq(settings.userId, userId));
        return mapRowToSetting(row as SettingRow);
    },

    async existingByUserId(userId: string): Promise<boolean> {
        const res = await db
            .select()
            .from(settings)
            .where(eq(settings.userId, userId))
            .limit(1);

        return res.length > 0;
    },

    async getAll(): Promise<Setting[]> {
        const rows = await db.select().from(settings);
        return rows.map(row => mapRowToSetting(row as SettingRow)).filter((s): s is Setting => s !== null);
    },

    async update(id: string, updateData: SettingUpdateData): Promise<Setting | null> {
        const updateValues: Partial<typeof settings.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };
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

        return mapRowToSetting(updated as SettingRow);
    },

    async delete(id: string): Promise<Setting | null> {
        const [deleted] = await db
            .delete(settings)
            .where(eq(settings.id, id))
            .returning();

        return mapRowToSetting(deleted as SettingRow);
    },

    async deleteByUserId(userId: string): Promise<Setting | null> {
        const [deleted] = await db
            .delete(settings)
            .where(eq(settings.userId, userId))
            .returning();

        return mapRowToSetting(deleted as SettingRow);
    },
};
