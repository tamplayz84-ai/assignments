import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Inventory() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [adjusting, setAdjusting] = useState(null); // product being adjusted
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  function load() {
    api.get('/products', { params: { low_stock: showLowStockOnly } }).then((res) => setProducts(res.data));
  }

  useEffect(load, [showLowStockOnly]);

  async function handleAdjust() {
    setError('');
    const parsedQty = parseInt(qty, 10);
    if (!parsedQty) return setError('Enter a valid quantity (positive to add, negative to remove).');
    if (!reason.trim()) return setError('A reason is required.');

    try {
      await api.post(`/products/${adjusting.id}/adjust-stock`, { quantity: parsedQty, reason });
      setAdjusting(null);
      setQty('');
      setReason('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Adjustment failed.');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory / Stock</h1>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={showLowStockOnly} onChange={(e) => setShowLowStockOnly(e.target.checked)} />
          Show low stock only
        </label>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded px-3 py-2 mb-4">{error}</div>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Product</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2">Low Stock Limit</th>
                {isAdmin && <th className="pb-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2">{p.sku}</td>
                  <td className={`py-2 font-medium ${p.stock_quantity <= p.low_stock_limit ? 'text-red-600' : ''}`}>
                    {p.stock_quantity}
                    {p.stock_quantity <= p.low_stock_limit && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Low</span>}
                  </td>
                  <td className="py-2">{p.low_stock_limit}</td>
                  {isAdmin && (
                    <td className="py-2">
                      <button onClick={() => setAdjusting(p)} className="text-blue-600 hover:underline">Adjust Stock</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {adjusting ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-1">Adjust Stock</h2>
              <div className="text-sm text-gray-500 mb-3">{adjusting.name} — current stock: {adjusting.stock_quantity}</div>

              <label className="block text-xs font-medium mb-1">Quantity (+ to add, - to remove)</label>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-3" placeholder="e.g. 50 or -5" />

              <label className="block text-xs font-medium mb-1">Reason</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-4" placeholder="e.g. New shipment arrived" />

              <div className="flex gap-2">
                <button onClick={handleAdjust} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 text-sm">Save</button>
                <button onClick={() => setAdjusting(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 rounded py-2 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Select a product to adjust stock.</div>
          )}
        </div>
      </div>
    </div>
  );
}
