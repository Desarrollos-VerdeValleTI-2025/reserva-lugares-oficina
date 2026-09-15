-- Devuelve TRUE si el lugar (p_seat_id) está disponible en la fecha (p_date):
-- no existe una reserva activa y no eliminada para ese lugar y esa fecha.

DROP FUNCTION IF EXISTS fn_seat_is_available;

DELIMITER $$
CREATE FUNCTION fn_seat_is_available(
    p_seat_id INT,
    p_date DATE
)
RETURNS BOOLEAN
READS SQL DATA
NOT DETERMINISTIC
BEGIN
    DECLARE v_count INT;

    IF p_seat_id IS NULL OR p_date IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT COUNT(*) INTO v_count
    FROM dbo_reservations
    WHERE id_seat = p_seat_id
      AND reservation_date = p_date
      AND is_active = TRUE
      AND is_deleted = FALSE;
    
    IF v_count > 0 THEN
        RETURN FALSE;
    ELSE
        RETURN TRUE;
    END IF;
END$$
DELIMITER ;

