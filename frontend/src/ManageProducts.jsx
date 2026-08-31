import { useState, useEffect, useCallback } from "react";
import api from "./api";
import bgImage from "./assets/eyecare-bg.jpg";
import "./ManageProducts.css";

export default function ManageProducts({ onBack }) {
  const [activeTab, setActiveTab] = useState("view");

  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    category: "Frames",
    quantity: "",
    buy_price: "",
    sell_price: "",
  });

  const [saleForm, setSaleForm] = useState({
    product_id: "",
    quantity: 1,
    unit_price: "",
    created_at: new Date().toISOString().split("T")[0],
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", isError: false });

  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [salesSearchTerm, setSalesSearchTerm] = useState("");

  const [prodSortConfig, setProdSortConfig] = useState({
    key: "id",
    direction: "asc",
  });

  const [salesSortConfig, setSalesSortConfig] = useState({
    key: "id",
    direction: "asc",
  });

  const [debugError, setDebugError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setDebugError("");

    const [prodRes, salesRes] = await Promise.allSettled([
      api.get("/auth/products/"),
      api.get("/auth/sales/"),
    ]);

    if (prodRes.status === "fulfilled") {
      setProducts(prodRes.value.data?.results || prodRes.value.data || []);
    } else {
      console.error("Failed to load products:", prodRes.reason);
      const errData = prodRes.reason?.response?.data;
      const errMsg =
        typeof errData === "string"
          ? errData
          : JSON.stringify(errData) || prodRes.reason?.message;
      setDebugError((prev) => prev + ` [Products Error: ${errMsg}]`);
    }

    if (salesRes.status === "fulfilled") {
      setSales(salesRes.value.data?.results || salesRes.value.data || []);
    } else {
      console.error("Failed to load sales:", salesRes.reason);
      const errData = salesRes.reason?.response?.data;
      const errMsg =
        typeof errData === "string"
          ? errData
          : JSON.stringify(errData) || salesRes.reason?.message;
      setDebugError((prev) => prev + ` [Sales Error: ${errMsg}]`);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadInventory = async () => {
      if (isMounted) await fetchData();
    };
    loadInventory();

    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: "", isError: false });

    try {
      const response = await api.post("/auth/products/", {
        id: productForm.id.trim(),
        name: productForm.name,
        category: productForm.category,
        quantity: parseInt(productForm.quantity, 10),
        buy_price: parseFloat(productForm.buy_price),
        sell_price: parseFloat(productForm.sell_price),
      });

      setStatusMsg({
        text: response.data?.message || "Product added successfully!",
        isError: false,
      });
      setProductForm({
        id: "",
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
        text:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to add product.",
        isError: true,
      });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (
      !window.confirm(`Are you sure you want to delete product #${productId}?`)
    )
      return;

    try {
      await api.delete(`/auth/products/${productId}/`);
      setStatusMsg({ text: "Product deleted successfully!", isError: false });
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to delete product."
      );
    }
  };

  const handleProductSelect = (e) => {
    const prodId = e.target.value;
    const prod = products.find((p) => String(p.id) === String(prodId));
    setSelectedProduct(prod || null);
    setSaleForm((prev) => ({
      ...prev,
      product_id: prodId,
      unit_price: prod ? prod.sell_price : "",
    }));
  };

const handleAddSale = async (e) => {
  e.preventDefault();
  setStatusMsg({ text: "", isError: false });
  setDebugError("");

  if (!saleForm.product_id) {
    setStatusMsg({
      text: "Please select a product from inventory.",
      isError: true,
    });
    return;
  }

  try {
    const parsedQty = parseInt(saleForm.quantity, 10);
    const parsedPrice = parseFloat(saleForm.unit_price);

    const response = await api.post("/auth/sales/", {
      product_id: saleForm.product_id,
      quantity: parsedQty,
      unit_price: parsedPrice,
      created_at: saleForm.created_at,
    });

    setStatusMsg({
      text: response.data?.message || "Sale recorded and stock updated!",
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
    console.error("Sale Recording Error:", err);

    // Extract full error payload from backend response
    const serverError = err.response?.data;
    let detailedMsg = "";

    if (typeof serverError === "string") {
      detailedMsg = serverError;
    } else if (serverError && typeof serverError === "object") {
      detailedMsg =
        serverError.error || serverError.detail || JSON.stringify(serverError);
    } else {
      detailedMsg = err.message || "Unknown error occurred.";
    }

    const formattedError = `Sale Error (${
      err.response?.status || "Network Error"
    }): ${detailedMsg}`;

    // Update both the status message banner and top debug container
    setStatusMsg({
      text: formattedError,
      isError: true,
    });
    setDebugError(formattedError);
  }
};
  const requestProdSort = (key) => {
    let direction = "asc";
    if (prodSortConfig.key === key && prodSortConfig.direction === "asc") {
      direction = "desc";
    }
    setProdSortConfig({ key, direction });
  };

  const requestSalesSort = (key) => {
    let direction = "asc";
    if (salesSortConfig.key === key && salesSortConfig.direction === "asc") {
      direction = "desc";
    }
    setSalesSortConfig({ key, direction });
  };

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

  const processedSales = [...sales]
    .filter(
      (s) =>
        String(s.id || "")
          .toLowerCase()
          .includes(salesSearchTerm.toLowerCase()) ||
        String(s.product_id || s.product || "")
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

      if (key === "total") {
        aVal =
          a.total ??
          (parseFloat(a.unit_price) || 0) * (parseInt(a.quantity, 10) || 0);
        bVal =
          b.total ??
          (parseFloat(a.unit_price) || 0) * (parseInt(a.quantity, 10) || 0);
      } else if (key === "quantity" || key === "unit_price") {
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

  const totalIncome = sales.reduce((acc, curr) => {
    const totalVal = curr.total
      ? parseFloat(curr.total)
      : (parseFloat(curr.unit_price) || 0) * (parseInt(curr.quantity, 10) || 0);
    return acc + (parseFloat(totalVal) || 0);
  }, 0);

  return (
    <div
      className="products-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.55)), url(${bgImage})`,
      }}
    >
      {debugError && (
        <div
          style={{
            background: "#fee2e2",
            border: "2px solid #ef4444",
            color: "#991b1b",
            padding: "16px",
            borderRadius: "8px",
            margin: "20px auto",
            maxWidth: "1200px",
            fontWeight: "bold",
            zIndex: 9999,
            position: "relative",
          }}
        >
          🚨 Debug Error Caught: {debugError}
        </div>
      )}

      <div className="products-container">
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
                  <label className="input-label">Product ID</label>
                  <input
                    type="text"
                    name="id"
                    className="products-input"
                    value={productForm.id}
                    onChange={handleInputChange}
                    placeholder="e.g. PRD1001"
                    required
                  />
                </div>

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
                        <td>${parseFloat(p.buy_price || 0).toFixed(2)}</td>
                        <td className="price-highlight">
                          ${parseFloat(p.sell_price || 0).toFixed(2)}
                        </td>
                        <td>
                          {p.created_at ? p.created_at.split("T")[0] : "N/A"}
                        </td>
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
                        {parseFloat(p.sell_price || 0).toFixed(2)})
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
                            ? `${s.product_name} (${s.product_id || s.product})`
                            : s.product_id || s.product}
                        </td>
                        <td>{s.quantity}</td>
                        <td>${parseFloat(s.unit_price || 0).toFixed(2)}</td>
                        <td className="price-highlight">
                          $
                          {parseFloat(
                            s.total ?? s.unit_price * s.quantity
                          ).toFixed(2)}
                        </td>
                        <td>
                          {s.created_at ? s.created_at.split("T")[0] : "N/A"}
                        </td>
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
