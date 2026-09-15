let currentId = null;

// ─── SIDEBAR NAVIGATION ───────────────────────────────────────
function showSection(name) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("section-" + name).classList.add("active");
    event.currentTarget.classList.add("active");

    if (name === "products") loadProducts();
    if (name === "orders") loadOrders();
    if (name === "dashboard") loadDashboard();
    if (name === "security") loadSecurityLogs();
}

// ─── DASHBOARD STATS ──────────────────────────────────────────
async function loadDashboard() {
    const [products, orders] = await Promise.all([
        fetch("http://localhost:7000/products").then(r => r.json()),
        fetch("http://localhost:7000/orders").then(r => r.json())
    ]);
    document.getElementById("stat-products").textContent = products.length;
    document.getElementById("stat-orders").textContent = orders.length;
    document.getElementById("stat-pending").textContent = orders.filter(o => o.status === "Pending").length;
    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    document.getElementById("stat-revenue").textContent = revenue.toLocaleString("en-IN");
}

// ─── LOAD PRODUCTS ────────────────────────────────────────────
function loadProducts() {
    fetch("http://localhost:7000/products")
    .then(res => res.json())
    .then(data => {
        data.reverse();
        const container = document.getElementById("admin-products");
        container.innerHTML = "";

        if (data.length === 0) {
            container.innerHTML = "<p style='color:#aaa'>No products yet. Add one! ➕</p>";
            return;
        }

        data.forEach(product => {
            const div = document.createElement("div");
            div.classList.add("product-card");
            div.innerHTML = `
                <img src="${product.image}" onerror="this.src='https://via.placeholder.com/200x140?text=No+Image'">
                <h3>${product.name}</h3>
                <div class="price">₹${product.price}</div>
                <div class="desc">${product.description || '—'}</div>
                <div class="card-actions">
                    <button class="btn-edit edit-btn"
                        data-id="${product._id}"
                        data-name="${(product.name || '').replace(/"/g, '&quot;')}"
                        data-price="${product.price}"
                        data-image="${(product.image || '').replace(/"/g, '&quot;')}"
                        data-desc="${(product.description || '').replace(/"/g, '&quot;')}">✏️ Edit</button>
                    <button class="btn-delete" onclick="deleteProduct('${product._id}')">🗑️ Delete</button>
                </div>
            `;
            container.appendChild(div);
        });
    })
    .catch(err => console.error("Error loading products:", err));
}

// ─── ADD PRODUCT ──────────────────────────────────────────────
function addProduct() {
    const name = document.getElementById("name").value.trim();
    const price = document.getElementById("price").value;
    const image = document.getElementById("image").value.trim();
    const description = document.getElementById("description").value.trim();
    const msg = document.getElementById("addMsg");

    if (!name || !price || !image) {
        msg.className = "form-msg error";
        msg.textContent = "Please fill all required fields!";
        return;
    }

    fetch("http://localhost:7000/add-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price), image, description })
    })
    .then(res => res.json())
    .then(() => {
        msg.className = "form-msg success";
        msg.textContent = "Product added successfully ✅";
        document.getElementById("name").value = "";
        document.getElementById("price").value = "";
        document.getElementById("image").value = "";
        document.getElementById("description").value = "";
        setTimeout(() => msg.textContent = "", 3000);
    })
    .catch(() => {
        msg.className = "form-msg error";
        msg.textContent = "Failed to add product ❌";
    });
}

// ─── DELETE PRODUCT ───────────────────────────────────────────
function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    fetch(`http://localhost:7000/delete-product/${id}`, { method: "DELETE" })
    .then(() => loadProducts())
    .catch(err => console.error(err));
}

// ─── EDIT MODAL ───────────────────────────────────────────────
document.addEventListener("click", e => {
    if (e.target.classList.contains("edit-btn")) {
        const btn = e.target;
        openEdit(btn.dataset.id, btn.dataset.name, btn.dataset.price, btn.dataset.image, btn.dataset.desc);
    }
});

function openEdit(id, name, price, image, desc) {
    currentId = id;
    document.getElementById("editName").value = name;
    document.getElementById("editPrice").value = price;
    document.getElementById("editImage").value = image;
    document.getElementById("editDesc").value = desc;
    document.getElementById("previewImg").src = image;
    document.getElementById("editModal").classList.add("open");
}

function closeEdit() {
    document.getElementById("editModal").classList.remove("open");
}

document.addEventListener("input", e => {
    if (e.target.id === "editImage") {
        document.getElementById("previewImg").src = e.target.value;
    }
});

function updateProduct() {
    const updated = {
        name: document.getElementById("editName").value,
        price: Number(document.getElementById("editPrice").value),
        image: document.getElementById("editImage").value,
        description: document.getElementById("editDesc").value
    };

    fetch(`http://localhost:7000/update-product/${currentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
    })
    .then(() => { closeEdit(); loadProducts(); })
    .catch(err => console.error(err));
}

// ─── LOAD ORDERS ──────────────────────────────────────────────
function loadOrders() {
    fetch("http://localhost:7000/orders")
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById("orders-tbody");
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;color:#aaa;padding:30px'>No orders yet 😢</td></tr>";
            return;
        }

        data.forEach(order => {
            const items = (order.products || []).map(p => p.name).join(", ");
            const date = new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            const statusClass = "status-" + (order.status || "Pending");

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><b>${order.userDetails?.name || "—"}</b><br><small style="color:#aaa">${order.userDetails?.address || ""}</small></td>
                <td>${order.userDetails?.phone || "—"}</td>
                <td style="max-width:180px;font-size:0.85rem">${items}</td>
                <td><b>₹${order.totalAmount}</b></td>
                <td>${date}</td>
                <td>
                    <select class="status-select" onchange="updateStatus('${order._id}', this.value)">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(err => console.error("Error loading orders:", err));
}

// ─── UPDATE ORDER STATUS ──────────────────────────────────────
function updateStatus(id, status) {
    fetch(`http://localhost:7000/update-order/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    }).catch(err => console.error(err));
}

// ─── LOGOUT ───────────────────────────────────────────────────
function logout() {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
}

// ─── INIT ─────────────────────────────────────────────────────
loadDashboard();

// ─── SECURITY LOGS ────────────────────────────────────────────
function loadSecurityLogs() {
    fetch("http://localhost:7000/security-logs")
    .then(res => res.json())
    .then(data => {
        // Blocked IPs
        const blockedDiv = document.getElementById("blocked-ips");
        if (data.blocked.length === 0) {
            blockedDiv.innerHTML = "<p style='color:#aaa'>No IPs currently blocked ✅</p>";
        } else {
            blockedDiv.innerHTML = data.blocked.map(b =>
                `<span class="blocked-badge">🚫 ${b.ip} — ${b.attempts} attempts — since ${b.since}</span>`
            ).join("");
        }

        // Log lines
        const logsDiv = document.getElementById("security-logs");
        if (data.logs.length === 0) {
            logsDiv.innerHTML = "<p style='color:#aaa'>No logs yet.</p>";
            return;
        }

        logsDiv.innerHTML = data.logs.map(line => {
            let cls = "log-line";
            if (line.includes("FAILED_LOGIN")) cls += " log-FAILED";
            else if (line.includes("BLOCKED")) cls += " log-BLOCKED";
            else if (line.includes("SUCCESS_LOGIN")) cls += " log-SUCCESS";
            else if (line.includes("SIGNUP")) cls += " log-SIGNUP";
            else if (line.includes("ADMIN")) cls += " log-ADMIN";
            return `<div class="${cls}">${line}</div>`;
        }).join("");
    })
    .catch(err => console.error("Error loading security logs:", err));
}
