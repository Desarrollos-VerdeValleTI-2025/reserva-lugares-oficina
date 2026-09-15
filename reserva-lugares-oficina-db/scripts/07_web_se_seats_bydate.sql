-- Devuelve el grid de los 20 lugares con su estado (disponible/ocupado) para p_date.

DROP PROCEDURE IF EXISTS web_se_seats_bydate;

DELIMITER $$
CREATE PROCEDURE web_se_seats_bydate(
    IN p_date DATE
)
READS SQL DATA
BEGIN
    SELECT s.id, s.code, s.seat_row, s.seat_column,
           CASE WHEN r.id IS NULL THEN 'disponible' ELSE 'ocupado' END AS status
    FROM dbo_seats s
    LEFT JOIN dbo_reservations r
        ON r.id_seat = s.id
        AND r.reservation_date = p_date
        AND r.is_active = TRUE
        AND r.is_deleted = FALSE;
END$$
DELIMITER ;

