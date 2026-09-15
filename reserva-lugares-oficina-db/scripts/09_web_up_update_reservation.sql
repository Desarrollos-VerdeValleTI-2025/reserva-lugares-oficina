-- Actualiza el lugar/fecha de una reserva existente, validando que pertenezca
-- al usuario y que el nuevo lugar/fecha esté disponible. Devuelve el id actualizado.

DROP PROCEDURE IF EXISTS web_up_update_reservation;

DELIMITER $$
CREATE PROCEDURE web_up_update_reservation(
    IN p_reservation_id INT,
    IN p_new_seat_id INT,
    IN p_new_date DATE,
    IN p_user_email VARCHAR(128)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_current_user_email VARCHAR(128);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION

    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_reservation_id IS NULL 
    OR p_new_seat_id IS NULL
    OR p_new_date IS NULL
    OR p_user_email IS NULL THEN SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'No se permiten parámetros nulos. ';
    END IF;
    
    SELECT user_email INTO v_current_user_email FROM dbo_reservations
    WHERE id = p_reservation_id AND is_active = TRUE AND is_deleted = FALSE; 
    
    IF v_current_user_email IS NULL THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'La reserva no existe.';
    END IF;
    
    IF v_current_user_email <> p_user_email THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'La reserva no pertenece al usuario indicado.';
    END IF; START TRANSACTION;

    UPDATE dbo_reservations SET is_active = FALSE WHERE id = p_reservation_id;

    IF NOT fn_seat_is_available(p_new_seat_id, p_new_date) THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'El lugar no está disponible para la fecha indicada.';
    END IF;

    UPDATE dbo_reservations SET id_seat = p_new_seat_id, reservation_date = p_new_date,
    is_active = TRUE WHERE id = p_reservation_id;

    COMMIT;
    SELECT p_reservation_id AS reservation_id;
END$$
DELIMITER ;
