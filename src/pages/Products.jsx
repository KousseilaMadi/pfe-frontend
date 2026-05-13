import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { formatDate } from '../utils/format'

export default function Products({ navigate }) {
    const { canManageProducts } = useAuth();

    const [products, setProducts] = useState([]);
    const [storage, setStorage] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        reference: '', name: '', category: '', unit: '', alertThreshold: '', maxCapacity: ''
    });

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productSuppliers, setProductSuppliers] = useState([]);
    const [allSuppliers, setAllSuppliers] = useState([]);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [supplierFormData, setSupplierFormData] = useState({
        supplierId: '', unitPrice: '', deliveryDays: '', reliabilityScore: ''
    });

    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [productsData, storageData, suppliersData] = await Promise.all([
                api.getAllProducts(),
                api.getAllStorage(),
                api.getAllSuppliers(),
            ]);
            setProducts(productsData);
            setStorage(storageData);
            setSuppliers(suppliersData);
            setAllSuppliers(suppliersData);
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
                const data = await api.getAllProducts();
                setProducts(data);
            } else {
                const data = await api.searchProducts(q);
                setProducts(data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    function openAddForm() {
        setEditingProduct(null);
        setFormData({ reference: '', name: '', category: '', unit: '', alertThreshold: '', maxCapacity: '' });
        setShowForm(true);
    }

    function openEditForm(product) {
        setEditingProduct(product);
        setFormData({
            reference: product.reference,
            name: product.name,
            category: product.category,
            unit: product.unit,
            alertThreshold: product.alert_threshold,
            maxCapacity: '',
        });
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingProduct(null);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.updateProduct(
                    editingProduct.id,
                    formData.reference,
                    formData.name,
                    formData.category,
                    formData.unit,
                    parseFloat(formData.alertThreshold),
                );
            } else {
                await api.createProduct(
                    formData.reference,
                    formData.name,
                    formData.category,
                    formData.unit,
                    parseFloat(formData.alertThreshold),
                    formData.maxCapacity ? parseFloat(formData.maxCapacity) : null,
                );
            }
            closeForm();
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleDelete(product) {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        try {
            await api.deleteProduct(product.id);
            loadData();
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function openProductDetail(product) {
        setSelectedProduct(product);
        try {
            const links = await api.getSuppliersForProduct(product.id);
            setProductSuppliers(links);
        } catch (e) {
            console.error(e);
        }
    }

    function closeProductDetail() {
        setSelectedProduct(null);
        setProductSuppliers([]);
        setShowSupplierForm(false);
        setEditingLink(null);
    }

    function openAddSupplierLink() {
        setEditingLink(null);
        setSupplierFormData({ supplierId: '', unitPrice: '', deliveryDays: '', reliabilityScore: '' });
        setShowSupplierForm(true);
    }

    function openEditSupplierLink(link) {
        setEditingLink(link);
        setSupplierFormData({
            supplierId: link.supplier_id,
            unitPrice: link.unit_price,
            deliveryDays: link.delivery_days,
            reliabilityScore: link.reliability_score,
        });
        setShowSupplierForm(true);
    }

    async function handleSupplierFormSubmit(e) {
        e.preventDefault();
        try {
            if (editingLink) {
                await api.updateProductSupplier(
                    editingLink.id,
                    parseFloat(supplierFormData.unitPrice),
                    parseInt(supplierFormData.deliveryDays),
                    parseFloat(supplierFormData.reliabilityScore),
                );
            } else {
                await api.addProductToSupplier(
                    selectedProduct.id,
                    parseInt(supplierFormData.supplierId),
                    parseFloat(supplierFormData.unitPrice),
                    parseInt(supplierFormData.deliveryDays),
                    parseFloat(supplierFormData.reliabilityScore),
                );
            }
            setShowSupplierForm(false);
            setEditingLink(null);
            const links = await api.getSuppliersForProduct(selectedProduct.id);
            setProductSuppliers(links);
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    async function handleRemoveSupplierLink(id) {
        if (!window.confirm('Remove this supplier link?')) return;
        try {
            await api.removeProductFromSupplier(id);
            const links = await api.getSuppliersForProduct(selectedProduct.id);
            setProductSuppliers(links);
        } catch (e) {
            alert('Error: ' + e);
        }
    }

    function getStockForProduct(productId) {
        return storage.find(s => s.product_id === productId);
    }

    if (loading) return <div>Loading products...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div id="page-products">
            <h1>Products</h1>

            <div id="products-toolbar">
                <input
                    type="text"
                    placeholder="Search by name or reference"
                    value={search}
                    onChange={handleSearch}
                />
                {canManageProducts() && (
                    <button onClick={openAddForm}>Add Product</button>
                )}
            </div>

            {/* Products table */}
            {!selectedProduct && (
                <table>
                    <thead>
                        <tr>
                            <th>Reference</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Unit</th>
                            <th>Stock</th>
                            <th>Threshold</th>
                            <th>Actions</th>
                            <th>Image</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => {
                            const stock = getStockForProduct(p.id);
                            const isLow = stock && stock.quantity <= p.alert_threshold;
                            return (
                                <tr key={p.id}>
                                    <td>{p.reference}</td>
                                    <td>{p.name}</td>
                                    <td>{p.category}</td>
                                    <td>{p.unit}</td>
                                    <td style={{ color: isLow ? 'red' : 'inherit' }}>
                                        {stock ? stock.quantity : '—'}
                                    </td>
                                    <td>{p.alert_threshold}</td>
                                    <td>
                                        <button onClick={() => openProductDetail(p)}>View</button>
                                        {canManageProducts() && (
                                            <>
                                                <button onClick={() => openEditForm(p)}>Edit</button>
                                                <button onClick={() => handleDelete(p)}>Delete</button>
                                            </>
                                        )}
                                    </td>
                                    <td>
                                        {p.image_path ? (
                                            <img
                                                src={api.getImageUrl(p.image_path)}
                                                alt={p.name}
                                                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        ) : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Add/Edit form */}
            {showForm && (
                <div id="product-form-container">
                    <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                    <form onSubmit={handleFormSubmit}>
                        <input
                            type="text"
                            placeholder="Reference"
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Category"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Unit"
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Alert threshold"
                            value={formData.alertThreshold}
                            onChange={e => setFormData({ ...formData, alertThreshold: e.target.value })}
                            required
                        />
                        {!editingProduct && (
                            <input
                                type="number"
                                placeholder="Max capacity (optional)"
                                value={formData.maxCapacity}
                                onChange={e => setFormData({ ...formData, maxCapacity: e.target.value })}
                            />
                        )}
                        <button type="submit">{editingProduct ? 'Update' : 'Create'}</button>
                        <button type="button" onClick={closeForm}>Cancel</button>
                    </form>
                </div>
            )}

            {/* Product detail */}
            {selectedProduct && (
                <div id="product-detail-container">
                    <h2>{selectedProduct.name}</h2>
                    <p>Reference: {selectedProduct.reference}</p>
                    <p>Category: {selectedProduct.category}</p>
                    <p>Unit: {selectedProduct.unit}</p>
                    <p>Alert threshold: {selectedProduct.alert_threshold}</p>

                    <div id="product-suppliers-section">
                        <h3>Suppliers</h3>
                        {productSuppliers.length === 0 ? (
                            <p>No suppliers linked.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Supplier ID</th>
                                        <th>Unit Price</th>
                                        <th>Delivery Days</th>
                                        <th>Reliability</th>
                                        {canManageProducts() && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {productSuppliers.map(link => (
                                        <tr key={link.id}>
                                            <td>{link.supplier_id}</td>
                                            <td>{link.unit_price}</td>
                                            <td>{link.delivery_days}</td>
                                            <td>{link.reliability_score}</td>
                                            {canManageProducts() && (
                                                <td>
                                                    <button onClick={() => openEditSupplierLink(link)}>Edit</button>
                                                    <button onClick={() => handleRemoveSupplierLink(link.id)}>Remove</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {canManageProducts() && (
                            <button onClick={openAddSupplierLink}>Add Supplier</button>
                        )}
                    </div>
                    <div id="product-image-section">
                        <h3>Product Image</h3>
                        {uploadingImage ? (
                            <p>Uploading...</p>
                        ) : selectedProduct.image_path ? (
                            <img
                                src={api.getImageUrl(selectedProduct.image_path)}
                                alt={selectedProduct.name}
                                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                            />
                        ) : (
                            <p>No image uploaded</p>
                        )}
                        {canManageProducts() && (
                            <label style={{ cursor: 'pointer'}}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}>
                                    Upload Image
                                </span>
                                <input
                                    disabled = {uploadingImage}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    style={{ display: 'none'}}
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        try {
                                            setUploadingImage(true)
                                            await new Promise(resolve => setTimeout(resolve, 0));
                                            await api.uploadProductImage(selectedProduct.id, file);
                                            await loadData(); // reload everything
                                            const updated = await api.getProductById(selectedProduct.id);
                                            setSelectedProduct(updated);
                                        } catch (err) {
                                            alert('Upload failed: ' + err);
                                        } finally {
                                            setUploadingImage(false)
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    {showSupplierForm && (
                        <form onSubmit={handleSupplierFormSubmit}>
                            <h3>{editingLink ? 'Edit Supplier Link' : 'Add Supplier'}</h3>
                            {!editingLink && (
                                <select
                                    value={supplierFormData.supplierId}
                                    onChange={e => setSupplierFormData({ ...supplierFormData, supplierId: e.target.value })}
                                    required
                                >
                                    <option value="">Select supplier</option>
                                    {allSuppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}
                            <input
                                type="number"
                                placeholder="Unit price"
                                value={supplierFormData.unitPrice}
                                onChange={e => setSupplierFormData({ ...supplierFormData, unitPrice: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Delivery days"
                                value={supplierFormData.deliveryDays}
                                onChange={e => setSupplierFormData({ ...supplierFormData, deliveryDays: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Reliability (0-1)"
                                step="0.01"
                                min="0"
                                max="1"
                                value={supplierFormData.reliabilityScore}
                                onChange={e => setSupplierFormData({ ...supplierFormData, reliabilityScore: e.target.value })}
                                required
                            />
                            <button type="submit">{editingLink ? 'Update' : 'Add'}</button>
                            <button type="button" onClick={() => { setShowSupplierForm(false); setEditingLink(null); }}>Cancel</button>
                        </form>
                    )}

                    <button onClick={closeProductDetail}>Back to Products</button>
                </div>
            )}
        </div>
    );
}