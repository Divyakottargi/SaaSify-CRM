import { useEffect, useState } from "react";

function Kanban() {
    const [deals, setDeals] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedDeal, setDraggedDeal] = useState(null);
    const [error, setError] = useState("");

    const API_URL = "http://localhost:10000";

    const token = localStorage.getItem("token");

    // Load deals and stages
    const loadKanbanData = async () => {
        try {
            setLoading(true);
            setError("");

            const [dealsResponse, stagesResponse] =
                await Promise.all([
                    fetch(`${API_URL}/api/deals`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),

                    fetch(`${API_URL}/api/deal-stages`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);

            const dealsData = await dealsResponse.json();
            const stagesData = await stagesResponse.json();

            if (dealsData.success) {
                setDeals(dealsData.deals);
            } else {
                setError(
                    dealsData.message ||
                    "Unable to load deals"
                );
            }

            if (stagesData.success) {
                setStages(stagesData.stages);
            } else {
                setError(
                    stagesData.message ||
                    "Unable to load deal stages"
                );
            }

        } catch (error) {
            console.error(error);

            setError(
                "Unable to connect to backend"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKanbanData();
    }, []);

    // Start dragging
    const handleDragStart = (deal) => {
        setDraggedDeal(deal);
    };

    // Allow drop
    const handleDragOver = (event) => {
        event.preventDefault();
    };

    // Drop deal into new stage
    const handleDrop = async (stageId) => {
        if (!draggedDeal) {
            return;
        }

        // Don't make unnecessary API request
        if (draggedDeal.stage_id === stageId) {
            setDraggedDeal(null);
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/deals/${draggedDeal.id}/stage`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        stageId: stageId
                    })
                }
            );

            const data = await response.json();

            if (data.success) {

                setDeals((currentDeals) =>
                    currentDeals.map((deal) =>
                        deal.id === draggedDeal.id
                            ? {
                                ...deal,
                                stage_id:
                                    data.deal.stage_id,
                                probability:
                                    data.deal.probability
                            }
                            : deal
                    )
                );

            } else {
                alert(
                    data.message ||
                    "Unable to move deal"
                );
            }

        } catch (error) {
            console.error(error);

            alert(
                "Unable to update deal stage"
            );
        }

        setDraggedDeal(null);
    };

    if (loading) {
        return (
            <div className="kanban-page">
                <h1>Deals Pipeline</h1>
                <p>Loading deals...</p>
            </div>
        );
    }

    return (
        <div className="kanban-page">

            {/* Header */}
            <div className="kanban-header">

                <div>
                    <h1>Deals Pipeline</h1>

                    <p>
                        Drag and drop deals between stages.
                    </p>
                </div>

                <div className="pipeline-summary">
                    <strong>
                        {deals.length}
                    </strong>

                    <span>
                        Active Deals
                    </span>
                </div>

            </div>

            {/* Error */}
            {error && (
                <div className="kanban-error">
                    {error}
                </div>
            )}

            {/* Kanban Board */}
            <div className="kanban-board">

                {stages.map((stage) => {

                    const stageDeals = deals.filter(
                        (deal) =>
                            Number(deal.stage_id) ===
                            Number(stage.id)
                    );

                    const stageValue =
                        stageDeals.reduce(
                            (total, deal) =>
                                total +
                                Number(deal.value || 0),
                            0
                        );

                    return (
                        <div
                            className={`kanban-column ${
                                draggedDeal
                                    ? "drop-active"
                                    : ""
                            }`}
                            key={stage.id}
                            onDragOver={
                                handleDragOver
                            }
                            onDrop={() =>
                                handleDrop(stage.id)
                            }
                        >

                            {/* Column Header */}
                            <div className="kanban-column-header">

                                <div>
                                    <h2>
                                        {stage.name}
                                    </h2>

                                    <span>
                                        {stageDeals.length} deals
                                    </span>
                                </div>

                                <span className="probability-badge">
                                    {stage.probability}%
                                </span>

                            </div>

                            {/* Pipeline value */}
                            <div className="stage-value">
                                ₹
                                {stageValue.toLocaleString(
                                    "en-IN"
                                )}
                            </div>

                            {/* Deal cards */}
                            <div className="kanban-cards">

                                {stageDeals.length === 0 ? (
                                    <div className="empty-column">
                                        Drop deals here
                                    </div>
                                ) : (
                                    stageDeals.map(
                                        (deal) => (
                                            <div
                                                className={`deal-card ${
                                                    draggedDeal?.id ===
                                                    deal.id
                                                        ? "dragging"
                                                        : ""
                                                }`}
                                                key={deal.id}
                                                draggable="true"
                                                onDragStart={() =>
                                                    handleDragStart(
                                                        deal
                                                    )
                                                }
                                                onDragEnd={() =>
                                                    setDraggedDeal(
                                                        null
                                                    )
                                                }
                                            >

                                                <div className="deal-card-title">
                                                    {deal.title}
                                                </div>

                                                <div className="deal-card-value">
                                                    ₹
                                                    {Number(
                                                        deal.value ||
                                                        0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </div>

                                                {deal.contact_name && (
                                                    <div className="deal-card-contact">
                                                        {deal.contact_name}
                                                    </div>
                                                )}

                                                <div className="deal-card-footer">

                                                    <span>
                                                        Probability
                                                    </span>

                                                    <strong>
                                                        {
                                                            deal.probability
                                                        }
                                                        %
                                                    </strong>

                                                </div>

                                            </div>
                                        )
                                    )
                                )}

                            </div>

                        </div>
                    );
                })}

            </div>

        </div>
    );
}

export default Kanban;