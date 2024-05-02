import { createSlice } from '@reduxjs/toolkit';
import countryData from 'country-data';

const initialState = {
    countryCodes: [],
};

export const countryCodeSlice = createSlice({
    name: 'countryCode',
    initialState,
    reducers: {
        setCountryCodes: (state, action) => {
            state.countryCodes = action.payload;
        },
    },
});

export const { setCountryCodes } = countryCodeSlice.actions;

// Thunk to fetch country codes
export const fetchCountryCodes = () => (dispatch) => {
    const uniqueCodes = [...new Set(countryData.callingCountries.all.map(country => country.countryCallingCodes[0].replace(/\s/g, '')))];

    const sortedCodes = uniqueCodes.map(code => ({
        label: code,
        value: code
    })).sort((a, b) => {
        const numericA = parseInt(a.value.replace(/\D/g, ''), 10); // Extract numeric part and convert to integer
        const numericB = parseInt(b.value.replace(/\D/g, ''), 10); // Extract numeric part and convert to integer
        return numericA - numericB; // Compare numerically
    });

    dispatch(setCountryCodes(sortedCodes));
};

// Selector to get country codes
export const selectCountryCodes = (state) => state.countryCode.countryCodes;

export default countryCodeSlice.reducer;
