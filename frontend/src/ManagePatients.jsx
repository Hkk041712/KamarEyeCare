import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import bgImage from "./assets/eyecare-bg.jpg";
import "./ManagePatients.css";

const API_BASE_URL = "http://127.0.0.1:8000/api/auth";

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    withCredentials: true,
  };
};

export default function ManagePatients({ onBack }) {
  const [activeTab, setActiveTab] = useState("view");

  const [frames, setFrames] = useState([]);
  const [lenses, setLenses] = useState([]);

  const [patientForm, setPatientForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone: "",
    frame_chosen: "",
    lens_chosen: "",
    others_chosen: "",
    notes: "",
    power_right_sphere: "",
    power_right_cylinder: "",
    power_right_addition: "",
    power_left_sphere: "",
    power_left_cylinder: "",
    power_left_addition: "",
    power_notes: "",
  });

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", isError: false });
  const [searchTerm, setSearchTerm] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/patients/`,
        getAuthHeaders()
      );
      setPatients(response.data?.results || response.data || []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/products/`,
        getAuthHeaders()
      );
      const allProducts = res.data?.results || res.data || [];

      const filteredFrames = allProducts.filter(
        (p) => p.category && p.category.toLowerCase() === "frames"
      );

      const filteredLenses = allProducts.filter((p) => {
        if (!p.category) return false;
        const cat = p.category.toLowerCase();
        return cat === "lenses" || cat === "contact lenses";
      });

      setFrames(filteredFrames);
      setLenses(filteredLenses);
    } catch (err) {
      console.error("Failed to fetch products from DB:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        await fetchPatients();
        await fetchProducts();
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchPatients, fetchProducts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const generatePatientId = (firstName, phone) => {
    const cleanName =
      firstName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, "") || "PATIENT";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const lastTwoPhone = cleanPhone.length >= 2 ? cleanPhone.slice(-2) : "00";
    const randomDigits = Math.floor(10 + Math.random() * 90);
    return `${cleanName}${lastTwoPhone}${randomDigits}`;
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: "", isError: false });

    let rawPhone = patientForm.phone.trim();
    let cleanPhone = rawPhone.replace(/^\+?961\s*/, "").replace(/^0+/, "");
    let formattedPhone = `+961 ${cleanPhone}`;

    const fullName = [
      patientForm.first_name,
      patientForm.middle_name,
      patientForm.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    const generatedId = generatePatientId(patientForm.first_name, cleanPhone);

    const payload = {
      name: fullName,
      full_name: fullName,
      patient_id: generatedId,
      phone: formattedPhone,
      frame: patientForm.frame_chosen,
      frame_chosen: patientForm.frame_chosen,
      lens: patientForm.lens_chosen,
      lens_chosen: patientForm.lens_chosen,
      others_chosen: patientForm.others_chosen,
      notes: patientForm.notes,
      od_sph: patientForm.power_right_sphere,
      od_cyl: patientForm.power_right_cylinder,
      od_add: patientForm.power_right_addition,
      power_right_sphere: patientForm.power_right_sphere,
      power_right_cylinder: patientForm.power_right_cylinder,
      power_right_addition: patientForm.power_right_addition,
      os_sph: patientForm.power_left_sphere,
      os_cyl: patientForm.power_left_cylinder,
      os_add: patientForm.power_left_addition,
      power_left_sphere: patientForm.power_left_sphere,
      power_left_cylinder: patientForm.power_left_cylinder,
      power_left_addition: patientForm.power_left_addition,
      power_notes: patientForm.power_notes,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/patients/`,
        payload,
        getAuthHeaders()
      );
      setStatusMsg({
        text: response.data?.message || "Patient recorded successfully!",
        isError: false,
      });

      setPatientForm({
        first_name: "",
        middle_name: "",
        last_name: "",
        phone: "",
        frame_chosen: "",
        lens_chosen: "",
        others_chosen: "",
        notes: "",
        power_right_sphere: "",
        power_right_cylinder: "",
        power_right_addition: "",
        power_left_sphere: "",
        power_left_cylinder: "",
        power_left_addition: "",
        power_notes: "",
      });

      fetchPatients();
      setTimeout(() => setActiveTab("view"), 1200);
    } catch (err) {
      setStatusMsg({
        text:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to add patient record.",
        isError: true,
      });
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (
      !window.confirm(`Are you sure you want to delete patient #${patientId}?`)
    )
      return;

    try {
      await axios.delete(
        `${API_BASE_URL}/patients/${patientId}/`,
        getAuthHeaders()
      );
      setStatusMsg({
        text: "Patient record deleted successfully!",
        isError: false,
      });
      if (selectedPatient?.id === patientId) setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to delete patient record."
      );
    }
  };

  const handleViewHistory = (patient) => {
    setSelectedPatient(patient);
    setActiveTab("history");
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getFullName = (p) => {
    if (p.full_name) return p.full_name;
    if (p.name) return p.name;
    const combined = [p.first_name, p.middle_name, p.last_name]
      .filter(Boolean)
      .join(" ");
    return combined || "N/A";
  };

  const processedPatients = [...patients]
    .filter((p) => {
      const fullName = getFullName(p).toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        String(p.phone || "")
          .toLowerCase()
          .includes(search) ||
        String(p.id || "")
          .toLowerCase()
          .includes(search) ||
        String(p.patient_id || "")
          .toLowerCase()
          .includes(search) ||
        String(p.frame_chosen || "")
          .toLowerCase()
          .includes(search) ||
        String(p.lens_chosen || "")
          .toLowerCase()
          .includes(search)
      );
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = key === "name" ? getFullName(a) : a[key] ?? "";
      let bVal = key === "name" ? getFullName(b) : b[key] ?? "";

      if (key === "id") {
        aVal = parseInt(aVal, 10) || 0;
        bVal = parseInt(bVal, 10) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  return (
    <div
      className="patients-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.55)), url(${bgImage})`,
      }}
    >
      <div className="patients-container">
        <div className="patients-header">
          <div className="header-title-group">
            <svg
              className="header-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            <div>
              <h1 className="header-title">Patient Management</h1>
              <p className="header-subtitle">
                Prescriptions, Eyewear & Power Records
              </p>
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
            className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
            onClick={() => setActiveTab("view")}
          >
            <span className="tab-icon">👥</span> Patient Directory (
            {patients.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <span className="tab-icon">+</span> New Patient Entry
          </button>
          {selectedPatient && (
            <button
              className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <span className="tab-icon">📄</span> History:{" "}
              {getFullName(selectedPatient)}
            </button>
          )}
        </div>

        {activeTab === "view" && (
          <div className="tab-card">
            <div className="card-header-row">
              <h2 className="card-heading">Patients & Prescriptions</h2>
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search name, phone, frame, lens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => requestSort("id")}
                      className="sortable-th"
                    >
                      ID{getSortIndicator("id")}
                    </th>
                    <th
                      onClick={() => requestSort("name")}
                      className="sortable-th"
                    >
                      Name{getSortIndicator("name")}
                    </th>
                    <th
                      onClick={() => requestSort("phone")}
                      className="sortable-th"
                    >
                      Phone{getSortIndicator("phone")}
                    </th>
                    <th>Frame Chosen</th>
                    <th>Lens Chosen</th>
                    <th
                      onClick={() => requestSort("created_at")}
                      className="sortable-th"
                    >
                      Registered Date{getSortIndicator("created_at")}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="table-empty">
                        Loading patient records...
                      </td>
                    </tr>
                  ) : processedPatients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-empty">
                        No matching patient records found.
                      </td>
                    </tr>
                  ) : (
                    processedPatients.map((p) => (
                      <tr key={p.id}>
                        <td className="id-badge">#{p.patient_id || p.id}</td>
                        <td className="font-semibold">{getFullName(p)}</td>
                        <td className="phone-text">{p.phone}</td>
                        <td>
                          <span className="choice-tag frame">
                            {typeof p.frame_chosen === "object"
                              ? p.frame_chosen?.brand || p.frame_chosen?.name
                              : p.frame_chosen || p.frame || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="choice-tag lens">
                            {typeof p.lens_chosen === "object"
                              ? p.lens_chosen?.type || p.lens_chosen?.name
                              : p.lens_chosen || p.lens || "N/A"}
                          </span>
                        </td>
                        <td>
                          {p.created_at ? p.created_at.split("T")[0] : "N/A"}
                        </td>
                        <td>
                          <div className="action-btn-group">
                            <button
                              className="btn-action view"
                              onClick={() => handleViewHistory(p)}
                            >
                              View History
                            </button>
                            <button
                              className="btn-action delete"
                              onClick={() => handleDeletePatient(p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "add" && (
          <div className="tab-card">
            <h2 className="card-heading">
              Register New Patient & Optical Power
            </h2>
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

            <form onSubmit={handleAddPatient} className="patients-form">
              <div className="section-divider">General Information</div>
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className="patients-input"
                    value={patientForm.first_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Hassan"
                    
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    className="patients-input"
                    value={patientForm.middle_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Khalil"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className="patients-input"
                    value={patientForm.last_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Kamar"
                    
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "0.5rem 0.75rem",
                        backgroundColor: "#334155",
                        color: "#94a3b8",
                        borderRadius: "6px 0 0 6px",
                        fontSize: "0.9rem",
                        border: "1px solid #334155",
                        borderRight: "none",
                      }}
                    >
                      +961
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      className="patients-input"
                      style={{ borderRadius: "0 6px 6px 0" }}
                      value={patientForm.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 70 123 456"
                      
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Frame Chosen</label>
                  <select
                    name="frame_chosen"
                    className="patients-input"
                    value={patientForm.frame_chosen}
                    onChange={handleInputChange}
                    
                  >
                    <option value=""> Select Frame </option>
                    {frames.map((frame) => {
                      const label = frame.brand
                        ? `${frame.brand} ${frame.model || ""}`
                        : frame.name || `Frame #${frame.id}`;
                      return (
                        <option key={frame.id} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Lens Chosen</label>
                  <select
                    name="lens_chosen"
                    className="patients-input"
                    value={patientForm.lens_chosen}
                    onChange={handleInputChange}
                    
                  >
                    <option value="">Select Lens</option>
                    {lenses.map((lens) => {
                      const label = lens.type
                        ? `${lens.type} ${lens.index ? `(${lens.index})` : ""}`
                        : lens.name || `Lens #${lens.id}`;
                      return (
                        <option key={lens.id} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Others Chosen 
                  </label>
                  <input
                    type="text"
                    name="others_chosen"
                    className="patients-input"
                    value={patientForm.others_chosen}
                    onChange={handleInputChange}
                    placeholder="e.g. Sunglass Clip-on, Case"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    General Notes 
                  </label>
                  <input
                    type="text"
                    name="notes"
                    className="patients-input"
                    value={patientForm.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Patient prefers thin lenses"
                  />
                </div>
              </div>

              <div className="section-divider">
                Optical Power Parameters (Patients Power)
              </div>

              <h3 className="eye-heading right-eye">
                Right Eye (Oculus Dexter - OD)
              </h3>
              <div className="form-grid power-grid">
                <div className="input-group">
                  <label className="input-label">SPH</label>
                  <input
                    type="text"
                    name="power_right_sphere"
                    className="patients-input"
                    value={patientForm.power_right_sphere}
                    onChange={handleInputChange}
                    placeholder="-2.00 / +1.50"
                    
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">CYL</label>
                  <input
                    type="text"
                    name="power_right_cylinder"
                    className="patients-input"
                    value={patientForm.power_right_cylinder}
                    onChange={handleInputChange}
                    placeholder="-0.50"
                    
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">ADD</label>
                  <input
                    type="text"
                    name="power_right_addition"
                    className="patients-input"
                    value={patientForm.power_right_addition}
                    onChange={handleInputChange}
                    placeholder="+2.00"
                    
                  />
                </div>
              </div>

              <h3 className="eye-heading left-eye">
                Left Eye (Oculus Sinister - OS)
              </h3>
              <div className="form-grid power-grid">
                <div className="input-group">
                  <label className="input-label">SPH</label>
                  <input
                    type="text"
                    name="power_left_sphere"
                    className="patients-input"
                    value={patientForm.power_left_sphere}
                    onChange={handleInputChange}
                    placeholder="-1.75 / +1.25"
                    
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">CYL</label>
                  <input
                    type="text"
                    name="power_left_cylinder"
                    className="patients-input"
                    value={patientForm.power_left_cylinder}
                    onChange={handleInputChange}
                    placeholder="-0.75"
                    
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">ADD</label>
                  <input
                    type="text"
                    name="power_left_addition"
                    className="patients-input"
                    value={patientForm.power_left_addition}
                    onChange={handleInputChange}
                    placeholder="+2.00"
                    
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: "1rem" }}>
                <label className="input-label">
                  Prescription Notes 
                </label>
                <input
                  type="text"
                  name="power_notes"
                  className="patients-input"
                  value={patientForm.power_notes}
                  onChange={handleInputChange}
                  placeholder="e.g. Progressive lens recommendation"
                />
              </div>

              <button type="submit" className="btn-primary-patients">
                Save Patient Record & Prescription
              </button>
            </form>
          </div>
        )}

        {activeTab === "history" && selectedPatient && (
          <div className="tab-card">
            <div className="card-header-row">
              <h2 className="card-heading">
                Prescription History:{" "}
                <span className="highlight-text">
                  {getFullName(selectedPatient)}
                </span>
              </h2>
              <button
                className="btn-action back"
                onClick={() => setActiveTab("view")}
              >
                Close History
              </button>
            </div>

            <div className="history-details-grid">
              <div className="history-box">
                <h4 className="box-title">Patient Profile</h4>
                <div className="info-row">
                  <span className="info-label">Patient ID:</span>
                  <span className="info-val">
                    #{selectedPatient.patient_id || selectedPatient.id}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-val">{selectedPatient.phone}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Registered On:</span>
                  <span className="info-val">
                    {selectedPatient.created_at
                      ? selectedPatient.created_at.split("T")[0]
                      : "N/A"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Frame Selected:</span>
                  <span className="info-val highlight">
                    {selectedPatient.frame_chosen || selectedPatient.frame}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Lens Selected:</span>
                  <span className="info-val highlight">
                    {selectedPatient.lens_chosen || selectedPatient.lens}
                  </span>
                </div>
                {selectedPatient.others_chosen && (
                  <div className="info-row">
                    <span className="info-label">Other Items:</span>
                    <span className="info-val">
                      {selectedPatient.others_chosen}
                    </span>
                  </div>
                )}
                {selectedPatient.notes && (
                  <div className="info-row">
                    <span className="info-label">Notes:</span>
                    <span className="info-val">{selectedPatient.notes}</span>
                  </div>
                )}
              </div>

              <div className="history-box">
                <h4 className="box-title">
                  Optical Power Matrix (PATIENTS_POWER)
                </h4>
                <div className="table-responsive">
                  <table className="custom-table power-table">
                    <thead>
                      <tr>
                        <th>Eye</th>
                        <th>SPH</th>
                        <th>CYL</th>
                        <th>ADD</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="eye-badge right">Right Eye (OD)</td>
                        <td>
                          {selectedPatient.power_right_sphere ||
                            selectedPatient.od_sph ||
                            "0.00"}
                        </td>
                        <td>
                          {selectedPatient.power_right_cylinder ||
                            selectedPatient.od_cyl ||
                            "0.00"}
                        </td>
                        <td>
                          {selectedPatient.power_right_addition ||
                            selectedPatient.od_add ||
                            "0.00"}
                        </td>
                      </tr>
                      <tr>
                        <td className="eye-badge left">Left Eye (OS)</td>
                        <td>
                          {selectedPatient.power_left_sphere ||
                            selectedPatient.os_sph ||
                            "0.00"}
                        </td>
                        <td>
                          {selectedPatient.power_left_cylinder ||
                            selectedPatient.os_cyl ||
                            "0.00"}
                        </td>
                        <td>
                          {selectedPatient.power_left_addition ||
                            selectedPatient.os_add ||
                            "0.00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {selectedPatient.power_notes && (
                  <div className="power-notes-box">
                    <strong>Power Notes:</strong> {selectedPatient.power_notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
