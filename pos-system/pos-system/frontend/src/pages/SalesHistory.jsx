import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function SalesHistory() {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [selected, setSelected] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [reasonInput, setReasonInput] = useState('');

  function load() {
    api.get('/sales', { params: { from, to } }).then((res) => setSales(res.data));
  }

  useEffect(load, []);

  async function openDetail(id) {
    const res = await api.get(`/sales/${id}`);
    setSelected(res.data);
    setReasonInput('');
  }

  async function handleRefund() {
    if (!reasonInput.trim()) return setError('Refund reason is required.');
    try {
      await api.post(`/sales/${selected.id}/refund`, { reason: reasonInput });
      setSelected(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Refund failed.');
    }
  }

  async function handleCancel() {
    if (!reasonInput.trim()) return setError('Cancellation reason is required.');
    try {
      await api.post(`/sales/${selected.id}/cancel`, { reason: reasonInput });
      setSelected(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed.');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2 mb-4 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        </div>
        <button className="bg-gray-200 hover:bg-gray-300 rounded px-4 py-2 text-sm">Filter</button>
      </form>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded px-3 py-2 mb-4">{error}</div>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Invoice</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Cashier</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} onClick={() => openDetail(s.id)} className="border-b last:border-0 cursor-pointer hover:bg-gray-50">
                  <td className="py-2 text-blue-600">{s.invoice_no}</td>
                  <td className="py-2">{s.Customer?.name || 'Walk-in'}</td>
                  <td className="py-2">{s.User?.name}</td>
                  <td className="py-2">Rs. {Number(s.total_amount).toFixed(2)}</td>
                  <td className="py-2 capitalize">{s.status}</td>
                  <td className="py-2">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {selected ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-2">Invoice {selected.invoice_no}</h2>
              <div className="text-sm text-gray-500 mb-3">
                {new Date(selected.created_at).toLocaleString()} · Status: <span className="capitalize">{selected.status}</span>
              </div>
              <table className="w-full text-sm mb-3">
                <tbody>
                  {selected.items.map((it) => (
                    <tr key={it.id} className="border-b">
                      <td className="py-1">{it.Product?.name}</td>
                      <td className="py-1">x{it.quantity}</td>
                      <td className="py-1">Rs. {Number(it.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-sm space-y-1 mb-3">
                <div className="flex justify-between"><span>Subtotal</span><span>Rs. {Number(selected.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>Rs. {Number(selected.discount).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>Rs. {Number(selected.tax).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>Rs. {Number(selected.total_amount).toFixed(2)}</span></div>
              </div>

              {isAdmin && selected.status === 'completed' && (
                <div className="border-t pt-3">
                  <label className="block text-xs font-medium mb-1">Reason (for refund/cancel)</label>
                  <input value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-2" />
                  <div className="flex gap-2">
                    <button onClick={handleRefund} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded py-1.5 text-sm">Refund</button>
                    <button onClick={handleCancel} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded py-1.5 text-sm">Cancel Sale</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Select a sale to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
