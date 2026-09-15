-- No se usa UNIQUE(id_seat, reservation_date) porque la cancelación es lógica (is_active)
CREATE TABLE dbo_reservations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    id_seat INT NOT NULL, 
    reservation_date DATE NOT NULL,
    user_email VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,   
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY(id_seat) REFERENCES dbo_seats(id)
) engine = innoDB;
