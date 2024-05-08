import React, { useState } from "react";
import './index.css';
import { Link } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import faqImg from '../../assets/faq-svg.png';
import routesImg from '../../assets/routes-svg.png';
import feedbackImg from '../../assets/feedback-svg.png';
import contactImg from '../../assets/contact-svg.png';

const Help = () => {
    const [hoveredElement, setHoveredElement] = useState(null);

    const handleRemoveHover = (e) => {
        if (hoveredElement !== null) {
            setHoveredElement(null);
        }
    };

    return (
        <div className="help">
            <div className="title">Help & Info</div>
            <div className="sub-title">Hi there, what can we help you with?</div>
            <div className="cards-container">
                <div className="card" onMouseEnter={() => setHoveredElement("card-1")} onMouseLeave={handleRemoveHover}>
                    <div className="card-content">
                        <img src={faqImg} className="card-image" alt="card-image" />
                        <div className={`icon-row ${hoveredElement === 'card-1' ? 'bg-highlight' : ''}`}>
                            <div>
                                <div className="card-title">FAQs</div>
                                <div className="card-description">Frequently asked questions</div>
                            </div>
                            <IoIosArrowForward className="icon" />
                        </div>
                    </div>
                </div>
                <div className="card" onMouseEnter={() => setHoveredElement("card-2")} onMouseLeave={handleRemoveHover}>
                    <div className="card-content" >
                        <img src={routesImg} className="card-image" alt="card-image" />
                        <div className={`icon-row ${hoveredElement === 'card-2' ? 'bg-highlight' : ''}`}>
                            <div>
                                <div className="card-title">Routes</div>
                                <div className="card-description">All available routes to travel</div>
                            </div>
                            <IoIosArrowForward className="icon" />
                        </div>
                    </div>
                </div>
                <div className="card" onMouseEnter={() => setHoveredElement("card-3")} onMouseLeave={handleRemoveHover}>
                    <div className="card-content">
                        <img src={feedbackImg} className="card-image" alt="card-image" />
                        <div className={`icon-row ${hoveredElement === 'card-3' ? 'bg-highlight' : ''}`}>
                            <div>
                                <div className="card-title">Feedback</div>
                                <div className="card-description">Any complaint or suggestion for improvement</div>
                            </div>
                            <IoIosArrowForward className="icon" />
                        </div>
                    </div>
                </div>
                <div className="card" onMouseEnter={() => setHoveredElement("card-4")} onMouseLeave={handleRemoveHover}>
                    <div className="card-content">
                        <img src={contactImg} className="card-image" alt="card-image" />
                        <div className={`icon-row ${hoveredElement === 'card-4' ? 'bg-highlight' : ''}`}>
                            <div>
                                <div className="card-title">Contact</div>
                                <div className="card-description">Anything else...</div>
                            </div>
                            <IoIosArrowForward className="icon" />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
};

export default Help;