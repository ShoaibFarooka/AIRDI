import React, { useState, useEffect } from 'react';
import '../styles/BookingInfo.css';
import { message } from 'antd';
import { useDispatch } from 'react-redux';
import { HideLoading, ShowLoading } from '../redux/loaderSlice';
import { FaBusAlt, FaCalendarAlt, FaCalendarCheck, FaLongArrowAltRight, FaRegClock } from 'react-icons/fa';
import { CgTimelapse } from "react-icons/cg";
import FileSaver from 'file-saver';
import bookingService from '../services/bookingService';

const BookingInfo = ({ ticket, ticketRef, cancellationVoucherCode, setCancellationVoucherCode }) => {
    const dispatch = useDispatch();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        };
        return date.toLocaleDateString('en-US', options).replace(',', '');
    };

    const convertToAMPM = (time24) => {
        var [hours, minutes] = time24.split(':');
        hours = parseInt(hours);
        var period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        hours = String(hours).padStart(2, '0');
        minutes = minutes.padStart(2, '0');
        return hours + ':' + minutes + ' ' + period;
    }

    // Function to get the current date and time in New York
    const getCurrentDateTimeInNewYork = () => {
        const newYorkTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        return new Date(newYorkTime);
    };

    // Function to check if current time in New York is 24 hours prior to departure time
    const is24HoursPriorToDeparture = () => {
        const departureDate = ticket.journeyBus.departureDate;
        const departureTime = ticket.journeyBus.departureTime;

        const currentTimeInNewYork = getCurrentDateTimeInNewYork();
        const departureDateTime = new Date(`${departureDate}T${departureTime}`);
        const timeDifference = departureDateTime.getTime() - currentTimeInNewYork.getTime();
        const millisecondsIn24Hours = 24 * 60 * 60 * 1000;

        return timeDifference >= millisecondsIn24Hours;
    };

    const handleCancelBooking = async () => {
        dispatch(ShowLoading());
        try {
            const response = await bookingService.cancelBooking({ bookingId: ticket._id });
            if (response.voucherCode) {
                setCancellationVoucherCode(response.voucherCode);
            }
            console.log('Response ->', response);
        } catch (error) {
            message.error(error.response.data);
        }
        dispatch(HideLoading());
    }

    const handleDownloadBooking = async () => {
        dispatch(ShowLoading());
        try {
            console.log("Downloading PDF ...");
            const response = await bookingService.downloadBooking(ticket._id);
            console.log('Buffer->', response.data);
            FileSaver.saveAs(
                new Blob([response.data], { type: 'application/pdf' }),
                `ticket-${ticket.code}.pdf`
            );
        } catch (error) {
            if (error.response && error.response.data) {
                message.error(error.response.data);
            }
        }
        dispatch(HideLoading());
    }

    return (
        <>
            {cancellationVoucherCode ?
                <div className="voucher-confirmation">
                    <h2>Booking Cancellation Voucher</h2>
                    <p>Your booking has been successfully cancelled.</p>
                    <p>A confirmation email has been sent to your booking email.</p>
                    <p>You can use the following voucher code for redemption:</p>
                    <div className="voucher-code">{cancellationVoucherCode}</div>
                    <p>
                        Please keep this voucher code safe. You can use it during your next
                        booking for availing discounts.
                    </p>
                </div>
                :
                <div className="ticket-container" ref={ticketRef}>
                    <div className='header'>Ticket Information</div>
                    <div className="ticket-details">
                        <div className="detail">
                            <span className="label">Booking Number:</span>
                            <span className="value">{ticket.code}</span>
                        </div>
                        <div className='sub-heading'>Passengers Info</div>
                        <div className="detail">
                            <span className="label">Email:</span>
                            <span className="value">{ticket.email}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Contact:</span>
                            <span className="value">{ticket.contact}</span>
                        </div>
                        {ticket.adults.map((adult, index) => (
                            <div className="detail" key={index}>
                                <span className="label">Passenger {index + 1}(Adult):</span>
                                <span className="value">{adult.firstname + ' ' + adult.lastname}</span>
                            </div>
                        ))}
                        {ticket.children?.map((child, index) => (
                            <div className="detail" key={index}>
                                <span className="label">Passenger {ticket.adults.length + index + 1}(Child):</span>
                                <span className="value">{child.firstname + ' ' + child.lastname}</span>
                            </div>
                        ))}
                        <div className='sub-heading'>Trip Details</div>
                        <div className='cards-container'>
                            <div className='schedule-card'>
                                <div className='flex-schedule-row'>
                                    <div className='flex-col'>
                                        <div>SOURCE</div>
                                        <div><b>{ticket.journeyBus.departurePoint}</b></div>
                                    </div>
                                    <FaLongArrowAltRight size={22} />
                                    <div className='flex-col'>
                                        <div>DESTINATION</div>
                                        <div><b>{ticket.journeyBus.arrivalPoint}</b></div>
                                    </div>
                                </div>
                                <div className='bus-type-row'>
                                    <FaBusAlt size={18} />
                                    <div>AIRDI Bus</div>
                                </div>
                                <div className='bus-row'>
                                    <div className='icon-row'>
                                        <FaCalendarAlt size={18} />
                                        {ticket.journeyBus.departureDate}
                                    </div>
                                    <div className='icon-row'>
                                        <FaCalendarCheck size={18} />
                                        {ticket.journeyBus.arrivalDate}
                                    </div>
                                </div>
                                <div className='bus-row'>
                                    <div className='icon-row'>
                                        <FaRegClock size={18} />
                                        {convertToAMPM(ticket.journeyBus.departureTime)}
                                    </div>
                                    <div className='icon-row'>
                                        <CgTimelapse size={18} />
                                        {convertToAMPM(ticket.journeyBus.arrivalTime)}
                                    </div>
                                </div>
                            </div>
                            {ticket.returnBus &&
                                <div className='schedule-card'>
                                    <div className='flex-schedule-row'>
                                        <div className='flex-col'>
                                            <div>SOURCE</div>
                                            <div><b>{ticket.returnBus.departurePoint}</b></div>
                                        </div>
                                        <FaLongArrowAltRight size={22} />
                                        <div className='flex-col'>
                                            <div>DESTINATION</div>
                                            <div><b>{ticket.returnBus.arrivalPoint}</b></div>
                                        </div>
                                    </div>
                                    <div className='bus-type-row'>
                                        <FaBusAlt size={18} />
                                        <div>AIRDI Bus</div>
                                    </div>
                                    <div className='bus-row'>
                                        <div className='icon-row'>
                                            <FaCalendarAlt size={18} />
                                            {ticket.returnBus.departureDate}
                                        </div>
                                        <div className='icon-row'>
                                            <FaCalendarCheck size={18} />
                                            {ticket.returnBus.arrivalDate}
                                        </div>
                                    </div>
                                    <div className='bus-row'>
                                        <div className='icon-row'>
                                            <FaRegClock size={18} />
                                            {convertToAMPM(ticket.returnBus.departureTime)}
                                        </div>
                                        <div className='icon-row'>
                                            <CgTimelapse size={18} />
                                            {convertToAMPM(ticket.returnBus.arrivalTime)}
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                        {ticket.extras &&
                            <>
                                <div className='sub-heading'>Extras</div>
                                {ticket.extras.map((extra, index) => (
                                    <div className="detail" key={index}>
                                        <span className="label">{extra.name}</span>
                                        <span className="value">${extra.price}</span>
                                    </div>
                                ))}
                            </>
                        }
                        {ticket.discount &&
                            <>
                                <div className='sub-heading'>Voucher Details</div>
                                <div className="detail">
                                    <span className="label">Discount:</span>
                                    <span className="value">{ticket.discount.type === 'fix' ? `$${ticket.discount.value}` : `${ticket.discount.value}%`}</span>
                                </div>
                            </>
                        }
                        <div className='sub-heading'>Payment Details</div>
                        <div className="detail">
                            <span className="label">Subtotal:</span>
                            <span className="value">${ticket.subTotal}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Paid Through:</span>
                            <span className="value">{ticket.paymentGateway === 'cards' ? 'Card (Stripe)' : 'PayPal'}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Paid At:</span>
                            <span className="value">{formatDate(ticket.updatedAt)}</span>
                        </div>
                    </div>
                    <div className='btns-div'>
                        <button
                            className={`btn ${is24HoursPriorToDeparture() ? 'non-disabled-btn' : 'disabled-btn'}`}
                            disabled={!is24HoursPriorToDeparture()}
                            onClick={handleCancelBooking}
                        >
                            Cancel Booking
                        </button>
                        <button className='btn non-disabled-btn' onClick={handleDownloadBooking}>Download Receipt</button>
                    </div>
                </div>
            }
        </>
    );
};

export default BookingInfo;