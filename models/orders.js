const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    products: [
        {
            name: String,
            price: Number,
            image: String,
            quantity: { type: Number, default: 1 }
        }
    ],
    totalAmount: Number,
    userDetails: {
        name: String,
        address: String,
        phone: String
    },
    paymentId: String,
    status: { type: String, default: "Pending" },
    orderDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
