const path = require("path");
const fs = require("fs");
const Product = require("./models/product");
const Order = require("./models/orders");
const Customer = require("./models/customer");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ✅ MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI is not set. Create a .env file or configure the environment variable before starting the server.");

mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connected 🌸"))
.catch(err => console.log(err));


// 🔐 SECURITY - Failed login tracking
const failedAttempts = {}; // { ip: { count, lastAttempt } }
const BLOCK_AFTER = 5;     // block after 5 failed attempts
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in ms
const LOG_FILE = path.join(__dirname, "security.log");

function getIP(req) {
    return req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
}

function isBlocked(ip) {
    const entry = failedAttempts[ip];
    if (!entry) return false;
    if (entry.count >= BLOCK_AFTER) {
        const timeSince = Date.now() - entry.lastAttempt;
        if (timeSince < BLOCK_DURATION) return true;
        // Block expired — reset
        delete failedAttempts[ip];
    }
    return false;
}

function recordFailedAttempt(ip, email, reason) {
    if (!failedAttempts[ip]) failedAttempts[ip] = { count: 0, lastAttempt: 0 };
    failedAttempts[ip].count++;
    failedAttempts[ip].lastAttempt = Date.now();

    const logLine = `[${new Date().toISOString()}] FAILED_LOGIN | IP: ${ip} | Email: ${email} | Reason: ${reason} | Attempts: ${failedAttempts[ip].count}\n`;
    fs.appendFileSync(LOG_FILE, logLine);
    console.log("🚨", logLine.trim());
}

function recordSuccess(ip, email) {
    delete failedAttempts[ip]; // reset on success
    const logLine = `[${new Date().toISOString()}] SUCCESS_LOGIN | IP: ${ip} | Email: ${email}\n`;
    fs.appendFileSync(LOG_FILE, logLine);
}

function recordSignup(ip, email, name) {
    const logLine = `[${new Date().toISOString()}] SIGNUP | IP: ${ip} | Email: ${email} | Name: ${name}\n`;
    fs.appendFileSync(LOG_FILE, logLine);
}

function recordBlockedAttempt(ip, email) {
    const logLine = `[${new Date().toISOString()}] BLOCKED | IP: ${ip} | Email: ${email} | Status: IP temporarily blocked\n`;
    fs.appendFileSync(LOG_FILE, logLine);
    console.log("🚫", logLine.trim());
}


// 📧 EMAIL SETUP
if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn("EMAIL_USER or EMAIL_APP_PASSWORD is not set. Email notifications may fail.");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

async function sendWelcomeEmail(name, email) {
    await transporter.sendMail({
        from: `"Flowers Flowers & Waffles Waffle 🌸" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to Flowers Flowers & Waffles Waffle! 🌸🧇",
        html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
            <div style="background:linear-gradient(135deg,#ff8fab,#ff4d6d);padding:30px;text-align:center">
                <h1 style="color:white;margin:0;font-size:1.8rem">🌸 Flowers Flowers & Waffles Waffle 🧇</h1>
            </div>
            <div style="padding:30px">
                <h2 style="color:#ff4d6d">Welcome, ${name}! 🎉</h2>
                <p style="color:#555;line-height:1.7">We're so excited to have you! Browse our freshly picked flowers and freshly baked waffles — all delivered with love. 💕</p>
                <div style="text-align:center;margin:25px 0">
                    <a href="http://localhost:7000/index.html" style="background:#ff4d6d;color:white;padding:12px 30px;border-radius:25px;text-decoration:none;font-weight:bold">Start Shopping 🛍️</a>
                </div>
                <p style="color:#aaa;font-size:0.85rem;text-align:center">Freshly Picked · Freshly Baked · Made with Love</p>
            </div>
        </div>`
    });
}

async function sendOrderEmail(name, email, products, totalAmount, paymentId) {
    const itemRows = products.map(p =>
        `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f5e0e5">${p.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f5e0e5;text-align:right">₹${p.price}</td>
        </tr>`
    ).join("");

    await transporter.sendMail({
        from: `"Flowers Flowers & Waffles Waffle 🌸" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Order is Confirmed! 🎉🌸",
        html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
            <div style="background:linear-gradient(135deg,#ff8fab,#ff4d6d);padding:30px;text-align:center">
                <h1 style="color:white;margin:0;font-size:1.8rem">Order Confirmed! 🎉</h1>
                <p style="color:#ffe0e8;margin:8px 0 0">Thank you for shopping with us, ${name}!</p>
            </div>
            <div style="padding:30px">
                <h3 style="color:#ff4d6d;margin-bottom:15px">Your Items</h3>
                <table style="width:100%;border-collapse:collapse;background:#fff8fa;border-radius:10px;overflow:hidden">
                    <thead><tr style="background:#ffd6e0">
                        <th style="padding:10px 12px;text-align:left;color:#ff4d6d">Item</th>
                        <th style="padding:10px 12px;text-align:right;color:#ff4d6d">Price</th>
                    </tr></thead>
                    <tbody>${itemRows}</tbody>
                    <tfoot><tr style="background:#ffd6e0">
                        <td style="padding:10px 12px;font-weight:bold;color:#ff4d6d">Total</td>
                        <td style="padding:10px 12px;font-weight:bold;color:#ff4d6d;text-align:right">₹${totalAmount}</td>
                    </tr></tfoot>
                </table>
                <p style="color:#888;font-size:0.85rem;margin-top:15px">Payment ID: <code>${paymentId}</code></p>
                <p style="color:#555;margin-top:20px;line-height:1.7">Your order is now <b>pending</b> and will be processed soon.</p>
                <div style="text-align:center;margin:25px 0">
                    <a href="http://localhost:7000/my-orders.html" style="background:#ff4d6d;color:white;padding:12px 30px;border-radius:25px;text-decoration:none;font-weight:bold">View My Orders 📦</a>
                </div>
                <p style="color:#aaa;font-size:0.85rem;text-align:center">Flowers Flowers & Waffles Waffle · Made with Love 💕</p>
            </div>
        </div>`
    });
}


// 👤 CUSTOMER AUTH

// Signup
app.post("/customer/signup", async (req, res) => {
    const ip = getIP(req);
    try {
        const { name, email, password } = req.body;
        const existing = await Customer.findOne({ email });
        if (existing) return res.status(400).json({ error: "Email already registered" });

        const hashed = await bcrypt.hash(password, 10);
        const customer = new Customer({ name, email, password: hashed });
        await customer.save();

        recordSignup(ip, email, name);
        sendWelcomeEmail(name, email).catch(err => console.log("Welcome email error:", err.message));

        res.json({ customer: { _id: customer._id, name: customer.name, email: customer.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login with brute force protection
app.post("/customer/login", async (req, res) => {
    const ip = getIP(req);
    const { email, password } = req.body;

    // 🚫 Check if IP is blocked
    if (isBlocked(ip)) {
        recordBlockedAttempt(ip, email);
        return res.status(429).json({ error: "Too many failed attempts. Try again in 15 minutes. 🚫" });
    }

    try {
        const customer = await Customer.findOne({ email });
        if (!customer) {
            recordFailedAttempt(ip, email, "Email not found");
            return res.status(400).json({ error: "Email not found" });
        }

        const match = await bcrypt.compare(password, customer.password);
        if (!match) {
            recordFailedAttempt(ip, email, "Wrong password");
            const attemptsLeft = BLOCK_AFTER - failedAttempts[ip].count;
            return res.status(400).json({
                error: attemptsLeft > 0
                    ? `Wrong password. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left before you're blocked.`
                    : "Too many failed attempts. Try again in 15 minutes. 🚫"
            });
        }

        recordSuccess(ip, email);
        res.json({ customer: { _id: customer._id, name: customer.name, email: customer.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin login
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    const valid = username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD;
    res.json({ success: valid });
});

// Admin login log
app.post("/admin/login-log", (req, res) => {
    const ip = getIP(req);
    const { success, username } = req.body;
    const logLine = `[${new Date().toISOString()}] ADMIN_${success ? "SUCCESS" : "FAILED"} | IP: ${ip} | Username: ${username}\n`;
    fs.appendFileSync(LOG_FILE, logLine);
    res.json({ ok: true });
});

// Get security logs (admin only)
app.get("/security-logs", (req, res) => {
    try {
        if (!fs.existsSync(LOG_FILE)) return res.json({ logs: [], blocked: [] });
        const raw = fs.readFileSync(LOG_FILE, "utf8");
        const logs = raw.trim().split("\n").filter(Boolean).reverse().slice(0, 100); // last 100
        const blocked = Object.entries(failedAttempts)
            .filter(([, v]) => v.count >= BLOCK_AFTER)
            .map(([ip, v]) => ({ ip, attempts: v.count, since: new Date(v.lastAttempt).toLocaleString() }));
        res.json({ logs, blocked });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 🌸 PRODUCT APIs
app.post("/add-product", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json({ message: "Product Added 🌸" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/delete-product/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product Deleted 🗑️" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/update-product/:id", async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "Product Updated ✏️" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// 📦 ORDER APIs
app.post("/create-order", async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        const { products, totalAmount, paymentId, customerId } = req.body;
        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (customer) {
                sendOrderEmail(customer.name, customer.email, products, totalAmount, paymentId)
                .catch(err => console.log("Order email error:", err.message));
            }
        }
        res.status(201).json({ message: "Order saved successfully 🎉" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ orderDate: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/my-orders/:customerId", async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.params.customerId }).sort({ orderDate: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/update-order/:id", async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(updatedOrder);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// 🚀 START SERVER
app.listen(7000, () => {
    console.log("Server running on port 7000 🚀");
    console.log("Open: http://localhost:7000/landing.html");
});
