import React from 'react';
import "./App.css";
import { Route, Routes } from 'react-router-dom';
import Loader from "./components/Loader.js";
import { useSelector } from "react-redux";
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Checkout from './pages/Checkout/index.js';
import ManageBooking from './pages/ManageBooking/index.js';
import Success from './pages/Success/index.js';

function App() {
  const { loading } = useSelector((state) => state.loader);

  return (
    <div className="App">
      {loading && <Loader />}
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <Home />
            <Footer />
          </>
        } />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/manage-booking" element={
          <>
            <Header />
            <ManageBooking />
            <Footer />
          </>
        } />
        <Route path="/success" element={
          <>
            <Header />
            <Success />
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
