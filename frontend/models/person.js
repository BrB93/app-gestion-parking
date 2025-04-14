export class Person {
    constructor(id, userId, firstName, lastName, address, zipCode, city, apartmentNumber = null, phoneNumber = null, 
                createdAt = null, vehicleBrand = null, vehicleModel = null, licensePlate = null) {
      this.id = id;
      this.user_id = userId;
      this.first_name = firstName;
      this.last_name = lastName;
      this.address = address;
      this.zip_code = zipCode;
      this.city = city;
      this.apartment_number = apartmentNumber;
      this.phone_number = phoneNumber;
      this.created_at = createdAt;
      this.vehicle_brand = vehicleBrand;
      this.vehicle_model = vehicleModel;
      this.license_plate = licensePlate;
    }
  }