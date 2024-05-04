import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { useLocation } from 'react-router-dom';
import { message } from 'antd';
import { useDispatch } from 'react-redux';
import { HideLoading, ShowLoading } from '../../redux/loaderSlice';
import bookingService from '../../services/bookingService';

const Success = () => {
    const [ticketCode, setTicketCode] = useState(null);
    const scrollRef = useRef(null);
    const location = useLocation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(ShowLoading());
        const verifyBooking = async (bookingId, retryCount = 0) => {
            console.log('Retrying...');
            try {
                const response = await bookingService.verifyBooking(bookingId);
                if (response.ticket) {
                    const ticket = response.ticket;
                    console.log('Response: ', ticket);
                    if (ticket.status === 'pending') {
                        if (retryCount < 3) {
                            setTimeout(() => {
                                verifyBooking(bookingId, retryCount + 1);
                            }, 5000); // Retry after 5 seconds
                        } else {
                            console.log('Max retries exceeded');
                            dispatch(HideLoading());
                        }
                    }
                    else if (ticket.status === 'confirmed') {
                        setTicketCode(ticket.code);
                        dispatch(HideLoading());
                    }
                    else {
                        dispatch(HideLoading());
                    }
                }
            } catch (error) {
                message.error(error.response.data);
                dispatch(HideLoading());
            }
        }

        const searchParams = new URLSearchParams(location.search);
        const clientReferenceId = searchParams.get('client_reference_id');
        if (clientReferenceId) {
            verifyBooking(clientReferenceId);
        }

    }, [location]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
    }, [])

    return (
        <div className='success' ref={scrollRef}>
            <div className="card">
                <div className='box'>
                    {ticketCode ?
                        <i className="checkmark">✓</i>
                        :
                        <i className='question-mark'>?</i>
                    }
                </div>
                {ticketCode ?
                    <>
                        <h1 className='color-green'>Booking Confirmed</h1>
                        <p>Thank you for making a purchase. Your booking confirmation number is {ticketCode}. An email confirmation is on the way. </p>
                        <br />
                        <p>Love, <br />Airdi!</p>
                    </>
                    :
                    <>
                        <h1 className='color-blue'>Please Wait...</h1>
                        <p>If loading keeps going then kindly refresh the browser.</p>
                    </>
                }
            </div>
        </div>
    )
};

export default Success;