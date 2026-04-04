import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { formatDate } from '../utils/format';

export default function Suppliers({ navigate }) {
    const { canManageProducts } = useAuth();

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '', contact: '', phone: '', address: ''
    });

    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [supplierProducts, setSupplierProducts] = useState([]);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [productFormData, setProductFormData] = useState({
        productId: '', unitPrice: '', deliveryDays: '', reliabilityScore: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [suppliersData, productsData] = await Promise.all([
                api.getAllSuppliers(),
                api.getAllProducts(),
            ]);
            setSuppliers(suppliersData);
            setProducts(productsData);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch(e) {
        const q = e.target.value;
        setSearch(q);
        try {
            if (q.trim() === '') {
                const data = await api.getAllSuppliers();
                setSuppliers(data);
            } else {
                const data = await api.searchSuppliers(q);
                setSuppliers(data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    function openAddForm() {
        setEditingSupplier(null);
        setFormData({ name: '', contact: '', phone: '', address: '' });
        setShowForm(true);
    }

    function openEditForm(supplier) {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact: supplier.contact ?? '',
            phone: supplier.phone ?? '',
            address: supplier.address ?? '',
        });
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingSupplier(null);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await api.updateSupplier(
                    editingSupplier.id,
                    formData.name,
                    formData.contact || null,
                    formData.phone || null,
                    formData.address || null,
                    editingSupplier.is_active,
                );
            } else {
                await api.createSupplier(
                    formData.name,
                    formData.contact || null,
                    formData.phone || null,
                    formData.address || null,
                );
            }
            closeForm();
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleToggleActive(supplier) {
        try {
            await api.updateSupplier(
                supplier.id,
                supplier.name,
                supplier.contact,
                supplier.phone,
                supplier.address,
                !supplier.is_active,
            );
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleDelete(supplier) {
        if (!window.confirm(`Delete "${supplier.name}"? This cannot be undone.`)) return;
        try {
            await api.deleteSupplier(supplier.id);
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function openSupplierDetail(supplier) {
        setSelectedSupplier(supplier);
        try {
            const links = await api.getProductsForSupplier(supplier.id);
            setSupplierProducts(links);
        } catch (e) {
            console.error(e);
        }
    }

    function closeSupplierDetail() {
        setSelectedSupplier(null);
        setSupplierProducts([]);
        setShowProductForm(false);
        setEditingLink(null);
    }

    function openAddProductLink() {
        setEditingLink(null);
        setProductFormData({ productId: '', unitPrice: '', deliveryDays: '', reliabilityScore: '' });
        setShowProductForm(true);
    }

    function openEditProductLink(link) {
        setEditingLink(link);
        setProductFormData({
            productId: link.product_id,
            unitPrice: link.unit_price,
            deliveryDays: link.delivery_days,
            reliabilityScore: link.reliability_score,
        });
        setShowProductForm(true);
    }

    async function handleProductFormSubmit(e) {
        e.preventDefault();
        try {
            if (editingLink) {
                await api.updateProductSupplier(
                    editingLink.id,
                    parseFloat(productFormData.unitPrice),
                    parseInt(productFormData.deliveryDays),
                    parseFloat(productFormData.reliabilityScore),
                );
            } else {
                await api.addProductToSupplier(
                    parseInt(productFormData.productId),
                    selectedSupplier.id,
                    parseFloat(productFormData.unitPrice),
                    parseInt(productFormData.deliveryDays),
                    parseFloat(productFormData.reliabilityScore),
                );
            }
            setShowProductForm(false);
            setEditingLink(null);
            const links = await api.getProductsForSupplier(selectedSupplier.id);
            setSupplierProducts(links);
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleRemoveProductLink(id) {
        if (!window.confirm('Remove this product link?')) return;
        try {
            await api.removeProductFromSupplier(id);
            const links = await api.getProductsForSupplier(selectedSupplier.id);
            setSupplierProducts(links);
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    if (loading) return <div>Loading suppliers...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div id="page-suppliers">
            <h1>Suppliers</h1>

            <div id="suppliers-toolbar">
                <input
                    type="text"
                    placeholder="Search by name"
                    value={search}
                    onChange={handleSearch}
                />
                {canManageProducts() && (
                    <button onClick={openAddForm}>Add Supplier</button>
                )}
            </div>

            {/* Suppliers table */}
            {!selectedSupplier && (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.id}>
                                <td>{s.name}</td>
                                <td>{s.contact ?? '—'}</td>
                                <td>{s.phone ?? '—'}</td>
                                <td>{s.address ?? '—'}</td>
                                <td>{s.is_active ? 'Active' : 'Inactive'}</td>
                                <td>
                                    <button onClick={() => openSupplierDetail(s)}>View</button>
                                    {canManageProducts() && (
                                        <>
                                            <button onClick={() => openEditForm(s)}>Edit</button>
                                            <button onClick={() => handleToggleActive(s)}>
                                                {s.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleDelete(s)}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Add/Edit form */}
            {showForm && (
                <div id="supplier-form-container">
                    <h2>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
                    <form onSubmit={handleFormSubmit}>
                        <input
                            type="text"
                            placeholder="Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Contact (optional)"
                            value={formData.contact}
                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Phone (optional)"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Address (optional)"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                        <button type="submit">{editingSupplier ? 'Update' : 'Create'}</button>
                        <button type="button" onClick={closeForm}>Cancel</button>
                    </form>
                </div>
            )}

            {/* Supplier detail */}
            {selectedSupplier && (
                <div id="supplier-detail-container">
                    <h2>{selectedSupplier.name}</h2>
                    <p>Contact: {selectedSupplier.contact ?? '—'}</p>
                    <p>Phone: {selectedSupplier.phone ?? '—'}</p>
                    <p>Address: {selectedSupplier.address ?? '—'}</p>
                    <p>Status: {selectedSupplier.is_active ? 'Active' : 'Inactive'}</p>

                    <div id="supplier-products-section">
                        <h3>Products</h3>
                        {supplierProducts.length === 0 ? (
                            <p>No products linked.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Reference</th>
                                        <th>Unit</th>
                                        <th>Unit Price</th>
                                        <th>Delivery Days</th>
                                        <th>Reliability</th>
                                        {canManageProducts() && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {supplierProducts.map(link => (
                                        <tr key={link.id}>
                                            <td>{link.product_name}</td>
                                            <td>{link.product_reference}</td>
                                            <td>{link.unit}</td>
                                            <td>{link.unit_price}</td>
                                            <td>{link.delivery_days}</td>
                                            <td>{link.reliability_score}</td>
                                            {canManageProducts() && (
                                                <td>
                                                    <button onClick={() => openEditProductLink(link)}>Edit</button>
                                                    <button onClick={() => handleRemoveProductLink(link.id)}>Remove</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {canManageProducts() && (
                            <button onClick={openAddProductLink}>Add Product</button>
                        )}
                    </div>

                    {showProductForm && (
                        <form onSubmit={handleProductFormSubmit}>
                            <h3>{editingLink ? 'Edit Product Link' : 'Add Product'}</h3>
                            {!editingLink && (
                                <select
                                    value={productFormData.productId}
                                    onChange={e => setProductFormData({ ...productFormData, productId: e.target.value })}
                                    required
                                >
                                    <option value="">Select product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            )}
                            <input
                                type="number"
                                placeholder="Unit price"
                                value={productFormData.unitPrice}
                                onChange={e => setProductFormData({ ...productFormData, unitPrice: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Delivery days"
                                value={productFormData.deliveryDays}
                                onChange={e => setProductFormData({ ...productFormData, deliveryDays: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Reliability (0-1)"
                                step="0.01"
                                min="0"
                                max="1"
                                value={productFormData.reliabilityScore}
                                onChange={e => setProductFormData({ ...productFormData, reliabilityScore: e.target.value })}
                                required
                            />
                            <button type="submit">{editingLink ? 'Update' : 'Add'}</button>
                            <button type="button" onClick={() => { setShowProductForm(false); setEditingLink(null); }}>Cancel</button>
                        </form>
                    )}

                    <button onClick={closeSupplierDetail}>Back to Suppliers</button>
                </div>
            )}
        </div>
    );
}