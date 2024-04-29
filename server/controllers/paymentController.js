// const Bus = require("../models/busModel");
const Stripe = require("stripe");
const Ticket = require("../models/ticketModel");
const AdminBusDetails = require("../models/busAccessModel");
const Bus = require("../models/busModel");
const nodemailer = require('nodemailer');
const puppeteer = require("puppeteer");
const handlebars = require('handlebars');
const fs = require("fs");
const path = require("path");

//Stripe Payment Integration
const stripe = Stripe(process.env.STRIPE_API_KEY);

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_EMAIL_PASSWORD,
    },
});

// Helper function to generate unique 6-digit code
function generateUniqueCode() {
    const code = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit number
    // Check if the code already exists in the database
    // You can implement this logic according to your database setup
    // If the code already exists, generate a new one recursively until a unique code is found
    return code;
}

const StripeCheckout = async (req, res) => {
    try {
        const { adults, children, email, contact, paymentGateway, journeyBus, returnBus, adultTickets, childTickets, extras, discount, subTotal } = req.body;
        const isAdultsValid = Array.isArray(adults) && adults.every(adult => adult.firstname && adult.lastname);
        const isChildrenValid = Array.isArray(children) && children.every(child => child.firstname && child.lastname);
        if (!isAdultsValid || !isChildrenValid || !email || !paymentGateway || !journeyBus || !(adultTickets || childTickets) || !subTotal) {
            return res.status(400).send('Invalid data');
        }
        const code = generateUniqueCode();
        const status = 'pending';

        // Create the ticket
        const placeholderTicket = new Ticket({
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
        await placeholderTicket.save();
        const sessionExpirationSeconds = 60 * process.env.STRIPE_CHECKOUT_EXPIRY_TIME;
        const expirationTime = Math.floor(Date.now() / 1000) + sessionExpirationSeconds;
        const clientUrl = req.get('origin');
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'AIRDI Bus Ticket',
                            images: ['https://takeairdi.com/wp-content/uploads/2024/01/J3500_night-2-1920x0-c-default.jpg'],

                        },
                        unit_amount: req.body.subTotal * 100,
                        // tax_rates: [StripeTaxRateID],
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${clientUrl}/success?client_reference_id=${encodeURIComponent(placeholderTicket._id.toString())}`,
            cancel_url: `${clientUrl}/`,
            client_reference_id: placeholderTicket._id.toString(),
            expires_at: expirationTime,
        });
        if (session) {
            res.status(200).json({ url: session.url });
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
        throw error;
    }
};

const StripeHooks = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOKS_KEY);
        } catch (err) {
            console.error('Webhook Error:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompletedEvent(event, res);
                break;
            case 'checkout.session.expired':
                await handleCheckoutExpiredEvent(event, res);
                break;
            default:
                res.status(200).send('Unhandled webhooks event.');
        }
    } catch (error) {
        console.error('Error in StripeHooks endpoint:', error);
        res.status(500).send('Internal Server Error');
    }
};

async function handleCheckoutCompletedEvent(event, res) {
    const session = event.data.object;
    const clientReferenceId = session.client_reference_id;
    const updatedTicket = await Ticket.findByIdAndUpdate(clientReferenceId, { status: 'confirmed' })
        .populate('journeyBus')
        .populate('returnBus')
        .lean();

    if (!updatedTicket) {
        return res.status(500).send('Unable to update ticket status.');
    }

    try {
        await updateVoucher(updatedTicket);
        await updateBusSeats(updatedTicket);

        const pdfBuffer = await generatePDF(updatedTicket);
        const htmlContent = await generateHTML(updatedTicket);
        await sendEmailWithPDF(updatedTicket, pdfBuffer, htmlContent);

        res.status(200).send('Ticket status updated!');
    } catch (error) {
        console.error('Error processing checkout completed event:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function handleCheckoutExpiredEvent(event, res) {
    const session = event.data.object;
    const clientReferenceId = session.client_reference_id;
    const updatedTicket = await Ticket.findByIdAndUpdate(clientReferenceId, { status: 'expired' });

    if (!updatedTicket) {
        return res.status(500).send('Unable to update ticket status.');
    }

    res.status(200).send('Ticket status updated!');
}

async function updateVoucher(ticket) {
    if (ticket.discount) {
        const discountId = ticket.discount.id;
        const adminDetails = await AdminBusDetails.findOne({});
        const voucher = adminDetails.vouchers.find(voucher => voucher._id.toString() === discountId);

        if (voucher && voucher?.isOneTimeUse) {
            voucher.isExpired = true;
            await adminDetails.save();
        }
    }
}

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
        from: process.env.SENDER_EMAIL,
        to: ticket.email,
        subject: 'Ticket Booking Confirmation!',
        html: htmlContent,
        attachments: [{
            filename: 'ticket.pdf',
            content: pdfBuffer
        }]
    };
    await transporter.sendMail(mailOptions);
}

module.exports = {
    StripeCheckout,
    StripeHooks
};
