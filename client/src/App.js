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
import FAQs from './pages/FAQs/index.js';
import Help from './pages/Help/indes.js';
import NotFound from './pages/NotFound/index.js';

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
        <Route path="/faqs" element={
          <>
            <Header />
            <FAQs />
            <Footer />
          </>
        } />
        <Route path="/help" element={
          <>
            <Header />
            <Help />
            <Footer />
          </>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
