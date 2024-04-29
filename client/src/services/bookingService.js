import axiosInstance from './axiosInstance';

const bookingService = {
    searchBooking: async (payload) => {
        try {
            const response = await axiosInstance.post(`/booking/search-ticket`, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    verifyBooking: async (bookingId) => {
        try {
            const response = await axiosInstance.get(`/booking/verify-ticket/${bookingId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    cancelBooking: async (payload) => {
        try {
            const response = await axiosInstance.put(`/booking/cancel-ticket`, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    downloadBooking: async (bookingId) => {
        try {
            const response = await axiosInstance.get(`/booking/download-ticket/${bookingId}`, {
                responseType: 'arraybuffer',
                headers: {
                    Accept: 'application/pdf',
                },
            });
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default bookingService;