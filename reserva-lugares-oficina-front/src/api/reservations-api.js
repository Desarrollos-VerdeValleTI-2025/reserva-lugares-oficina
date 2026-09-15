import httpClient from './httpClient';

// userEmail ya no se manda por query — el backend lo obtiene del token (Actividad 4).
export const getMyReservations = async () => {
    return httpClient.get('reservations/me');
};

export const createReservation = async ({ seatId, date }) => {
    return httpClient.post('reservations', { seatId, date });
};

export const updateReservation = async (reservationId, { seatId, date }) => {
    return httpClient.put(`reservations/${reservationId}`, { seatId, date });
};

export const deleteReservation = async (reservationId) => {
    return httpClient.delete(`reservations/${reservationId}`);
};