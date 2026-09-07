import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DatePicker, Button, Space } from "antd";
import { ArrowLeftOutlined, CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getSeatsByDate } from "../api/seats-api.js";
import { createReservation, updateReservation } from "../api/reservations-api.js";
import SeatMap from "../components/SeatMap.jsx";

function ReservarLugar() {
    const location = useLocation();
    // Si venimos de "Editar" en Inicio, location.state trae la reserva a modificar.
    const reservaAEditar = location.state?.reservaAEditar ?? null;

    const [date, setDate] = useState(reservaAEditar ? dayjs(reservaAEditar.date) : dayjs());
    const [seats, setSeats] = useState([]);
    const [selectedSeatId, setSelectedSeatId] = useState(reservaAEditar?.seatId ?? null);
    const navigate = useNavigate();
    const esPrimeraCarga = useRef(true);

    useEffect(() => {
        const loadSeats = async () => {
            const data = await getSeatsByDate(date.format("YYYY-MM-DD"));
            setSeats(data);
            // Solo limpiamos el lugar seleccionado si el usuario cambió la fecha manualmente,
            // no en la carga inicial (para conservar la preselección al editar).
            if (esPrimeraCarga.current) {
                esPrimeraCarga.current = false;
            } else {
                setSelectedSeatId(null);
            }
        };
        loadSeats();
    }, [date]);

    const handleConfirmar = async () => {
        if (selectedSeatId && date) {
            if (reservaAEditar) {
                await updateReservation(reservaAEditar.id, { seatId: selectedSeatId, date: date.format("YYYY-MM-DD") });
            } else {
                await createReservation({ seatId: selectedSeatId, date: date.format("YYYY-MM-DD") });
            }
            navigate("/");
        }
    };

    return (
        <Space orientation="vertical" size="large" style={{ display: "flex" }}>
            <DatePicker value={date} onChange={setDate} allowClear={false}/>

            <SeatMap
                seats={seats}
                mode="select"
                selectedSeatId={selectedSeatId}
                onSelectSeat={setSelectedSeatId}
            />

            <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
                    Cancelar
                </Button>
                <Button
                    icon={<CheckOutlined />}
                    type="primary"
                    disabled={!(selectedSeatId && date)}
                    onClick={handleConfirmar}
                >
                    {reservaAEditar ? "Guardar cambios" : "Confirmar reserva"}
                </Button>
            </Space>
        </Space>
    );
}
export default ReservarLugar;