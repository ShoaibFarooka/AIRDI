import React from 'react';
import './index.css';

const NotFound = () => {
    return (
        <div className="not-found-container">
            <h1>404 - Not Found</h1>
            <p>Sorry, the page you are looking for might be in another castle.</p>
            <img
                src="https://i.imgur.com/qIufhof.png"
                alt="Mario 404"
                className="not-found-image"
            />
        </div>
    );
};

export default NotFound;
