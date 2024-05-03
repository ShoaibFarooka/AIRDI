const QRCode = require('qrcode');

const generateQR = async (ticket) => {
    const { code, email, contact } = ticket;
    const url = `${process.env.ADMIN_URL}/ticket-validation?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}&number=${encodeURIComponent(contact)}`;
    const qrCodeImage = await QRCode.toDataURL(url);
    return qrCodeImage;
}

// generateQR({ code: 123456, email: 'shoaibfarooka@gmail.com', contact: '+92-3078434357' });

module.exports = {
    generateQR,
};