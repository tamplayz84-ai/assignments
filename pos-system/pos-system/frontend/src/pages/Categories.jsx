import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Categories() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.get('/categories').then((res) => setCategories(res.data));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
      } else {
        await api.post('/categories', form);
      }
      setForm({ name: '', description: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || '' });
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-6 flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border rounded px-3 py-2 text-sm w-64"
            />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm">
            {editingId ? 'Update' : 'Add Category'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm({ name: '', description: '' }); }}
              className="text-sm text-gray-500 underline"
            >
              Cancel
            </button>
          )}
        </form>
      )}

      {error && <div className="bg-red-50 text-red-700 text-sm rounded px-3 py-2 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Name</th>
              <th className="pb-2">Description</th>
              {isAdmin && <th className="pb-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2">{c.name}</td>
                <td className="py-2 text-gray-600">{c.description}</td>
                {isAdmin && (
                  <td className="py-2 space-x-3">
                    <button onClick={() => startEdit(c)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
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
