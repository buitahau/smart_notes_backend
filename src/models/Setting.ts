import { z } from 'zod';

/**
 * Setting schema for validation
 */
export const SettingSchema = z.object({
    id: z.string(),
    userId: z.string(),
    receiveReminder: z.boolean(),
    intervalMinutes: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Setting type inferred from schema
 */
export type Setting = z.infer<typeof SettingSchema>;

/**
 * Setting class for business logic
 */
class SettingClass {
    id: string;
    userId: string;
    receiveReminder: boolean;
    intervalMinutes: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(
        id: string,
        userId: string,
        receiveReminder: boolean,
        intervalMinutes: number,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date()
    ) {
        this.id = id;
        this.userId = userId;
        this.receiveReminder = receiveReminder;
        this.intervalMinutes = intervalMinutes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    toJSON(): Setting {
        return {
            id: this.id,
            userId: this.userId,
            receiveReminder: this.receiveReminder,
            intervalMinutes: this.intervalMinutes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export default SettingClass;
