class Setting {
  constructor(
    id,
    userId,
    receiveReminder,
    intervalMinutes,
    createdAt = new Date(),
    updatedAt = new Date()
  ) {
    this.id = id;
    this.userId = userId;
    this.receiveReminder = receiveReminder;
    this.intervalMinutes = intervalMinutes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
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

export default Setting;
