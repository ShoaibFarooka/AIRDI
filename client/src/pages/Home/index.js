import React, { useState, useEffect, useRef } from "react";
import './index.css';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { message, DatePicker, Select } from 'antd';
import dayjs from "dayjs";
import { useDispatch } from 'react-redux';
import { HideLoading, ShowLoading } from '../../redux/loaderSlice';
import { FaLocationDot } from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import { FaLongArrowAltRight } from "react-icons/fa";
import Image1 from '../../assets/image-1.png';
import Image2 from '../../assets/image-2.png';
import SerachResult from "../../components/SearchResult";
import busService from "../../services/busService";

const Home = () => {
    const [points, setPoints] = useState([]);
    const [selectedPointIndex, setSelectedPointIndex] = useState(null);
    const [formData, setFormData] = useState({
        from: null,
        to: null,
        journeyDate: '',
        returnDate: ''
    });
    const [errors, setErrors] = useState({
        from: '',
        to: '',
        journeyDate: '',
    });
    const [autoFetch, setAutoFetch] = useState(false);
    const [error, setError] = useState(null);
    const [outwardBuses, setOutwardBuses] = useState([]);
    const [returnBuses, setReturnBuses] = useState([]);
    const [journeyDateChanged, setJourneyDateChanged] = useState(false);
    const [returnDateChanged, setReturnDateChanged] = useState(false);
    const [thresholdTime, setThresholdTime] = useState(0);
    const dateFormat = 'YYYY-MM-DD';
    const location = useLocation();
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const resultRef = useRef(null);

    const dispatch = useDispatch();

    const fetchAllDeparturesAndArrivals = async () => {
        try {
            const response = await busService.getDepartureAndArrivalPoints();
            if (response.points) {
                console.log('Points: ', response.points);
                setPoints(response.points);
            }
        } catch (error) {
            message.error(error.response.data);
        }
    };

    const fetchThresholdTime = async () => {
        try {
            const response = await busService.getThresholdTime();
            if (response.thresholdTime) {
                setThresholdTime(response.thresholdTime);
            }
        } catch (error) {
            message.error(error.response.data);
        }
    };

    const getData = async () => {
        dispatch(ShowLoading());
        await fetchAllDeparturesAndArrivals();
        await fetchThresholdTime();
        dispatch(HideLoading());
    }

    useEffect(() => {
        getData();
        window.history.scrollRestoration = 'manual';
    }, []);

    useEffect(() => {
        const savedFormData = localStorage.getItem('formData');
        if (location.state && location.state.fromCheckout && savedFormData) {
            setFormData(JSON.parse(savedFormData));
            setAutoFetch(true);
            navigate(location.pathname, { replace: true });
        }
        else {
            if (!location.hash) {
                window.scrollTo(0, 0);
            }
        }
    }, [location]);

    useEffect(() => {
        if (formData.from && points?.length > 0) {
            const index = points.findIndex(item => item["departurePoint"] === formData.from);
            setSelectedPointIndex(index);
        }
    }, [formData.from, points])

    useEffect(() => {
        if (autoFetch) {
            handleSearch(true);
        }
    }, [autoFetch]);

    useEffect(() => {
        if (outwardBuses.length > 0 || returnBuses.length > 0) {
            resultRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [outwardBuses, returnBuses])

    useEffect(() => {
        if (journeyDateChanged) {
            handleSearch(false);
            setJourneyDateChanged(false);
        }
        else if (returnDateChanged) {
            handleSearch(true);
            setReturnDateChanged(false);
        }
    }, [journeyDateChanged, returnDateChanged]);

    const handleDateChange = (name, value) => {
        console.log(name, value);
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handlePointChange = (name, value) => {
        if (name === 'from') {
            setFormData({
                ...formData,
                to: null,
                [name]: value
            });
        }
        else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const isDatePassed = (value) => {
        const NYDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        const currentDate = new Date(NYDate).setHours(0, 0, 0, 0);
        const selectedDate = new Date(value).setHours(0, 0, 0, 0);
        if (selectedDate < currentDate) {
            return true;
        }
        else {
            return false;
        }
    };

    const validateInputs = () => {
        const newErrors = { ...errors };
        let hasErrors = false;

        if (!formData.from) {
            newErrors.from = 'Departure point is required';
            hasErrors = true;
        }
        else {
            newErrors.from = '';
        }

        if (!formData.to) {
            newErrors.to = 'Arrival point is required';
            hasErrors = true;
        }
        else {
            newErrors.to = '';
        }

        if (!formData.journeyDate) {
            newErrors.journeyDate = 'Journey Date is required';
            hasErrors = true;
        }
        else if (isDatePassed(formData.journeyDate)) {
            newErrors.journeyDate = 'Please update the jouney date';
            hasErrors = true;
        }
        else {
            newErrors.journeyDate = '';
        }
        setErrors(newErrors);
        if (hasErrors) {
            return false;
        }
        return true;
    };

    const handleSearch = async (stopReRender) => {
        if (!validateInputs()) {
            return;
        }
        if (!stopReRender) {
            setOutwardBuses([]);
            setReturnBuses([]);
        }
        dispatch(ShowLoading());
        try {
            const response = await busService.getAllBuses(formData);
            console.log(response);
            setError(null);
            if (response.outwardBuses) {
                setOutwardBuses(response.outwardBuses);
            }
            if (response.returnBuses) {
                setReturnBuses(response.returnBuses);
            }
        } catch (error) {
            console.log('Error: ', error);
            setOutwardBuses([]);
            setReturnBuses([]);
            searchRef.current.scrollIntoView({ behavior: 'smooth' });
            setError('No buses available for the selected input, please revise input and try again.');
        }
        localStorage.setItem('formData', JSON.stringify(formData));
        dispatch(HideLoading());
    };

    const handleParentChangeDate = (date, type) => {
        if (type === 'outward') {
            let currentJourneyDate = new Date(formData.journeyDate);
            let newDate = new Date(currentJourneyDate);
            if (date === 'previous') {
                newDate.setDate(currentJourneyDate.getDate() - 1);
            } else if (date === 'next') {
                newDate.setDate(currentJourneyDate.getDate() + 1);
            }
            if (formData.journeyDate !== formData.returnDate) {
                setFormData({
                    ...formData,
                    journeyDate: newDate.toISOString().split('T')[0]
                });
            }
            else if (date === 'next') {
                setFormData({
                    ...formData,
                    journeyDate: newDate.toISOString().split('T')[0],
                    returnDate: newDate.toISOString().split('T')[0]
                });
            }
            else {
                setFormData({
                    ...formData,
                    journeyDate: newDate.toISOString().split('T')[0]
                });
            }
            setJourneyDateChanged(true);
        }
        else if (type === 'return') {
            let currentReturnDate = new Date(formData.returnDate);
            let newDate = new Date(currentReturnDate);
            if (date === 'previous') {
                newDate.setDate(currentReturnDate.getDate() - 1);
            } else if (date === 'next') {
                newDate.setDate(currentReturnDate.getDate() + 1);
            }
            setFormData({
                ...formData,
                returnDate: newDate.toISOString().split('T')[0]
            });
            setReturnDateChanged(true);
        }
    };

    return (
        <div className="Home">
            <div className="search-box" ref={searchRef}>
                <div className="title">BUY TICKET</div>
                <div className="flex-row">
                    <div className="flex-row-item">
                        <label htmlFor="from" className="label">
                            <FaLocationDot size={20} />
                            <div>From:</div>
                        </label>
                        <Select
                            id="from"
                            name="from"
                            className="search-input text-input"
                            size="large"
                            placeholder="Please Select"
                            value={formData.from}
                            onChange={(value) => handlePointChange('from', value)}
                        >
                            {points.map((point, index) => (
                                <Select.Option key={index} value={point.departurePoint}>{point.departurePoint}</Select.Option>
                            ))}
                        </Select>
                        {errors.from && <div className="error">{errors.from}</div>}
                    </div>
                    <div className="flex-row-item">
                        <label htmlFor="to" className="label">
                            <FaLocationDot size={20} />
                            <div>To:</div>
                        </label>
                        <Select
                            id="to"
                            name="to"
                            className="search-input text-input"
                            size="large"
                            placeholder="Please Select"
                            value={formData.to}
                            onChange={(value) => handlePointChange('to', value)}
                        >
                            {points[selectedPointIndex]?.arrivalPoints.map((point, index) => (
                                <Select.Option key={index} value={point}>{point}</Select.Option>
                            ))}
                        </Select>
                        {errors.to && <div className="error">{errors.to}</div>}
                    </div>
                    <div className="flex-row-item">
                        <label htmlFor="journey-date" className="label">
                            <FaCalendarAlt size={21} />
                            <div>Departure</div>
                        </label>
                        <DatePicker
                            format={dateFormat}
                            id="journey-date"
                            name="journeyDate"
                            className="search-input date-picker"
                            size="large"
                            inputReadOnly={true}
                            onKeyDown={(e) => e.preventDefault()}
                            minDate={dayjs(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))}
                            maxDate={formData.returnDate ? dayjs(formData.returnDate) : ''}
                            value={formData.journeyDate ? dayjs(formData.journeyDate) : formData.journeyDate}
                            onChange={(date, dateString) => handleDateChange('journeyDate', dateString)}
                        />
                        {errors.journeyDate && <div className="error">{errors.journeyDate}</div>}
                    </div>
                    <div className="flex-row-item">
                        <label htmlFor="return-date" className="label">
                            <FaCalendarAlt size={21} />
                            <div>Return (Optional)</div>
                        </label>
                        <DatePicker
                            format={dateFormat}
                            id="return-date"
                            name="returnDate"
                            className="search-input date-picker"
                            size="large"
                            inputReadOnly={true}
                            onKeyDown={(e) => e.preventDefault()}
                            disabled={!formData.journeyDate}
                            minDate={formData.journeyDate ? dayjs(formData.journeyDate) : ''}
                            value={formData.returnDate ? dayjs(formData.returnDate) : formData.returnDate}
                            onChange={(date, dateString) => handleDateChange('returnDate', dateString)}
                        />
                    </div>
                    <div className={`flex-row-item ${(errors.from || errors.to || errors.journeyDate) ? 'flex-row-center-item' : 'flex-row-last-item'}`}>
                        <button className="search-btn" onClick={() => handleSearch(false)}>
                            <FaSearch size={18} />
                            <div>Search</div>
                        </button>
                    </div>
                </div>
            </div>
            <div className="main-content">
                {(outwardBuses && outwardBuses.length > 0) &&
                    <SerachResult outwardBuses={outwardBuses} returnBuses={returnBuses} handleParentChangeDate={handleParentChangeDate} resultRef={resultRef} setError={setError} thresholdTime={thresholdTime} />
                }
                {error &&
                    <div className="error-info">{error}</div>
                }
                {/* <div className="comment">
                    <div>"Getting to the airport just got much more affordable for Bronxites, thanks to Airdi"</div>
                    <div>- Bronx News 12</div>
                </div> */}
                <div className="cards-container">
                    <div className="cards-title">MEET AIRDI</div>
                    <div className="seperator"></div>
                    <div className="cards">
                        <div className="card">
                            <img src={Image1} alt="walking-person" />
                            <div className="title">Airdi is Convenient</div>
                            <p className="para">Frequent shuttle bus to the airport from convenient locations.</p>
                            {/* <Link to='/' className="btn">
                                <div>LEARN MORE</div>
                                <FaLongArrowAltRight color="white" />
                            </Link> */}
                        </div>
                        <div className="card">
                            <img src={Image2} alt="market" />
                            <div className="title">Airdi is Affordable</div>
                            <p className="para">Getting to the airport doesn't have to cost the same price as your flight</p>
                            {/* <Link to='/' className="btn">
                                <div>LEARN MORE</div>
                                <FaLongArrowAltRight color="white" />
                            </Link> */}
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute-container">
                <div className="content">
                    <div className="title">BOOK NOW & SAVE</div>
                    <div className="seperator"></div>
                    <div className="para">Getting to the airport has never been this easy or affordable. Airdi offers hourly transportation between The Bronx and JFK/LGA Airport.</div>
                    <Link to='/' className="btn">
                        <div>LEARN MORE</div>
                        <FaLongArrowAltRight color="white" />
                    </Link>
                </div>
            </div>
        </div>
    )
};

export default Home;