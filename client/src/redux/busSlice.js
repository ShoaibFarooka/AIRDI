import { createSlice } from "@reduxjs/toolkit";

const busDataSlice = createSlice({
  name: "busData",
  initialState: {
    busData: {
      journeyBus: null,
      returnBus: null,
    },
  },
  reducers: {
    setBusData: (state, action) => {
      state.busData = action.payload;
    },
  },
});

export const { setBusData } = busDataSlice.actions;
export default busDataSlice.reducer;
