// Auth check
const customerData = JSON.parse(localStorage.getItem("customer"));
if (!customerData) { window.location.href = "customer-login.html"; }

// ── SESSION-BASED CART (Lab 5) ────────────────────────────────
// Cart stored in localStorage with quantity tracking
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItemsDiv = document.getElementById("cartItems");
const totalPriceSpan = document.getElementById("totalPrice");
const cartSubtitle = document.getElementById("cartSubtitle");

// Group items by name and track quantity
function groupCart(cart) {
    const grouped = {};
    cart.forEach((item, index) => {
        const key = item.name;
        if (!grouped[key]) {
            grouped[key] = { ...item, quantity: 1, indices: [index] };
        } else {
            grouped[key].quantity++;
            grouped[key].indices.push(index);
        }
    });
    return Object.values(grouped);
}

let total = 0;
const grouped = groupCart(cart);

if (cart.length === 0) {
    cartItemsDiv.innerHTML = `
        <div class="cart-empty">
            <div class="icon">🛒</div>
            <p style="font-size:1.1rem;color:#888;margin-bottom:15px">Your cart is empty</p>
            <a href="index.html">Start Shopping 🛍️</a>
        </div>`;
    cartSubtitle.textContent = "0 items";
} else {
    cartSubtitle.textContent = cart.length + " item" + (cart.length !== 1 ? "s" : "");

    grouped.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement("div");
        div.classList.add("cart-card");
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80?text=?'">
            <div class="info">
                <h3>${item.name}</h3>
                <div class="price">₹${item.price} ${item.quantity > 1 ? `× ${item.quantity} = ₹${itemTotal}` : ''}</div>
            </div>
            <button class="remove-btn" onclick="removeItem('${item.name}')">✕ Remove</button>
        `;
        cartItemsDiv.appendChild(div);
    });
}

totalPriceSpan.innerText = total;

// ── PAYMENT ───────────────────────────────────────────────────
function payNow() {
    if (cart.length === 0) { alert("Your cart is empty 🥺"); return; }

    const name = document.getElementById("name").value.trim();
    const address = document.getElementById("address").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!name || !address || !phone) { alert("Please fill all details 🥺"); return; }

    const totalAmount = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

    var options = {
        key: "rzp_test_SEiJd9JLRkJEZF",
        amount: totalAmount * 100,
        currency: "INR",
        name: "Flowers & Waffles",
        description: "Order Payment",
        handler: function (response) {
            const orderData = {
                customerId: customerData._id,
                products: cart,
                totalAmount,
                userDetails: { name, address, phone },
                paymentId: response.razorpay_payment_id
            };

            fetch("http://localhost:7000/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            })
            .then(res => res.json())
            .then(() => {
                alert("Order placed successfully 🎉");
                localStorage.removeItem("cart");
                window.location.href = "my-orders.html";
            })
            .catch(() => alert("Order failed ❌ Please try again."));
        },
        theme: { color: "#ff4d6d" }
    };

    new Razorpay(options).open();
}

// ── REMOVE ONE TYPE OF ITEM ───────────────────────────────────
function removeItem(name) {
    const idx = cart.findIndex(i => i.name === name);
    if (idx !== -1) cart.splice(idx, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    location.reload();
}

// ── CLEAR CART ────────────────────────────────────────────────
function clearCart() {
    if (!confirm("Clear your entire cart?")) return;
    localStorage.removeItem("cart");
    location.reload();
}
