import { useEffect, useState } from "react";
import "./index.css";

function App() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const [user, setUser] = useState(null);
    const [totalLeads, setTotalLeads] = useState(0);
    const [leads, setLeads] = useState([]);
    const [currentPage, setCurrentPage] = useState("dashboard");

    const [showLeadForm, setShowLeadForm] = useState(false);

    const [leadName, setLeadName] = useState("");
    const [leadEmail, setLeadEmail] = useState("");
    const [leadPhone, setLeadPhone] = useState("");
    const [leadCompany, setLeadCompany] = useState("");
    const [leadStatus, setLeadStatus] = useState("new");

    // Load logged-in user
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        const loadUser = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/profile",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setUser(data.user);
                } else {
                    localStorage.removeItem("token");
                }
            } catch (error) {
                setMessage("Unable to load profile");
            }
        };

        loadUser();
    }, []);

    // Load total lead count
    const loadDashboardData = async () => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                "http://localhost:5000/api/leads/count",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (data.success) {
                setTotalLeads(data.totalLeads);
            }
        } catch (error) {
            console.log("Unable to load lead count");
        }
    };

    // Load all leads
    const loadLeads = async () => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                "http://localhost:5000/api/leads",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (data.success) {
                setLeads(data.leads);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Unable to load leads");
        }
    };

    // Load dashboard data after login
    useEffect(() => {
        if (user) {
            loadDashboardData();
            loadLeads();
        }
    }, [user]);

    // Login
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("token", data.token);
                setUser(data.user);
                setMessage("");
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Unable to connect to backend");
        }
    };

    // Add new lead
    const handleAddLead = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                "http://localhost:5000/api/leads",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: leadName,
                        email: leadEmail,
                        phone: leadPhone,
                        company: leadCompany,
                        status: leadStatus
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                setLeadName("");
                setLeadEmail("");
                setLeadPhone("");
                setLeadCompany("");
                setLeadStatus("new");

                setShowLeadForm(false);

                await loadLeads();
                await loadDashboardData();

                setMessage("");
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Unable to create lead");
        }
    };

    // Delete lead
    const handleDeleteLead = async (leadId) => {
        const token = localStorage.getItem("token");

        const confirmed = window.confirm(
            "Are you sure you want to delete this lead?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/leads/${leadId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (data.success) {
                await loadLeads();
                await loadDashboardData();

                setMessage("");
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Unable to delete lead");
        }
    };

    // Logout
    const handleLogout = async () => {
        try {
            await fetch(
                "http://localhost:5000/api/auth/logout",
                {
                    method: "POST"
                }
            );
        } catch (error) {
            console.log("Logout API error");
        }

        localStorage.removeItem("token");

        setUser(null);
        setLeads([]);
        setTotalLeads(0);
        setCurrentPage("dashboard");
    };

    // Login screen
    if (!user) {
        return (
            <div className="login-container">
                <div className="login-card">

                    <h1>SaaSify CRM</h1>

                    <h2>Login</h2>

                    <form onSubmit={handleLogin}>

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                        <button type="submit">
                            Login
                        </button>

                    </form>

                    <p className="message">
                        {message}
                    </p>

                </div>
            </div>
        );
    }

    // Main application
    return (
        <div className="dashboard-layout">

            {/* Sidebar */}
            <aside className="sidebar">

                <h2>SaaSify</h2>

                <nav>

                    <button
                        className={`nav-item ${
                            currentPage === "dashboard"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setCurrentPage("dashboard")
                        }
                    >
                        Dashboard
                    </button>

                    <button
                        className={`nav-item ${
                            currentPage === "leads"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setCurrentPage("leads")
                        }
                    >
                        Leads
                    </button>

                    <button className="nav-item">
                        Contacts
                    </button>

                    <button className="nav-item">
                        Deals
                    </button>

                    <button className="nav-item">
                        Activities
                    </button>

                </nav>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </aside>

            {/* Main Content */}
            <main className="dashboard-main">

                {/* Dashboard */}
                {currentPage === "dashboard" && (
                    <>
                        <header className="dashboard-header">

                            <div>
                                <h1>Dashboard</h1>

                                <p>
                                    Welcome back, {user.name}
                                </p>
                            </div>

                            <div className="user-info">
                                <strong>{user.name}</strong>
                                <span>{user.role}</span>
                            </div>

                        </header>

                        <section className="summary-grid">

                            <div className="summary-card">
                                <h3>Total Leads</h3>
                                <p>{totalLeads}</p>
                            </div>

                            <div className="summary-card">
                                <h3>Total Contacts</h3>
                                <p>0</p>
                            </div>

                            <div className="summary-card">
                                <h3>Active Deals</h3>
                                <p>0</p>
                            </div>

                            <div className="summary-card">
                                <h3>Pipeline Value</h3>
                                <p>₹0</p>
                            </div>

                        </section>

                        <section className="activity-card">

                            <h2>Recent Activity</h2>

                            <p>
                                No recent activity available.
                            </p>

                        </section>
                    </>
                )}

                {/* Leads */}
                {currentPage === "leads" && (
                    <>
                        <header className="dashboard-header">

                            <div>
                                <h1>Leads</h1>

                                <p>
                                    Manage your CRM leads
                                </p>
                            </div>

                            <button
                                className="add-button"
                                onClick={() =>
                                    setShowLeadForm(true)
                                }
                            >
                                + Add Lead
                            </button>

                        </header>

                        {/* Add Lead Form */}
                        {showLeadForm && (
                            <section className="lead-form-card">

                                <h2>Add New Lead</h2>

                                <form
                                    onSubmit={handleAddLead}
                                >

                                    <input
                                        type="text"
                                        placeholder="Lead name"
                                        value={leadName}
                                        onChange={(e) =>
                                            setLeadName(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={leadEmail}
                                        onChange={(e) =>
                                            setLeadEmail(
                                                e.target.value
                                            )
                                        }
                                    />

                                    <input
                                        type="text"
                                        placeholder="Phone"
                                        value={leadPhone}
                                        onChange={(e) =>
                                            setLeadPhone(
                                                e.target.value
                                            )
                                        }
                                    />

                                    <input
                                        type="text"
                                        placeholder="Company"
                                        value={leadCompany}
                                        onChange={(e) =>
                                            setLeadCompany(
                                                e.target.value
                                            )
                                        }
                                    />

                                    <select
                                        value={leadStatus}
                                        onChange={(e) =>
                                            setLeadStatus(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="new">
                                            New
                                        </option>

                                        <option value="contacted">
                                            Contacted
                                        </option>

                                        <option value="qualified">
                                            Qualified
                                        </option>
                                    </select>

                                    <div className="form-buttons">

                                        <button
                                            type="submit"
                                            className="save-button"
                                        >
                                            Save Lead
                                        </button>

                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={() =>
                                                setShowLeadForm(
                                                    false
                                                )
                                            }
                                        >
                                            Cancel
                                        </button>

                                    </div>

                                </form>

                            </section>
                        )}

                        {/* Leads Table */}
                        <section className="leads-card">

                            <div className="leads-header">

                                <h2>
                                    All Leads ({leads.length})
                                </h2>

                            </div>

                            {leads.length === 0 ? (
                                <p className="empty-message">
                                    No leads found.
                                </p>
                            ) : (
                                <div className="table-container">

                                    <table>

                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Company</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {leads.map((lead) => (
                                                <tr key={lead.id}>

                                                    <td>
                                                        {lead.name}
                                                    </td>

                                                    <td>
                                                        {lead.email}
                                                    </td>

                                                    <td>
                                                        {lead.phone}
                                                    </td>

                                                    <td>
                                                        {lead.company}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`status ${lead.status}`}
                                                        >
                                                            {lead.status}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <button
                                                            className="delete-button"
                                                            onClick={() =>
                                                                handleDeleteLead(
                                                                    lead.id
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>

                                                </tr>
                                            ))}

                                        </tbody>

                                    </table>

                                </div>
                            )}

                        </section>

                        <p className="message">
                            {message}
                        </p>

                    </>
                )}

            </main>
        </div>
    );
}

export default App;