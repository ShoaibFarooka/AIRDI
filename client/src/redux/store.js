import { configureStore } from "@reduxjs/toolkit";
import loaderSlice  from "./loaderSlice";
import busDataSlice from "./busSlice";
import countryCodeSlice, { fetchCountryCodes } from "./countryCodeSlice";

const store = configureStore({
    reducer: {
        busData: busDataSlice,
        loader : loaderSlice,
        countryCode: countryCodeSlice
    },
});

// Fetch country codes when store is initialized
store.dispatch(fetchCountryCodes());

export default store;