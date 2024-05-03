const Admin = require("../models/adminModel");
const Bus = require("../models/busModel");
const Route = require("../models/routeModel");
const Booking = require("../models/ticketModel");
const AdminBusDetails = require("../models/busAccessModel");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const puppeteer = require("puppeteer");
const handlebars = require('handlebars');
const fs = require("fs");
const path = require("path");


// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // Your SMTP host
    port: process.env.EMAIL_PORT, // Your SMTP port (usually 587 for TLS/STARTTLS)
    secure: true, // Set to true if you're using SSL
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_EMAIL_PASSWORD,
    }
});

const Register = async (req, res) => {
    try {
        const { name, username, password } = req.body;
        let existingUser = await Admin.findOne({ username });
        if (existingUser) {
            return res.status(409).send("A user with that username has already been registered!");
        } else {
            let passwordDigest = await authMiddleware.hashPassword(password);
            const userData = await Admin.create({
                name,
                email,
                password: passwordDigest,
            });
            res.status(201).json({ userData });
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
        throw error;
    }
};

const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Invalid data');
        }
        const user = await Admin.findOne({ email });
        if (user) {
            let passwordMatched = await authMiddleware.comparePassword(
                user.password,
                password
            );
            if (passwordMatched) {
                let payload = {
                    id: user.id,
                };
                let token = authMiddleware.createToken(payload);
                return res.status(200).json({ token });
            }
        }
        res.status(401).send('Invalid Credentials!');
    } catch (error) {
        res.status(500).send('Internal Server Error');
        throw error;
    }
};

const GetBusesInfo = async (req, res) => {
    try {
        const currentDate = new Date().toISOString().slice(0, 10);
        // const currentDate = '2024-04-25';
        const result = await Bus.aggregate([
            {
                $match: {
                    departureDate: currentDate
                }
            },
            {
                $group: {
                    _id: {
                        departurePoint: '$departurePoint', // Group by departure point
                        arrivalPoint: '$arrivalPoint' // Group by arrival point
                    },
                    departureTimes: {
                        $addToSet: '$departureTime' // Accumulate unique departure times
                    }
                }
            }
        ]);

        const info = result.map(entry => ({
            departurePoint: entry._id.departurePoint,
            arrivalPoint: entry._id.arrivalPoint,
            departureTimes: entry.departureTimes
        }));
        res.status(200).json({ info });
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
};

const GetBusPassengerList = async (req, res) => {
    try {
        const { departurePoint, arrivalPoint, departureTime } = req.body;
        if (!departurePoint || !departureTime) {
            return res.status(400).send('Invalid data');
        }
        const currentDate = new Date().toISOString().slice(0, 10);
        // const currentDate = '2024-04-25';
        const bus = await Bus.findOne({ departurePoint, arrivalPoint, departureDate: currentDate, departureTime });
        if (!bus) {
            return res.status(404).send('Bus not found');
        }
        const journeyBusPassengerList = await Booking.find({
            journeyBus: bus._id,
            status: 'confirmed'
        }).populate('journeyBus');
        const returnBusPassengerList = await Booking.find({
            returnBus: bus._id,
            journeyBusCheckedIn: true,
            status: 'confirmed'
        }).populate('returnBus');
        if (journeyBusPassengerList.length <= 0 && returnBusPassengerList <= 0) {
            return res.status(404).send('Tickets not found');
        }
        const combinedPassengerList = journeyBusPassengerList.map(item => ({ ...item.toObject(), fromJourneyBus: true }))
            .concat(returnBusPassengerList.map(item => ({ ...item.toObject(), fromJourneyBus: false })));
        res.status(200).json({ passengerList: combinedPassengerList });
    } catch (error) {
        res.status(500).send('Internal Server Error');
        console.log(error);
    }
};

const SearchPassenger = async (req, res) => {
    try {
        const { bookingId, email, contact } = req.body;
        if (!bookingId || (!email && (!contact || contact === '+'))) {
            return res.status(400).send('Invalid data');
        }
        let query = { code: bookingId };
        if (email) {
            query.email = email;
        } else if (contact && contact !== '+') {
            query.contact = contact;
        }
        const passenger = await Booking.findOne(query).populate('journeyBus').populate('returnBus');
        if (passenger) {
            res.status(200).json({ passenger });
        } else {
            res.status(404).send('Passenger not found');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
        console.log(error);
    }
};

const CheckInPassenger = async (req, res) => {
    try {
        const { fromJourneyBus } = req.body;
        const { bookingId } = req.params;
        if (!fromJourneyBus || !bookingId || !mongoose.isValidObjectId(bookingId)) {
            return res.status(400).send('Invalid request');
        }
        let updatedBooking;
        if (fromJourneyBus) {
            updatedBooking = await Booking.findByIdAndUpdate(bookingId, { journeyBusCheckedIn: true });
        }
        else {
            updatedBooking = await Booking.findByIdAndUpdate(bookingId, { returnBusCheckedIn: true });
        }
        if (updatedBooking) {
            res.status(200).send('Checked in successfully');
        }
        else {
            res.status(400).send('Unable to check in');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
        console.log(error);
    }
};

const GetSalesReport = async (req, res) => {
    try {
        const report = await generateSalesReport(req.body);
        res.status(200).json({ report });
    } catch (error) {
        res.status(500).send('Internal Server Error');
        console.log(error);
    }
};

const GetFilteredPassengers = async (req, res) => {
    try {
        const passengers = await filterPassengers(req.body);
        res.status(200).json({ passengers });
    } catch (error) {
        res.status(500).send('Internal Server Error');
        console.log(error);
    }
};

const GetBusAccess = async (req, res) => {
    try {
        const data = await AdminBusDetails.findOne({})
            .populate({
                path: 'vouchers.generatedForBooking',
                model: 'Ticket'
            });
        if (data) {
            res.status(200).json({ data });
        }
        else {
            res.status(404).send('Data not found!');
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const UpdateBusAccess = async (req, res) => {
    try {
        const { advanceBooking, bufferTime, serviceFee } = req.body;
        const numberRegex = /^[0-9\b]+$/;
        if (!numberRegex.test(advanceBooking) || !numberRegex.test(bufferTime) || !numberRegex.test(serviceFee)) {
            return res.status(400).send('Invalid data');
        }
        const updatedData = await AdminBusDetails.findOneAndUpdate({}, { advanceBooking, bufferTime, serviceFee }, { new: true });
        if (!updatedData) {
            return res.status(404).send('Data not found');
        }
        res.status(200).send('Updated!');
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const AddVoucher = async (req, res) => {
    try {
        const { code, type, value, isOneTimeUse } = req.body;
        if (!code || !type || !value || typeof (isOneTimeUse) !== 'boolean') {
            return res.status(400).send('Invalid data');
        }
        const newVoucher = {
            code,
            value,
            type,
            isOneTimeUse
        };
        const adminBusDetails = await AdminBusDetails.findOne();
        if (!adminBusDetails) {
            return res.status(404).send('Data not found');
        }
        adminBusDetails.vouchers.push(newVoucher);
        await adminBusDetails.save();
        res.status(201).send('Voucher added successfully');
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const UpdateVoucher = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const { isExpired } = req.body
        const adminBusDetails = await AdminBusDetails.findOne();
        if (!adminBusDetails) {
            return res.status(404).send('Data not found');
        }
        const voucherIndex = adminBusDetails.vouchers.findIndex(voucher => voucher._id.toString() === voucherId);
        if (voucherIndex === -1) {
            return res.status(404).send('Voucher not found');
        }
        adminBusDetails.vouchers[voucherIndex].isExpired = isExpired;
        await adminBusDetails.save();
        return res.status(200).send('Voucher updated successfully');
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const AddExtra = async (req, res) => {
    try {
        const { name, price } = req.body;
        if (!name || !price) {
            return res.status(400).send('Invalid data');
        }
        const newExtra = {
            name,
            price
        };
        const adminBusDetails = await AdminBusDetails.findOne();
        if (!adminBusDetails) {
            return res.status(404).send('Data not found');
        }
        adminBusDetails.extras.push(newExtra);
        await adminBusDetails.save();
        res.status(201).send('Extra added successfully');
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const UpdateExtra = async (req, res) => {
    try {
        const { extraId } = req.params;
        const { isAvailable } = req.body
        const adminBusDetails = await AdminBusDetails.findOne();
        if (!adminBusDetails) {
            return res.status(404).send('Data not found');
        }
        const extraIndex = adminBusDetails.extras.findIndex(extra => extra._id.toString() === extraId);
        if (extraIndex === -1) {
            return res.status(404).send('Extra not found');
        }
        adminBusDetails.extras[extraIndex].isAvailable = isAvailable;
        await adminBusDetails.save();
        return res.status(200).send('Extra updated successfully');
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const BuyTicket = async (req, res) => {
    try {
        const { adults, children, email, contact, paymentGateway, journeyBus, returnBus, adultTickets, childTickets, extras, discount, subTotal } = req.body;
        const isAdultsValid = Array.isArray(adults) && adults.every(adult => adult.firstname && adult.lastname);
        const isChildrenValid = Array.isArray(children) && children.every(child => child.firstname && child.lastname);
        console.log(email, contact);
        if (!isAdultsValid || !isChildrenValid || !email || !paymentGateway || !journeyBus || !(adultTickets || childTickets) || !subTotal) {
            return res.status(400).send('Invalid data');
        }
        const code = generateUniqueCode();
        const status = 'confirmed';
        const newTicket = new Booking({
            code,
            adults,
            children,
            email,
            contact,
            paymentGateway,
            journeyBus: journeyBus?._id,
            returnBus: returnBus?._id,
            adultTickets,
            childTickets,
            extras,
            discount,
            subTotal,
            status
        });
        await newTicket.save();
        const updatedTicket = await Booking.findById(newTicket._id)
            .populate('journeyBus')
            .populate('returnBus')
            .lean();

        await updateBusSeats(updatedTicket);
        const pdfBuffer = await generatePDF(updatedTicket);
        const htmlContent = await generateHTML(updatedTicket);
        await sendEmailWithPDF(updatedTicket, pdfBuffer, htmlContent);

        const clientUrl = req.get('origin');
        const success_url = `${clientUrl}/success?client_reference_id=${encodeURIComponent(updatedTicket._id.toString())}`
        res.status(200).json({ url: success_url });
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const CreateRoute = async (req, res) => {
    try {
        const { from, to, departureTime, startDate, endDate, duration, days, totalSeats, price } = req.body;
        if (!from || !to || !departureTime || !startDate || !endDate || !duration || !(days && days.length !== 0) || !totalSeats || !price) {
            return res.status(400).send('Invalid data');
        }
        await createRoute(req.body);
        res.status(200).send('Route created successfully');
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const GetRoutes = async (req, res) => {
    try {
        const routes = await Route.find({});
        if (routes && routes.length > 0) {
            return res.status(200).json({ routes });
        }
        res.status(400).send('Routes not found!');
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const UpdateRoute = async (req, res) => {
    try {
        const { routeId } = req.params;
        const { bookingOpen } = req.body;
        if (typeof (bookingOpen) !== 'boolean') {
            return res.status(400).send('Invalid data');
        }

        const updatedRoute = await Route.findByIdAndUpdate(routeId, { bookingOpen }, { new: true });
        if (updatedRoute) {
            const updatedBuses = await Bus.updateMany({ route: routeId }, { $set: { bookingOpen } });
            if (updatedBuses) {
                res.status(200).send('Route updated successfully');
            }
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};































async function updateBusSeats(ticket) {
    const seatsTaken = ticket.adultTickets + ticket.childTickets;
    await Bus.findByIdAndUpdate(ticket.journeyBus._id, { seatsTaken: ticket.journeyBus.seatsTaken + seatsTaken }, { new: true });

    if (ticket.returnBus) {
        await Bus.findByIdAndUpdate(ticket.returnBus._id, { seatsTaken: ticket.returnBus.seatsTaken + seatsTaken }, { new: true });
    }
};

async function generatePDF(ticket) {
    const templatePath = path.join(__dirname, '../template/pdfTemplate.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    const html = template({ ticket });

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreHTTPSErrors: true,
        dumpio: false
    });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    return pdfBuffer;
}

async function generateHTML(ticket) {
    const templatePath = path.join(__dirname, '../template/emailTemplate.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    const html = template({ ticket });
    return html;
}

async function sendEmailWithPDF(ticket, pdfBuffer, htmlContent) {
    const mailOptions = {
        from: '"Airdi Support" <' + process.env.SENDER_EMAIL + '>',
        to: ticket.email,
        replyTo: '"Airdi Support" <' + process.env.SENDER_EMAIL + '>',
        subject: 'Ticket Booking Confirmation!',
        html: htmlContent,
        attachments: [{
            filename: 'ticket.pdf',
            content: pdfBuffer
        }]
    };
    await transporter.sendMail(mailOptions);
}

function generateUniqueCode() {
    const code = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit number
    // Check if the code already exists in the database
    // You can implement this logic according to your database setup
    // If the code already exists, generate a new one recursively until a unique code is found
    return code;
};

const filterPassengers = async (filters) => {
    try {
        const { orderNo, contact, name, email, journeyDate, orderDate } = filters;
        const matchQuery = {};

        if (orderNo) {
            matchQuery.code = Number(orderNo);
        }
        if (contact) {
            matchQuery.contact = contact;
        }
        if (name) {
            const [firstName, lastName] = name.split(' ');
            matchQuery.$or = [
                { 'adults.firstname': firstName, 'adults.lastname': lastName },
                { 'children.firstname': firstName, 'children.lastname': lastName }
            ];
        }
        if (email) {
            matchQuery.email = email;
        }
        if (journeyDate) {
            matchQuery['journeyBus.departureDate'] = journeyDate;
        }
        matchQuery.status = 'confirmed';

        const pipeline = [
            {
                $lookup: {
                    from: 'buses',
                    localField: 'journeyBus',
                    foreignField: '_id',
                    as: 'journeyBus'
                }
            },
            {
                $lookup: {
                    from: 'buses',
                    localField: 'returnBus',
                    foreignField: '_id',
                    as: 'returnBus'
                }
            },
            {
                "$unwind": "$journeyBus"
            },
            {
                "$unwind": {
                    path: "$returnBus",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {

                    // ...matchQuery,
                    ...matchQuery,

                    // Match updatedAt by date only if orderDate provided
                    ...(orderDate && {
                        $expr: {
                            $eq: [
                                { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                                orderDate
                            ]
                        }
                    })
                }
            },
        ];
        const result = await Booking.aggregate(pipeline);
        return result;
    } catch (error) {
        console.error("Error filtering passengers:", error);
        throw error;
    }
};

const generateSalesReport = async (filters) => {
    try {
        const { journeyDate, journeyDateFrom, journeyDateTo, orderDate, orderDateFrom, orderDateTo, boardingTime, boardingPoint, droppingPoint } = filters;
        const matchQuery = {};

        // Apply filters based on provided values
        if (journeyDate) {
            matchQuery['journeyBus.departureDate'] = journeyDate;
        }
        if (journeyDateFrom && journeyDateTo) {
            matchQuery['journeyBus.departureDate'] = { $gte: journeyDateFrom, $lte: journeyDateTo };
        }
        if (boardingTime) {
            matchQuery['journeyBus.departureTime'] = boardingTime;
        }
        if (boardingPoint) {
            matchQuery['journeyBus.departurePoint'] = boardingPoint;
        }
        if (droppingPoint) {
            matchQuery['journeyBus.arrivalPoint'] = droppingPoint;
        }
        matchQuery.status = 'confirmed';

        const pipeline = [
            {
                $lookup: {
                    from: 'buses', // Name of the Bus collection
                    localField: 'journeyBus', // Field in the Ticket collection
                    foreignField: '_id', // Field in the Bus collection
                    as: 'journeyBus' // Alias for the joined data
                }
            },
            {
                "$unwind": "$journeyBus"
            },
            {
                $match: {

                    // ...matchQuery,
                    ...matchQuery,

                    // Match updatedAt by date only if orderDate provided
                    ...(orderDate && (!orderDateFrom || !orderDateTo) && {
                        $expr: {
                            $eq: [
                                { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                                orderDate
                            ]
                        }
                    }),
                    ...(orderDateFrom && orderDateTo && {
                        $expr: {
                            $and: [
                                { $gte: [{ $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, orderDateFrom] },
                                { $lte: [{ $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, orderDateTo] }
                            ]
                        }
                    }),
                }
            },
            {
                $group: {
                    _id: 0,
                    totalSales: { $sum: "$subTotal" },
                    totalPassengers: { $sum: { $add: ["$adultTickets", "$childTickets"] } },
                    totalOrders: { $sum: 1 },
                    totalBuses: { $addToSet: "$journeyBus._id" }
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    totalSales: 1,
                    totalPassengers: 1,
                    totalOrders: 1,
                    totalBuses: { $size: "$totalBuses" }
                }
            }
        ];

        const result = await Booking.aggregate(pipeline);
        return result[0]; // Return the aggregation result
    } catch (error) {
        console.error("Error generating sales report:", error);
        throw error;
    }
};

// Example usage:
const filters = {
    // journeyDate: '2024-03-27',
    // journeyDateFrom: '2024-03-27',
    // journeyDateTo: '2024-04-10',
    // orderDate: '2024-04-07',
    // orderDateFrom: '2024-04-07',
    // orderDateTo: '2024-04-08',
    // boardingTime: '23:20',
    // boardingPoint: 'City A',
    // droppingPoint: 'City Y'
};

// generateSalesReport(filters)
//     .then((result) => console.log('Sales Report: ', result))
//     .catch(error => console.error(error));






const CreateAdmin = async ({ name, email, password }) => {
    try {
        let passwordDigest = await authMiddleware.hashPassword(password);
        const userData = await Admin.create({
            name,
            email,
            password: passwordDigest,
        });
        if (userData) {
            console.log('Admin Created!');
        }
    } catch (error) {
        console.log('Error while creating an admin');
    }
};

const adminData = {
    name: 'Admin Test',
    email: 'shoaibfarooka@gmail.com',
    password: 'Welcome5home!'
}
// CreateAdmin(adminData);


module.exports = {
    Login,
    Register,
    GetBusesInfo,
    GetBusPassengerList,
    SearchPassenger,
    CheckInPassenger,
    GetSalesReport,
    GetFilteredPassengers,
    GetBusAccess,
    UpdateBusAccess,
    AddVoucher,
    UpdateVoucher,
    AddExtra,
    UpdateExtra,
    BuyTicket,
    CreateRoute,
    GetRoutes,
    UpdateRoute
};
