import React, { useState } from 'react';
import '../styles/TicketsCounter.css';
import { message } from 'antd';
import { AiOutlineMinus } from "react-icons/ai";
import { AiOutlinePlus } from "react-icons/ai";

const TicketsCounter = ({ journeyBus, returnBus, adultTickets, setAdultTickets, childTickets, setChildTickets }) => {

    const handleChange = (ticketType, changeType) => {
        if (ticketType === 'adult') {
            if (changeType === 'inc' && seatsAvailable(adultTickets + 1, childTickets)) {
                setAdultTickets(prevState => prevState + 1)
            }
            else if (changeType === 'dec') {
                setAdultTickets(prevState => {
                    if (prevState === 0) {
                        return prevState;
                    }
                    return prevState - 1;
                });
            }
        }
        else if (ticketType === 'child') {
            if (changeType === 'inc' && seatsAvailable(adultTickets, childTickets + 1)) {
                setChildTickets(prevState => prevState + 1)
            }
            else if (changeType === 'dec') {
                setChildTickets(prevState => {
                    if (prevState === 0) {
                        return prevState;
                    }
                    return prevState - 1;
                });
            }
        }
    };

    const seatsAvailable = (adults, children) => {
        const selectedSeatsCount = adults + children;
        const seatsAvailable = journeyBus.totalSeats - journeyBus.seatsTaken;
        let seatsAvailableForReturn;
        if (returnBus) {
            seatsAvailableForReturn = returnBus.totalSeats - returnBus.seatsTaken;
        }
        if (selectedSeatsCount > seatsAvailable) {
            message.error('Not enough seats available in the outgoing bus.');
            return false;
        }
        else if (returnBus && selectedSeatsCount > seatsAvailableForReturn) {
            message.error('Not enough seats available in the return bus.');
            return false;
        }
        return true;
    }

    return (
        <div className="tickets-counter">
            <div className="title">Confirm Total Seats</div>
            <div className='flex'>
                <div className='label'>Adults</div>
                <div className='quantity-container'>
                    <AiOutlineMinus size={22} className="q-btn" onClick={() => handleChange('adult', 'dec')} />
                    <div className='quantity'>{adultTickets}</div>
                    <AiOutlinePlus size={22} className="q-btn" onClick={() => handleChange('adult', 'inc')} />
                </div>
            </div>
            {/* <div className='seperator'></div>
            <div className='flex'>
                <div className='label'>Child</div>
                <div className='quantity-container'>
                    <AiOutlineMinus size={22} className="q-btn" onClick={() => handleChange('child', 'dec')} />
                    <div className='quantity'>{childTickets}</div>
                    <AiOutlinePlus size={22} className="q-btn" onClick={() => handleChange('child', 'inc')} />
                </div>
            </div> */}
        </div>
    )
};

export default TicketsCounter;