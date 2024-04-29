const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    code: {
        type: Number,
        required: true,
        unique: true
    },
    adults: [{
        firstname: {
            type: String,
            required: true
        },
        lastname: {
            type: String,
            required: true
        }
    }],
    children: [{
        firstname: {
            type: String,
            required: true
        },
        lastname: {
            type: String,
            required: true
        }
    }],
    email: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    paymentGateway: {
        type: String,
        required: true
    },
    journeyBus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    journeyBusCheckedIn: {
        type: Boolean,
        default: false
    },
    returnBus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        default: null
    },
    returnBusCheckedIn: {
        type: Boolean,
        default: false
    },
    adultTickets: {
        type: Number,
        required: true
    },
    childTickets: {
        type: Number,
        required: true
    },
    discount: {
        id: {
            type: String,
        },
        type: {
            type: String,
        },
        value: {
            type: Number,
        }
    },
    extras: [{
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    subTotal: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'expired', 'canceled']
    }
},
    { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
