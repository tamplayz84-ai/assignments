import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function POSBilling() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]); // { product, quantity }
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.get('/customers').then((res) => setCustomers(res.data));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    const res = await api.get('/products', { params: { search } });
    setResults(res.data);
  }

  function addToCart(product) {
    setError('');
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock_quantity) {
          setError(`Only ${product.stock_quantity} unit(s) of "${product.name}" available.`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (product.stock_quantity < 1) {
        setError(`"${product.name}" is out of stock.`);
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, delta) {
    setError('');
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty > i.product.stock_quantity) {
            setError(`Only ${i.product.stock_quantity} unit(s) of "${i.product.name}" available.`);
            return i;
          }
          return { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.quantity * parseFloat(i.product.selling_price), 0);
  const discountAmount = parseFloat(discount) || 0;
  const taxAmount = (subtotal - discountAmount) * (parseFloat(taxRate) || 0) / 100;
  const total = subtotal - discountAmount + taxAmount;

  async function handleCompleteSale() {
    setError('');
    setSuccess(null);
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }
    try {
      const { data } = await api.post('/sales', {
        customer_id: customerId || null,
        items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        discount: discountAmount,
        tax_rate: parseFloat(taxRate) || 0,
        payment_method: paymentMethod,
      });
      setSuccess(data);
      setCart([]);
      setDiscount(0);
      setCustomerId('');
      setResults([]);
      setSearch('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete sale.');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">POS Billing</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded px-3 py-2 mb-4">{error}</div>}
      {success && (
        <div className="bg-green-50 text-green-800 text-sm rounded px-3 py-3 mb-4">
          Sale completed! Invoice <strong>{success.invoice_no}</strong> — Total Rs. {Number(success.total_amount).toFixed(2)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: search + results */}
        <div className="col-span-2">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product by name or barcode/SKU..."
              className="border rounded px-3 py-2 text-sm flex-1"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm">Search</button>
          </form>

          <div className="bg-white rounded-lg shadow p-4">
            {results.length === 0 ? (
              <div className="text-gray-400 text-sm">Search for a product to add it to the cart.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Stock</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2">Rs. {Number(p.selling_price).toFixed(2)}</td>
                      <td className="py-2">{p.stock_quantity}</td>
                      <td className="py-2">
                        <button
                          onClick={() => addToCart(p)}
                          disabled={p.stock_quantity < 1}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded px-3 py-1 text-xs"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: cart + checkout */}
        <div>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="font-semibold mb-3">Cart</h2>
            {cart.length === 0 ? (
              <div className="text-gray-400 text-sm">No items in cart.</div>
            ) : (
              <div className="space-y-3">
                {cart.map((i) => (
                  <div key={i.product.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{i.product.name}</div>
                      <div className="text-gray-500">Rs. {Number(i.product.selling_price).toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(i.product.id, -1)} className="bg-gray-200 rounded w-6 h-6">-</button>
                      <span>{i.quantity}</span>
                      <button onClick={() => updateQuantity(i.product.id, 1)} className="bg-gray-200 rounded w-6 h-6">+</button>
                      <button onClick={() => removeItem(i.product.id)} className="text-red-600 text-xs ml-2">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-xs font-medium mb-1">Customer (optional)</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-3">
              <option value="">Walk-in customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label className="block text-xs font-medium mb-1">Discount (Rs.)</label>
            <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-3" />

            <label className="block text-xs font-medium mb-1">Tax Rate (%)</label>
            <input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-3" />

            <label className="block text-xs font-medium mb-1">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-4">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="easypaisa_jazzcash">Easypaisa / JazzCash</option>
            </select>

            <div className="text-sm space-y-1 mb-4 border-t pt-3">
              <div className="flex justify-between"><span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>- Rs. {discountAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>+ Rs. {taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>Rs. {total.toFixed(2)}</span></div>
            </div>

            <button
              onClick={handleCompleteSale}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded py-2 text-sm font-medium"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
