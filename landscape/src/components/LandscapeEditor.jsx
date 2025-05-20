import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, Image as FabricImage, Line } from 'fabric';
import axios from 'axios';
import {
    Container, Row, Col,
    Card, ListGroup,
    Button, Form, InputGroup,
    Alert, Spinner, Modal
} from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

/* ──────────── константы ──────────── */
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const abs = u => (u.startsWith('http') ? u : `${API}${u.startsWith('/') ? '' : '/'}${u}`);
const GRID = 50;

/* ──────────── компонент ──────────── */
export default function LandscapeEditor() {
    /* ----- refs / canvas ----- */
    const cvsRef = useRef(null);
    const [cvs, setCvs] = useState(null);

    /* ----- данные ассетов и стен ----- */
    const [assets, setAssets] = useState([]);

    /* ----- состояние полотна ----- */
    const [plot, setPlot] = useState({ w: 800, h: 600 });
    const [sizeInp, setSizeInp] = useState({ w: 800, h: 600 });
    const [grid, setGrid] = useState(true);
    const [zoom, setZoom] = useState(1);

    /* ----- фильтры ассетов ----- */
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    /* ----- сведения о проекте ----- */
    const [projectName, setProjectName] = useState(`Проект ${new Date().toLocaleString()}`);
    const [projectDesc, setProjectDesc] = useState('');

    /* ----- загрузка / удаление проектов ----- */
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [projects, setProjects] = useState([]);
    const [deleting, setDeleting] = useState(false);

    /* ----- выделенный объект и форма свойств ----- */
    const [sel, setSel] = useState(null);
    const [form, setForm] = useState({ x: 0, y: 0, w: 0, h: 0, a: 0 });
    const [wallLen, setWallLen] = useState(100);

    /* ----- сводка стоимости и магазинов ----- */
    const [total, setTotal] = useState(0);
    const [shopList, setShopList] = useState([]);

    /* ----- авторизация ----- */
    const token = localStorage.getItem('token');
    const authConfig = { headers: { Authorization: `Bearer ${token}` } };
    const [userId, setUserId] = useState(null);

    /* ----- сообщения и статусы ----- */
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);

    /* ──────────── получение id пользователя ──────────── */
    useEffect(() => {
        if (!token) return;
        axios.get(`${API}/api/users/me`, authConfig)
            .then(({ data }) => setUserId(data._id))
            .catch(() => setError('Не удалось получить данные пользователя'));
    }, [token]);

    /* ──────────── загрузка ассетов ──────────── */
    useEffect(() => {
        axios.get(`${API}/api/assets`)
            .then(({ data }) => setAssets(data))
            .catch(console.error);
    }, []);

    /* ──────────── категории ассетов ──────────── */
    const categories = useMemo(() => {
        const s = new Set(assets.map(a => a.category).filter(Boolean));
        return Array.from(s);
    }, [assets]);

    /* ──────────── ассеты после фильтра ──────────── */
    const filteredAssets = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return assets.filter(a =>
            a.name.toLowerCase().includes(term) &&
            (!selectedCategory || a.category === selectedCategory)
        );
    }, [assets, searchTerm, selectedCategory]);

    /* ──────────── прорисовка сетки ──────────── */
    const drawGrid = useCallback(cv => {
        cv.getObjects('line').filter(l => l.gridLine).forEach(l => cv.remove(l));
        if (!grid) { cv.requestRenderAll(); return; }
        const step = GRID * zoom;
        const lines = [];
        for (let x = 0; x <= cv.width; x += step) {
            lines.push(new Line([x, 0, x, cv.height], { stroke: '#e0e0e0', selectable: false, excludeFromExport: true, gridLine: true }));
        }
        for (let y = 0; y <= cv.height; y += step) {
            lines.push(new Line([0, y, cv.width, y], { stroke: '#e0e0e0', selectable: false, excludeFromExport: true, gridLine: true }));
        }
        cv.add(...lines);
        cv.requestRenderAll();
    }, [grid, zoom]);

    /* ──────────── пересчёт цены и магазинов ──────────── */
    const recalc = useCallback(() => {
        if (!cvs) return;
        const objs = cvs.getObjects().filter(o => o.assetId);
        let sum = 0;
        const map = new Map();
        objs.forEach(o => {
            const asset = assets.find(a => a._id === o.assetId);
            if (!asset) return;
            sum += Number(asset.price) || 0;
            if (asset.shop) map.set(asset.shop._id, asset.shop);
        });
        setTotal(sum);
        setShopList(Array.from(map.values()));
    }, [cvs, assets]);

    /* ──────────── инициализация Canvas ──────────── */
    useEffect(() => {
        if (!cvsRef.current) return;
        const cv = new Canvas(cvsRef.current, {
            width: plot.w,
            height: plot.h,
            backgroundColor: '#fafafa'
        });

        /* округление вращения */
        cv.on('object:rotating', ({ target }) => {
            const a = Math.round(target.angle / 5) * 5;
            if (a !== target.angle) { target.angle = a; target.setCoords(); }
        });

        /* выделение */
        const onSel = e => {
            const o = e.selected?.[0] || e.target;
            if (!o) return setSel(null);
            setSel(o);
            setForm({
                x: o.left,
                y: o.top,
                w: o.type === 'image' ? o.width * o.scaleX : o.x2,
                h: o.type === 'image' ? o.height * o.scaleY : 4,
                a: o.angle || 0
            });
        };
        cv.on('selection:created', onSel);
        cv.on('selection:updated', onSel);
        cv.on('selection:cleared', () => setSel(null));

        /* пересчёт стоимости */
        cv.on('object:added', recalc);
        cv.on('object:modified', recalc);
        cv.on('object:removed', recalc);

        setCvs(cv);
        drawGrid(cv);
        return () => cv.dispose();
    }, []);

    /* ──────────── реакция на изменение размеров / сетки ──────────── */
    useEffect(() => { if (cvs) { cvs.setWidth(plot.w); cvs.setHeight(plot.h); drawGrid(cvs); } }, [plot, drawGrid]);
    useEffect(() => { if (cvs) drawGrid(cvs); }, [grid, zoom]);

    /* ──────────── добавление ассета ──────────── */
    const addAsset = async asset => {
        if (!cvs) return;
        const img = await FabricImage.fromURL(abs(asset.url), { crossOrigin: 'anonymous' });
        asset.width > 0 ? img.scaleToWidth(asset.width) : img.scaleToWidth(120);
        img.set({ left: 50, top: 50, selectable: true });
        img.assetId = asset._id;
        cvs.add(img);
        cvs.setActiveObject(img);
        cvs.requestRenderAll();
        recalc();
    };

    /* ──────────── добавление стены ──────────── */
    const addWall = () => {
        if (!cvs) return;
        const len = Number(wallLen);
        if (!len) return;
        const wall = new Line([0, 0, len, 0], {
            stroke: '#444', strokeWidth: 4, originX: 'left', originY: 'top', selectable: true
        });
        wall.set({ left: 50, top: 50 });
        wall.isWall = true;            // флаг, чтобы потом сохранить
        cvs.add(wall);
        cvs.setActiveObject(wall);
        cvs.requestRenderAll();
    };

    /* ──────────── применение формы свойств ──────────── */
    const applyProps = () => {
        if (!sel) return;
        sel.set({
            left: form.x, top: form.y, angle: form.a,
            ...(sel.type === 'image'
                ? { scaleX: form.w / sel.width, scaleY: form.h / sel.height }
                : { x2: form.w, y2: 0 })
        });
        cvs.requestRenderAll();
        recalc();
    };

    /* ──────────── сохранение проекта ──────────── */
    const handleSaveProject = async () => {
        setError(null); setSuccess(null);
        if (!userId) return setError('Подождите, идёт загрузка данных пользователя...');
        setSaving(true);

        /* собираем ассеты */
        const imgObjs = cvs.getObjects().filter(o => o.assetId).map(o => ({
            asset: o.assetId,
            x: o.left, y: o.top,
            scale: o.scaleX,
            rotation: o.angle
        }));

        /* собираем стены */
        const wallObjs = cvs.getObjects().filter(o => o.isWall).map(o => ({
            x: o.left, y: o.top,
            length: o.x2,
            rotation: o.angle
        }));

        const payload = {
            user: userId,
            name: projectName,
            description: projectDesc,
            plot: { type: 'Rectangle', width: plot.w, height: plot.h },
            objects: imgObjs,
            walls: wallObjs
        };

        try {
            await axios.post(`${API}/api/projects`, payload, authConfig);
            setSuccess('Проект успешно сохранён');
        } catch (e) {
            setError(e.response?.data?.message || 'Ошибка сохранения проекта');
        } finally {
            setSaving(false);
        }
    };

    /* ──────────── загрузка и удаление проектов ──────────── */
    const openLoadModal = () => {
        setError(null);
        axios.get(`${API}/api/projects`, authConfig)
            .then(({ data }) => {
                setProjects(data.filter(p => p.user._id === userId));
                setShowLoadModal(true);
            })
            .catch(() => setError('Не удалось загрузить список проектов'));
    };
    const closeLoadModal = () => setShowLoadModal(false);

    const loadProject = async project => {
        if (!cvs) return;
        cvs.clear();

        /* размеры полотна */
        setPlot({ w: project.plot.width, h: project.plot.height });
        setSizeInp({ w: project.plot.width, h: project.plot.height });

        setProjectName(project.name);
        setProjectDesc(project.description || '');

        /* ассеты */
        for (const o of project.objects) {
            const asset = o.asset;
            const img = await FabricImage.fromURL(abs(asset.url), { crossOrigin: 'anonymous' });
            img.set({ left: o.x, top: o.y, angle: o.rotation, selectable: true });
            img.scaleX = o.scale;
            img.scaleY = o.scale;
            img.assetId = asset._id;
            cvs.add(img);
        }

        /* стены */
        for (const w of project.walls || []) {
            const wall = new Line([0, 0, w.length, 0], {
                stroke: '#444', strokeWidth: 4, originX: 'left', originY: 'top', selectable: true
            });
            wall.set({ left: w.x, top: w.y, angle: w.rotation });
            wall.isWall = true;
            cvs.add(wall);
        }

        cvs.requestRenderAll();
        recalc();
        closeLoadModal();
    };

    const deleteProject = useCallback(id => {
        if (!window.confirm('Удалить этот проект безвозвратно?')) return;
        setDeleting(true); setError(null);
        axios.delete(`${API}/api/projects/${id}`, authConfig)
            .then(() => {
                setProjects(ps => ps.filter(p => p._id !== id));
                setSuccess('Проект удалён');
            })
            .catch(() => setError('Не удалось удалить проект'))
            .finally(() => setDeleting(false));
    }, [authConfig]);

    /* ──────────── UI ──────────── */
    return (
        <Container fluid className="p-3">
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row>
                {/* ----- левая колонка: ассеты и инструменты ----- */}
                <Col md={3}>
                    <Card>
                        <Card.Header>Ассеты</Card.Header>
                        <Card.Body>
                            <Form.Control
                                placeholder="Поиск..."
                                className="mb-2"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Form.Select
                                className="mb-3"
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Все категории</option>
                                {categories.map(c => <option key={c}>{c}</option>)}
                            </Form.Select>

                            <ListGroup variant="flush" style={{ maxHeight: 330, overflowY: 'auto' }}>
                                {filteredAssets.map(a => (
                                    <ListGroup.Item key={a._id} action onClick={() => addAsset(a)}>
                                        <img src={abs(a.url)} width={28} height={28} alt=""
                                            style={{ objectFit: 'cover', marginRight: 8 }} />
                                        {a.name} <small className="text-muted">({a.category}) — {a.price}₽</small>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    {/* настройки полотна */}
                    <Card className="mt-3">
                        <Card.Header>Полотно</Card.Header>
                        <Card.Body>
                            {['w', 'h'].map(k => (
                                <InputGroup key={k} className="mb-2">
                                    <InputGroup.Text>{k === 'w' ? 'Ширина' : 'Высота'}</InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        value={sizeInp[k]}
                                        onChange={e => setSizeInp(s => ({ ...s, [k]: +e.target.value }))}
                                    />
                                </InputGroup>
                            ))}
                            <Button size="sm" onClick={() => setPlot(sizeInp)}>Применить размер</Button>
                            <hr className="my-2" />
                            <Form.Check
                                type="checkbox"
                                label="Сетка"
                                checked={grid}
                                onChange={() => setGrid(g => !g)}
                            />
                            <div className="mt-2">
                                <Button size="sm" onClick={() => setZoom(z => z + 0.1)}>Zoom +</Button>{' '}
                                <Button size="sm" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>Zoom -</Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* стены */}
                    <Card className="mt-3">
                        <Card.Header>Границы / стены</Card.Header>
                        <Card.Body>
                            <InputGroup className="mb-2">
                                <InputGroup.Text>Длина</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    value={wallLen}
                                    onChange={e => setWallLen(+e.target.value)}
                                />
                            </InputGroup>
                            <Button size="sm" onClick={addWall}>Добавить границу</Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ----- холст ----- */}
                <Col md={6}>
                    <canvas
                        ref={cvsRef}
                        style={{ border: '1px solid #ccc', display: 'block', width: plot.w, height: plot.h }}
                    />

                    {/* данные проекта */}
                    <Form className="mt-3">
                        <Form.Group className="mb-2">
                            <Form.Label>Название проекта</Form.Label>
                            <Form.Control value={projectName} onChange={e => setProjectName(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Описание проекта</Form.Label>
                            <Form.Control as="textarea" rows={2} value={projectDesc} onChange={e => setProjectDesc(e.target.value)} />
                        </Form.Group>
                    </Form>

                    {/* кнопки */}
                    <div className="mt-2 d-flex">
                        <Button onClick={handleSaveProject} disabled={saving} className="me-2">
                            {saving ? <Spinner animation="border" size="sm" /> : 'Сохранить проект'}
                        </Button>
                        <Button variant="secondary" onClick={openLoadModal}>Загрузить проект</Button>
                    </div>
                </Col>

                {/* ----- правая колонка: свойства ----- */}
                <Col md={3}>
                    <Card>
                        <Card.Header>Свойства / Сводка</Card.Header>
                        <Card.Body>
                            {!sel ? (
                                <div className="text-muted">Ничего не выбрано</div>
                            ) : (
                                <>
                                    {['x', 'y', 'w', 'h', 'a'].map(k => (
                                        <InputGroup key={k} className="mb-2">
                                            <InputGroup.Text>{k.toUpperCase()}</InputGroup.Text>
                                            <Form.Control
                                                type="number"
                                                value={form[k]}
                                                onChange={e => setForm(p => ({ ...p, [k]: +e.target.value }))}
                                            />
                                        </InputGroup>
                                    ))}
                                    <Button size="sm" className="me-1" onClick={applyProps}>Применить</Button>
                                    <Button size="sm" variant="danger" onClick={() => { cvs.remove(sel); setSel(null); recalc(); }}>Удалить</Button>
                                    <hr />
                                </>
                            )}

                            <h6>Стоимость проекта:</h6>
                            <p><strong>{total.toLocaleString()} ₽</strong></p>

                            <h6>Магазины:</h6>
                            {shopList.length === 0 ? (
                                <div className="text-muted">-</div>
                            ) : (
                                <ul className="mb-0">
                                    {shopList.map(s => (
                                        <li key={s._id}>
                                            <strong>{s.name}</strong><br />
                                            <small className="text-muted">{s.address}</small><br />
                                            {s.info && <small>{s.info}</small>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ----- модал загрузки проектов ----- */}
            <Modal show={showLoadModal} onHide={closeLoadModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Загрузить проект</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {projects.length === 0 ? (
                        <p className="text-muted">У вас ещё нет сохранённых проектов.</p>
                    ) : (
                        <ListGroup>
                            {projects.map(p => (
                                <ListGroup.Item
                                    key={p._id}
                                    className="d-flex justify-content-between align-items-start"
                                    action
                                    onClick={() => loadProject(p)}
                                >
                                    <div style={{ flex: 1 }}>
                                        <strong>{p.name}</strong><br />
                                        <small className="text-muted">{new Date(p.createdAt).toLocaleString()}</small>
                                    </div>
                                    <Button
                                        variant="link" className="text-danger p-0 ms-3"
                                        title="Удалить проект" disabled={deleting}
                                        onClick={e => { e.stopPropagation(); deleteProject(p._id); }}
                                    >
                                        <FaTrash size={16} />
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeLoadModal}>Закрыть</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
