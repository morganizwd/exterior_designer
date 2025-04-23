// src/components/LandscapeEditor.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, Image as FabricImage, Line } from 'fabric';
import axios from 'axios';
import {
    Container, Row, Col,
    Card, ListGroup,
    Button, Form, InputGroup,
    Alert, Spinner, Modal
} from 'react-bootstrap';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const abs = u =>
    u.startsWith('http')
        ? u
        : `${API}${u.startsWith('/') ? '' : '/'}${u}`;
const GRID = 50;

export default function LandscapeEditor() {
    const cvsRef = useRef(null);
    const [cvs, setCvs] = useState(null);

    // canvas & assets
    const [assets, setAssets] = useState([]);
    const [plot, setPlot] = useState({ w: 800, h: 600 });
    const [sizeInp, setSizeInp] = useState({ w: 800, h: 600 });
    const [grid, setGrid] = useState(true);
    const [zoom, setZoom] = useState(1);

    // asset filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // project metadata
    const [projectName, setProjectName] = useState(`Проект ${new Date().toLocaleString()}`);
    const [projectDesc, setProjectDesc] = useState('');

    // load projects modal
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [projects, setProjects] = useState([]);

    // selection & properties
    const [sel, setSel] = useState(null);
    const [form, setForm] = useState({ x: 0, y: 0, w: 0, h: 0, a: 0 });
    const [wallLen, setWallLen] = useState(100);

    // pricing & shops
    const [total, setTotal] = useState(0);
    const [shopList, setShopList] = useState([]);

    // user & save status
    const token = localStorage.getItem('token');
    const authConfig = { headers: { Authorization: `Bearer ${token}` } };
    const [userId, setUserId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);

    // fetch current user
    useEffect(() => {
        if (!token) return;
        axios.get(`${API}/api/users/me`, authConfig)
            .then(({ data }) => setUserId(data._id))
            .catch(err => {
                console.error('getMe error', err);
                setError('Не удалось получить данные пользователя');
            });
    }, [token]);

    // fetch assets
    useEffect(() => {
        axios.get(`${API}/api/assets`)
            .then(({ data }) => setAssets(data))
            .catch(console.error);
    }, []);

    // derive unique categories
    const categories = useMemo(() => {
        const set = new Set(assets.map(a => a.category).filter(Boolean));
        return Array.from(set);
    }, [assets]);

    // filtered assets by search + category
    const filteredAssets = useMemo(() => {
        return assets.filter(a => {
            const matchesName = a.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = selectedCategory ? a.category === selectedCategory : true;
            return matchesName && matchesCat;
        });
    }, [assets, searchTerm, selectedCategory]);

    // draw or redraw grid
    const drawGrid = useCallback(cv => {
        cv.getObjects('line').filter(l => l.gridLine).forEach(l => cv.remove(l));
        if (!grid) { cv.requestRenderAll(); return; }
        const step = GRID * zoom;
        const lines = [];
        for (let x = 0; x <= cv.width; x += step) {
            lines.push(new Line([x, 0, x, cv.height], {
                stroke: '#e0e0e0',
                selectable: false,
                excludeFromExport: true,
                gridLine: true
            }));
        }
        for (let y = 0; y <= cv.height; y += step) {
            lines.push(new Line([0, y, cv.width, y], {
                stroke: '#e0e0e0',
                selectable: false,
                excludeFromExport: true,
                gridLine: true
            }));
        }
        cv.add(...lines);
        cv.requestRenderAll();
    }, [grid, zoom]);

    // recalc price & shop list
    const recalc = useCallback(() => {
        if (!cvs) return;
        const objs = cvs.getObjects().filter(o => o.assetId);
        let sum = 0;
        const shopsMap = new Map();
        objs.forEach(o => {
            const asset = assets.find(a => a._id === o.assetId);
            if (!asset) return;
            sum += Number(asset.price) || 0;
            if (asset.shop) {
                const s = asset.shop;
                shopsMap.set(s._id, {
                    _id: s._id,
                    name: s.name,
                    address: s.address,
                    info: s.info
                });
            }
        });
        setTotal(sum);
        setShopList(Array.from(shopsMap.values()));
    }, [cvs, assets]);

    // initialize Fabric canvas
    useEffect(() => {
        if (!cvsRef.current) return;
        const cv = new Canvas(cvsRef.current, {
            width: plot.w,
            height: plot.h,
            backgroundColor: '#fafafa'
        });
        cv.on('object:rotating', ({ target }) => {
            const a = Math.round(target.angle / 5) * 5;
            if (a !== target.angle) { target.angle = a; target.setCoords(); }
        });
        const onSel = e => {
            const o = e.selected?.[0] || e.target;
            if (!o) { setSel(null); return; }
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
        cv.on('object:added', recalc);
        cv.on('object:modified', recalc);
        cv.on('object:removed', recalc);
        setCvs(cv);
        drawGrid(cv);
        return () => cv.dispose();
    }, []); // eslint-disable-line

    // redraw grid when needed
    useEffect(() => {
        if (cvs) {
            cvs.setWidth(plot.w);
            cvs.setHeight(plot.h);
            drawGrid(cvs);
        }
    }, [plot, drawGrid]);
    useEffect(() => { if (cvs) drawGrid(cvs); }, [grid, zoom]);

    // add asset
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

    // add wall
    const addWall = () => {
        if (!cvs) return;
        const len = Number(wallLen);
        if (!len) return;
        const wall = new Line([0, 0, len, 0], {
            stroke: '#444',
            strokeWidth: 4,
            originX: 'left',
            originY: 'top',
            selectable: true
        });
        wall.set({ left: 50, top: 50 });
        cvs.add(wall);
        cvs.setActiveObject(wall);
        cvs.requestRenderAll();
    };

    // apply property changes
    const applyProps = () => {
        if (!sel) return;
        sel.set({
            left: form.x,
            top: form.y,
            angle: form.a,
            ...(sel.type === 'image'
                ? { scaleX: form.w / sel.width, scaleY: form.h / sel.height }
                : { x2: form.w, y2: 0 })
        });
        cvs.requestRenderAll();
        recalc();
    };

    // save project
    const handleSaveProject = async () => {
        setError(null);
        setSuccess(null);
        if (!userId) {
            setError('Подождите, идёт загрузка данных пользователя...');
            return;
        }
        setSaving(true);
        const objs = cvs.getObjects()
            .filter(o => o.assetId)
            .map(o => ({
                asset: o.assetId,
                x: o.left,
                y: o.top,
                scale: o.scaleX,
                rotation: o.angle
            }));
        const payload = {
            user: userId,
            name: projectName,
            description: projectDesc,
            plot: { type: 'Rectangle', width: plot.w, height: plot.h },
            objects: objs
        };
        try {
            await axios.post(`${API}/api/projects`, payload, authConfig);
            setSuccess('Проект успешно сохранён');
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.message || 'Ошибка сохранения проекта');
        } finally {
            setSaving(false);
        }
    };

    // open load modal & fetch user's projects
    const openLoadModal = () => {
        setError(null);
        axios.get(`${API}/api/projects`, authConfig)
            .then(({ data }) => {
                // filter to only this user's
                setProjects(data.filter(p => p.user._id === userId));
                setShowLoadModal(true);
            })
            .catch(err => {
                console.error('getProjects error', err);
                setError('Не удалось загрузить список проектов');
            });
    };
    const closeLoadModal = () => setShowLoadModal(false);

    // load a selected project
    const loadProject = async project => {
        if (!cvs) return;
        // clear canvas
        cvs.clear();
        // apply plot size
        setPlot({ w: project.plot.width, h: project.plot.height });
        setSizeInp({ w: project.plot.width, h: project.plot.height });
        // set metadata
        setProjectName(project.name);
        setProjectDesc(project.description || '');
        // add each object
        for (const o of project.objects) {
            const asset = o.asset;
            const img = await FabricImage.fromURL(abs(asset.url), { crossOrigin: 'anonymous' });
            img.set({
                left: o.x,
                top: o.y,
                angle: o.rotation,
                selectable: true
            });
            img.scaleX = o.scale;
            img.scaleY = o.scale;
            img.assetId = asset._id;
            cvs.add(img);
        }
        cvs.requestRenderAll();
        recalc();
        closeLoadModal();
    };

    return (
        <Container fluid className="p-3">
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row>
                {/* Sidebar: поиск и фильтры */}
                <Col md={3}>
                    <Card>
                        <Card.Header>Ассеты</Card.Header>
                        <Card.Body>
                            <Form.Control
                                type="text"
                                placeholder="Поиск по названию..."
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
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Form.Select>
                            <ListGroup variant="flush" style={{ maxHeight: 330, overflowY: 'auto' }}>
                                {filteredAssets.map(a => (
                                    <ListGroup.Item key={a._id} action onClick={() => addAsset(a)}>
                                        <img
                                            src={abs(a.url)}
                                            width={28}
                                            height={28}
                                            style={{ objectFit: 'cover', marginRight: 8 }}
                                            alt=""
                                        />
                                        {a.name}&nbsp;
                                        <small className="text-muted">({a.category})</small>
                                        {' '}
                                        <small className="text-muted">— {a.price}₽</small>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    {/* Полотно и стены без изменений */}
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

                {/* Canvas & Project Info */}
                <Col md={6}>
                    <canvas
                        ref={cvsRef}
                        style={{ border: '1px solid #ccc', display: 'block', width: plot.w, height: plot.h }}
                    />
                    <Form className="mt-3">
                        <Form.Group className="mb-2">
                            <Form.Label>Название проекта</Form.Label>
                            <Form.Control
                                type="text"
                                value={projectName}
                                onChange={e => setProjectName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Описание проекта</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={projectDesc}
                                onChange={e => setProjectDesc(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                    <div className="mt-2 d-flex">
                        <Button onClick={handleSaveProject} disabled={saving} className="me-2">
                            {saving ? <Spinner animation="border" size="sm" /> : 'Сохранить проект'}
                        </Button>
                        <Button variant="secondary" onClick={openLoadModal}>
                            Загрузить проект
                        </Button>
                    </div>
                </Col>

                {/* Properties & Summary */}
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

            {/* Load Projects Modal */}
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
                                    action
                                    onClick={() => loadProject(p)}
                                >
                                    <strong>{p.name}</strong><br />
                                    <small className="text-muted">
                                        {new Date(p.createdAt).toLocaleString()}
                                    </small>
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
