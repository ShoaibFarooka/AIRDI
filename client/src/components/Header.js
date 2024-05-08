import React, { useState } from "react";
import '../styles/Header.css';
import { NavLink } from "react-router-dom";
import Logo from '../assets/logo.png';
import { PiArrowsLeftRightBold } from "react-icons/pi";
import { GiHamburgerMenu } from "react-icons/gi";
import { RxCross2 } from "react-icons/rx";
const Header = () => {
    const [isOpenDropdown, setIsOpenDropdown] = useState(false);

    const toggleDropdown = () => {
        setIsOpenDropdown(!isOpenDropdown);
    }
    return (
        <div className="Header">
            <div className={`nav ${isOpenDropdown ? 'opened-menu' : ''}`}>
                <div className="">
                    <NavLink to='/'>
                        <img className="logo" src={Logo} alt="airdi-logo" />
                    </NavLink>
                </div>
                <div className="nav-links">
                    <div className="link">
                        <NavLink
                            to='/'
                            className={({ isActive }) =>
                                isActive ? "active-link" : ""}
                        >
                            Book
                        </NavLink>
                    </div>
                    <div className="link">
                        <NavLink
                            to='/manage-booking'
                            className={({ isActive }) =>
                                isActive ? "active-link" : ""}
                        >
                            Manage Booking
                        </NavLink>
                    </div>
                    <div className="link">
                        <NavLink
                            to='/faqs'
                            className={({ isActive }) =>
                                isActive ? "active-link" : ""}
                        >
                            FAQs
                        </NavLink>
                    </div>
                    <div className="link">
                        <NavLink
                            to='/help'
                            className={({ isActive }) =>
                                isActive ? "active-link" : ""}

                        >
                            Help
                        </NavLink>
                    </div>
                </div>
                <div className="dropdown">
                    <button className="dropdown-btn">
                        {!isOpenDropdown ?
                            <GiHamburgerMenu size={24} color="white" onClick={toggleDropdown} />
                            :
                            <RxCross2 size={24} color="white" onClick={toggleDropdown} />
                        }
                    </button>
                    {isOpenDropdown &&
                        <div className="dropdown-list">
                            <div className="list-item"><NavLink to='/' onClick={toggleDropdown}>Book</NavLink></div>
                            <div className="list-item"><NavLink to='/manage-booking' onClick={toggleDropdown}>Manage Booking</NavLink></div>
                            <div className="list-item"><NavLink to='/faqs' onClick={toggleDropdown}>FAQs</NavLink></div>
                            <div className="list-item"><NavLink to='/help' onClick={toggleDropdown}>Help</NavLink></div>
                        </div>
                    }
                </div>
            </div>
            <div className="title-wrapper">
                <div className="title">
                    <div className="top-row">
                        <div className="text">NYC</div>
                        <div className="icon"><PiArrowsLeftRightBold /></div>
                        <div className="text">AIRPORT</div>
                    </div>
                    <div className="info-para">&#128293;&#128293;SEATS ARE SELLING FAST, RESERVE YOUR SEAT NOW!!!&#128293;&#128293;</div>
                </div>
            </div>
        </div>
    )
};

export default Header;