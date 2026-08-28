import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import bgImage from "./assets/eyecare-bg.jpg";
import "./ManageProducts.css";

const API_BASE_URL = "http://127.0.0.1:8000/api/auth";

export default function ManageProducts({ onBack }) {
  const [activeTab, setActiveTab] = useState("view"); // 'add', 'view', 'add-income', 'income'

  // Form State for Add Product
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Frames",
    quantity: "",
    buy_price: "",
    sell_price: "",
  });

  // Form State for Recording Sale / Income
  const [saleForm, setSaleForm] = useState({
    product_id: "",
    quantity: 1,
    unit_price: "",
    created_at: new Date().toISOString().split("T")[0],
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Table Data States
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", isError: false });

  // Search Terms
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [salesSearchTerm, setSalesSearchTerm] = useState("");

  // Sorting State for Products Table
  const [prodSortConfig, setProdSortConfig] = useState({
    key: "id",
    direction: "asc",
  });

  // Sorting State for Sales Table
  const [salesSortConfig, setSalesSortConfig] = useState({
    key: "id",
    direction: "asc",
  });

  // Fetch Products & Sales Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, salesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products/`),
        axios.get(`${API_BASE_URL}/sales/`),
      ]);
      setProducts(prodRes.data || []);
      setSales(salesRes.data || []);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadInventory = async () => {
      if (isMounted) {
        await fetchData();
      }
    };
    loadInventory();

    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  // Handle Input Changes for Add Product
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  // Add Product Submit Handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: "", isError: false });

    try {
      const response = await axios.post(`${API_BASE_URL}/products/`, {
        name: productForm.name,
        category: productForm.category,
        quantity: parseInt(productForm.quantity, 10),
        buy_price: parseFloat(productForm.buy_price),
        sell_price: parseFloat(productForm.sell_price),
      });

      setStatusMsg({
        text: response.data.message || "Product added successfully!",
        isError: false,
      });
      setProductForm({
        name: "",
        category: "Frames",
        quantity: "",
        buy_price: "",
        sell_price: "",
      });
      fetchData();
      setTimeout(() => setActiveTab("view"), 1200);
    } catch (err) {
      setStatusMsg({
        text: err.response?.data?.error || "Failed to add product.",
        isError: true,
      });
    }
  };

  // Delete Product Handler
  const handleDeleteProduct = async (productId) => {
    if (
      !window.confirm(`Are you sure you want to delete product ${productId}?`)
    )
      return;

    try {
      await axios.delete(`${API_BASE_URL}/products/${productId}/`);
      setStatusMsg({ text: "Product deleted successfully!", isError: false });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete product.");
    }
  };

  // Handle Dynamic Selection of Product in Sale Form
  const handleProductSelect = (e) => {
    const prodId = e.target.value;
    const prod = products.find((p) => p.id === prodId);
    setSelectedProduct(prod || null);
    setSaleForm((prev) => ({
      ...prev,
      product_id: prodId,
      unit_price: prod ? prod.sell_price : "",
    }));
  };

  // Record Sale / Add Income Handler
  const handleAddSale = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: "", isError: false });

    if (!saleForm.product_id) {
      setStatusMsg({
        text: "Please select a product from inventory.",
        isError: true,
      });
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/sales/`, {
        product_id: saleForm.product_id,
        quantity: parseInt(saleForm.quantity, 10),
        unit_price: parseFloat(saleForm.unit_price),
        created_at: saleForm.created_at,
      });

      setStatusMsg({
        text: response.data.message || "Sale recorded and stock updated!",
        isError: false,
      });
      setSaleForm({
        product_id: "",
        quantity: 1,
        unit_price: "",
        created_at: new Date().toISOString().split("T")[0],
      });
      setSelectedProduct(null);
      fetchData();
      setTimeout(() => setActiveTab("income"), 1200);
    } catch (err) {
      setStatusMsg({
        text: err.response?.data?.error || "Failed to record sale transaction.",
        isError: true,
      });
    }
  };

  // Product Sorting Handler
  const requestProdSort = (key) => {
    let direction = "asc";
    if (prodSortConfig.key === key && prodSortConfig.direction === "asc") {
      direction = "desc";
    }
    setProdSortConfig({ key, direction });
  };

  // Sales Sorting Handler
  const requestSalesSort = (key) => {
    let direction = "asc";
    if (salesSortConfig.key === key && salesSortConfig.direction === "asc") {
      direction = "desc";
    }
    setSalesSortConfig({ key, direction });
  };

  // Filter and Sort Products safely
  const processedProducts = [...products]
    .filter(
      (p) =>
        String(p.name || "")
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        String(p.category || "")
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        String(p.id || "")
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const { key, direction } = prodSortConfig;
      let aVal = a[key] ?? "";
      let bVal = b[key] ?? "";

      if (key === "quantity" || key === "buy_price" || key === "sell_price") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

  // Filter and Sort Sales safely
  const processedSales = [...sales]
    .filter(
      (s) =>
        String(s.id || "")
          .toLowerCase()
          .includes(salesSearchTerm.toLowerCase()) ||
        String(s.product_id || "")
          .toLowerCase()
          .includes(salesSearchTerm.toLowerCase()) ||
        String(s.created_at || "")
          .toLowerCase()
          .includes(salesSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const { key, direction } = salesSortConfig;
      let aVal = a[key] ?? "";
      let bVal = b[key] ?? "";

      if (key === "quantity" || key === "unit_price" || key === "total") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

  const getSortIndicator = (config, key) => {
    if (config.key !== key) return " ↕";
    return config.direction === "asc" ? " ▲" : " ▼";
  };

  // Total calculated income from sales
  const totalIncome = sales.reduce(
    (acc, curr) => acc + (parseFloat(curr.total) || 0),
    0
  );

  return (
    <div
      className="products-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.55)), url(${bgImage})`,
      }}
    >
      <div className="products-container">
        {/* Header */}
        <div className="products-header">
          <div className="header-title-group">
            <svg
              className="header-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
            </svg>
            <div>
              <h1 className="header-title">Product Management</h1>
              <p className="header-subtitle">Inventory & Revenue Control</p>
            </div>
          </div>
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ← Back to Dashboard
            </button>
          )}
        </div>

        {/* Top Navigation Bar */}
        <div className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <span className="tab-icon">+</span> Add Product
          </button>
          <button
            className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
            onClick={() => setActiveTab("view")}
          >
            <span className="tab-icon">📋</span> View Products (
            {products.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "add-income" ? "active" : ""}`}
            onClick={() => setActiveTab("add-income")}
          >
            <span className="tab-icon">💳</span> Record Sale
          </button>
          <button
            className={`tab-btn ${activeTab === "income" ? "active" : ""}`}
            onClick={() => setActiveTab("income")}
          >
            <span className="tab-icon">💰</span> Income History
          </button>
        </div>

        {/* Tab Content 1: ADD PRODUCT */}
        {activeTab === "add" && (
          <div className="tab-card">
            <h2 className="card-heading">Add New Optical Item</h2>
            {statusMsg.text && (
              <p
                className={
                  statusMsg.isError
                    ? "status-msg error-msg"
                    : "status-msg success-msg"
                }
              >
                {statusMsg.text}
              </p>
            )}

            <form onSubmit={handleAddProduct} className="products-form">
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    className="products-input"
                    value={productForm.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Ray-Ban Wayfarer Classic"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    name="category"
                    className="products-input"
                    value={productForm.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Frames">Frames</option>
                    <option value="Lenses">Lenses</option>
                    <option value="Sunglasses">Sunglasses</option>
                    <option value="Contact Lenses">Contact Lenses</option>
                    <option value="Accessories">Accessories & Care</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Quantity in Stock</label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    className="products-input"
                    value={productForm.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="buy_price"
                    min="0"
                    className="products-input"
                    value={productForm.buy_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="sell_price"
                    min="0"
                    className="products-input"
                    value={productForm.sell_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary-products">
                Save Product to Inventory
              </button>
            </form>
          </div>
        )}

        {/* Tab Content 2: VIEW PRODUCTS */}
        {activeTab === "view" && (
          <div className="tab-card">
            <div className="card-header-row">
              <h2 className="card-heading">Inventory Catalog</h2>
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search name, category, ID..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => requestProdSort("id")}
                      className="sortable-th"
                    >
                      ID{getSortIndicator(prodSortConfig, "id")}
                    </th>
                    <th
                      onClick={() => requestProdSort("name")}
                      className="sortable-th"
                    >
                      Name{getSortIndicator(prodSortConfig, "name")}
                    </th>
                    <th
                      onClick={() => requestProdSort("category")}
                      className="sortable-th"
                    >
                      Category{getSortIndicator(prodSortConfig, "category")}
                    </th>
                    <th
                      onClick={() => requestProdSort("quantity")}
                      className="sortable-th"
                    >
                      Stock{getSortIndicator(prodSortConfig, "quantity")}
                    </th>
                    <th
                      onClick={() => requestProdSort("buy_price")}
                      className="sortable-th"
                    >
                      Buy Price{getSortIndicator(prodSortConfig, "buy_price")}
                    </th>
                    <th
                      onClick={() => requestProdSort("sell_price")}
                      className="sortable-th"
                    >
                      Sell Price{getSortIndicator(prodSortConfig, "sell_price")}
                    </th>
                    <th
                      onClick={() => requestProdSort("created_at")}
                      className="sortable-th"
                    >
                      Date Added{getSortIndicator(prodSortConfig, "created_at")}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="table-empty">
                        Loading products...
                      </td>
                    </tr>
                  ) : processedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="table-empty">
                        No matching products found.
                      </td>
                    </tr>
                  ) : (
                    processedProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="id-badge">{p.id}</td>
                        <td className="font-semibold">{p.name}</td>
                        <td>
                          <span className="category-tag">{p.category}</span>
                        </td>
                        <td>
                          <span
                            className={
                              p.quantity < 5 ? "stock-low" : "stock-ok"
                            }
                          >
                            {p.quantity} units
                          </span>
                        </td>
                        <td>${parseFloat(p.buy_price).toFixed(2)}</td>
                        <td className="price-highlight">
                          ${parseFloat(p.sell_price).toFixed(2)}
                        </td>
                        <td>{p.created_at}</td>
                        <td>
                          <button
                            className="btn-delete-product"
                            onClick={() => handleDeleteProduct(p.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 3: RECORD SALE / ADD INCOME */}
        {activeTab === "add-income" && (
          <div className="tab-card">
            <h2 className="card-heading">Record Customer Transaction</h2>
            {statusMsg.text && (
              <p
                className={
                  statusMsg.isError
                    ? "status-msg error-msg"
                    : "status-msg success-msg"
                }
              >
                {statusMsg.text}
              </p>
            )}

            <form onSubmit={handleAddSale} className="products-form">
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">Select Item Name</label>
                  <select
                    className="products-input"
                    value={saleForm.product_id}
                    onChange={handleProductSelect}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={p.quantity <= 0}
                      >
                        {p.name} ({p.quantity} available - $
                        {parseFloat(p.sell_price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Category</label>
                  <input
                    type="text"
                    className="products-input"
                    value={selectedProduct ? selectedProduct.category : ""}
                    readOnly
                    placeholder="Auto-populated"
                    style={{ opacity: 0.7 }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Units Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct ? selectedProduct.quantity : 999}
                    className="products-input"
                    value={saleForm.quantity}
                    onChange={(e) =>
                      setSaleForm((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="products-input"
                    value={saleForm.unit_price}
                    onChange={(e) =>
                      setSaleForm((prev) => ({
                        ...prev,
                        unit_price: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Transaction Date</label>
                  <input
                    type="date"
                    className="products-input"
                    value={saleForm.created_at}
                    onChange={(e) =>
                      setSaleForm((prev) => ({
                        ...prev,
                        created_at: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Total Amount</label>
                  <input
                    type="text"
                    className="products-input"
                    value={
                      saleForm.unit_price && saleForm.quantity
                        ? `$${(
                            parseFloat(saleForm.unit_price) *
                            parseInt(saleForm.quantity, 10)
                          ).toFixed(2)}`
                        : "$0.00"
                    }
                    readOnly
                    style={{ opacity: 0.7, color: "#34d399", fontWeight: 700 }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary-products">
                Complete Sale & Deduct Stock
              </button>
            </form>
          </div>
        )}

        {/* Tab Content 4: INCOME HISTORY (SALES) */}
        {activeTab === "income" && (
          <div className="tab-card">
            <div className="card-header-row">
              <h2 className="card-heading">Sales & Revenue Ledger</h2>
              <div
                style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}
              >
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Search Sale ID, Product ID, Date..."
                  value={salesSearchTerm}
                  onChange={(e) => setSalesSearchTerm(e.target.value)}
                />
                <div className="revenue-pill">
                  Total Revenue: <span>${totalIncome.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => requestSalesSort("id")}
                      className="sortable-th"
                    >
                      Sale ID{getSortIndicator(salesSortConfig, "id")}
                    </th>
                    <th
                      onClick={() => requestSalesSort("product_id")}
                      className="sortable-th"
                    >
                      Product ID
                      {getSortIndicator(salesSortConfig, "product_id")}
                    </th>
                    <th
                      onClick={() => requestSalesSort("quantity")}
                      className="sortable-th"
                    >
                      Quantity{getSortIndicator(salesSortConfig, "quantity")}
                    </th>
                    <th
                      onClick={() => requestSalesSort("unit_price")}
                      className="sortable-th"
                    >
                      Unit Price
                      {getSortIndicator(salesSortConfig, "unit_price")}
                    </th>
                    <th
                      onClick={() => requestSalesSort("total")}
                      className="sortable-th"
                    >
                      Total Amount{getSortIndicator(salesSortConfig, "total")}
                    </th>
                    <th
                      onClick={() => requestSalesSort("created_at")}
                      className="sortable-th"
                    >
                      Transaction Date
                      {getSortIndicator(salesSortConfig, "created_at")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="table-empty">
                        Loading sales history...
                      </td>
                    </tr>
                  ) : processedSales.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="table-empty">
                        No sales matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    processedSales.map((s) => (
                      <tr key={s.id}>
                        <td className="id-badge">{s.id}</td>
                        <td className="font-semibold">
                          {s.product_name
                            ? `${s.product_name} (${s.product_id})`
                            : s.product_id}
                        </td>
                        <td>{s.quantity}</td>
                        <td>${parseFloat(s.unit_price).toFixed(2)}</td>
                        <td className="price-highlight">
                          ${parseFloat(s.total).toFixed(2)}
                        </td>
                        <td>{s.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
