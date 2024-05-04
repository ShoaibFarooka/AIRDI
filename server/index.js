const express = require('express');
const cors = require('cors');
const path = require("path");
const mongoose = require('mongoose');
require('dotenv').config();
const BusRoutes = require("./routes/busRoutes");
const PaymentRoutes = require("./routes/paymentRoutes");
const BookingRoutes = require("./routes/bookingRoutes");
const AdminRoutes = require("./routes/adminRoutes");

//Express Server Setup
const app = express();
const port = process.env.PORT || 5009;

//Express Middlewares
app.use((req, res, next) => {
    if (req.originalUrl === '/payments/webhooks') {
        express.raw({ type: 'application/json' })(req, res, next);
    } else {
        express.json()(req, res, next);
    }
});
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Connection URL
const DB = process.env.DB_URI;
mongoose.connect(DB)
    .then(() => {
        console.log('Connected to MongoDB Atlas Production');

        //Server status endpoint
        app.get('/', (req, res) => {
            res.send('Server is Up!');
        });

        // Routes
        app.use("/buses", BusRoutes);
        app.use("/payments", PaymentRoutes);
        app.use("/booking", BookingRoutes);
        app.use("/admin", AdminRoutes);

        app.listen(port, () => {
            console.log(`Node/Express Server is Up......\nPort: localhost:${port}`);
        });
    })
    .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));