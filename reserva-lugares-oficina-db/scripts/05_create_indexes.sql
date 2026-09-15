CREATE INDEX idx_dbo_reservations_id_seat_reservation_date 
ON dbo_reservations (id_seat, reservation_date);

CREATE INDEX idx_dbo_reservations_user_email 
ON dbo_reservations (user_email);

SHOW INDEX FROM dbo_reservations;