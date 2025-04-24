// src/components/Header.jsx
import React, { useMemo } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function Header() {
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const user = useMemo(() => {
        if (!token) return null;
        try {
            return jwtDecode(token);
        } catch {
            return null;
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
        window.location.reload();
    };

    return (
        <Navbar bg="light" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand as={NavLink} to="/">
                    MyLandscapeApp
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-nav" />
                <Navbar.Collapse id="main-nav">
                    <Nav className="me-auto">
                        {user?.role === 'admin' && (
                            <Nav.Link as={NavLink} to="/admin">
                                Админка
                            </Nav.Link>
                        )}
                        <Nav.Link as={NavLink} to="/editor">
                            Редактор
                        </Nav.Link>
                    </Nav>
                    <Nav>
                        {!user ? (
                            <>
                                <Nav.Link as={NavLink} to="/auth">
                                    Вход
                                </Nav.Link>
                                <Nav.Link as={NavLink} to="/auth">
                                    Регистрация
                                </Nav.Link>
                            </>
                        ) : (
                            <Button variant="outline-secondary" onClick={handleLogout}>
                                Выйти
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
