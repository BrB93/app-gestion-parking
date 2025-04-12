export class User {
  constructor(id, name, email, role, phone = null, is_active = true) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.phone = phone;
    this.is_active = is_active;
  }
}