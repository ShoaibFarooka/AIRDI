import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { selectCountryCodes } from '../../redux/countryCodeSlice';
import { HideLoading, ShowLoading } from '../../redux/loaderSlice';
import { isValidEmail } from '../../utils/validationUtils';
import bookingService from '../../services/bookingService';
import BookingInfo from '../../components/BookingInfo';

const ManageBooking = () => {
    const [formData, setFormData] = useState({
        code: '',
        email: '',
        countryCode: '',
        contact: ''
    });
    const [errors, setErrors] = useState({
        code: '',
        email: '',
        contact: ''
    });
    const [ticket, setTicket] = useState(null);
    const [cancellationVoucherCode, setCancellationVoucherCode] = useState(null);
    const searchRef = useRef(null);
    const ticketRef = useRef(null);
    const countryCodes = useSelector(selectCountryCodes);
    const dispatch = useDispatch();

    useEffect(() => {
        searchRef.current.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }, []);

    useEffect(() => {
        if (ticket) {
            ticketRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [ticket])

    const handleChange = (e) => {
        const { name, value } = e.target;
        const numberRegex = /^[0-9\b]+$/;
        if ((name === 'code' || name === 'contact') && value !== '' && !numberRegex.test(value)) {
            return;
        }
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const validateForm = () => {
        let newErrors = {};
        let hasErrors = false;
        if (!formData.code) {
            newErrors = {
                ...newErrors,
                code: 'Please enter the code'
            };
            hasErrors = true;
        }
        else {
            newErrors = {
                ...newErrors,
                code: ''
            };
        }
        if (!formData.email || !isValidEmail(formData.email)) {
            newErrors = {
                ...newErrors,
                email: 'Please enter the valid email or contact number'
            };
        }
        else {
            newErrors = {
                ...newErrors,
                email: ''
            };
        }
        if (!formData.contact || !formData.countryCode) {
            newErrors = {
                ...newErrors,
                contact: 'Please enter the valid email or contact number'
            };
        }
        else {
            newErrors = {
                ...newErrors,
                contact: ''
            };
        }
        if (newErrors.email && newErrors.contact) {
            hasErrors = true;
        }
        setErrors({
            ...errors,
            ...newErrors
        });
        if (hasErrors) {
            return false;
        }
        return true;
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        else {
            console.log('Seraching for ticket...');
            dispatch(ShowLoading());
            const payload = {
                ...formData,
                contact: formData.countryCode + '-' + formData.contact
            }
            try {
                const response = await bookingService.searchBooking(payload);
                if (response.ticket) {
                    // console.log(response.ticket);
                    if (cancellationVoucherCode) {
                        setCancellationVoucherCode(null)
                    }
                    setTicket(response.ticket);
                }
            } catch (error) {
                if (ticket) {
                    setTicket(null);
                }
                message.error(error.response.data);
            }
            dispatch(HideLoading());
        }
    };

    return (
        <div className='manage-booking'>
            <div className='search-box' ref={searchRef}>
                <div className='title'>Manage My Booking</div>
                <div className='info-para'>View your booking details by entering the fields below. You will find your booking number in your confirmation e-mail or on your ticket.</div>
                <div className='content'>
                    <div className='input-container'>
                        <label htmlFor='code' className='label'>Booking Number: </label>
                        <input
                            type='text'
                            id='code'
                            name='code'
                            maxLength={6}
                            className='input'
                            value={formData.code}
                            onChange={handleChange}
                        />
                        {errors.code && <div className='error'>{errors.code}</div>}
                    </div>
                    <div className='input-container'>
                        <label htmlFor='email' className='label'>Email: </label>
                        <input
                            type='email'
                            id='email'
                            name='email'
                            className='input'
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && errors.contact && <div className='error'>{errors.email}</div>}
                    </div>
                    <div className='input-container'>
                        <label htmlFor='contact' className='label'>Phone Number: </label>
                        <select className='input select' name='countryCode' value={formData.countryCode} onChange={handleChange}>
                            <option value='' disabled>Please Select Country</option>
                            {countryCodes.map((code, index) => (
                                <option key={index} value={code.value}>
                                    {code.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type='text'
                            id='contact'
                            name='contact'
                            className='input'
                            value={formData.contact}
                            onChange={handleChange}
                        />
                        {errors.email && errors.contact && <div className='error'>{errors.contact}</div>}
                    </div>
                    <div className='btn-div'>
                        <button className='btn' onClick={handleSubmit}>Retrieve Booking</button>
                    </div>
                </div>
                {ticket &&
                    <BookingInfo ticket={ticket} ticketRef={ticketRef} cancellationVoucherCode={cancellationVoucherCode} setCancellationVoucherCode={setCancellationVoucherCode} />
                }
            </div>
        </div>
    )
};

export default ManageBooking;