const Booking = require("../models/ticketModel");
const AdminBusDetails = require("../models/busAccessModel");
const Bus = require("../models/busModel");
const nodemailer = require('nodemailer');
const puppeteer = require("puppeteer");
const handlebars = require('handlebars');
const fs = require("fs");
const path = require("path");
const helpers = require("../utils/helpers");
const mongoose = require("mongoose");

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

//Helper functions for hbs

// Define the formatDate helper
handlebars.registerHelper('formatDate', function (dateString) {
    const date = new Date(dateString);
    return date.toDateString();
});

// Define the full date formater helper
handlebars.registerHelper('getFullDate', function (dateString) {
    const date = new Date(dateString).toDateString();
    return date;
});

// If Equal helper
handlebars.registerHelper('ifEqual', function (arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

// Define the convertToAMPM helper
handlebars.registerHelper('convertToAMPM', function (time24) {
    var [hours, minutes] = time24.split(':');
    hours = parseInt(hours);
    var period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    hours = String(hours).padStart(2, '0');
    minutes = minutes.padStart(2, '0');
    return hours + ':' + minutes + ' ' + period;
});

// Define the increment helper
handlebars.registerHelper("inc", function (value, options) {
    return parseInt(value) + 1;
});

// Define the children array index count helper 
handlebars.registerHelper('countIndex', function (index, arr) {
    return parseInt(index) + arr.length + 1;
});

const SearchTicket = async (req, res) => {
    try {
        const { code, email, contact } = req.body;
        if (!code || !(email || (contact && contact !== '-'))) {
            return res.status(400).send('Invalid data');
        }
        let ticket;
        if (email) {
            ticket = await Booking.findOne({ code, email, status: 'confirmed' })
                .populate('journeyBus')
                .populate('returnBus')
        }
        else {
            ticket = await Booking.findOne({ code, contact, status: 'confirmed' })
                .populate('journeyBus')
                .populate('returnBus')
        }
        if (ticket) {
            res.status(200).json({ ticket });
        }
        else {
            res.status(404).send('Booking not found');
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

// Function to get the current date and time in New York
const getCurrentDateTimeInNewYork = () => {
    const newYorkTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    return new Date(newYorkTime);
};

// Function to check if current time in New York is 24 hours prior to departure time
const is24HoursPriorToDeparture = (departureDate, departureTime) => {
    const currentTimeInNewYork = getCurrentDateTimeInNewYork();
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    const timeDifference = departureDateTime.getTime() - currentTimeInNewYork.getTime();
    const millisecondsIn24Hours = 24 * 60 * 60 * 1000;

    return timeDifference >= millisecondsIn24Hours;
};

// Generate voucher code for refund
const generateVoucherCode = async (length) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let voucherCode = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        voucherCode += charset[randomIndex];
    }

    try {
        const existingVoucher = await AdminBusDetails.findOne({ 'vouchers.code': voucherCode });
        if (existingVoucher) {
            return generateVoucherCode(length);
        } else {
            return voucherCode;
        }
    } catch (error) {
        throw error;
    }
};

async function updateBusSeats(ticket) {
    const seatsTaken = ticket.adultTickets + ticket.childTickets;
    await Bus.findByIdAndUpdate(ticket.journeyBus._id, { seatsTaken: ticket.journeyBus.seatsTaken - seatsTaken }, { new: true });

    if (ticket.returnBus) {
        await Bus.findByIdAndUpdate(ticket.returnBus._id, { seatsTaken: ticket.returnBus.seatsTaken - seatsTaken }, { new: true });
    }
};

const CancelTicket = async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) {
            return res.status(400).send('Invalid data');
        }
        const ticket = await Booking.findOne({ _id: bookingId })
            .populate('journeyBus')
            .populate('returnBus');
        if (ticket) {
            if (is24HoursPriorToDeparture(ticket.journeyBus.departureDate, ticket.journeyBus.departureTime)) {
                const randomString = await generateVoucherCode(8);
                const adminBusDetails = await AdminBusDetails.findOne();

                if (!adminBusDetails) {
                    return res.status(500).send('Internal Server Error');
                }
                const voucherData = {
                    code: randomString,
                    value: ticket.subTotal,
                    type: 'fix',
                    generatedForBooking: ticket._id,
                    isExpired: false
                }
                adminBusDetails.vouchers.push(voucherData);
                await adminBusDetails.save();
                await Booking.findByIdAndUpdate(bookingId, { status: 'canceled' });
                await updateBusSeats(ticket);

                const startTime = performance.now();
                console.log('Sending email to user....');
                const mailOptions2 = {
                    from: '"Airdi" <' + process.env.SENDER_EMAIL + '>',
                    to: process.env.ADMIN_EMAIL,
                    replyTo: '"Airdi" <' + process.env.SENDER_EMAIL + '>',
                    subject: `Ticket Cancellation For Booking ID #${ticket.code}.`,
                    text: `This voucher code '${randomString}' of $${ticket.subTotal} is generated for cancellation of booking id '${ticket.code}'.`,
                };
                transporter.sendMail(mailOptions2, (error, info) => {
                    if (error) {
                        return res.status(500).send('Error sending email to admin.');
                    }
                    console.log('Email sent to admin:', info.response);
                    const endTime = performance.now();
                    console.log('Time Taken: ', (endTime - startTime) / 1000, ' seconds');
                });

                const startTime2 = performance.now();
                console.log('Sending email to admin....');
                const mailOptions = {
                    from: '"Airdi" <' + process.env.SENDER_EMAIL + '>',
                    to: ticket.email,
                    replyTo: '"Airdi" <' + process.env.SENDER_EMAIL + '>',
                    subject: 'Ticket Cancellation Confirmation!',
                    text: `Here is your voucher code '${randomString}' of $${ticket.subTotal} for cancellation of booking id '${ticket.code}'.`,
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return res.status(500).send('Error sending email to user.');
                    }
                    console.log('Email sent to user:', info.response);
                    const endTime2 = performance.now();
                    console.log('Time Taken: ', (endTime2 - startTime2) / 1000, ' seconds');
                });
                res.status(200).json({ voucherCode: randomString });
            }
            else {
                res.status(400).send('Invalid ticket for cancellation');
            }
        }
        else {
            res.status(404).send('Booking not found');
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const DownloadTicket = async (req, res) => {
    console.log('Request to download PDF...');
    try {
        const startTime = performance.now();

        const { bookingId } = req.params;
        if (!bookingId) {
            return res.status(400).send('Invalid data');
        }
        const ticket = await Booking.findById(bookingId)
            .populate('journeyBus')
            .populate('returnBus')
            .lean();
        if (!ticket) {
            return res.status(400).send('Booking not found');
        }

        const MongoTime = performance.now();

        const templatePath = path.join(__dirname, '../template/pdfTemplate.hbs');
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateContent);
        const qrCode = await helpers.generateQR(ticket);
        const html = template({ ticket, qrCode });

        const beforeLaunchTime = performance.now();

        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: true, // Run in headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Disable sandboxing
            ignoreHTTPSErrors: true,
            dumpio: false
        });

        const afterLaunchTime = performance.now();

        const page = await browser.newPage();
        await page.setContent(html);

        const beforePdfGenerationTime = performance.now();

        // Generate PDF
        // const outputPath = path.join(__dirname, 'ticket.pdf');
        // await page.pdf({ path: outputPath, format: 'A4' });
        const pdfBuffer = await page.pdf({ format: 'A4' });

        const afterPdfGenerationTime = performance.now();

        browser.close();
        const endTime = performance.now();

        // console.log('Time taken to fetch data from database:', (MongoTime - startTime) / 1000, 'seconds');
        // console.log('Time taken to fetch data from template:', (beforeLaunchTime - MongoTime) / 1000, 'seconds');
        // console.log('Time taken to launch Puppeteer:', (afterLaunchTime - beforeLaunchTime) / 1000, 'seconds');
        // console.log('Time taken to set Content:', (beforePdfGenerationTime - afterLaunchTime) / 1000, 'seconds');
        // console.log('Time taken to generate PDF:', (afterPdfGenerationTime - beforePdfGenerationTime) / 1000, 'seconds');
        // console.log('Time taken to close Puppeteer:', (endTime - afterPdfGenerationTime) / 1000, 'seconds');
        console.log('Total time taken:', (endTime - startTime) / 1000, 'seconds');



        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.code}.pdf`);
        res.status(200).send(pdfBuffer);
        // res.status(200).send('OK');

        console.log('PDF generated successfully!');
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
}

const VerifyTicket = async (req, res) => {
    try {
        const { bookingId } = req.params;
        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).send('Invalid booking ID');
        }
        const ticket = await Booking.findOne({ _id: bookingId })
            .populate('journeyBus')
            .populate('returnBus');
        if (ticket) {
            res.status(200).json({ ticket });
        }
        else {
            res.status(404).send('Booking not found');
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

// DownloadTicket();

module.exports = {
    SearchTicket,
    CancelTicket,
    DownloadTicket,
    VerifyTicket
};
