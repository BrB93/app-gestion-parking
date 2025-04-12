export class User {
  constructor(id, name, email, role, phone = null) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.phone = phone;
  }
}