import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '', sku: '', barcode: '', category_id: '',
  purchase_price: '', selling_price: '', stock_quantity: '', low_stock_limit: '',
};

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  function load(q = '') {
    api.get('/products', { params: { search: q } }).then((res) => setProducts(res.data));
  }

  useEffect(() => {
    load();
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, form);
      } else {
        await api.post('/products', form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name, sku: p.sku || '', barcode: p.barcode || '',
      category_id: p.category_id || '', purchase_price: p.purchase_price,
      selling_price: p.selling_price, stock_quantity: p.stock_quantity,
      low_stock_limit: p.low_stock_limit,
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      load(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm"
          >
            {showForm ? 'Close' : '+ Add Product'}
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU, or barcode..."
          className="border rounded px-3 py-2 text-sm w-72"
        />
        <button className="bg-gray-200 hover:bg-gray-300 rounded px-4 py-2 text-sm">Search</button>
      </form>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded px-3 py-2 mb-4">{error}</div>}

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-3 gap-4">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="border rounded px-3 py-2 text-sm">
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input required type="number" step="0.01" placeholder="Purchase Price" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          <input required type="number" step="0.01" placeholder="Selling Price" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          {!editingId && (
            <input type="number" placeholder="Initial Stock Quantity" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          )}
          <input type="number" placeholder="Low Stock Limit" value={form.low_stock_limit} onChange={(e) => setForm({ ...form, low_stock_limit: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm col-span-3">
            {editingId ? 'Update Product' : 'Save Product'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Name</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">Purchase</th>
              <th className="pb-2">Selling</th>
              <th className="pb-2">Stock</th>
              {isAdmin && <th className="pb-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2">{p.name}</td>
                <td className="py-2">{p.sku}</td>
                <td className="py-2">{p.Category?.name || '-'}</td>
                <td className="py-2">Rs. {Number(p.purchase_price).toFixed(2)}</td>
                <td className="py-2">Rs. {Number(p.selling_price).toFixed(2)}</td>
                <td className={`py-2 font-medium ${p.stock_quantity <= p.low_stock_limit ? 'text-red-600' : ''}`}>
                  {p.stock_quantity}
                </td>
                {isAdmin && (
                  <td className="py-2 space-x-3">
                    <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
