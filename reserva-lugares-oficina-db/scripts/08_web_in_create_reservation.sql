-- Crea una reserva para p_seat_id en p_date, validando que la fecha no sea pasada
-- y que el lugar esté disponible. Devuelve el id de la reserva creada.

DROP PROCEDURE IF EXISTS web_in_create_reservation;

DELIMITER $$
CREATE PROCEDURE web_in_create_reservation(
    IN p_seat_id INT,
    IN p_date DATE,
    IN p_user_email VARCHAR(128)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_reservation_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
   
    IF p_seat_id IS NULL 
    OR p_date IS NULL
    OR p_user_email IS NULL THEN SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'No se permiten parámetros nulos. ';
    END IF;
   
    IF p_date < CURDATE() THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'La fecha de reserva no puede ser anterior a hoy. ';
    END IF;
   
    IF NOT fn_seat_is_available(p_seat_id, p_date) THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'El lugar no está disponible para la fecha indicada. ';
    END IF; START TRANSACTION;

    INSERT INTO dbo_reservations (id_seat, reservation_date, user_email)
    VALUES (p_seat_id, p_date, p_user_email);
    SET v_reservation_id = LAST_INSERT_ID();

    COMMIT;
    SELECT v_reservation_id AS reservation_id;
    
END$$
DELIMITER ;
