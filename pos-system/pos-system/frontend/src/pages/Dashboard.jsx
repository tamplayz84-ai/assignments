import { useEffect, useState } from 'react';
import api from '../api/axios';

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'));
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's Sales" value={`Rs. ${Number(data.today_sales_amount).toFixed(2)}`} />
        <StatCard label="Today's Orders" value={data.today_orders_count} />
        <StatCard label="Total Products" value={data.total_products} />
        <StatCard label="Low Stock Items" value={data.low_stock_count} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">Top Selling Products</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Product</th>
                <th className="pb-2">Qty Sold</th>
                <th className="pb-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.top_selling_products.map((p) => (
                <tr key={p.product_id} className="border-b last:border-0">
                  <td className="py-2">{p.Product?.name}</td>
                  <td className="py-2">{p.dataValues?.total_quantity_sold ?? p.total_quantity_sold}</td>
                  <td className="py-2">Rs. {Number(p.dataValues?.total_revenue ?? p.total_revenue).toFixed(2)}</td>
                </tr>
              ))}
              {data.top_selling_products.length === 0 && (
                <tr><td colSpan="3" className="py-3 text-gray-400">No sales yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">Low Stock Products</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Product</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2">Limit</th>
              </tr>
            </thead>
            <tbody>
              {data.low_stock_products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-red-600 font-medium">{p.stock_quantity}</td>
                  <td className="py-2">{p.low_stock_limit}</td>
                </tr>
              ))}
              {data.low_stock_products.length === 0 && (
                <tr><td colSpan="3" className="py-3 text-gray-400">All products well stocked.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h2 className="font-semibold mb-3">Recent Sales</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Invoice</th>
              <th className="pb-2">Cashier</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Payment</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_sales.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2">{s.invoice_no}</td>
                <td className="py-2">{s.User?.name}</td>
                <td className="py-2">Rs. {Number(s.total_amount).toFixed(2)}</td>
                <td className="py-2 capitalize">{s.payment_method.replace('_', '/')}</td>
                <td className="py-2">{new Date(s.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
