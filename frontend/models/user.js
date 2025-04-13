export class User {
  constructor(id, username, email, role, phone = null, is_active = true) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.role = role;
    this.phone = phone;
    this.is_active = is_active;
  }
}