// src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Container, Nav, Tab, Table,
    Button, Modal, Form, Image,
    Row, Col, Spinner, Alert
} from 'react-bootstrap';

/** ----- Справочники ----- */
const categories = [
    'Дерево', 'Кустарник', 'Цветок', 'Скамейка', 'Фонтан',
    'Дорожка', 'Газон', 'Фонарь', 'Пруд', 'Статуя',
    'Беседка', 'Забор', 'Камень', 'Мульча', 'Терраса',
    'Детская площадка', 'Мангал', 'Сарай', 'Клумба', 'Шпалера'
];
const colors = [
    { name: 'Красный', value: '#FF0000' },
    { name: 'Оранжевый', value: '#FFA500' },
    { name: 'Жёлтый', value: '#FFFF00' },
    { name: 'Зелёный', value: '#008000' },
    { name: 'Синий', value: '#0000FF' },
    { name: 'Фиолетовый', value: '#800080' },
    { name: 'Розовый', value: '#FFC0CB' },
    { name: 'Коричневый', value: '#A52A2A' },
    { name: 'Серый', value: '#808080' },
    { name: 'Чёрный', value: '#000000' },
    { name: 'Белый', value: '#FFFFFF' },
    { name: 'Голубой', value: '#00FFFF' },
    { name: 'Пурпурный', value: '#FF00FF' },
    { name: 'Лайм', value: '#00FF00' },
    { name: 'Оливковый', value: '#808000' },
    { name: 'Тёмно-синий', value: '#000080' },
    { name: 'Бирюзовый', value: '#008080' },
    { name: 'Бордовый', value: '#800000' },
    { name: 'Серебристый', value: '#C0C0C0' },
    { name: 'Золотой', value: '#FFD700' },
];

const AdminPanel = () => {
    /* ----- табы ----- */
    const [key, setKey] = useState('shops');          // shops | assets | projects

    /* ----- данные ----- */
    const [shops, setShops] = useState([]);
    const [assets, setAssets] = useState([]);
    const [projects, setProjects] = useState([]);

    /* ----- модал ----- */
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create | edit | view
    const [currentItem, setCurrentItem] = useState({});
    const [form, setForm] = useState({});
    const [uploading, setUploading] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    /* ───────────────────────── Загрузка данных по вкладке ───────────────────────── */
    useEffect(() => {
        const load = async () => {
            try {
                if (key === 'shops') {
                    const { data } = await axios.get('/api/shops');
                    setShops(data);
                } else if (key === 'assets') {
                    const [{ data: s }, { data: a }] = await Promise.all([
                        axios.get('/api/shops'),
                        axios.get('/api/assets')
                    ]);
                    setShops(s);
                    setAssets(a);
                } else {
                    const [{ data: s }, { data: p }] = await Promise.all([
                        axios.get('/api/shops'),
                        axios.get('/api/projects')
                    ]);
                    setShops(s);
                    setProjects(p);
                }
            } catch (e) {
                alert('Ошибка загрузки данных');
            }
        };
        load();
    }, [key]);

    /* ───────────────────────── Открытие модала ───────────────────────── */
    const openModal = (mode, item = {}) => {
        setModalMode(mode);
        setCurrentItem(item);

        if (mode === 'edit') {
            if (key === 'shops') {
                setForm({ name: item.name, address: item.address, info: item.info });
            } else if (key === 'assets') {
                setForm({
                    shop: item.shop._id,
                    name: item.name,
                    url: item.url,
                    category: item.category,
                    color: item.color,
                    price: item.price,
                    width: item.width,
                    height: item.height
                });
            }
        } else {
            setForm({});
        }
        setShowModal(true);
    };

    /* ───────────────────────── Upload изображений для ассетов ───────────────────────── */
    const handleFileUpload = async e => {
        const file = e.target.files[0];
        if (!file) return;
        const dataForm = new FormData();
        dataForm.append('file', file);
        setUploading(true);
        try {
            const res = await axios.post('/api/upload', dataForm, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setForm(prev => ({ ...prev, url: res.data.url }));
        } catch {
            alert('Ошибка загрузки файла');
        } finally {
            setUploading(false);
        }
    };

    /* ───────────────────────── Проверка валидности формы ───────────────────────── */
    const isShopValid = form.name && form.address && form.info;
    const isAssetValid = form.shop && form.name && form.url && form.category
        && form.color && form.price !== undefined
        && form.width !== undefined && form.height !== undefined;
    const isFormValid =
        key === 'shops' ? isShopValid :
            key === 'assets' ? isAssetValid :
                true; // projects – форму не редактируем

    /* ───────────────────────── Сохранение ───────────────────────── */
    const handleSave = async () => {
        if (!isFormValid) return;

        if (key === 'shops') {
            if (modalMode === 'create')
                await axios.post('/api/shops', form, { headers });
            else
                await axios.put(`/api/shops/${currentItem._id}`, form, { headers });

            const { data } = await axios.get('/api/shops');
            setShops(data);
        }

        if (key === 'assets') {
            if (modalMode === 'create')
                await axios.post('/api/assets', form, { headers });
            else
                await axios.put(`/api/assets/${currentItem._id}`, form, { headers });

            const { data } = await axios.get('/api/assets');
            setAssets(data);
        }

        setShowModal(false);
    };

    /* ───────────────────────── Удаление сущностей ───────────────────────── */
    const handleDelete = async id => {
        if (!window.confirm('Удалить выбранный элемент?')) return;

        if (key === 'shops') {
            await axios.delete(`/api/shops/${id}`, { headers });
            const { data } = await axios.get('/api/shops');
            setShops(data);
        } else if (key === 'assets') {
            await axios.delete(`/api/assets/${id}`, { headers });
            const { data } = await axios.get('/api/assets');
            setAssets(data);
        } else {
            await axios.delete(`/api/projects/${id}`, { headers });
            const { data } = await axios.get('/api/projects');
            setProjects(data);
        }
    };

    /* ───────────────────────── Вспом-функция отображения цвета ───────────────────────── */
    const colorCell = clr => (
        <>
            <div style={{
                display: 'inline-block',
                width: 16, height: 16,
                backgroundColor: clr, border: '1px solid #ccc', marginRight: 4
            }} />
            {colors.find(c => c.value === clr)?.name}
        </>
    );

    return (
        <Container className="py-4">
            <Tab.Container activeKey={key} onSelect={setKey}>
                <Nav variant="tabs">
                    <Nav.Item><Nav.Link eventKey="shops">Магазины</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="assets">Ассеты</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="projects">Проекты</Nav.Link></Nav.Item>
                </Nav>

                <Tab.Content className="mt-3">

                    {/* ─────────────────────── Магазины ─────────────────────── */}
                    <Tab.Pane eventKey="shops">
                        <Button onClick={() => openModal('create')} className="mb-3">
                            Добавить магазин
                        </Button>
                        <Table bordered hover>
                            <thead>
                                <tr>
                                    <th>Название</th><th>Адрес</th><th>Инфо</th><th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shops.map(s => (
                                    <tr key={s._id}>
                                        <td>{s.name}</td>
                                        <td>{s.address}</td>
                                        <td>{s.info}</td>
                                        <td>
                                            <Button size="sm" onClick={() => openModal('edit', s)}>✏️</Button>{' '}
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(s._id)}>🗑️</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab.Pane>

                    {/* ─────────────────────── Ассеты ─────────────────────── */}
                    <Tab.Pane eventKey="assets">
                        <Button onClick={() => openModal('create')} className="mb-3">
                            Добавить ассет
                        </Button>
                        <Table bordered hover>
                            <thead>
                                <tr>
                                    <th>Магазин</th><th>Название</th><th>Превью</th>
                                    <th>Категория</th><th>Цвет</th><th>Цена</th><th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map(a => (
                                    <tr key={a._id}>
                                        <td>{a.shop.name}</td>
                                        <td>{a.name}</td>
                                        <td><Image src={a.url} thumbnail style={{ width: 80 }} /></td>
                                        <td>{a.category}</td>
                                        <td>{colorCell(a.color)}</td>
                                        <td>{a.price}</td>
                                        <td>
                                            <Button size="sm" onClick={() => openModal('edit', a)}>✏️</Button>{' '}
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(a._id)}>🗑️</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab.Pane>

                    {/* ─────────────────────── Проекты ─────────────────────── */}
                    <Tab.Pane eventKey="projects">
                        <Alert variant="info">
                            Здесь отображаются все проекты пользователей. Администратор может просмотреть
                            детали или удалить проект.
                        </Alert>
                        <Table bordered hover>
                            <thead>
                                <tr>
                                    <th>Пользователь</th><th>Название</th><th>Создан</th>
                                    <th>Обновлён</th><th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map(p => (
                                    <tr key={p._id}>
                                        <td>{p.user?.firstName} {p.user?.lastName}</td>
                                        <td>{p.name}</td>
                                        <td>{new Date(p.createdAt).toLocaleString()}</td>
                                        <td>{new Date(p.updatedAt).toLocaleString()}</td>
                                        <td>
                                            <Button
                                                size="sm"
                                                title="Просмотр"
                                                onClick={() => openModal('view', p)}
                                            >👁️</Button>{' '}
                                            <Button
                                                size="sm" variant="danger"
                                                onClick={() => handleDelete(p._id)}
                                            >🗑️</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab.Pane>

                </Tab.Content>
            </Tab.Container>

            {/* ─────────────────────── Модальное окно ─────────────────────── */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size={key === 'assets' ? 'lg' : undefined}
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === 'create' && key === 'shops' && 'Новый магазин'}
                        {modalMode === 'edit' && key === 'shops' && 'Редактировать магазин'}
                        {modalMode === 'create' && key === 'assets' && 'Новый ассет'}
                        {modalMode === 'edit' && key === 'assets' && 'Редактировать ассет'}
                        {key === 'projects' && 'Детали проекта'}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {/* ─── Магазин ─── */}
                    {key === 'shops' && (
                        <Form>
                            <Form.Group className="mb-2">
                                <Form.Label>Название</Form.Label>
                                <Form.Control
                                    value={form.name || ''}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Адрес</Form.Label>
                                <Form.Control
                                    value={form.address || ''}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Инфо</Form.Label>
                                <Form.Control
                                    as="textarea" rows={2}
                                    value={form.info || ''}
                                    onChange={e => setForm({ ...form, info: e.target.value })}
                                />
                            </Form.Group>
                        </Form>
                    )}

                    {/* ─── Ассет ─── */}
                    {key === 'assets' && (
                        <Form>
                            <Form.Group className="mb-2">
                                <Form.Label>Магазин</Form.Label>
                                <Form.Select
                                    value={form.shop || ''}
                                    onChange={e => setForm({ ...form, shop: e.target.value })}
                                >
                                    <option value="" disabled>Выберите магазин</option>
                                    {shops.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Название</Form.Label>
                                <Form.Control
                                    value={form.name || ''}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Изображение</Form.Label>
                                <Form.Control type="file" accept="image/*" onChange={handleFileUpload} />
                            </Form.Group>
                            {uploading && <Spinner animation="border" size="sm" className="mb-2" />}
                            {form.url && (
                                <div className="mb-3">
                                    <Image src={form.url} thumbnail style={{ width: 100 }} />
                                </div>
                            )}
                            <Form.Group className="mb-2">
                                <Form.Label>Категория</Form.Label>
                                <Form.Select
                                    value={form.category || ''}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                >
                                    <option value="" disabled>Выберите категорию</option>
                                    {categories.map(c => <option key={c}>{c}</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Row className="align-items-center mb-2">
                                <Col md={8}>
                                    <Form.Label>Цвет</Form.Label>
                                    <Form.Select
                                        value={form.color || ''}
                                        onChange={e => setForm({ ...form, color: e.target.value })}
                                    >
                                        <option value="" disabled>Выберите цвет</option>
                                        {colors.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={4}>
                                    <div style={{
                                        width: 24, height: 24, border: '1px solid #ccc',
                                        backgroundColor: form.color || 'transparent'
                                    }} />
                                </Col>
                            </Row>
                            <Form.Group className="mb-2">
                                <Form.Label>Цена</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={form.price || ''}
                                    onChange={e => setForm({ ...form, price: e.target.value })}
                                />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Ширина</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={form.width || ''}
                                            onChange={e => setForm({ ...form, width: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Высота</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={form.height || ''}
                                            onChange={e => setForm({ ...form, height: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    )}

                    {/* ─── Проект (только просмотр) ─── */}
                    {key === 'projects' && (
                        <>
                            <p><strong>Пользователь:</strong> {currentItem.user?.firstName} {currentItem.user?.lastName}</p>
                            <p><strong>Название:</strong> {currentItem.name}</p>
                            {currentItem.description && <p><strong>Описание:</strong> {currentItem.description}</p>}
                            <p><strong>Создан:</strong> {new Date(currentItem.createdAt).toLocaleString()}</p>
                            <p><strong>Обновлён:</strong> {new Date(currentItem.updatedAt).toLocaleString()}</p>
                            <hr />
                            <p>
                                <strong>Полотно:</strong> {currentItem.plot?.width} × {currentItem.plot?.height}px
                            </p>
                            <p>
                                <strong>Кол-во объектов:</strong> {currentItem.objects?.length}
                            </p>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        {key === 'projects' ? 'Закрыть' : 'Отмена'}
                    </Button>
                    {key !== 'projects' && (
                        <Button
                            onClick={handleSave}
                            disabled={!isFormValid || uploading}
                        >
                            {modalMode === 'create'
                                ? (key === 'shops' ? 'Создать' : 'Добавить')
                                : 'Сохранить'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminPanel;