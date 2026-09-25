
"use client";

import { useState } from "react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const menuItems = [
    "Dashboard",
    "Question Bank",
    "Upload Questions",
    "Subjects",
    "Analytics",
    "Settings"
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#172033",
        fontFamily: "Arial, sans-serif",
        padding: "24px"
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto"
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px"
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "14px"
              }}
            >
              NEET-PG MASTER
            </p>

            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "32px"
              }}
            >
              Admin Dashboard
            </h1>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "12px 16px",
              boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)"
            }}
          >
            Administrator
          </div>
        </header>

        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "28px"
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "12px 16px",
                cursor: "pointer",
                background:
                  activeTab === item ? "#2563eb" : "#ffffff",
                color:
                  activeTab === item ? "#ffffff" : "#334155",
                fontWeight: 600
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 6px 24px rgba(15, 23, 42, 0.06)",
            marginBottom: "24px"
          }}
        >
          <p
            style={{
              color: "#64748b",
              margin: 0,
              fontSize: "14px"
            }}
          >
            CURRENT SECTION
          </p>

          <h2
            style={{
              fontSize: "26px",
              margin: "10px 0"
            }}
          >
            {activeTab}
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 0
            }}
          >
            Manage your NEET-PG question bank, organize subjects,
            import questions, and monitor student learning activity.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px"
          }}
        >
          <StatCard title="Total Questions" value="0" />
          <StatCard title="Subjects" value="0" />
          <StatCard title="Uploaded Today" value="0" />
          <StatCard title="Active Students" value="0" />
        </section>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 6px 24px rgba(15, 23, 42, 0.06)"
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "22px"
            }}
          >
            Quick Actions
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <button
              onClick={() => setActiveTab("Upload Questions")}
              style={actionButtonStyle}
            >
              Upload Excel Questions
            </button>

            <button
              onClick={() => setActiveTab("Question Bank")}
              style={secondaryButtonStyle}
            >
              View Question Bank
            </button>

            <button
              onClick={() => setActiveTab("Subjects")}
              style={secondaryButtonStyle}
            >
              Manage Subjects
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "0 6px 24px rgba(15, 23, 42, 0.06)"
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748b",
          fontSize: "14px"
        }}
      >
        {title}
      </p>

      <h3
        style={{
          fontSize: "30px",
          margin: "12px 0 0"
        }}
      >
        {value}
      </h3>
    </div>
  );
}

const actionButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "14px 18px",
  cursor: "pointer",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600
};

const secondaryButtonStyle = {
  border: "1px solid #dbe3ef",
  borderRadius: "10px",
  padding: "14px 18px",
  cursor: "pointer",
  background: "#ffffff",
  color: "#334155",
  fontWeight: 600
};
