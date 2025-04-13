export class Person {
    constructor(id, user_id, address, apartment_number = null, phone_number = null, created_at = null, vehicle_brand = null, vehicle_model = null, license_plate = null) {
      this.id = id;
      this.user_id = user_id;
      this.address = address;
      this.apartment_number = apartment_number;
      this.phone_number = phone_number;
      this.created_at = created_at;
      this.vehicle_brand = vehicle_brand;
      this.vehicle_model = vehicle_model;
      this.license_plate = license_plate;
    }
  }