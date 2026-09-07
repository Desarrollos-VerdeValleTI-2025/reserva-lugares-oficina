import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {Card, Button, Modal, Space, Popconfirm} from "antd";
import {EyeOutlined, EditOutlined, DeleteOutlined} from "@ant-design/icons";
import {getMyReservations, deleteReservation} from "../api/reservations-api.js";
import {getSeatsByDate} from "../api/seats-api.js";
import SeatMap from "../components/SeatMap.jsx";

function Inicio(){
    const [reservations, setReservations] = useState(null);
    const [seats, setSeats] = useState([]);
    const [error, setError] = useState(null);
    const[isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const cargarReservas = async () => {
        try {
            const data = await getMyReservations();
            setReservations(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        cargarReservas();
    }, []);

    if (error) {
        return <p>Ocurrió un error al cargar tus reservas: {error}</p>;
    }

    const miReserva = reservations && reservations.length > 0 ? reservations[0] : null;
    const handleVerLugar = async () => {
        const data = await getSeatsByDate(miReserva.date);
        setSeats(data);
        setIsModalOpen(true);
    };
    const handleApartarLugar = () => {
        navigate("/reservar");
    };
    const handleEditar = () => {
        navigate("/reservar", { state: { reservaAEditar: miReserva } });
    };
    const handleCancelar = async () => {
        try {
            await deleteReservation(miReserva.id);
            await cargarReservas();
        } catch (err) {
            setError(err.message);
        }
    };
    if (reservations === null) {
        return <p>Cargando...</p>;
    }
    return (
        <>
            {miReserva ? (
                <Card>
                    <p><strong>Tienes lugar apartado: {miReserva.seatCode} el {miReserva.date}</strong></p>
                    <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button icon={<EyeOutlined />} type="primary" onClick={handleVerLugar}>Ver lugar</Button>
                        <Button icon={<EditOutlined />} onClick={handleEditar}>Editar</Button>
                        <Popconfirm
                            title="¿Cancelar esta reserva?"
                            onConfirm={handleCancelar}
                            okText="Sí, cancelar"
                            cancelText="No"
                        >
                            <Button icon={<DeleteOutlined />} danger>Cancelar</Button>
                        </Popconfirm>
                    </Space>
                </Card>
            ) : (
                <Card>
                    <p>No tienes lugar apartado</p>
                    <Button type="primary" onClick={handleApartarLugar}>Apartar lugar</Button>
                </Card>
            )}
            <Modal 
                title='Lugar reservado'
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <SeatMap seats={seats} mode="view" selectedSeatId={miReserva?.seatId} onSelectSeat={() => {}}/>
            </Modal>
        </>
        
    );
}
export default Inicio; 