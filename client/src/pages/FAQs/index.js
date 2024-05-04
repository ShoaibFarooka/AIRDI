import React, { useEffect, useRef } from 'react';
import './index.css';
import { Collapse, Table } from 'antd';
import image from '../../assets/faq-image.png';
import * as data from './data';

const items = [
    {
        key: '1',
        label: 'What is Airdi?',
        children: <p>Airdi is an airport shuttle bus company providing scheduled transportation from various NYC neighborhoods to LaGuardia & JFK Airport.</p>
    },
    {
        key: '2',
        label: 'When does the service begin?',
        children: <>
            <p>Please see the table below for our tentative service commencement dates and ticket sale dates.</p>
            <Table dataSource={data.dataSource1} bordered pagination={false} columns={data.columns1} />
        </>,
    },
    {
        key: '3',
        label: 'What is the booking process?',
        children: <ol style={{ margin: 0 }} >
            <li>First visit the booking page on our website, input the travel criteria (departure, destination, travel date(s), etc.) and click search.</li>
            <li>Select your preferred departure time and complete booking. **Please note most airlines recommend arriving 2-3 hours before your flight.</li>
            <li>Show up to the boarding location, present your ticket and board. It's as easy as 1-2-3.</li>
        </ol >
    },
    {
        key: '4',
        label: 'Where are the boarding locations?',
        children: <p>Our service will initially launch from our main hub in the Bronx, located around Fordham Rd & Webster Ave. Our inaugural route from the Bronx will directly connect Fordham Road to LaGuardia & JFK Airport. We are actively planning to expand our service to various neighborhoods in the Bronx, Brooklyn, and Manhattan. For the latest updates on our expanding routes and boarding locations, we encourage you to join our email list.</p>
    },
    {
        key: '5',
        label: 'How early should I arrive at the boarding location?',
        children: <p>We recommend arriving at the boarding location at least 20 minutes prior to the scheduled departure time.</p>
    },
    {
        key: '6',
        label: 'What is your pricing structure?',
        children: <>
            <p>General pricing between Fordham & LaGuardia starts at $20 while trips between Fordham & JFK airport will start at $25. Please see below for our pricing structure. We encourage you to book in advance and save more money.</p>
            <h2>Fordham ⇄ JFK Airport</h2>
            <Table dataSource={data.dataSource2} bordered pagination={false} columns={data.columns2} />
            <h2>Fordham ⇄ LaGuardia Airport</h2>
            <Table dataSource={data.dataSource3} bordered pagination={false} columns={data.columns2} />
        </>
    },
    {
        key: '7',
        label: 'How do I know what time to book?',
        children: <p>We've made it easy by displaying the anticipated arrival times. Unforeseen circumstances like traffic can and will affect the schedule so please give yourself ample time. Passengers should aim to arrive at the airport 2-3 hours before their scheduled departure or defer to their airline's recommended arrival time if it's more.</p>
    },
    {
        key: '8',
        label: 'How far in advance should I book my ticket?',
        children: <p>It is recommended to book your ticket as early as possible to secure your preferred departure time, especially during peak travel seasons. Booking in advance not only ensures availability but also offers cost savings. However, you can generally book up until the day of travel, subject to availability.</p>
    },
    {
        key: '9',
        label: 'Is there a limit to the amount of luggage I can bring?',
        children: <p>There is no limit to the amount of luggage you can bring aboard our buses. We strive to accommodate all our passengers' needs, ensuring a comfortable and convenient journey for everyone.</p>
    },
    {
        key: '10',
        label: 'Can I modify my booking?',
        children: <p>Tickets can't be modified after booking however you can always cancel and rebook or you can reach out to customer support for changes.</p>
    },
    {
        key: '11',
        label: 'What is your cancellation and refund policy?',
        children: <p>Cancellation is allowed online up to 24 hours before departure and any time before departure via customer support. Upon cancellation, a refund will be issued in the form of a credit for future use. Credits are valid for 180 days from issue date. Refunds back to original payments will incur a $3 deduction per passenger due to non-refundable card processing fees by our payment processor.</p>
    },
    {
        key: '12',
        label: 'What happens if I miss my Airdi bus departure time?',
        children: <p>If you arrive at a boarding location and your bus has already departed, please speak to one of our Boarding Coordinators. Depending on availability, we will do our best to accommodate you on the next available departure.</p>
    },
];

const FAQs = () => {
    const faqRef = useRef(null);

    useEffect(() => {
        if (faqRef) {
            faqRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [faqRef]);

    return (
        <div className='faqs' ref={faqRef}>
            <div className='header'>
                <div className='content'>
                    <div className='title'>Frequently Asked Questions</div>
                    <p className='para'>Welcome to our FAQ page! We're here to address all your bus journey queries and ensure your travel experience with us is hassle-free. Whether you're a frequent traveler or embarking on your first adventure, find quick answers to common questions about ticketing, schedules, amenities, and more. Travel confidently with Airdi!</p>
                </div>
                <div className='image-container'>
                    <img src={image} className='image' alt='dog' />
                </div>
            </div>
            <div className='accordin'>
                <Collapse accordion items={items} className='collapse' />
            </div>
        </div>
    );
}

export default FAQs;