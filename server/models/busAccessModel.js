const mongoose = require('mongoose');

// Define the schema for vouchers
const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['fix', 'percentage'],
        required: true
    },
    generatedForBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        default: null
    },
    generatedFor: {
        type: String,
        default: ''
    },
    isOneTimeUse: {
        type: Boolean,
        default: true
    },
    isExpired: {
        type: Boolean,
        default: false
    }
});

// Define the schema for extras
const extraSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
});

// Define the main schema for bus-related details managed by admin
const adminBusDetailsSchema = new mongoose.Schema({
    advanceBooking: {
        type: Number,
        default: 30
    },
    bufferTime: {
        type: Number,
        default: 0
    },
    serviceFee: {
        type: Number,
        default: 0
    },
    vouchers: [voucherSchema], // Array of vouchers
    extras: [extraSchema], // Array of extras
    holidays: {
        type: [String]
    }
});

// Create the model
const AdminBusDetails = mongoose.model('AdminBusDetails', adminBusDetailsSchema);

module.exports = AdminBusDetails;
