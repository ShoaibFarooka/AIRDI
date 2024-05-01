import React, { useState, useEffect, useRef } from "react";
import './index.css';
import { Link } from "react-router-dom";
import { message, DatePicker } from 'antd';
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
    const [departures, setDepartures] = useState([]);
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        journeyDate: '',
        returnDate: ''
    });
    const [autoFetch, setAutoFetch] = useState(false);
    const [error, setError] = useState(null);
    const [arrivals, setArrivals] = useState([]);
    const [outwardBuses, setOutwardBuses] = useState([]);
    const [returnBuses, setReturnBuses] = useState([]);
    const [journeyDateChanged, setJourneyDateChanged] = useState(false);
    const [returnDateChanged, setReturnDateChanged] = useState(false);
    const [thresholdTime, setThresholdTime] = useState(0);
    const searchRef = useRef(null);
    const resultRef = useRef(null);

    const dispatch = useDispatch();

    const fetchAllDeparturesAndArrivals = async () => {
        try {
            const response = await busService.getAllDepartures();
            if (response.departurePoints) {
                setDepartures(response.departurePoints);
            }
        } catch (error) {
            message.error(error.response.data);
        }
        try {
            const response = await busService.getAllArrivals();
            if (response.arrivalPoints) {
                setArrivals(response.arrivalPoints);
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

    useEffect(() => {
        dispatch(ShowLoading());
        fetchAllDeparturesAndArrivals();
        fetchThresholdTime();
        dispatch(HideLoading());
        const savedFormData = localStorage.getItem('formData');
        if (savedFormData) {
            setFormData(JSON.parse(savedFormData));
            setAutoFetch(true);
        }
        else {
            window.scrollTo(0, 0);
        }
    }, []);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'journeyDate') {
            const NYDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
            const currentDate = new Date(NYDate).setHours(0, 0, 0, 0);
            const selectedDate = new Date(value).setHours(0, 0, 0, 0);
            let returnDate;
            if (formData.returnDate) {
                returnDate = new Date(formData.returnDate).setHours(0, 0, 0, 0);
            }
            if (selectedDate >= currentDate) {
                if (returnDate && returnDate < selectedDate) {
                    return message.error('Please select a date before return date.');
                }
                setFormData({ ...formData, [name]: value });
            }
            else {
                return message.error('Please select a date from today or in the future.');
            }
        }
        else if (name === 'returnDate') {
            if (!formData.journeyDate) {
                return message.error('Please select journey date first.')
            }
            else {
                const jdate = new Date(formData.journeyDate);
                const rdate = new Date(value);
                if (rdate < jdate) {
                    return message.error('Please select a date from journey date or in the future.');
                }
                else {
                    setFormData({ ...formData, [name]: value });
                }
            }

        } else {
            // If other fields are changed, update the state normally
            setFormData((prevData) => ({
                ...prevData,
                [name]: value
            }));
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
    }

    const handleSearch = async (stopReRender) => {
        if (!stopReRender) {
            setOutwardBuses([]);
            setReturnBuses([]);
        }
        if (!formData.from || !formData.to || !formData.journeyDate) {
            return message.error('Please fill all required fields');
        }
        else if (isDatePassed(formData.journeyDate)) {
            return message.error('Please update the jouney date');
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
            setError(error.response.data);
            message.error(error.response.data);
        }
        localStorage.setItem('formData', JSON.stringify(formData));
        dispatch(HideLoading());
    }

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
                        <input
                            type="text"
                            id="from"
                            name="from"
                            list="departure-list"
                            className="search-input"
                            placeholder="Please Select"
                            value={formData.from}
                            onChange={handleInputChange}
                        />
                        <datalist id="departure-list">
                            {departures.map((point, index) => (
                                <option key={index} value={point} />
                            ))}
                        </datalist>
                    </div>
                    <div className="flex-row-item">
                        <label htmlFor="to" className="label">
                            <FaLocationDot size={20} />
                            <div>To:</div>
                        </label>
                        <input
                            type="text"
                            id="to"
                            name="to"
                            list="arrival-list"
                            className="search-input"
                            placeholder="Please Select"
                            value={formData.to}
                            onChange={handleInputChange}
                        />
                        <datalist id="arrival-list">
                            {arrivals.map((point, index) => (
                                <option key={index} value={point} />
                            ))}
                        </datalist>
                    </div>
                    <div className="flex-row-item">
                        <label htmlFor="journey-date" className="label">
                            <FaCalendarAlt size={21} />
                            <div>Departure</div>
                        </label>
                        <input
                            type="date"
                            id="journey-date"
                            name="journeyDate"
                            className="search-input"
                            value={formData.journeyDate}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="flex-row-item">
                        <label htmlFor="return-date" className="label">
                            <FaCalendarAlt size={21} />
                            <div>Return (Optional)</div>
                        </label>
                        <input
                            type="date"
                            id="return-date"
                            name="returnDate"
                            className="search-input"
                            value={formData.returnDate}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="flex-row-item flex-row-last-item">
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
                <div className="comment">
                    <div>"Getting to the airport just got much more affordable for Bronxites, thanks to Airdi"</div>
                    <div>- Bronx News 12</div>
                </div>
                <div className="cards-container">
                    <div className="cards-title">MEET AIRDI</div>
                    <div className="seperator"></div>
                    <div className="cards">
                        <div className="card">
                            <img src={Image1} alt="walking-person" />
                            <div className="title">Airdi is Convenient</div>
                            <p className="para">Frequent shuttle bus to the airport from convenient locations.</p>
                            <Link to='/' className="btn">
                                <div>LEARN MORE</div>
                                <FaLongArrowAltRight color="white" />
                            </Link>
                        </div>
                        <div className="card">
                            <img src={Image2} alt="market" />
                            <div className="title">Airdi is Affordable</div>
                            <p className="para">Getting to the airport doesn't have to cost the same price as your flight</p>
                            <Link to='/' className="btn">
                                <div>LEARN MORE</div>
                                <FaLongArrowAltRight color="white" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute-container">
                <div className="content">
                    <div className="title">BOOK NOW & SAVE UP TO 25% OFF</div>
                    <div className="seperator"></div>
                    <div className="para">Diremit mundi mare undae nunc mixtam tanto sibi. Nubes unda concordi. Fert his. Recessit mentes praecipites locum caligine sui egens erat. Silvas caeli regna.</div>
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