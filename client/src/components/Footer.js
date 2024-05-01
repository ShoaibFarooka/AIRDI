import React from "react";
import '../styles/Footer.css';

const Footer = () => {
    return (
        <div className="Footer">
            <div>New York City, USA | Phone: 800-123-456 | Email: support@airdibus.com</div>
            <div>Copyright © {new Date().getFullYear()} Airdi: Coach Bus from NYC ⇄ Airport</div>
        </div>
    )
};

export default Footer;