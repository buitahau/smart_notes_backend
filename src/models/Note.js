class Note {
  constructor(id, userId, content, dateAt, createdAt = new Date(), category, status) {
    this.id = id;
    this.userId = userId;
    this.content = content;
    this.dateAt = dateAt; // User-specified date for the note
    this.createdAt = createdAt; // System timestamp when note was created
    this.category = category;
    this.status = status;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      content: this.content,
      dateAt: this.dateAt,
      createdAt: this.createdAt,
      category: this.category,
      status: this.status,
    };
  }
}

export default Note;
