import React, { useState, useEffect } from 'react';
import '../styles/SearchResult.css';
import { MdArrowForwardIos } from "react-icons/md";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaBusAlt } from 'react-icons/fa';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { setBusData } from "../redux/busSlice";

const SerachResult = ({ outwardBuses, returnBuses, handleParentChangeDate, resultRef, setError, thresholdTime }) => {
    const [filteredOutwardBuses, setFilteredOutwardBuses] = useState([]);
    const [filteredReturnBuses, setFilteredReturnBuses] = useState([]);
    const [view, setView] = useState(1);
    const [journeyBus, setJourneyBus] = useState(null);
    const [returnBus, setReturnBus] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (outwardBuses && outwardBuses.length > 0) {
            const currentDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
            const filteredBuses = outwardBuses.filter(bus => {
                const [hours, minutes] = bus.departureTime.split(':').map(Number);
                const departureDate = new Date(bus.departureDate);
                departureDate.setHours(hours, minutes, 0, 0);

                // Calculate the difference in milliseconds between the current time and the departure time
                const timeDifference = departureDate - new Date(currentDate);
                // Filter buses whose departure time has not passed and is after the threshold time
                return timeDifference > thresholdTime * 60 * 1000;
            });
            // console.log('Filtered Outward Buses: ', filteredBuses);
            if (filteredBuses.length === 0) {
                setError('All buses are already gone for today.');
            }
            setFilteredOutwardBuses(filteredBuses);
        }
    }, [outwardBuses, thresholdTime]);

    useEffect(() => {
        if (returnBuses && returnBuses.length > 0 && journeyBus) {
            const [arrivalHours, arrivalMinutes] = journeyBus.arrivalTime.split(':').map(Number);
            const arrivalDate = new Date(journeyBus.arrivalDate);
            arrivalDate.setHours(arrivalHours, arrivalMinutes, 0, 0);
            const filteredBuses = returnBuses.filter(bus => {
                const [hours, minutes] = bus.departureTime.split(':').map(Number);
                const departureDate = new Date(bus.departureDate);
                departureDate.setHours(hours, minutes, 0, 0);

                // Calculate the difference in milliseconds between the current time and the departure time
                const timeDifference = departureDate - arrivalDate;
                // Filter buses whose departure time has not passed and is after the threshold time
                return timeDifference > thresholdTime * 60 * 1000;
            });
            // console.log('Filtered Return Buses: ', filteredBuses);
            if (filteredBuses.length === 0) {
                setError('All return buses will be already gone at the arrival time.');
            }
            setFilteredReturnBuses(filteredBuses);
        }
    }, [returnBuses, journeyBus, thresholdTime]);

    const calculatePrice = (price, departureDate, departureTime) => {
        const departureDateTimeString = `${departureDate}T${departureTime}`;
        const departureDateTime = new Date(departureDateTimeString);
        const currentNYTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        const timeDifference = departureDateTime.getTime() - new Date(currentNYTime).getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        let adjustedPrice;
        if (daysDifference >= 21) {
            adjustedPrice = 0;
        } else if (daysDifference >= 2) {
            adjustedPrice = 5;
        } else {
            adjustedPrice = 10;
        }
        return price + adjustedPrice;
    };

    const convertToAMPM = (time24) => {
        var [hours, minutes] = time24.split(':');
        hours = parseInt(hours);
        var period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        minutes = minutes.padStart(2, '0');
        return hours + ':' + minutes + ' ' + period;
    };

    function getDuration(departureTime, arrivalTime) {
        var [depHours, depMinutes] = departureTime.split(':').map(Number);
        var [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
        var depTotalMinutes = depHours * 60 + depMinutes;
        var arrTotalMinutes = arrHours * 60 + arrMinutes;
        var durationMinutes;
        if (arrTotalMinutes < depTotalMinutes) {
            durationMinutes = 1440 + arrTotalMinutes - depTotalMinutes;
        }
        else {
            durationMinutes = arrTotalMinutes - depTotalMinutes;
        }
        var durationHours = Math.floor(durationMinutes / 60);
        var durationMinutesRemainder = durationMinutes % 60;
        var formattedDuration = ('0' + durationHours).slice(-2) + ':' + ('0' + durationMinutesRemainder).slice(-2) + ' hrs';
        return formattedDuration;
    };

    // const getFormattedDate = (date, type) => {
    //     let currentDate;
    //     if (type === 'outward') {
    //         currentDate = new Date(filteredOutwardBuses[0].departureDate);
    //     }
    //     else if (type === 'return') {
    //         currentDate = new Date(filteredReturnBuses[0].departureDate);
    //     }
    //     else {
    //         return;
    //     }
    //     if (date === 'current') {
    //         return currentDate.toLocaleDateString();
    //     } else if (date === 'previous') {
    //         const previousDate = new Date(currentDate);
    //         previousDate.setDate(previousDate.getDate() - 1);
    //         return previousDate.toLocaleDateString();
    //     } else if (date === 'next') {
    //         const nextDate = new Date(currentDate);
    //         nextDate.setDate(nextDate.getDate() + 1);
    //         return nextDate.toLocaleDateString();
    //     } else {
    //         return;
    //     }
    // };

    const getFormattedDate = (date, type) => {
        let currentDate;
        if (type === 'outward') {
            const [year, month, day] = filteredOutwardBuses[0].departureDate.split('-');
            currentDate = new Date(year, month - 1, day);
        } else if (type === 'return') {
            const [year, month, day] = filteredReturnBuses[0].departureDate.split('-');
            currentDate = new Date(year, month - 1, day);
        } else {
            return;
        }
        if (date === 'current') {
            console.log('Current Date: ', currentDate);
            return currentDate.toLocaleDateString();
        } else if (date === 'previous') {
            const previousDate = currentDate;
            previousDate.setDate(previousDate.getDate() - 1);
            console.log('Prev Date: ', previousDate);
            return previousDate.toLocaleDateString();
        } else if (date === 'next') {
            const nextDate = currentDate;
            nextDate.setDate(nextDate.getDate() + 1);
            console.log('Next Date: ', nextDate);
            return nextDate.toLocaleDateString();
        } else {
            return;
        }
    };

    const isDatePassed = (date) => {
        const NYDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        const currentDate = new Date(NYDate);
        currentDate.setHours(0, 0, 0, 0);
        const dateToCheck = new Date(date);
        dateToCheck.setHours(0, 0, 0, 0);
        return dateToCheck < currentDate;
    };

    const isDateBeforeJourneyDate = (returnDate) => {
        const dateToCheck = new Date(returnDate).setHours(0, 0, 0, 0);
        const journeyDate = new Date(journeyBus.departureDate).setHours(0, 0, 0, 0);
        return dateToCheck < journeyDate;
    };

    const handleChangeDate = (e, date, type) => {
        if (e.target.className.split(' ').includes('disabled-item')) {
            return;
        }
        handleParentChangeDate(date, type);
    };

    const handleView1Continue = async (bus) => {
        setJourneyBus(bus);
        if (returnBuses.length > 0) {
            setView(2);
        }
        else {
            const newBusData = {
                journeyBus: bus,
                returnBus
            };
            dispatch(setBusData(newBusData));
            navigate('/checkout');
        }
    };

    const handleView2Continue = async (bus) => {
        setReturnBus(bus);
        const newBusData = {
            journeyBus,
            returnBus: bus
        };
        dispatch(setBusData(newBusData));
        navigate('/checkout');
    };


    return (
        <div className="SearchResult" ref={resultRef}>
            <div className="content">
                {view === 1 ?
                    <>
                        {(filteredOutwardBuses && filteredOutwardBuses.length > 0) &&
                            <div className="selected-date">
                                <div
                                    className={`item ${isDatePassed(getFormattedDate('previous', 'outward')) ? 'disabled-item' : 'non-disabled-item'}`}
                                    onClick={(e) => handleChangeDate(e, 'previous', 'outward')}
                                >
                                    {getFormattedDate('previous', 'outward')}
                                </div>
                                <div className="item active-item">{getFormattedDate('current', 'outward')}</div>
                                <div
                                    className="item non-disabled-item"
                                    onClick={(e) => handleChangeDate(e, 'next', 'outward')}
                                >
                                    {getFormattedDate('next', 'outward')}
                                </div>
                            </div>
                        }
                    </>
                    :
                    <>
                        {(filteredReturnBuses && filteredReturnBuses.length > 0) &&
                            <div className="selected-date">
                                <div
                                    className={`item ${isDateBeforeJourneyDate(getFormattedDate('previous', 'return')) ? 'disabled-item' : 'non-disabled-item'}`}
                                    onClick={(e) => handleChangeDate(e, 'previous', 'return')}
                                >
                                    {getFormattedDate('previous', 'return')}
                                </div>
                                <div className="item active-item">{getFormattedDate('current', 'return')}</div>
                                <div
                                    className="item non-disabled-item"
                                    onClick={(e) => handleChangeDate(e, 'next', 'return')}
                                >
                                    {getFormattedDate('next', 'return')}
                                </div>
                            </div>
                        }
                    </>
                }

                {returnBuses.length > 0 &&
                    <div className="title">{view === 1 ? 'Outbound Trip' : 'Return Trip'}</div>
                }
                {(view === 1 && filteredOutwardBuses.length !== 0) &&
                    <div className="result-count">{filteredOutwardBuses.length} results</div>
                }
                {(view === 2 && filteredReturnBuses.length !== 0) &&
                    <div className="result-count">{filteredReturnBuses.length} results</div>
                }
                {view === 1 ?
                    <div className="buses">
                        {filteredOutwardBuses.map((bus, index) => (
                            <div key={index} className="bus">
                                <div className="bus-type">Airdi</div>
                                <div className="timeline">
                                    <div className="timeline-item">
                                        <div className="time">{convertToAMPM(bus.departureTime)}</div>
                                        <div className="city">{bus.departurePoint}</div>
                                    </div>
                                    <div className="timeline-item duration-timeline-item">
                                        <div className="travel-time">{getDuration(bus.departureTime, bus.arrivalTime)}</div>
                                    </div>
                                    <div className="timeline-item">
                                        <div className="time">{convertToAMPM(bus.arrivalTime)}</div>
                                        <div className="city">{bus.arrivalPoint}</div>
                                    </div>
                                    <div className="timeline-item">
                                        <div className="price">${calculatePrice(bus.adultTicketCost, bus.departureDate, bus.departureTime)}</div>
                                        <div style={{ fontSize: '14px' }}>per person</div>
                                    </div>
                                </div>
                                <div className="info">
                                    <div className="info-details">
                                        <div className="item border-item">
                                            <div className="nested-item">
                                                <FaBusAlt size={20} />
                                                <div>Bus</div>
                                            </div>
                                            <div className="seperator"></div>
                                            <div>Direct</div>
                                        </div>
                                        {bus.seatsTaken >= 10 &&
                                            <div className="item">
                                                <FaPeopleGroup size={22} />
                                                <div>Almost Full</div>
                                            </div>
                                        }
                                    </div>
                                    <button className="btn" onClick={() => handleView1Continue(bus)}>
                                        <div>Continue </div>
                                        <MdArrowForwardIos size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    :
                    <div className="buses">
                        {filteredReturnBuses.map((bus, index) => (
                            <div key={index} className="bus">
                                <div className="bus-type">Airdi</div>
                                <div className="timeline">
                                    <div className="timeline-item">
                                        <div className="time">{convertToAMPM(bus.departureTime)}</div>
                                        <div className="city">{bus.departurePoint}</div>
                                    </div>
                                    <div className="timeline-item">
                                        <div className="travel-time">{getDuration(bus.departureTime, bus.arrivalTime)}</div>
                                    </div>
                                    <div className="timeline-item">
                                        <div className="time">{convertToAMPM(bus.arrivalTime)}</div>
                                        <div className="city">{bus.arrivalPoint}</div>
                                    </div>
                                    <div className="timeline-item">
                                        <div className="price">${calculatePrice(bus.adultTicketCost, bus.departureDate, bus.departureTime)}</div>
                                        <div style={{ fontSize: '14px' }}>per person</div>
                                    </div>
                                </div>
                                <div className="info">
                                    <div className="info-details">
                                        <div className="item border-item">
                                            <div className="nested-item">
                                                <FaBusAlt size={20} />
                                                <div>Bus</div>
                                            </div>
                                            <div className="seperator"></div>
                                            <div>Direct</div>
                                        </div>
                                        {bus.seatsTaken >= 10 &&
                                            <div className="item">
                                                <FaPeopleGroup size={22} />
                                                <div>Almost Full</div>
                                            </div>
                                        }
                                    </div>
                                    <button className="btn" onClick={() => handleView2Continue(bus)}>
                                        <div>Continue </div>
                                        <MdArrowForwardIos size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </div>
        </div>
    )
};

export default SerachResult;