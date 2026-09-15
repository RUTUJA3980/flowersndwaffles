// Cart setup
let cart = JSON.parse(localStorage.getItem("cart")) || [];
updateCartCount();

function addToCart(name, price, image) {
    const item = { name, price, image };
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert(name + " added to cart 🛒");
}

function updateCartCount() {
    document.getElementById("cartCount").innerText = cart.length;
}

// Fetch products from backend
fetch("http://localhost:7000/products")
  .then(res => res.json())
  .then(data => {
    console.log("DATA:", data);
    const container = document.getElementById("product-list");
    container.innerHTML = "";

    data.forEach(product => {
      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span>₹${product.price}</span>
        <button onclick="addToCart('${product.name}', ${product.price}, '${product.image}')">
          Add to Cart
        </button>
      `;

      container.appendChild(card);
    });

    // SEARCH BAR (after products are loaded)
    const searchBar = document.getElementById("searchBar");
    searchBar.addEventListener("keyup", () => {
      const value = searchBar.value.toLowerCase();
      const cards = document.querySelectorAll(".card");
      cards.forEach(card => {
        const name = card.querySelector("h3").innerText.toLowerCase();
        card.style.display = name.includes(value) ? "block" : "none";
      });
    });
  })
  .catch(err => console.log("ERROR:", err));