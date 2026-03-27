import { useState } from "react";


export default function App() {
    const [page, setPage] = useState("dashboard");

    /** @type {[string[], Function]} */
    const [roommates, setRoommates] = useState([
        "Jordan",
        "Chris",
        "Taylor",
    ]);


    const [bills, setBills] = useState([
        {
            id: 1,
            name: "Electric Bill",
            roommates: [
                { name: "Jordan", paid: true },
                { name: "Chris", paid: false },
                { name: "Taylor", paid: true },
            ],
        },
    ]);

    function handleAddRoommate(name) {
        const cleaned = name.trim();

        if (!cleaned) return;

        const exists = roommates.some(
            (r) => r.toLowerCase() === cleaned.toLowerCase()
        );

        if (exists) return;

        setRoommates([...roommates, cleaned]);
    }

    function handleDeleteRoommate(name) {
        const hasUnpaidBills = bills.some((bill) =>
            bill.roommates.some(
                (person) => person.name === name && !person.paid
            )
        );

        if (hasUnpaidBills) {
            alert("Cannot delete roommate with unpaid bills");
            return;
        }

        setRoommates(
            roommates.filter((roommate) => roommate !== name)
        );

        setBills((prevBills) =>
            prevBills.map((bill) => ({
                ...bill,
                roommates: bill.roommates.filter(
                    (person) => person.name !== name
                ),
            }))
        );
    }

    function togglePayment(billId, roommateName) {
        setBills((prevBills) =>
            prevBills.map((bill) => {
                if (bill.id !== billId) return bill;

                return {
                    ...bill,
                    roommates: bill.roommates.map((person) => {
                        if (person.name !== roommateName) return person;

                        return {
                            ...person,
                            paid: !person.paid,
                        };
                    }),
                };
            })
        );
    }

    function Dashboard() {
        return (
            <div>
                <h2>Dashboard</h2>

                <p>Active Roommates: {roommates.length}</p>

                <button onClick={() => setPage("household")}>
                    Manage Roommates
                </button>

                <div style={{ marginTop: 20 }}>
                    {bills.map((bill) => (
                        <div key={bill.id}>
                            <h3>{bill.name}</h3>

                            {bill.roommates.map((person) => (
                                <div
                                    key={person.name}
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        marginBottom: 6,
                                    }}
                                >
                  <span>
                    {person.name} — {person.paid ? "Paid" : "Unpaid"}
                  </span>

                                    <button
                                        onClick={() =>
                                            togglePayment(bill.id, person.name)
                                        }
                                    >
                                        Toggle Payment
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function HouseholdPage() {
        const [newName, setNewName] = useState("");

        return (
            <div>
                <h2>Household Setup</h2>

                <input
                    placeholder="Roommate name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />

                <button
                    onClick={() => {
                        handleAddRoommate(newName);
                        setNewName("");
                    }}
                >
                    Add Roommate
                </button>

                <div style={{ marginTop: 20 }}>
                    {roommates.map((roommate) => {
                        const hasUnpaidBills = bills.some((bill) =>
                            bill.roommates.some(
                                (p) => p.name === roommate && !p.paid
                            )
                        );

                        return (
                            <div
                                key={roommate}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 10,
                                }}
                            >
                                <span>{roommate}</span>

                                <button
                                    disabled={hasUnpaidBills}
                                    onClick={() => handleDeleteRoommate(roommate)}
                                >
                                    Delete
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => setPage("dashboard")}
                    style={{ marginTop: 20 }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <img
                    src="/public/rentmates-logo.png"
                    alt="RentMates logo"
                    style={{ height: 50 }}
                />

                <h1>RentMates</h1>
            </header>

            {page === "dashboard" && <Dashboard />}
            {page === "household" && <HouseholdPage />}
        </div>
    );
}
