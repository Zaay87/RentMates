import { useMemo, useState } from "react";

function currency(value) {
    return `$${value.toFixed(2)}`;
}

function formatDueDate(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function todayLabel() {
    return new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function getBillStatus(roommates) {
    const paidCount = roommates.filter((r) => r.paid).length;
    if (paidCount === 0) return "Unpaid";
    if (paidCount === roommates.length) return "Paid";
    return "Partially Paid";
}

function getRemaining(roommates) {
    return roommates
        .filter((r) => !r.paid)
        .reduce((sum, r) => sum + r.owed, 0);
}

function StatCard({ title, value, subtitle }) {
    return (
        <div className="card">
            <p className="muted small">{title}</p>
            <p className="stat-value">{value}</p>
            <p className="muted small">{subtitle}</p>
        </div>
    );
}

function HouseholdPage({
                           householdName,
                           roommates,
                           onAddRoommate,
                           onDeleteRoommate,
                           bills,
                       }) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        const trimmed = name.trim();

        if (!trimmed) {
            setError("Enter a roommate name.");
            return;
        }

        const exists = roommates.some(
            (roommate) => roommate.toLowerCase() === trimmed.toLowerCase()
        );

        if (exists) {
            setError("That roommate already exists.");
            return;
        }

        onAddRoommate(trimmed);
        setName("");
        setError("");
    }

    return (
        <div className="page-stack">
            <div className="card">
                <h2>Household Setup</h2>
                <p className="muted">
                    Manage roommates in {householdName}. A roommate can only be deleted
                    when they do not have any unpaid balance.
                </p>
            </div>

            <div className="two-column">
                <div className="card">
                    <h3>Current Roommates</h3>
                    <div className="helper-box">
                        User deletion is blocked by unpaid balances. Pay your balances to be removed.
                    </div>

                    <div className="stack">
                        {roommates.map((roommate) => {
                            const hasUnpaidBills = bills.some((bill) =>
                                bill.roommates.some(
                                    (person) => person.name === roommate && !person.paid
                                )
                            );

                            return (
                                <div key={roommate} className="list-row">
                                    <span>{roommate}</span>
                                    <button
                                        className={`button ${
                                            hasUnpaidBills ? "button-disabled" : "button-primary"
                                        }`}
                                        disabled={hasUnpaidBills}
                                        onClick={() => onDeleteRoommate(roommate)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="card">
                    <h3>Add Roommate</h3>
                    <form className="stack" onSubmit={handleSubmit}>
                        <div>
                            <label className="label">Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                placeholder="Enter roommate name"
                            />
                        </div>

                        {error && <p className="error-text">{error}</p>}

                        <button className="button button-primary" type="submit">
                            Save Roommate
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function AddBillPage({ roommates, onAddBill }) {
    const [primaryPayer, setPrimaryPayer] = useState("");
    const [name, setName] = useState("");
    const [total, setTotal] = useState("");
    const [due, setDue] = useState("");
    const [splitType, setSplitType] = useState("equal");
    const [customShares, setCustomShares] = useState(() =>
        roommates.reduce((acc, roommate) => {
            acc[roommate] = "";
            return acc;
        }, {})
    );
    const [error, setError] = useState("");

    function handleCustomShareChange(roommate, value) {
        setCustomShares((prev) => ({ ...prev, [roommate]: value }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        const amount = Number(total);

        if (roommates.length === 0) {
            setError("Add at least one roommate before creating a bill.");
            return;
        }

        if (!name.trim() || !amount || amount <= 0 || !due || !primaryPayer) {
            setError("Please complete all bill fields before saving.");
            return;
        }

        let roommateData = [];

        if (splitType === "equal") {
            const totalCents = Math.round(amount * 100);
            const baseShare = Math.floor(totalCents / roommates.length);
            const remainder = totalCents % roommates.length;

            roommateData = roommates.map((roommate, index) => {
                const owedCents = baseShare + (index < remainder ? 1 : 0);
                const owed = owedCents / 100;

                return {
                    name: roommate,
                    owed,
                    paid: owed <= 0,
                };
            });
        } else {
            const percentages = roommates.map((roommate) =>
                Number(customShares[roommate] || 0)
            );
            const totalPercent = percentages.reduce((sum, value) => sum + value, 0);

            if (totalPercent !== 100) {
                setError("Custom split percentages must add up to 100.");
                return;
            }

            const totalCents = Math.round(amount * 100);

            let assignedCents = 0;

            roommateData = roommates.map((roommate, index) => {
                let owedCents;

                if (index === roommates.length - 1) {
                    owedCents = totalCents - assignedCents;
                } else {
                    owedCents = Math.round(
                        (totalCents * Number(customShares[roommate])) / 100
                    );
                    assignedCents += owedCents;
                }

                const owed = owedCents / 100;

                return {
                    name: roommate,
                    owed,
                    paid: owed <= 0,
                };
            });
        }

        onAddBill({
            name: name.trim(),
            total: amount,
            due,
            split: splitType === "equal" ? "Equal split" : "Custom split",
            primaryPayer,
            roommates: roommateData,
        });

        setName("");
        setPrimaryPayer("");
        setTotal("");
        setDue("");
        setSplitType("equal");
        setCustomShares(
            roommates.reduce((acc, roommate) => {
                acc[roommate] = "";
                return acc;
            }, {})
        );
        setError("");
    }

    return (
        <div className="page-stack">
            <div className="card">
                <h2>Add Bill</h2>
                <p className="muted">
                    Create a bill, choose how it will be split, and track payments from
                    one place.
                </p>
            </div>

            <div>
                <label className="label">Primary Payer</label>
                <select
                    value={primaryPayer}
                    onChange={(e) => setPrimaryPayer(e.target.value)}
                    className="input"
                >
                    <option value="">Select primary payer</option>
                    {roommates.map((roommate) => (
                        <option key={roommate} value={roommate}>
                            {roommate}
                        </option>
                    ))}
                </select>
            </div>

            <div className="card">
                <form className="form-grid" onSubmit={handleSubmit}>
                    <div>
                        <label className="label">Bill Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input"
                            placeholder="Ex. Electric Bill"
                        />
                    </div>

                    <div>
                        <label className="label">Total Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={total}
                            onChange={(e) => setTotal(e.target.value)}
                            className="input"
                            placeholder="Ex. 120.00"
                        />
                    </div>

                    <div>
                        <label className="label">Due Date</label>
                        <input
                            type="date"
                            value={due}
                            onChange={(e) => setDue(e.target.value)}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Split Type</label>
                        <select
                            value={splitType}
                            onChange={(e) => setSplitType(e.target.value)}
                            className="input"
                        >
                            <option value="equal">Equal Split</option>
                            <option value="custom">Custom Split</option>
                        </select>
                    </div>

                    {splitType === "custom" && (
                        <div className="full-width">
                            <div className="helper-box">
                                <p className="label">Custom Percentages</p>
                                <div className="three-column">
                                    {roommates.map((roommate) => (
                                        <div key={roommate}>
                                            <label className="label">{roommate}</label>
                                            <input
                                                type="number"
                                                value={customShares[roommate]}
                                                onChange={(e) =>
                                                    handleCustomShareChange(roommate, e.target.value)
                                                }
                                                className="input"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="full-width form-footer">
                        {error ? <p className="error-text">{error}</p> : <span />}
                        <button className="button button-primary" type="submit">
                            Save Bill
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BillDetailsPage({ bill, onTogglePaid, onSendReminder, reminders }) {
    if (!bill) {
        return (
            <div className="card">
                <h2>Bill Details</h2>
                <p className="muted">Select a bill from the dashboard to view it.</p>
            </div>
        );
    }

    const status = getBillStatus(bill.roommates);
    const remaining = getRemaining(bill.roommates);

    return (
        <div className="page-stack">
            <div className="card">
                <div className="split-header">
                    <div>
                        <h2>{bill.name}</h2>
                        <p className="muted">
                            Due {formatDueDate(bill.due)} • {bill.split} • Primary payer: {bill.primaryPayer} • Status: {status}
                        </p>
                        <p className="muted">
                            Due {formatDueDate(bill.due)} • {bill.split} • Status: {status}
                        </p>
                    </div>

                    <div className="summary-box">
                        <p>
                            Total: <strong>{currency(bill.total)}</strong>
                        </p>
                        <p>
                            Remaining: <strong>{currency(remaining)}</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Roommate Payments</h3>

                <div className="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Roommate</th>
                            <th>Amount Owed</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {bill.roommates.map((roommate) => (
                            <tr key={roommate.name}>
                                <td>{roommate.name}</td>
                                <td>{currency(roommate.owed)}</td>
                                <td
                                    className={
                                        roommate.paid ? "status-paid" : "status-unpaid"
                                    }
                                >
                                    {roommate.paid ? "Paid" : "Unpaid"}
                                </td>
                                <td>
                                    <div className="action-row">
                                        <button
                                            className={`button small-button ${
                                                roommate.paid ? "button-paid" : "button-unpaid"
                                            }`}
                                            onClick={() => onTogglePaid(bill.id, roommate.name)}
                                        >
                                            {roommate.paid ? "Mark Unpaid" : "Mark Paid"}
                                        </button>

                                        {!roommate.paid && (
                                            <button
                                                className="button button-secondary small-button"
                                                onClick={() =>
                                                    onSendReminder(bill.id, roommate.name)
                                                }
                                            >
                                                Send Reminder
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <h3>Reminder Log</h3>
                <div className="stack">
                    {reminders.filter((entry) => entry.billId === bill.id).length ===
                    0 ? (
                        <p className="muted">No reminders have been sent for this bill.</p>
                    ) : (
                        reminders
                            .filter((entry) => entry.billId === bill.id)
                            .map((entry, index) => (
                                <div key={index} className="helper-box">
                                    Reminder sent to {entry.roommate} on {entry.date}
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
}

function DashboardPage({
                           bills,
                           search,
                           setSearch,
                           statusFilter,
                           setStatusFilter,
                           onOpenBill,
                           roommates,
                       }) {
    const filteredBills = useMemo(() => {
        return bills.filter((bill) => {
            const billStatus = getBillStatus(bill.roommates);
            const matchesSearch = bill.name
                .toLowerCase()
                .includes(search.toLowerCase());
            const matchesStatus =
                statusFilter === "All" || billStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [bills, search, statusFilter]);

    const activeBills = bills.length;
    const outstandingBalance = bills.reduce(
        (sum, bill) => sum + getRemaining(bill.roommates),
        0
    );
    const unpaidBills = bills.filter(
        (bill) => getRemaining(bill.roommates) > 0
    ).length;

    return (
        <div className="page-stack">
            <div className="stats-grid">
                <StatCard
                    title="Active Bills"
                    value={String(activeBills)}
                    subtitle={`${unpaidBills} still need payment`}
                />
                <StatCard
                    title="Outstanding Balance"
                    value={currency(outstandingBalance)}
                    subtitle="Still owed by roommates"
                />
                <StatCard
                    title="Household Members"
                    value={String(roommates.length)}
                    subtitle="Current active roommates"
                />
            </div>

            <div className="card">
                <div className="toolbar">
                    <div>
                        <h2>Dashboard</h2>
                        <p className="muted">
                            Review bills, payment progress, and what still needs attention.
                        </p>
                    </div>

                    <div className="toolbar-actions">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input"
                            placeholder="Search bills"
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input"
                        >
                            <option>All</option>
                            <option>Paid</option>
                            <option>Partially Paid</option>
                            <option>Unpaid</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="stack">
                {filteredBills.map((bill) => {
                    const status = getBillStatus(bill.roommates);
                    const paidCount = bill.roommates.filter((r) => r.paid).length;
                    const remaining = getRemaining(bill.roommates);

                    return (
                        <div key={bill.id} className="card">
                            <div className="bill-header">
                                <div>
                                    <div className="title-row">
                                        <h3>{bill.name}</h3>
                                        <span
                                            className={`status-pill ${
                                                status === "Paid"
                                                ? "status-paid" 
                                                    : status === "Unpaid"
                                                ? "status-unpaid"
                                                    :"status-partial"
                                            }`}
                                        >
                                            {status}
                                        </span>
                                    </div>

                                    <p className="muted">
                                        Due {formatDueDate(bill.due)} • {bill.split} • Primary payer: {bill.primaryPayer} • {paidCount} of{" "}
                                        {bill.roommates.length} paid
                                    </p>
                                </div>

                                <div className="summary-grid">
                                    <div>
                                        <p className="muted small">Total</p>
                                        <p className="strong">{currency(bill.total)}</p>
                                    </div>
                                    <div>
                                        <p className="muted small">Remaining</p>
                                        <p className="strong">{currency(remaining)}</p>
                                    </div>
                                    <div>
                                        <p className="muted small">Status</p>
                                        <p className="strong">
                                            {remaining > 0 ? "Balance Remaining" : "Complete"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="align-right">
                                <button
                                    className="button button-primary"
                                    onClick={() => onOpenBill(bill.id)}
                                >
                                    Open Bill Details
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredBills.length === 0 && (
                    <div className="card muted">
                        No bills match your current search or filter.
                    </div>
                )}
            </div>
        </div>
    );
}

function BillsOverviewPage({ bills, onOpenBill }) {
    return (
        <div className="page-stack">
            <div className="card">
                <h2>All Bill Details</h2>
                <p className="muted">
                    View every bill in one place, including total amount, due date, split
                    type, and each roommate's payment status.
                </p>
            </div>

            <div className="stack">
                {bills.map((bill) => {
                    const status = getBillStatus(bill.roommates);
                    const remaining = getRemaining(bill.roommates);

                    return (
                        <div key={bill.id} className="card">
                            <div className="split-header">
                                <div>
                                    <div className="title-row">
                                        <h3>{bill.name}</h3>
                                        <span
                                            className={`status-pill ${
                                                status === "Paid"
                                                    ? "status-paid"
                                                    : status === "Unpaid"
                                                        ? "status-unpaid"
                                                        : "status-partial"
                                            }`}
                                        >
                      {status}
                    </span>
                                    </div>

                                    <p className="muted">
                                        Due {formatDueDate(bill.due)} • {bill.split} • Total{" "}
                                        {currency(bill.total)}
                                    </p>
                                    <p className="muted">
                                        Due {formatDueDate(bill.due)} • {bill.split} • Primary payer: {bill.primaryPayer} • Total {currency(bill.total)}
                                    </p>
                                </div>

                                <div className="summary-box">
                                    <p>
                                        Remaining: <strong>{currency(remaining)}</strong>
                                    </p>
                                    <p>
                                        Roommates: <strong>{bill.roommates.length}</strong>
                                    </p>
                                </div>
                            </div>

                            <div className="table-wrap">
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Roommate</th>
                                        <th>Amount Owed</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {bill.roommates.map((roommate) => (
                                        <tr key={roommate.name}>
                                            <td>{roommate.name}</td>
                                            <td>{currency(roommate.owed)}</td>
                                            <td
                                                className={
                                                    roommate.paid ? "status-paid" : "status-unpaid"
                                                }
                                            >
                                                {roommate.paid ? "Paid" : "Unpaid"}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="align-right">
                                <button
                                    className="button button-secondary"
                                    onClick={() => onOpenBill(bill.id)}
                                >
                                    Open Interactive Bill Page
                                </button>
                            </div>
                        </div>
                    );
                })}

                {bills.length === 0 && (
                    <div className="card muted">No bills have been created yet.</div>
                )}
            </div>
        </div>
    );
}

export default function App() {
    const [page, setPage] = useState("dashboard");
    const [selectedBillId, setSelectedBillId] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [roommates, setRoommates] = useState(["Jessica", "Zac", "Avery","Yaniel", "Adam", "Nhan"]);
    const [reminders, setReminders] = useState([]);
    const [bills, setBills] = useState([

    ]);

    const selectedBill = bills.find((bill) => bill.id === selectedBillId);

    function handleOpenBill(id) {
        setSelectedBillId(id);
        setPage("details");
    }

    function handleAddRoommate(name) {
        const normalized = name.trim();
        if (!normalized) return;

        if (
            roommates.some(
                (roommate) => roommate.toLowerCase() === normalized.toLowerCase()
            )
        ) {
            return;
        }

        setRoommates((prev) => [...prev, normalized]);
    }

    function handleDeleteRoommate(name) {
        const hasUnpaidBills = bills.some((bill) =>
            bill.roommates.some((person) => person.name === name && !person.paid)
        );

        if (hasUnpaidBills) return;

        setRoommates((prev) => prev.filter((roommate) => roommate !== name));

        setBills((prevBills) =>
            prevBills.map((bill) => ({
                ...bill,
                roommates: bill.roommates.filter((person) => person.name !== name),
            }))
        );
    }

    function handleAddBill(newBill) {
        setBills((prev) => [
            ...prev,
            {
                ...newBill,
                id: Date.now(),
            },
        ]);
        setPage("dashboard");
    }

    function handleTogglePaid(billId, roommateName) {
        setBills((prev) =>
            prev.map((bill) =>
                bill.id !== billId
                    ? bill
                    : {
                        ...bill,
                        roommates: bill.roommates.map((roommate) =>
                            roommate.name !== roommateName
                                ? roommate
                                : { ...roommate, paid: !roommate.paid }
                        ),
                    }
            )
        );
    }

    function handleSendReminder(billId, roommateName) {
        setReminders((prev) => [
            {
                billId,
                roommate: roommateName,
                date: todayLabel(),
            },
            ...prev,
        ]);
    }

    return (
        <div className="app-shell">
            <header className="topbar">
                <div>
                    <div className="brand-row">
                        <img
                            src="/rentmates-logo.png"
                            alt="RentMates logo"
                            className="brand-logo"
                        />
                        <div>
                            <h1 className="brand-title">RentMates</h1>
                        </div>
                    </div>

                    <p className="muted topbar-copy">
                        Group 16's prototype for creating bills, splitting costs, and
                        tracking who has paid.
                    </p>
                </div>

                <nav className="nav-row">
                    <button
                        onClick={() => setPage("dashboard")}
                        className={`button ${
                            page === "dashboard" ? "button-primary" : "button-secondary"
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setPage("add-bill")}
                        className={`button ${
                            page === "add-bill" ? "button-primary" : "button-secondary"
                        }`}
                    >
                        Add Bill
                    </button>
                    <button
                        onClick={() => setPage("household")}
                        className={`button ${
                            page === "household" ? "button-primary" : "button-secondary"
                        }`}
                    >
                        Household Setup
                    </button>
                    <button
                        onClick={() => setPage("bills-overview")}
                        className={`button ${
                            page === "bills-overview" ? "button-primary" : "button-secondary"
                        }`}
                    >
                        All Bill Details
                    </button>
                </nav>
            </header>

            <main className="main-content">
                {page === "dashboard" && (
                    <DashboardPage
                        bills={bills}
                        search={search}
                        setSearch={setSearch}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        onOpenBill={handleOpenBill}
                        roommates={roommates}
                    />
                )}

                {page === "add-bill" && (
                    <AddBillPage roommates={roommates} onAddBill={handleAddBill} />
                )}

                {page === "household" && (
                    <HouseholdPage
                        householdName="RentMates Household"
                        roommates={roommates}
                        onAddRoommate={handleAddRoommate}
                        onDeleteRoommate={handleDeleteRoommate}
                        bills={bills}
                    />
                )}

                {page === "bills-overview" && (
                    <BillsOverviewPage bills={bills} onOpenBill={handleOpenBill} />
                )}

                {page === "details" && (
                    <BillDetailsPage
                        bill={selectedBill}
                        onTogglePaid={handleTogglePaid}
                        onSendReminder={handleSendReminder}
                        reminders={reminders}
                    />
                )}
            </main>
        </div>
    );
}