import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout, Typography, theme, Button, Card, Space, Dropdown, Avatar } from 'antd';
import { LoginOutlined, UserOutlined, LogoutOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { useAuth } from './features/auth/useAuth.js';
import Inicio from './pages/Inicio.jsx';
import ReservarLugar from './pages/ReservarLugar.jsx';

const { Header, Content } = Layout;
const { Title } = Typography;

function PantallaLogin({ iniciarSesion }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: token.colorPrimary,
      }}
    >
      <Card bordered={false} style={{ maxWidth: 360, width: '100%', textAlign: 'center', background: token.colorBgContainer }}>
        <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0, color: token.colorPrimary }}>
            <EnvironmentOutlined style={{ marginRight: 10 }} />
            Reserva de Lugares
          </Title>
          <p style={{ margin: 0, color: token.colorText }}>Inicia sesión con tu cuenta de Verde Valle para reservar tu lugar.</p>
          <Button
            type="primary"
            icon={<LoginOutlined />}
            size="large"
            block
            style={{ background: token.colorPrimaryHover, borderColor: token.colorPrimaryHover }}
            onClick={iniciarSesion}
          >
            Iniciar sesión
          </Button>
        </Space>
      </Card>
    </div>
  );
}

function App() {
  const { token } = theme.useToken();
  const { usuarioActual, iniciarSesion, cerrarSesion } = useAuth();
  const menuUsuario = {
    items: [
      { key: 'email', label: usuarioActual?.username, disabled: true },
      { type: 'divider' },
      { key: 'logout', label: 'Cerrar sesión', icon: <LogoutOutlined />, onClick: cerrarSesion },
    ],
  };
  return (
        <BrowserRouter>
            <UnauthenticatedTemplate>
                <PantallaLogin iniciarSesion={iniciarSesion} />
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
                <Layout style={{ minHeight: '100vh' }}>
                    <Header style={{ background: token.colorPrimary, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: token.paddingLG }}>
                        {<Link to="/">
                            <Title level={3} style={{ margin: 0, color: token.colorWhite }}>
                              <EnvironmentOutlined style={{ marginRight: 10 }} />
                              Reserva de Lugares
                            </Title>
                          </Link>}
                        <Dropdown menu={menuUsuario} placement="bottomRight" trigger={['click']}>
                            <Avatar
                                icon={<UserOutlined />}
                                style={{ cursor: 'pointer', backgroundColor: token.colorPrimaryHover }}
                            />
                        </Dropdown>
                    </Header>
                    <Content style={{ padding: token.paddingLG }}>
                        <Routes>
                            <Route path="/" element={<Inicio />} />
                            <Route path="/reservar" element={<ReservarLugar />} />
                        </Routes>
                    </Content>
                </Layout>
            </AuthenticatedTemplate>
        </BrowserRouter>
    );
}
export default App
