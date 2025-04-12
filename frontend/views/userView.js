export function renderUsers(users) {
    const container = document.getElementById("user-list");
    container.innerHTML = "";
    users.forEach(user => {
        const div = document.createElement("div");
        div.className = "user-card";
        div.innerHTML = `
            <h3>${user.name}</h3>
            <p>Email: ${user.email}</p>
            <p>Role: ${user.role}</p>
        `;
        container.appendChild(div);
    });
}