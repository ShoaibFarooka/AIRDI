import axiosInstance from './axiosInstance';

const paymentService = {
    stripeCheckout: async (payload) => {
        try {
            const response = await axiosInstance.post(`/payments/stripe-checkout`, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default paymentService;