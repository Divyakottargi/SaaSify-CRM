import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:10000";

function Activities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_URL}/api/activities`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            console.log("Activities API response:", data);

            if (data.success) {
                setActivities(data.activities || []);
            } else {
                alert(data.message || "Unable to load activities");
            }
        } catch (error) {
            console.error("Fetch activities error:", error);
            alert("Unable to connect to backend");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const getActivityIcon = (type) => {
        switch (type?.toLowerCase()) {
            case "email":
                return "📧";
            case "call":
                return "📞";
            case "meeting":
                return "📅";
            case "note":
                return "📝";
            default:
                return "📌";
        }
    };

    const formatDate = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleString();
    };

    return (
        <div className="activities-page">

            <div className="activities-header">
                <div>
                    <h1>Activities</h1>
                    <p>
                        Track customer interactions and email activity.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchActivities}
                >
                    🔄 Refresh
                </button>
            </div>

            {loading ? (
                <div className="activities-loading">
                    Loading activities...
                </div>
            ) : activities.length === 0 ? (
                <div className="activities-empty">
                    <h3>No activities yet</h3>
                    <p>
                        No customer activities have been recorded.
                    </p>
                </div>
            ) : (
                <div className="activity-timeline">

                    {activities.map((activity) => (

                        <div
                            className="activity-card"
                            key={activity.id}
                        >

                            <div className="activity-icon">
                                {getActivityIcon(activity.type)}
                            </div>

                            <div className="activity-content">

                                <div className="activity-top">

                                    <h3>
                                        {activity.subject || "Activity"}
                                    </h3>

                                    <span className="activity-type">
                                        {activity.type}
                                    </span>

                                </div>

                                <p className="activity-description">
                                    {activity.description ||
                                        "No description"}
                                </p>

                                <div className="activity-details">

                                    {activity.contact_name && (
                                        <span>
                                            👤 {activity.contact_name}
                                        </span>
                                    )}

                                    {activity.deal_title && (
                                        <span>
                                            💼 {activity.deal_title}
                                        </span>
                                    )}

                                    {activity.user_name && (
                                        <span>
                                            🧑‍💻 {activity.user_name}
                                        </span>
                                    )}

                                    <span>
                                        🕒{" "}
                                        {formatDate(
                                            activity.created_at
                                        )}
                                    </span>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>
            )}

        </div>
    );
}

export default Activities;