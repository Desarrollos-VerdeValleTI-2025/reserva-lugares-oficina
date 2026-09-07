-- Cancela una reserva (is_active = FALSE, is_deleted = TRUE, deleted_at = ahora)
-- validando que pertenezca al usuario indicado. No borra el registro (sigue siendo un UPDATE).

DROP PROCEDURE IF EXISTS web_de_cancel_reservation;

DELIMITER $$
CREATE PROCEDURE web_de_cancel_reservation(
    IN p_reservation_id INT,
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
    OR p_user_email IS NULL 
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se permiten parámetros nulos. ';
    END IF;

    SELECT user_email INTO v_current_user_email FROM dbo_reservations
    WHERE id = p_reservation_id AND is_active = TRUE AND is_deleted = FALSE;
    
    IF v_current_user_email IS NULL THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'La reserva no existe.';
    END IF;
    
    IF v_current_user_email <> p_user_email THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'La reserva no pertenece al usuario indicado.';
    END IF; START TRANSACTION;
 
    UPDATE dbo_reservations
    SET is_active = FALSE, is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
    WHERE id = p_reservation_id;

    COMMIT;
    SELECT p_reservation_id AS reservation_id;
END$$
DELIMITER ;

