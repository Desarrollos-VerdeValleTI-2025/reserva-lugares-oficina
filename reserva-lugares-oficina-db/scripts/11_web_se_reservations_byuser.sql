-- Devuelve las reservas activas y futuras del usuario indicado.

DROP PROCEDURE IF EXISTS web_se_reservations_byuser;

DELIMITER $$
CREATE PROCEDURE web_se_reservations_byuser(
    IN p_user_email VARCHAR(128)
)
READS SQL DATA
BEGIN
    SELECT r.id, r.id_seat, s.code AS seat_code, r.reservation_date, r.user_email
    FROM dbo_reservations r
    JOIN dbo_seats s ON r.id_seat = s.id
    WHERE r.user_email = p_user_email
      AND r.is_active = TRUE
      AND r.is_deleted = FALSE
      AND r.reservation_date >= CURDATE();
END$$
DELIMITER ;