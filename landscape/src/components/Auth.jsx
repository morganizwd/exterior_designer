// src/components/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

const Auth = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'user',
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError(null);
        try {
            const endpoint = isRegister ? '/api/users/register' : '/api/users/login';
            const { data } = await axios.post(endpoint, form);
            localStorage.setItem('token', data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при запросе');
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <h2 className="mb-4 text-center">{isRegister ? 'Регистрация' : 'Вход'}</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        {isRegister && (
                            <>
                                <Form.Group controlId="firstName" className="mb-3">
                                    <Form.Label>Имя</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        placeholder="Введите имя"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group controlId="lastName" className="mb-3">
                                    <Form.Label>Фамилия</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        placeholder="Введите фамилию"
                                        required
                                    />
                                </Form.Group>
                            </>
                        )}

                        <Form.Group controlId="email" className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Введите email"
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="password" className="mb-3">
                            <Form.Label>Пароль</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Введите пароль"
                                required
                            />
                        </Form.Group>

                        {isRegister && (
                            <Form.Group controlId="role" className="mb-3">
                                <Form.Label>Роль</Form.Label>
                                <Form.Select name="role" value={form.role} onChange={handleChange}>
                                    <option value="user">Пользователь</option>
                                    <option value="admin">Админ</option>
                                </Form.Select>
                            </Form.Group>
                        )}

                        <div className="d-grid gap-2">
                            <Button variant="primary" type="submit">
                                {isRegister ? 'Зарегистрироваться' : 'Войти'}
                            </Button>
                        </div>
                    </Form>

                    <div className="mt-3 text-center">
                        <Button variant="link" onClick={() => setIsRegister(!isRegister)}>
                            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Auth;