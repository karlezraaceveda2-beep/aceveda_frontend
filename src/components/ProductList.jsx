import { useCallback, useEffect, useState } from 'react';
import { getProducts, deleteProduct, errorMessage } from '../api.js';
import ProductForm from './ProductForm.jsx';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export default function ProductList({ user, onLogout }) {
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formFor, setFormFor] = useState(null); // null = closed, {} = add, product = edit
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getProducts());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"?`)) return;
    try {
      await deleteProduct(p.id);
      setNotice('Product deleted.');
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleSaved = (msg) => {
    setFormFor(null);
    setNotice(msg);
    load();
  };

  const visibleProducts = products
    .filter((product) => `${product.product_name} ${product.description ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      if (sortBy === 'price') return a.price - b.price;
      return a.product_name.localeCompare(b.product_name);
    });
  const lowStockCount = products.filter((product) => product.quantity <= 5).length;
  const inventoryValue = products.reduce((total, product) => total + Number(product.price) * Number(product.quantity), 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="#products" aria-label="Stockroom home">
          <span className="brand-mark">s</span>
          <span><strong>stockroom</strong><small>PRODUCT DESK</small></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Workspace">
          <a className="nav-link active" href="#products"><span className="nav-glyph">▦</span>Products<span className="nav-count">{products.length}</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="account-chip">
            <span className="avatar">{(user.username || 'U').slice(0, 1).toUpperCase()}</span>
            <span className="account-name"><strong>{user.username}</strong><small>{isAdmin ? 'Administrator' : 'Read only'}</small></span>
          </div>
          <button className="signout-button" onClick={onLogout}><span aria-hidden="true">↗</span> Sign out</button>
        </div>
      </aside>

      <main className="main-area" id="products">
        <div className="topline"><span>Workspace <span aria-hidden="true">/</span> Inventory</span><span className="live-indicator">LIVE CATALOG</span></div>
        <section className="page-heading">
          <div>
            <p className="eyebrow">INVENTORY OVERVIEW</p>
            <h1>Products<span className="heading-period">.</span></h1>
            <p className="heading-copy">A clear view of every item in your catalog.</p>
          </div>
          {isAdmin && <button className="primary-button" onClick={() => setFormFor({})}><span aria-hidden="true">+</span> Add product</button>}
        </section>

        {error && <div className="alert error" role="alert">{error}</div>}
        {notice && <div className="alert success" role="status" onClick={() => setNotice('')}>{notice}</div>}

        <section className="summary-strip" aria-label="Inventory summary">
          <div className="summary-item"><span className="summary-label">CATALOG ITEMS</span><strong>{loading ? '—' : products.length.toString().padStart(2, '0')}</strong><span className="summary-note">registered products</span></div>
          <div className="summary-item"><span className="summary-label">LOW STOCK</span><strong className={lowStockCount ? 'summary-warn' : ''}>{loading ? '—' : lowStockCount.toString().padStart(2, '0')}</strong><span className="summary-note">5 units or fewer</span></div>
          <div className="summary-item"><span className="summary-label">INVENTORY VALUE</span><strong>{loading ? '—' : peso.format(inventoryValue)}</strong><span className="summary-note">based on current quantity</span></div>
        </section>

        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="catalog-heading">
            <div><h2 id="catalog-title">Catalog</h2><span className="catalog-count">{visibleProducts.length} {visibleProducts.length === 1 ? 'item' : 'items'}</span></div>
            {!isAdmin && <span className="access-label"><span aria-hidden="true">◉</span> VIEW ONLY</span>}
          </div>
          <div className="catalog-tools">
            <label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search products" placeholder="Find a product…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <label className="sort-field"><span>SORT BY</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="name">Name</option><option value="quantity">Lowest stock</option><option value="price">Lowest price</option></select></label>
          </div>

          <div className="table-wrap">
            {loading ? <div className="table-state"><span className="loader-mark" />Loading catalog…</div> : (
              <table>
                <thead><tr><th>PRODUCT</th><th>DESCRIPTION</th><th className="num">UNIT PRICE</th><th className="num">ON HAND</th><th>STOCK STATUS</th>{isAdmin && <th className="actions-heading">ACTIONS</th>}</tr></thead>
                <tbody>
                  {visibleProducts.length === 0 ? (
                    <tr><td colSpan={isAdmin ? 6 : 5} className="empty-state"><span className="empty-mark">—</span><strong>{query ? 'No matching products' : 'Your catalog is empty'}</strong><span>{query ? 'Try a different product name or description.' : isAdmin ? 'Add a product to get your inventory started.' : 'There are no products to display yet.'}</span></td></tr>
                  ) : visibleProducts.map((product) => (
                    <tr key={product.id}>
                      <td><div className="product-cell"><span className="product-monogram">{product.product_name.slice(0, 1).toUpperCase()}</span><span><strong>{product.product_name}</strong><small>SKU-{String(product.id).padStart(4, '0')}</small></span></div></td>
                      <td className="description-cell">{product.description || 'No description'}</td>
                      <td className="num price-cell">{peso.format(product.price)}</td>
                      <td className="num quantity-cell">{product.quantity}</td>
                      <td><span className={`stock-pill ${product.quantity <= 5 ? 'low' : 'available'}`}><i />{product.quantity <= 5 ? 'Low stock' : 'In stock'}</span></td>
                      {isAdmin && <td className="row-actions"><button className="text-action" onClick={() => setFormFor(product)}>Edit</button><button className="text-action delete-action" onClick={() => handleDelete(product)}>Delete</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="catalog-foot"><span>Showing {visibleProducts.length} of {products.length} products</span><span>STOCKROOM <i>·</i> INVENTORY</span></div>
        </section>
      </main>

      {isAdmin && formFor && (
        <ProductForm
          product={formFor.id ? formFor : null}
          onSaved={handleSaved}
          onCancel={() => setFormFor(null)}
        />
      )}
    </div>
  );
}
