const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
    {
        departurePoint: {
            type: String,
            required: true,
        },
        arrivalPoint: {
            type: String,
            required: true,
        },
        departureDate: {
            type: String,
            required: true,
        },
        arrivalDate: {
            type: String,
            required: true,
        },
        departureTime: {
            type: String,
            required: true,
        },
        arrivalTime: {
            type: String,
            required: true,
        },
        adultTicketCost: {
            type: Number,
            required: true,
        },
        childTicketCost: {
            type: Number,
            required: true,
        },
        totalSeats: {
            type: Number,
            required: true
        },
        seatsTaken: {
            type: Number,
            default: 0,
        },
        bookingOpen: {
            type: Boolean,
            default: true
        },
        route: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Route',
            default: null
        }
    },
    { timestamps: true }
);

const Bus = mongoose.model("Bus", busSchema);

module.exports = Bus;
