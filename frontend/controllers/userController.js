import { fetchJSON } from "../core/fetchWrapper.js";
import { User } from "../models/user.js";
import { renderUsers } from "../views/userView.js";

export async function loadUsers() {
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/users");
        const users = data.map(user => new User(user.id, user.name, user.email, user.role));
        renderUsers(users);
    } catch (error) {
        console.error("Error loading users:", error);
    }
}