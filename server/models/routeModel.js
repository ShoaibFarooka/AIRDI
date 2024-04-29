const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
    {
        departurePoint: {
            type: String,
            required: true,
        },
        arrivalPoint: {
            type: String,
            required: true,
        },
        days: [],
        startDate: {
            type: String,
            required: true,
        },
        endDate: {
            type: String,
            required: true,
        },
        departureTime: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true
        },
        totalSeats: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        bookingOpen: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const Route = mongoose.model("Route", routeSchema);

module.exports = Route;
