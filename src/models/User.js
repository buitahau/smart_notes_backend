class User {
  constructor(
    id,
    firstName,
    lastName,
    email,
    status = true,
    createdAt = new Date(),
    updatedAt = new Date()
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.status = typeof status === 'boolean' ? status : Boolean(status);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default User;
