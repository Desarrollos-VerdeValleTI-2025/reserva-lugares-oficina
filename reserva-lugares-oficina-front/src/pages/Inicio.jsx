import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {Card, Button, Modal, Space, Popconfirm, Tag, Row, Col, Typography, Empty, Skeleton, message, Result} from "antd";
import {EyeOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, CalendarOutlined, PlusOutlined, CheckCircleOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import {getMyReservations, deleteReservation} from "../api/reservations-api.js";
import {getSeatsByDate} from "../api/seats-api.js";
import SeatMap from "../components/SeatMap.jsx";

// Convierte una fecha en un texto relativo tipo "Hoy", "Mañana" o "En 3 días"
const formatearFechaRelativa = (fecha) => {
    const hoy = dayjs().startOf("day");
    const objetivo = dayjs(fecha).startOf("day");
    const diferenciaDias = objetivo.diff(hoy, "day");
    if (diferenciaDias === 0) return "Hoy";
    if (diferenciaDias === 1) return "Mañana";
    if (diferenciaDias === -1) return "Ayer";
    if (diferenciaDias > 1) return `En ${diferenciaDias} días`;
    return `Hace ${Math.abs(diferenciaDias)} días`;
};

function Inicio(){
    const [reservations, setReservations] = useState(null);
    const [seats, setSeats] = useState([]);
    const [error, setError] = useState(null);
    const[isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const cargarReservas = async () => {
        try {
            setError(null);
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
        return (
            <Result
                status="error"
                title="Ocurrió un error al cargar tus reservas"
                subTitle={error}
                extra={
                    <Button type="primary" onClick={cargarReservas}>
                        Reintentar
                    </Button>
                }
            />
        );
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
            message.success("Reserva cancelada correctamente");
        } catch (err) {
            setError(err.message);
        }
    };

    if (reservations === null) {
        return (
            <>
                <Typography.Title level={4} style={{ marginTop: 0 }}>Mis reservas</Typography.Title>
                <Card style={{ borderRadius: 12 }}>
                    <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
            </>
        );
    }
    return (
        <>
            <Typography.Title level={4} style={{ marginTop: 0 }}>Mis reservas</Typography.Title>
            {miReserva ? (
                <Card hoverable style={{ borderRadius: 12 }}>
                    <Row justify="space-between" align="middle" gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Space direction="vertical" size={8}>
                                <Tag icon={<CheckCircleOutlined />} color="success">Confirmada</Tag>
                                <Space size="large" wrap>
                                    <Typography.Text>
                                        <EnvironmentOutlined style={{ marginRight: 6 }} />
                                        Lugar: <strong>{miReserva.seatCode}</strong>
                                    </Typography.Text>
                                    <Typography.Text>
                                        <CalendarOutlined style={{ marginRight: 6 }} />
                                        Fecha: <strong>{miReserva.date}</strong>{" "}
                                        <Typography.Text type="secondary">
                                            ({formatearFechaRelativa(miReserva.date)})
                                        </Typography.Text>
                                    </Typography.Text>
                                </Space>
                            </Space>
                        </Col>
                        <Col xs={24} md={12}>
                            <Space wrap style={{ display: "flex", justifyContent: "flex-end" }}>
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
                        </Col>
                    </Row>
                </Card>
            ) : (
                <Card hoverable style={{ borderRadius: 12, textAlign: "center" }}>
                    <Empty description="Todavía no tienes lugar apartado">
                        <Button icon={<PlusOutlined />} type="primary" size="large" onClick={handleApartarLugar}>
                            Apartar lugar
                        </Button>
                    </Empty>
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
