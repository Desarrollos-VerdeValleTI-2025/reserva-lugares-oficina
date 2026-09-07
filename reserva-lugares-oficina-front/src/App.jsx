import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout, Typography, theme, Button, Card, Space } from 'antd';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { useAuth } from './features/auth/useAuth.js';
import Inicio from './pages/Inicio.jsx';
import ReservarLugar from './pages/ReservarLugar.jsx';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const { token } = theme.useToken();
  const { usuarioActual, iniciarSesion, cerrarSesion } = useAuth();
  return (
        <BrowserRouter>
            <Layout style={{ minHeight: '100vh' }}>
                <Header style={{ background: token.colorPrimary, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: token.paddingLG }}>
                    {<Link to="/">
                        <Title level={3} style={{ margin: 0, color: token.colorWhite }}>
                          Reserva de Lugares
                        </Title>
                      </Link>}
                    <AuthenticatedTemplate>
                        <Space>
                            <span style={{ color: token.colorWhite }}>{usuarioActual?.username}</span>
                            <Button onClick={cerrarSesion}>Cerrar sesión</Button>
                        </Space>
                    </AuthenticatedTemplate>
                </Header>
                <Content style={{ padding: token.paddingLG }}>
                    <AuthenticatedTemplate>
                        <Routes>
                            <Route path="/" element={<Inicio />} />
                            <Route path="/reservar" element={<ReservarLugar />} />
                        </Routes>
                    </AuthenticatedTemplate>
                    <UnauthenticatedTemplate>
                        <Card>
                            <p>Inicia sesión con tu cuenta de Verde Valle para reservar tu lugar.</p>
                            <Button type="primary" onClick={iniciarSesion}>Iniciar sesión</Button>
                        </Card>
                    </UnauthenticatedTemplate>
                </Content>
            </Layout>
        </BrowserRouter>
    );
}
export default App
