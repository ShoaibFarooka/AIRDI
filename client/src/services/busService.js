import axiosInstance from './axiosInstance';

const busService = {
    getAllBuses: async (payload) => {
        try {
            const response = await axiosInstance.post(`/buses/find-bus`, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAllDepartures: async () => {
        try {
            const response = await axiosInstance.get(`/buses/get-all-departure-points`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAllArrivals: async () => {
        try {
            const response = await axiosInstance.get(`/buses/get-all-arrival-points`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getThresholdTime: async () => {
        try {
            const response = await axiosInstance.get(`/buses/get-threshold-time`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getBusAccess: async () => {
        try {
            const response = await axiosInstance.get(`/buses/get-access`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    verifyVoucher: async (payload) => {
        try {
            const response = await axiosInstance.post(`/buses/verify-voucher`, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

};

export default busService;