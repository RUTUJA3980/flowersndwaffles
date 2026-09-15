console.log("Orders JS LOADED 🔥");

const container = document.getElementById("ordersContainer");

fetch("http://localhost:7000/orders")
.then(res => res.json())
.then(data => {
    console.log("DATA:", data);

    if (!container) {
        console.error("Container not found ❌");
        return;
    }

    if (data.length === 0) {
        container.innerHTML = "<h3>No orders yet 😢</h3>";
        return;
    }

    data.forEach(order => {
        let productsHTML = "";
        order.products.forEach(p => {
            productsHTML += `<li>${p.name} - ₹${p.price}</li>`;
        });

        const div = document.createElement("div");
        div.classList.add("order-card");

        div.innerHTML = `
            <h3>${order.userDetails.name}</h3>
            <p><b>Phone:</b> ${order.userDetails.phone}</p>
            <p><b>Address:</b> ${order.userDetails.address}</p>
            <ul>${productsHTML}</ul>
            <p>Total: ₹${order.totalAmount}</p>
            <p>Status: ${order.status}</p>
        `;

        container.appendChild(div);
    });
})
.catch(err => {
    console.error("ERROR:", err);
});
