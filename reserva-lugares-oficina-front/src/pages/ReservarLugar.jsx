import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DatePicker, Button, Space, message, Typography, Spin, Alert, Popconfirm } from "antd";
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
    const [cargandoLugares, setCargandoLugares] = useState(true);
    const [selectedSeatId, setSelectedSeatId] = useState(reservaAEditar?.seatId ?? null);
    const navigate = useNavigate();
    const esPrimeraCarga = useRef(true);

    useEffect(() => {
        const loadSeats = async () => {
            setCargandoLugares(true);
            const data = await getSeatsByDate(date.format("YYYY-MM-DD"));
            setSeats(data);
            setCargandoLugares(false);
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
            try {
                if (reservaAEditar) {
                    await updateReservation(reservaAEditar.id, { seatId: selectedSeatId, date: date.format("YYYY-MM-DD") });
                    message.success("Reserva actualizada correctamente");
                } else {
                    await createReservation({ seatId: selectedSeatId, date: date.format("YYYY-MM-DD") });
                    message.success("Reserva creada correctamente");
                }
                navigate("/");
            } catch (err) {
                message.error(err.message);
            }
        }
    };

    const handleVolver = () => navigate("/");

    // No se puede reservar en una fecha ya pasada
    const deshabilitarFechasPasadas = (fecha) => fecha && fecha < dayjs().startOf("day");

    const todosOcupados = seats.length > 0 && seats.every((seat) => seat.status === "ocupado");

    return (
        <Space orientation="vertical" size="large" style={{ display: "flex" }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
                {reservaAEditar ? "Editar reserva" : "Reservar lugar"}
            </Typography.Title>

            <DatePicker value={date} onChange={setDate} allowClear={false} disabledDate={deshabilitarFechasPasadas} />

            {!cargandoLugares && todosOcupados && (
                <Alert
                    type="warning"
                    showIcon
                    message="No hay lugares disponibles para esta fecha, prueba con otra."
                />
            )}

            <Spin spinning={cargandoLugares}>
                <SeatMap
                    seats={seats}
                    mode="select"
                    selectedSeatId={selectedSeatId}
                    onSelectSeat={setSelectedSeatId}
                />
            </Spin>

            <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                {selectedSeatId ? (
                    <Popconfirm
                        title="¿Descartar el lugar seleccionado?"
                        onConfirm={handleVolver}
                        okText="Sí, descartar"
                        cancelText="No"
                    >
                        <Button icon={<ArrowLeftOutlined />}>Cancelar</Button>
                    </Popconfirm>
                ) : (
                    <Button icon={<ArrowLeftOutlined />} onClick={handleVolver}>
                        Cancelar
                    </Button>
                )}
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
