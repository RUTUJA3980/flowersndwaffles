// Run this once to add all products to the database:
// node seed.js

const mongoose = require("mongoose");
const Product = require("./models/product");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI is not set. Create a .env file or configure the environment variable before running the seed script.");

const products = [
    // 🌸 FLOWERS
    { name: "Classic Red Roses", price: 299, image: "./images/roses.jpg", description: "A timeless symbol of love. Freshly cut, long-lasting bouquet of 12 stems." },
    { name: "Sunshine Daisies", price: 199, image: "./images/daisy.jpg", description: "Bright and cheerful daisies to light up any room or occasion." },
    { name: "White Lilies", price: 249, image: "./images/lily.jpg", description: "Elegant white lilies with a gentle fragrance — perfect for gifting." },
    { name: "Sunflowers", price: 179, image: "./images/sunflower.jpg", description: "Bold, bright sunflowers that radiate warmth and happiness." },
    { name: "Pink Tulips", price: 229, image: "./images/tulips.jpg", description: "Soft pink tulips — a classic spring favourite for every occasion." },
    { name: "Blue Blossom", price: 319, image: "./images/blue-blossom.jpg", description: "Rare and stunning blue blossoms — a unique gift that stands out." },
    { name: "Pink Daisy", price: 189, image: "./images/pink-daisy.jpg", description: "Delicate pink daisies — sweet and lovely for any celebration." },
    // 🧇 WAFFLES
    { name: "Classic Butter Waffle", price: 149, image: "./images/classic.jpg", description: "Crispy on the outside, fluffy inside, served with maple syrup and butter." },
    { name: "Choco Delight Waffle", price: 189, image: "./images/choco-waffle.jpg", description: "Rich chocolate batter topped with chocolate sauce and cocoa powder." },
    { name: "Strawberry Bliss Waffle", price: 199, image: "./images/strawberry-waffle.jpg", description: "Fresh strawberries, whipped cream and strawberry syrup on a golden waffle." },
    { name: "Buttermilk Honey Waffle", price: 169, image: "./images/buttermilk-honey.jpg", description: "Fluffy buttermilk waffle drizzled with pure organic honey and cinnamon." },
    { name: "Protein Power Waffle", price: 219, image: "./images/protein-fun.jpg", description: "High-protein waffle with peanut butter, banana slices and dark chocolate." },
    { name: "Whole Wheat Waffle", price: 159, image: "./images/whole-wheat.jpg", description: "Healthy whole wheat base with seeds, honey and fresh berries." },
];

mongoose.connect(MONGO_URI)
.then(async () => {
    console.log("Connected to MongoDB 🌸");
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`✅ ${products.length} products added to database!`);
    console.log("🌸 Flowers:", products.filter(p => !p.name.includes("Waffle")).length);
    console.log("🧇 Waffles:", products.filter(p => p.name.includes("Waffle")).length);
    mongoose.connection.close();
})
.catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
});
