const pool = require('../db/connection');
const seatsService = require('./seatsService');
const BusinessError = require('../middlewares/businessError');

const getReservationsByUserEmail = async (userEmail) => {
  const [rows] = await pool.execute('CALL web_se_reservations_byuser(?)', [userEmail]);
  return rows[0].map((r) => ({
    id: r.id,
    seatId: r.id_seat,
    seatCode: r.seat_code,
    date: r.reservation_date,
    userEmail: r.user_email
  }));
};

const createReservation = async ({ seatId, date, userEmail }) => {
  try {
    const [rows] = await pool.execute('CALL web_in_create_reservation(?, ?, ?)', [seatId, date, userEmail]);
    const reservationId = rows[0][0].reservation_id;
    const seat = await seatsService.getSeatsGrid(date);
    const seatCode = seat.find((s) => s.id === seatId)?.code || null;
    return { id: reservationId, seatId, seatCode, date, userEmail };
  } catch (err) {
    if (err.code === 'ER_SIGNAL_EXCEPTION') {
      throw new BusinessError(err.sqlMessage);
    }
    throw err;
  }
};

const updateReservation = async (id, { seatId, date, userEmail }) => {
  try {
    const [rows] = await pool.execute('CALL web_up_update_reservation(?, ?, ?, ?)', [id, seatId, date, userEmail]);
    const updatedReservationId = rows[0][0].reservation_id;
    const seat = await seatsService.getSeatsGrid(date);
    const seatCode = seat.find((s) => s.id === seatId)?.code || null;
    return { id: updatedReservationId, seatId, seatCode, date, userEmail };
  } catch (err) {
    if (err.code === 'ER_SIGNAL_EXCEPTION') {
      throw new BusinessError(err.sqlMessage);
    }
    throw err;
  }
};

const deleteReservation = async (id, userEmail) => {
  try {
    await pool.execute('CALL web_de_cancel_reservation(?, ?)', [id, userEmail]);
    return { id };
  } catch (err) {
    if (err.code === 'ER_SIGNAL_EXCEPTION') {
      throw new BusinessError(err.sqlMessage);
    }
    throw err;
  }
};

module.exports = {
  getReservationsByUserEmail,
  createReservation,
  updateReservation,
  deleteReservation,
};