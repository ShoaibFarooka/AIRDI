import React, { useState, useEffect } from 'react';
import './index.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useDispatch } from 'react-redux';
import { selectCountryCodes } from '../../redux/countryCodeSlice';
import { HideLoading, ShowLoading } from '../../redux/loaderSlice';
import { MdArrowBackIos, MdLocalOffer } from "react-icons/md";
import { MdDepartureBoard } from "react-icons/md";
import { FaMapMarkerAlt } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { isValidEmail } from '../../utils/validationUtils';
import logo from '../../assets/logo.png';
import busService from '../../services/busService';
import paymentService from '../../services/paymentService';
import TicketsCounter from '../../components/TicketsCounter';

const Checkout = () => {

    const busData = useSelector((state) => state.busData.busData);
    const countryCodes = useSelector(selectCountryCodes);
    const [adultTickets, setAdultTickets] = useState(1);
    const [childTickets, setChildTickets] = useState(0);
    const [formData, setFormData] = useState({
        adults: Array.from({ length: adultTickets }, () => ({ firstname: '', lastname: '' })),
        children: Array.from({ length: childTickets }, () => ({ firstname: '', lastname: '', dob: '---' })),
        email: '',
        countryCode: '+1',
        contact: '',
        paymentGateway: '',
    });
    const [errors, setErrors] = useState({
        adults: Array(adultTickets).fill({ firstname: '', lastname: '' }),
        children: Array(childTickets).fill({ firstname: '', lastname: '', dob: '' }),
        email: '',
        contact: '',
        paymentGateway: '',
    });
    const [data, setData] = useState(null);
    const [voucherText, setVoucherText] = useState('');
    const [discount, setDiscount] = useState({
        id: '',
        isVerified: false,
        isApplied: false,
        type: '',
        value: 0
    });
    const [showVoucherInput, setShowVoucherInput] = useState(false);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const getData = async () => {
            dispatch(ShowLoading());
            try {
                const response = await busService.getBusAccess();
                if (response.data) {
                    setData(response.data);
                }
            } catch (error) {
                message.error(error.response.data);
            }
            dispatch(HideLoading());
        }
        getData();
    }, []);

    useEffect(() => {
        if (busData) {
            if (!busData.journeyBus) {
                // message.error('Please select the bus first');
                navigate('/');
            }
            else {
                window.scrollTo(0, 0);
            }
        }
    }, [busData]);

    useEffect(() => {
        setFormData(prevState => {
            return {
                ...prevState,
                adults: Array.from({ length: adultTickets }, () => ({ firstname: '', lastname: '' })),
                children: Array.from({ length: childTickets }, () => ({ firstname: '', lastname: '', dob: '---' })),
            }
        });
        setErrors(prevState => {
            return {
                ...prevState,
                adults: Array(adultTickets).fill({ firstname: '', lastname: '' }),
                children: Array(childTickets).fill({ firstname: '', lastname: '', dob: '' }),
            }
        });

    }, [adultTickets, childTickets]);

    const formatDate = (dateString) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const [year, month, day] = dateString.split("-");
        const date = new Date(year, month - 1, day);

        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];

        return `${dayName}, ${monthName} ${day}`;
    };

    const convertToAMPM = (time24) => {
        var [hours, minutes] = time24.split(':');
        hours = parseInt(hours);
        var period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        minutes = minutes.padStart(2, '0');
        return hours + ':' + minutes + ' ' + period;
    };

    const calculatePriceAsPerAdvanceBookingDays = (price, departureDate, departureTime) => {
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

    const calculateTotalPrice = (busType) => {
        let totalPrice;
        if (busType === 'outward') {
            const { adultTicketCost, childTicketCost, departureDate, departureTime } = busData.journeyBus;
            totalPrice = calculatePriceAsPerAdvanceBookingDays(adultTicketCost, departureDate, departureTime) * adultTickets + calculatePriceAsPerAdvanceBookingDays(childTicketCost, departureDate, departureTime) * childTickets;
        }
        else if (busType === 'return') {
            if (busData.returnBus) {
                const { adultTicketCost, childTicketCost, departureDate, departureTime } = busData.returnBus;
                totalPrice = calculatePriceAsPerAdvanceBookingDays(adultTicketCost, departureDate, departureTime) * adultTickets + calculatePriceAsPerAdvanceBookingDays(childTicketCost, departureDate, departureTime) * childTickets;
            }
            else {
                totalPrice = 0;
            }
        }
        return totalPrice;
    };

    const calculateSubTotal = () => {
        const outwardTotalTicketPrice = calculateTotalPrice('outward');
        const returnTotalTicketPrice = calculateTotalPrice('return');
        const subTotalWithoutServiceFee = outwardTotalTicketPrice + returnTotalTicketPrice;
        let subTotal = subTotalWithoutServiceFee;
        if (data) {
            subTotal += data.serviceFee
        }
        let extrasCost = selectedExtras.reduce(
            (total, index) => total + data.extras[index].price,
            0
        );
        subTotal += extrasCost;
        let discountedPrice = 0;
        if (discount.isApplied) {
            if (discount.type === 'fix') {
                discountedPrice = discount.value;
            }
            else if (discount.type === 'percentage') {
                discountedPrice = subTotalWithoutServiceFee * discount.value / 100;
            }
        }
        else {
            discountedPrice = 0;
        }
        return subTotal - discountedPrice;
    };

    const handleChange = (e, type, index, field) => {
        const { value } = e.target;
        if (field.includes('dob')) {
            if (!/^-?\d+$/.test(value)) {
                return;
            }
            const arr = formData.children[index].dob.split('-');
            let day = arr[0];
            let month = arr[1];
            let year = arr[2];
            if (!day) {
                day = '';
            }
            if (!month) {
                month = '';
            }
            if (!year) {
                year = '';
            }
            let formattedDOB;
            if (field === 'dob-1') {
                formattedDOB = value + '-' + month + '-' + year;
            }
            else if (field === 'dob-2') {
                formattedDOB = day + '-' + value + '-' + year;
            }
            else if (field === 'dob-3') {
                formattedDOB = day + '-' + month + '-' + value;
            }
            setFormData(prevFormData => ({
                ...prevFormData,
                [type]: prevFormData[type].map((passenger, i) => (
                    i === index ? { ...passenger, dob: formattedDOB } : passenger
                ))
            }));
        }
        else {
            setFormData(prevFormData => ({
                ...prevFormData,
                [type]: prevFormData[type].map((passenger, i) => (
                    i === index ? { ...passenger, [field]: value } : passenger
                ))
            }));
        }
    };

    const handleChange2 = (e) => {
        const { name, value } = e.target;
        if (name === 'contact' && !/^[0-9]*$/.test(value)) {
            return;
        }
        setFormData({
            ...formData,
            [name]: value
        })
    };

    const handlePaymentSwitch = (value) => {
        if (formData.paymentGateway !== value) {
            setFormData({
                ...formData,
                paymentGateway: value
            })
        }
    };

    const validateInputs = () => {
        const newErrors = { ...errors };
        let hasErrors = false;

        // Validate adults
        formData.adults.forEach((adult, index) => {
            if (!adult.firstname.trim()) {
                newErrors.adults[index].firstname = 'First name is required';
                hasErrors = true;
            } else {
                newErrors.adults[index].firstname = '';
            }
            if (!adult.lastname.trim()) {
                newErrors.adults[index].lastname = 'Last name is required';
                hasErrors = true;
            } else {
                newErrors.adults[index].lastname = '';
            }
        });

        // Validate children
        formData.children.forEach((child, index) => {
            if (!child.firstname.trim()) {
                newErrors.children[index].firstname = 'First name is required';
                hasErrors = true;
            } else {
                newErrors.children[index].firstname = '';
            }
            if (!child.lastname.trim()) {
                newErrors.children[index].lastname = 'Last name is required';
                hasErrors = true;
            } else {
                newErrors.children[index].lastname = '';
            }
            if (!child.dob.trim()) {
                newErrors.children[index].dob = 'Date of birth is required';
                hasErrors = true;

            } else {
                newErrors.children[index].dob = '';
            }
        });

        if (!formData.email) {
            newErrors.email = 'Email is required';
            hasErrors = true;
        }
        else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Email is not valid';
            hasErrors = true;
        }
        else {
            newErrors.email = '';
        }

        // if (!formData.contact) {
        //     newErrors.contact = 'Contact is required';
        //     hasErrors = true;
        // }
        // else if (!formData.countryCode) {
        //     newErrors.contact = 'Country Code is not valid';
        //     hasErrors = true;
        // }
        // else {
        //     newErrors.contact = '';
        // }

        if (!formData.paymentGateway) {
            newErrors.paymentGateway = 'Payment Gateway is required';
            hasErrors = true;
        }
        else if (formData.paymentGateway === 'paypal') {
            newErrors.paymentGateway = 'Sorry, currently we are not operating PayPal';
            hasErrors = true;
        }
        else {
            newErrors.paymentGateway = '';
        }
        setErrors(newErrors);
        if (hasErrors) {
            return false;
        }
        return true;
    };

    const handlePay = async () => {
        if (!validateInputs()) {
            return;
        }
        dispatch(ShowLoading());
        const extras = data?.extras.filter((extra, index) => selectedExtras.includes(index))
            .map(extra => {
                return {
                    name: extra.name,
                    price: extra.price
                }
            });
        const dataToSend = {
            ...formData,
            contact: formData.countryCode + '-' + formData.contact,
            ...busData,
            adultTickets,
            childTickets,
            discount: discount.isApplied ? {
                id: discount.id,
                type: discount.type,
                value: discount.value
            }
                : null,
            extras,
            subTotal: calculateSubTotal()
        }
        try {
            const response = await paymentService.stripeCheckout(dataToSend);
            if (response.url) {
                localStorage.removeItem('formData');
                window.location.href = response.url;
            }
        } catch (error) {
            message.error(error.response.data);
        }
        dispatch(HideLoading());
    };

    const handleCheckboxChange = (index) => {
        const newSelectedExtras = [...selectedExtras];
        const isSelected = newSelectedExtras.includes(index);

        if (isSelected) {
            const selectedIndex = newSelectedExtras.indexOf(index);
            newSelectedExtras.splice(selectedIndex, 1);
        } else {
            newSelectedExtras.push(index);
        }

        setSelectedExtras(newSelectedExtras);
    };

    const handleVerifyVoucher = async () => {
        if (!voucherText) {
            return;
        }
        dispatch(ShowLoading());
        try {
            const response = await busService.verifyVoucher({ code: voucherText });
            if (response.voucher) {
                const voucherData = response.voucher;
                if (!voucherData.isExpired && voucherData.type === 'fix') {
                    const voucherPrice = voucherData.value;
                    const subTotal = calculateSubTotal();
                    if (voucherPrice > subTotal) {
                        setDiscount({
                            ...discount,
                            isVerified: true,
                            isApplied: false
                        })
                    }
                    else {
                        setDiscount({
                            id: voucherData._id,
                            isVerified: true,
                            isApplied: !voucherData.isExpired,
                            type: voucherData.type,
                            value: voucherData.value
                        })
                    }
                }
                else {
                    setDiscount({
                        id: voucherData._id,
                        isVerified: true,
                        isApplied: !voucherData.isExpired,
                        type: voucherData.type,
                        value: voucherData.value
                    })
                }
            }
        } catch (error) {
            // message.error(error.response.data);
            setDiscount({
                ...discount,
                isVerified: true,
                isApplied: false
            })
        }
        dispatch(HideLoading());
    };

    const goBack = () => {
        navigate('/', { state: { fromCheckout: true } });
    };

    return (
        <div className='checkout'>
            <div className='header'>
                <img src={logo} className='airdi-logo' alt='Airdi' />
            </div>
            {busData.journeyBus &&
                <div className='content'>
                    <div className='passenger-info-container'>
                        <button onClick={goBack} className='back-btn'>
                            <MdArrowBackIos size={14} />
                            <div>Back</div>
                        </button>
                        <TicketsCounter journeyBus={busData.journeyBus} returnBus={busData.returnBus} adultTickets={adultTickets} setAdultTickets={setAdultTickets} childTickets={childTickets} setChildTickets={setChildTickets} />
                        {(adultTickets > 0 || childTickets > 0) &&
                            <div className='passenger-info'>
                                <div id='card-1' className='cards'>
                                    <div className='title'>
                                        <div className='number'>1</div>
                                        <div className='text'>Passengers</div>
                                    </div>
                                    <div className='p-info-internal'>
                                        {formData.adults.map((passenger, index) => (
                                            <div className='adult-info' key={index}>
                                                <div className='info-number'><b>{index + 1}  .  Adult</b></div>
                                                <div className='passenger-name-container'>
                                                    <div className='input-container half-input-container'>
                                                        <label htmlFor={`firstname-${index}`} className='input-label'>First Name (required)</label>
                                                        <input
                                                            type='text'
                                                            id={`firstname-${index}`}
                                                            className='input'
                                                            value={passenger.firstname}
                                                            onChange={(e) => handleChange(e, 'adults', index, 'firstname')}
                                                        />
                                                        {errors.adults[index]?.firstname && <div className='error'>{errors.adults[index].firstname}</div>}
                                                    </div>
                                                    <div className='input-container half-input-container'>
                                                        <label htmlFor={`lastname-${index}`} className='input-label'>Last Name (required)</label>
                                                        <input
                                                            type='text'
                                                            id={`lastname-${index}`}
                                                            className='input'
                                                            value={passenger.lastname}
                                                            onChange={(e) => handleChange(e, 'adults', index, 'lastname')}
                                                        />
                                                        {errors.adults[index]?.lastname && <div className='error'>{errors.adults[index].lastname}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.children.map((passenger, index) => (
                                            <div className='child-info' key={index + formData.adults.length}>
                                                <div className='info-number'><b>{index + formData.adults.length + 1}  .  Child (2-15)</b></div>
                                                <div className='passenger-name-container'>
                                                    <div className='input-container half-input-container'>
                                                        <label htmlFor={`firstname-${index + formData.adults.length}`} className='input-label'>First Name (required)</label>
                                                        <input
                                                            type='text'
                                                            id={`firstname-${index + formData.adults.length}`}
                                                            className='input'
                                                            value={passenger.firstname}
                                                            onChange={(e) => handleChange(e, 'children', index, 'firstname')}
                                                        />
                                                        {errors.children[index]?.firstname && <div className='error'>{errors.children[index].firstname}</div>}
                                                    </div>
                                                    <div className='input-container half-input-container'>
                                                        <label htmlFor={`lastname-${index + formData.adults.length}`} className='input-label'>Last Name (required)</label>
                                                        <input
                                                            type='text'
                                                            id={`lastname-${index + formData.adults.length}`}
                                                            className='input'
                                                            value={passenger.lastname}
                                                            onChange={(e) => handleChange(e, 'children', index, 'lastname')}
                                                        />
                                                        {errors.children[index]?.lastname && <div className='error'>{errors.children[index].lastname}</div>}
                                                    </div>
                                                </div>
                                                <div className='passenger-dob-container'>
                                                    <label className='input-label'>Date of Birth (required)</label>
                                                    <div className='input-flex'>
                                                        <input
                                                            type='text'
                                                            id='input-1'
                                                            className='input'
                                                            placeholder='DD'
                                                            maxLength={2}
                                                            value={formData.children[index].dob.split('-')[0]}
                                                            onChange={(e) => handleChange(e, 'children', index, 'dob-1')}
                                                        />
                                                        <input
                                                            type='text'
                                                            id='input-2'
                                                            className='input'
                                                            placeholder='MM'
                                                            maxLength={2}
                                                            value={formData.children[index].dob.split('-')[1]}
                                                            onChange={(e) => handleChange(e, 'children', index, 'dob-2')}
                                                        />
                                                        <input
                                                            type='text'
                                                            id='input-3'
                                                            className='input'
                                                            placeholder='YYYY'
                                                            maxLength={4}
                                                            value={formData.children[index].dob.split('-')[2]}
                                                            onChange={(e) => handleChange(e, 'children', index, 'dob-3')}
                                                        />
                                                    </div>
                                                    {errors.children[index]?.dob && <div className='error'>{errors.children[index].dob}</div>}
                                                </div>
                                            </div>
                                        ))
                                        }
                                    </div>
                                </div>
                                {data?.extras?.length > 0 &&
                                    <div id='card-2' className='cards'>
                                        <div className='title'>
                                            <div className='number'>2</div>
                                            <div className='text'>Extras</div>
                                        </div>
                                        <div className='p-info-internal'>
                                            {data?.extras.map((extra, index) => (
                                                <div className='extra' key={index} onClick={() => handleCheckboxChange(index)} >
                                                    <div className='input-container half-input-container'>
                                                        <input
                                                            type='checkbox'
                                                            id={`extra ${index + 1}`}
                                                            className='input'
                                                            checked={selectedExtras.includes(index)}
                                                            readOnly={true}
                                                        />
                                                        <label htmlFor={`extra`} className='input-label'>{extra.name}</label>
                                                    </div>
                                                    <div className='extra-price'>+ ${extra.price}</div>
                                                </div>
                                            ))
                                            }
                                        </div>
                                    </div>
                                }
                                <div id='card-3' className='cards'>
                                    <div className='title'>
                                        <div className='number'>{data?.extras?.length > 0 ? '3' : '2'}</div>
                                        <div className='text'>Contact</div>
                                    </div>
                                    <div className='p-info-internal'>
                                        <div className='input-container half-input-container'>
                                            <label htmlFor='email' className='label-input'>Email (required)</label>
                                            <input
                                                type='email'
                                                id='email'
                                                className='input'
                                                name='email'
                                                value={formData.email}
                                                onChange={handleChange2}
                                            />
                                            {errors.email && <div className='error'>{errors.email}</div>}
                                        </div>
                                        <div className='input-container full-input-container'>
                                            <label htmlFor='number' className='label-input'>Phone Number (optional)</label>
                                            <div className='input-flex'>
                                                <select className='select' name='countryCode' value={formData.countryCode} onChange={handleChange2}>
                                                    {countryCodes.map((code, index) => (
                                                        <option key={index} value={code.value}>
                                                            {code.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type='text'
                                                    id='number'
                                                    className='input'
                                                    maxLength={13}
                                                    name='contact'
                                                    value={formData.contact}
                                                    onChange={handleChange2}
                                                />
                                            </div>
                                            <div className='info-para'>Used to retrieve booking.</div>
                                            {errors.contact && <div className='error'>{errors.contact}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div id='card-4' className='cards'>
                                    <div className='title'>
                                        <div className='number'>{data?.extras?.length > 0 ? '4' : '3'}</div>
                                        <div className='text'>Payment</div>
                                    </div>
                                    <div className='p-info-internal'>
                                        <div className='item' onClick={() => handlePaymentSwitch('cards')}>
                                            <input
                                                type='radio'
                                                id='card-payment'
                                                className='input'
                                                name='paymentGateway'
                                                value='cards'
                                                checked={formData.paymentGateway === 'cards'}
                                                onChange={handleChange2}
                                            />
                                            <img src='https://shop.flixbus.com/img/gate/credit_card_jcb.svg' alt='cards' className='img' />
                                            <label htmlFor='card-payment' className='input-label'>Cards</label>
                                        </div>
                                        {/* <div className='seperator'></div>
                                        <div className='item' onClick={() => handlePaymentSwitch('paypal')}>
                                            <input
                                                type='radio'
                                                id='paypal-payment'
                                                className='input'
                                                name='paymentGateway'
                                                value='paypal'
                                                checked={formData.paymentGateway === 'paypal'}
                                                onChange={handleChange2}
                                            />
                                            <img src='https://shop.flixbus.com/img/gate/paypal.svg' alt='paypal' className='img' />
                                            <label htmlFor='paypal-payment' className='input-label'>PayPal</label>
                                        </div> */}
                                    </div>
                                    {errors.paymentGateway && <div className='error'>{errors.paymentGateway}</div>}
                                </div>
                            </div>
                        }
                    </div>
                    {(adultTickets > 0 || childTickets > 0) &&
                        <div className='booking-details'>
                            <div className='title'>Your Booking</div>
                            <div className='card'>
                                <div className='card-header'>
                                    <div className='date'>{formatDate(busData.journeyBus.departureDate)}</div>
                                    <div className='trip-type'>DIRECT TRIP</div>
                                </div>
                                <div className='trip-details' style={{ marginBottom: "5px" }}>
                                    <div className='city'>
                                        <MdDepartureBoard color='black' size={20} />
                                        <div>{busData.journeyBus.departurePoint}</div>
                                    </div>
                                    <div className='time'>{convertToAMPM(busData.journeyBus.departureTime)}</div>
                                </div>
                                <div className='trip-details'>
                                    <div className='city'>
                                        <FaMapMarkerAlt color='black' size={20} className="map-icon" />
                                        <div>{busData.journeyBus.arrivalPoint}</div>
                                    </div>
                                    <div className='time'>{convertToAMPM(busData.journeyBus.arrivalTime)}</div>
                                </div>
                            </div>
                            {busData.returnBus &&
                                < div className='card'>
                                    <div className='card-header'>
                                        <div className='date'>{formatDate(busData.returnBus.departureDate)}</div>
                                        <div className='trip-type'>DIRECT TRIP</div>
                                    </div>
                                    <div className='trip-details' style={{ marginBottom: "5px" }}>
                                        <div className='city'>
                                            <MdDepartureBoard color='black' size={20} />
                                            <div>{busData.returnBus.departurePoint}</div>
                                        </div>
                                        <div className='time'>{convertToAMPM(busData.returnBus.departureTime)}</div>
                                    </div>
                                    <div className='trip-details'>
                                        <div className='city'>
                                            <FaMapMarkerAlt color='black' size={20} className="map-icon" />
                                            <div>{busData.returnBus.arrivalPoint}</div>
                                        </div>
                                        <div className='time'>{convertToAMPM(busData.returnBus.arrivalTime)}</div>
                                    </div>
                                </div>
                            }
                            <div className='price-info'>
                                <div className='sub-price-info'>
                                    <div className='seats text'>
                                        {busData.returnBus && <span>Outbound Trip<br /></span>}
                                        {formData.adults.length > 0 ? `${formData.adults.length} Adult` : ''}{(formData.adults.length > 0 && formData.children.length > 0) ? ', ' : ''}{formData.children.length > 0 ? `${formData.children.length} Child` : ''}
                                    </div>
                                    <div className='seats-price cost'>${calculateTotalPrice('outward')}</div>
                                </div>
                                <div className='seperator'></div>
                                {busData.returnBus &&
                                    <>
                                        <div className='sub-price-info'>
                                            <div className='seats text'>
                                                <span>Return Trip<br /></span>
                                                {formData.adults.length > 0 ? `${formData.adults.length} Adults` : ''}{(formData.adults.length > 0 && formData.children.length > 0) ? ', ' : ''}{formData.children.length > 0 ? `${formData.children.length} Child` : ''}
                                            </div>
                                            <div className='seats-price cost'>${calculateTotalPrice('return')}</div>
                                        </div>
                                        <div className='seperator'></div>
                                    </>
                                }
                                {data?.serviceFee !== 0 &&
                                    <div className='sub-price-info'>
                                        <div className='service-fee text'>Service Fee</div>
                                        <div className='service-fee-price cost'>${data?.serviceFee ? data.serviceFee : 0}</div>
                                    </div>
                                }
                                <div className='seperator'></div>
                                {data?.extras.map((extra, index) => (
                                    <div key={index}>
                                        {selectedExtras.includes(index) &&
                                            <div>
                                                <div className='sub-price-info'>
                                                    <div className='service-fee text'>{extra.name}</div>
                                                    <div className='service-fee-price cost'>${extra.price}</div>
                                                </div>
                                                <div className='seperator'></div>
                                            </div>
                                        }
                                    </div>
                                ))
                                }
                                {discount.isApplied &&
                                    <>
                                        <div className='sub-price-info'>
                                            <div className='service-fee text'>Voucher/Promo Discount</div>
                                            <div className='service-fee-price cost'>{discount.type === 'fix' ? `$${discount.value}` : `${discount.value}%`}</div>
                                        </div>
                                        <div className='seperator'></div>
                                    </>
                                }
                                <div className='sub-price-info'>
                                    <div className='total-text'><div>Total</div> (incl. TAX)</div>
                                    <div className='total-cost'>${calculateSubTotal()}</div>
                                </div>
                                <div className='voucher'>
                                    <div className='voucher-btn' onClick={() => setShowVoucherInput(!showVoucherInput)}>
                                        <MdLocalOffer size={19} className='icon' />
                                        <div>Enter Voucher or Promo Code</div>
                                        {!showVoucherInput ?
                                            <IoIosArrowDown size={19} className='icon' />
                                            :
                                            <IoIosArrowUp size={19} className='icon' />
                                        }
                                    </div>
                                    {showVoucherInput &&
                                        <>
                                            <div className='input-container half-input-container'>
                                                <input
                                                    type='text'
                                                    className='input'
                                                    value={voucherText}
                                                    onChange={(e) => setVoucherText(e.target.value.toUpperCase())}
                                                />
                                                <button className='btn' onClick={handleVerifyVoucher}>Redeem</button>
                                            </div>
                                            <div className={discount.isVerified && discount.isApplied ? 'success-message' : `error-message`}>{!discount.isVerified ? "" : discount.isApplied ? 'Voucher Applied' : "Sorry, that voucher code isn't applicable or expired"}</div>
                                        </>
                                    }
                                </div>
                            </div>
                            <button className='pay-btn' onClick={handlePay}>Pay now</button>
                        </div>
                    }
                </div>
            }
        </div>
    )
};

export default Checkout;