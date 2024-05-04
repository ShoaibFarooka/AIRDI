const Bus = require("../models/busModel");
const AdminBusDetails = require("../models/busAccessModel");
const moment = require("moment");

const verifyAdvanceBooking = (journeyDate, maximumAllowedDays) => {
    const currentDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const [month, day, year] = currentDate.split(',')[0].split('/');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const maximumDepartureDate = new Date(formattedDate);
    maximumDepartureDate.setDate(maximumDepartureDate.getDate() + maximumAllowedDays);
    if (maximumDepartureDate.setHours(0, 0, 0, 0) >= new Date(journeyDate).setHours(0, 0, 0, 0)) {
        return true;
    }
    else {
        return false;
    }
}
const FindBus = async (req, res) => {
    try {
        const { from, to, journeyDate, returnDate } = req.body;
        if (!from || !to || !journeyDate) {
            return res.status(400).send('Invalid data');
        }
        const data = await AdminBusDetails.findOne();
        const maximumAllowedDays = data.advanceBooking;
        if (!verifyAdvanceBooking(journeyDate, maximumAllowedDays)) {
            return res.status(403).send('Booking not opened yet!');
        }
        const outwardBuses = await Bus.find({
            departurePoint: from,
            arrivalPoint: to,
            departureDate: journeyDate,
            bookingOpen: true
        }).sort({ departureTime: 1 });

        if (!outwardBuses || outwardBuses.length <= 0) {
            return res.status(404).send('No buses available for the selected input, please revise input and try again.');
        }
        let returnBuses = [];
        if (returnDate) {
            returnBuses = await Bus.find({
                departurePoint: to,
                arrivalPoint: from,
                departureDate: returnDate,
                bookingOpen: true
            }).sort({ departureTime: 1 });
            if (!returnBuses || returnBuses.length <= 0) {
                return res.status(404).send('Return bus not found!');
            }
        }
        res.status(200).json({ outwardBuses, returnBuses });
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const GetAllDeparturePoints = async (req, res) => {
    try {
        const departurePoints = await Bus.distinct("departurePoint");
        if (departurePoints && departurePoints.length > 0) {
            res.status(200).json({ departurePoints });
        }
        else {
            res.status(404).send('Departure points not found!');
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const GetAllArrivalPoints = async (req, res) => {
    try {
        const arrivalPoints = await Bus.distinct("arrivalPoint");
        if (arrivalPoints && arrivalPoints.length > 0) {
            res.status(200).json({ arrivalPoints });
        }
        else {
            res.status(404).send('Arrival points not found!');
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const GetDepartureAndArrivalPoints = async (req, res) => {
    try {
        const points = await Bus.aggregate([
            {
                $group: {
                    _id: "$departurePoint",
                    arrivalPoints: { $addToSet: "$arrivalPoint" }
                }
            },
            {
                $project: {
                    departurePoint: "$_id",
                    arrivalPoints: 1,
                    _id: 0
                }
            }
        ]);

        if (points && points.length > 0) {
            res.status(200).json({ points });
        } else {
            res.status(404).send('Departure points not found!');
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const GetThresholdTime = async (req, res) => {
    try {
        const data = await AdminBusDetails.findOne();
        if (!data) {
            res.status(404).send('Data not found!');
        }
        res.status(200).json({ thresholdTime: data.bufferTime })
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const GetBusAccess = async (req, res) => {
    try {
        const data = await AdminBusDetails.findOne({}, { vouchers: 0, bufferTime: 0, advanceBooking: 0 });
        if (data) {
            data.extras = data.extras.filter(extra => extra.isAvailable === true);
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

const VerifyVoucher = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).send('Invalid data');
        }
        const data = await AdminBusDetails.findOne();
        if (!data) {
            return res.status(404).send('Data not found!');
        }
        const voucher = data.vouchers.find(voucher => voucher.code === code);
        if (voucher) {
            res.status(200).json({ voucher });
        }
        else {
            res.status(404).send('Voucher not found!');
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};








// Utility function to add bus-related details
async function addAdminBusDetails(serviceFee, bufferTime, advanceBooking, vouchers, extras) {
    try {
        // Create a new instance of AdminBusDetails
        const adminBusDetails = new AdminBusDetails({
            serviceFee,
            bufferTime,
            advanceBooking,
            vouchers,
            extras
        });

        // Save the new admin bus details to the database
        const savedDetails = await adminBusDetails.save();

        console.log('Admin bus details added successfully');
        return savedDetails;
    } catch (error) {
        console.error('Error adding admin bus details:', error);
        throw error;
    }
}

// Example usage:
const serviceFee = 0; // Example service fee
const bufferTime = 15;
const advanceBooking = 30;
const vouchers = [
    { code: 'VOUCHER1', value: 10, type: 'fix' },
    { code: 'VOUCHER2', value: 20, type: 'percentage' }
]; // Example vouchers
const extras = [
    { name: 'Extra Lugage', price: 70 },
    { name: 'Taxi', price: 120 },
    { name: 'Snacks', price: 5 }

]; // Example extras

// addAdminBusDetails(serviceFee, bufferTime, advanceBooking, vouchers, extras);






// Function to generate random date within a range
function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Seeder function to add buses with dates from now to future
async function seedBuses() {
    // await Bus.deleteMany();
    // console.log('Old Buses Deleted');

    const now = new Date();
    const futureDate = moment().add(3, 'days').toDate(); // Three days from now
    const departurePoints = ["City A", "City B", "City C"];
    const arrivalPoints = ["City X", "City Y", "City Z"];
    // const departurePoints = ["City X", "City Y", "City Z"];
    // const arrivalPoints = ["City A", "City B", "City C"];

    console.log('Seeding....');
    for (let i = 0; i < 100; i++) {
        const departurePoint = departurePoints[Math.floor(Math.random() * departurePoints.length)];
        const arrivalPoint = arrivalPoints[Math.floor(Math.random() * arrivalPoints.length)];
        const departureDateTime = getRandomDate(now, futureDate);
        const arrivalDateTime = moment(departureDateTime).add(Math.floor(Math.random() * 12) + 1, 'hours').toDate(); // Random arrival time after departure
        const adultTicketCost = Math.floor(Math.random() * 100) + 50; // Random cost between 50 and 150
        const childTicketCost = Math.floor(adultTicketCost * 0.7); // 70% of adult ticket cost
        // const totalSeats = Math.floor(Math.random() * 40) + 20; // Random total seats between 20 and 59

        // Format dates to YYYY-MM-DD
        const formattedDepartureDate = moment(departureDateTime).format("YYYY-MM-DD");
        const formattedArrivalDate = moment(arrivalDateTime).format("YYYY-MM-DD");

        const bus = new Bus({
            departurePoint,
            arrivalPoint,
            departureDate: formattedDepartureDate,
            arrivalDate: formattedArrivalDate,
            departureTime: moment(departureDateTime).format("HH:mm"),
            arrivalTime: moment(arrivalDateTime).format("HH:mm"),
            adultTicketCost,
            childTicketCost,
            totalSeats: 50,
        });
        await bus.save();
    }

    console.log("Buses seeded successfully!");
}

// seedBuses();


module.exports = {
    FindBus,
    GetAllDeparturePoints,
    GetAllArrivalPoints,
    GetDepartureAndArrivalPoints,
    GetBusAccess,
    VerifyVoucher,
    GetThresholdTime
};
