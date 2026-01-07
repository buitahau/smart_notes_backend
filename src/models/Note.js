class Note {
  constructor(id, userId, content, dateAt, createdAt = new Date(), category = 'general') {
    this.id = id;
    this.userId = userId;
    this.content = content;
    this.category = category; // Category: 'general' or 'on-a-date'
    this.dateAt = dateAt; // User-specified date for the note
    this.createdAt = createdAt; // System timestamp when note was created
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      content: this.content,
      category: this.category,
      dateAt: this.dateAt,
      createdAt: this.createdAt,
    };
  }
}

export default Note;
