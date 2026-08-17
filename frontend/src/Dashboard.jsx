import bgImage from "./assets/eyecare-bg.jpg";
import "./Dashboard.css";

export default function Dashboard() {
  const menuItems = [
    {
      id: "products",
      title: "Manage Products",
      description: "Inventory, frame stock & optical lens supplies",
      icon: (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
        </svg>
      ),
    },
    {
      id: "expenses",
      title: "Manage Expenses",
      description: "Financial logs, overhead & vendor billing",
      icon: (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1H6.32c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
        </svg>
      ),
    },
    {
      id: "patients",
      title: "Manage Patients",
      description: "Eye exams, prescriptions & medical records",
      icon: (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-2v-4H8v-2h4V8h2v4h4v2z" />
        </svg>
      ),
    },
    {
      id: "users",
      title: "Manage Users",
      description: "Staff access permissions & system roles",
      icon: (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="dashboard-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url(${bgImage})`,
      }}
    >
      <div className="dashboard-card">
        <div className="brand-header">
          <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <h1 className="brand-title">Kamar Eye Care</h1>
          <p className="portal-subtitle">Management Portal</p>
        </div>

        <div className="portal-grid">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              className="portal-btn"
              style={{ animationDelay: `${index * 0.12 + 0.2}s` }}
              onClick={() => console.log(`Navigating to ${item.title}`)}
            >
              <div className="btn-icon-wrapper">{item.icon}</div>
              <div className="btn-content">
                <span className="btn-title">{item.title}</span>
                <span className="btn-desc">{item.description}</span>
              </div>
              <svg
                className="arrow-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
