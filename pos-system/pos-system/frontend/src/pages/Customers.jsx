import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { name: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.get('/customers').then((res) => setCustomers(res.data));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, form);
      } else {
        await api.post('/customers', form);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone || '', address: c.address || '' });
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer?')) return;
    await api.delete(`/customers/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Customers</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-6 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border rounded px-3 py-2 text-sm w-64" />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm">
          {editingId ? 'Update' : 'Add Customer'}
        </button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="text-sm text-gray-500 underline">
            Cancel
          </button>
        )}
      </form>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded px-3 py-2 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Name</th>
              <th className="pb-2">Phone</th>
              <th className="pb-2">Address</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2">{c.name}</td>
                <td className="py-2">{c.phone}</td>
                <td className="py-2">{c.address}</td>
                <td className="py-2 space-x-3">
                  <button onClick={() => startEdit(c)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
