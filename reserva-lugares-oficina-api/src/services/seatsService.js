const pool = require('../db/connection');

const getSeatsGrid = async (date) => {
  const [rows] = await pool.execute('CALL web_se_seats_bydate(?)', [date]);
  return rows[0].map((seat) => ({
    id: seat.id,
    code: seat.code,
    row: seat.seat_row,
    column: seat.seat_column,
    status: seat.status
  }));
};

module.exports = { getSeatsGrid };
