import { useState } from 'react';
import api from '../api/axios';

const TABS = ['Sales', 'Product-wise', 'Profit', 'Low Stock', 'Cashier-wise'];

export default function Reports() {
  const [tab, setTab] = useState('Sales');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setError('');
    setLoading(true);
    setData(null);
    try {
      let res;
      const params = { from, to };
      if (tab === 'Sales') res = await api.get('/reports/sales', { params });
      else if (tab === 'Product-wise') res = await api.get('/reports/product-wise', { params });
      else if (tab === 'Profit') res = await api.get('/reports/profit', { params });
      else if (tab === 'Low Stock') res = await api.get('/reports/low-stock');
      else if (tab === 'Cashier-wise') res = await api.get('/reports/cashier-wise', { params });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format) {
    const params = new URLSearchParams({ from, to }).toString();
    const token = localStorage.getItem('pos_token');
    const res = await fetch(`http://localhost:5000/api/reports/export/${format}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setData(null); }}
            className={`px-4 py-2 rounded text-sm ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-end mb-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        </div>
        <button onClick={loadReport} className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm">
          Run Report
        </button>
        <button onClick={() => handleExport('csv')} className="bg-gray-200 hover:bg-gray-300 rounded px-4 py-2 text-sm">Export CSV</button>
        <button onClick={() => handleExport('excel')} className="bg-gray-200 hover:bg-gray-300 rounded px-4 py-2 text-sm">Export Excel</button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded px-3 py-2 mb-4">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Loading report...</div>}

      {data && (
        <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
          {tab === 'Sales' && (
            <>
              <div className="text-sm mb-3">
                Invoices: <strong>{data.total_invoices}</strong> · Total: <strong>Rs. {Number(data.total_amount).toFixed(2)}</strong>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Invoice</th><th className="pb-2">Cashier</th><th className="pb-2">Total</th><th className="pb-2">Date</th></tr></thead>
                <tbody>
                  {data.sales.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2">{s.invoice_no}</td>
                      <td className="py-2">{s.User?.name}</td>
                      <td className="py-2">Rs. {Number(s.total_amount).toFixed(2)}</td>
                      <td className="py-2">{new Date(s.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'Product-wise' && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Product</th><th className="pb-2">Qty Sold</th><th className="pb-2">Revenue</th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.product_id} className="border-b last:border-0">
                    <td className="py-2">{r.Product?.name}</td>
                    <td className="py-2">{r.dataValues?.total_quantity_sold ?? r.total_quantity_sold}</td>
                    <td className="py-2">Rs. {Number(r.dataValues?.total_revenue ?? r.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'Profit' && (
            <>
              <div className="text-sm mb-3">
                Revenue: <strong>Rs. {Number(data.totals.revenue).toFixed(2)}</strong> ·
                Cost: <strong>Rs. {Number(data.totals.cost).toFixed(2)}</strong> ·
                Profit: <strong className="text-green-700">Rs. {Number(data.totals.profit).toFixed(2)}</strong>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Product</th><th className="pb-2">Qty Sold</th><th className="pb-2">Revenue</th><th className="pb-2">Cost</th><th className="pb-2">Profit</th></tr></thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.product_id} className="border-b last:border-0">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2">{p.quantity_sold}</td>
                      <td className="py-2">Rs. {p.revenue.toFixed(2)}</td>
                      <td className="py-2">Rs. {p.cost.toFixed(2)}</td>
                      <td className="py-2 text-green-700">Rs. {p.profit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'Low Stock' && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Product</th><th className="pb-2">Stock</th><th className="pb-2">Limit</th></tr></thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-red-600 font-medium">{p.stock_quantity}</td>
                    <td className="py-2">{p.low_stock_limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'Cashier-wise' && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Cashier</th><th className="pb-2">Invoices</th><th className="pb-2">Total Sales</th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.user_id} className="border-b last:border-0">
                    <td className="py-2">{r.User?.name}</td>
                    <td className="py-2">{r.dataValues?.total_invoices ?? r.total_invoices}</td>
                    <td className="py-2">Rs. {Number(r.dataValues?.total_amount ?? r.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
