// src/components/ShopViewer.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
    Container, Row, Col,
    Card, ListGroup, Image,
    Form, InputGroup,
    Button, Modal, Spinner,
    Alert
} from 'react-bootstrap';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ShopViewer() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    const [selected, setSelected] = useState(null);

    const [shopAssets, setShopAssets] = useState([]);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [assetsError, setAssetsError] = useState(null);
    const [assetSearch, setAssetSearch] = useState('');

    useEffect(() => {
        const loadShops = async () => {
            try {
                const { data } = await axios.get(`${API}/api/shops`);
                setShops(data);
            } catch (err) {
                console.error('getShops error', err);
                setError('Не удалось загрузить список магазинов');
            } finally {
                setLoading(false);
            }
        };
        loadShops();
    }, []);

    useEffect(() => {
        if (!selected) return;
        setShopAssets([]);
        setAssetSearch('');
        setAssetsError(null);
        setAssetsLoading(true);

        axios
            .get(`${API}/api/assets`)
            .then(({ data }) => {
                const list = data.filter(a => a.shop && a.shop._id === selected._id);
                setShopAssets(list);
            })
            .catch(err => {
                console.error('getAssets error', err);
                setAssetsError('Не удалось загрузить ассеты магазина');
            })
            .finally(() => setAssetsLoading(false));
    }, [selected]);

    const filteredShops = useMemo(() => {
        const q = search.toLowerCase();
        return shops.filter(
            s =>
                s.name.toLowerCase().includes(q) ||
                (s.address && s.address.toLowerCase().includes(q))
        );
    }, [shops, search]);

    const filteredAssets = useMemo(() => {
        const q = assetSearch.toLowerCase();
        return shopAssets.filter(
            a =>
                a.name.toLowerCase().includes(q) ||
                (a.category && a.category.toLowerCase().includes(q))
        );
    }, [shopAssets, assetSearch]);

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col md={8}>
                    <h3 className="mb-3 text-center">Магазины-партнёры</h3>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <InputGroup className="mb-3">
                        <Form.Control
                            placeholder="Поиск по названию или адресу…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <Button
                            variant="outline-secondary"
                            disabled={!search}
                            onClick={() => setSearch('')}
                        >
                            ✕
                        </Button>
                    </InputGroup>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : filteredShops.length === 0 ? (
                        <p className="text-muted text-center">Ничего не найдено</p>
                    ) : (
                        <Card>
                            <ListGroup variant="flush">
                                {filteredShops.map(s => (
                                    <ListGroup.Item
                                        key={s._id}
                                        action
                                        onClick={() => setSelected(s)}
                                    >
                                        <strong>{s.name}</strong><br />
                                        <small className="text-muted">
                                            {s.address || '—'}
                                        </small>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    )}
                </Col>
            </Row>

            {selected && (
                <Modal
                    show
                    onHide={() => setSelected(null)}
                    size="lg"
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>{selected.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selected.address && (
                            <p className="mb-2">
                                <strong>Адрес:</strong><br />
                                {selected.address}
                            </p>
                        )}
                        {selected.info && (
                            <p className="mb-3">
                                <strong>Информация:</strong><br />
                                {selected.info}
                            </p>
                        )}

                        <h5 className="mb-3">Ассеты магазина</h5>

                        {assetsError && <Alert variant="danger">{assetsError}</Alert>}

                        <InputGroup className="mb-3">
                            <Form.Control
                                placeholder="Поиск по ассетам…"
                                value={assetSearch}
                                onChange={e => setAssetSearch(e.target.value)}
                                disabled={assetsLoading || shopAssets.length === 0}
                            />
                            <Button
                                variant="outline-secondary"
                                disabled={!assetSearch}
                                onClick={() => setAssetSearch('')}
                            >
                                ✕
                            </Button>
                        </InputGroup>

                        {assetsLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" />
                            </div>
                        ) : filteredAssets.length === 0 ? (
                            <p className="text-muted">Ассеты не найдены</p>
                        ) : (
                            <Row xs={2} sm={3} md={3} lg={4} className="g-3">
                                {filteredAssets.map(a => (
                                    <Col key={a._id}>
                                        <Card className="h-100">
                                            <Image
                                                src={a.url}
                                                alt={a.name}
                                                style={{ objectFit: 'cover', height: '110px' }}
                                                className="card-img-top"
                                            />
                                            <Card.Body className="p-2">
                                                <Card.Title className="h6 mb-1" style={{ fontSize: '0.9rem' }}>
                                                    {a.name}
                                                </Card.Title>
                                                <small className="text-muted">
                                                    {a.category} • {Number(a.price).toLocaleString()} ₽
                                                </small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        {selected.address && (
                            <Button
                                variant="success"
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address)}`}
                            >
                                Открыть в картах
                            </Button>
                        )}
                        <Button variant="secondary" onClick={() => setSelected(null)}>
                            Закрыть
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
}