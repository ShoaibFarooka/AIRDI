import React from 'react';
import './index.css';
import { MdArrowBackIos } from "react-icons/md";
import Routes from '../Routes';
import Feedback from '../Feedback';
import Contact from '../Contact';

const HelpDetails = ({ view, setView }) => {
    return (
        <div className='help-details'>
            <button onClick={() => setView(null)} className='back-btn'>
                <MdArrowBackIos size={14} />
                <div>Back</div>
            </button>

            {view === 'routes' ?
                <Routes />
                : view === 'feedback' ?
                    <Feedback />
                    :
                    <Contact />
            }
        </div>
    )
};

export default HelpDetails;