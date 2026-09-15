import httpClient from './httpClient';

export const getSeatsByDate = async (date) => {
    return httpClient.get('seats', { params: { date } });
};
