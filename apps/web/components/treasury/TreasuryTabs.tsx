"use client";

import { useState } from "react";
import { TransactionList } from "@/components/treasury/TransactionList";
import RevenueDistribution from "@/components/treasury/RevenueDistribution";
import ClaimPanel from "@/components/treasury/ClaimPanel";
import BurnHistory from "@/components/treasury/BurnHistory";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = "transactions" | "revenue" | "claims" | "burns";

interface TabDef {
  id: TabId;
  label: string;
}

const tabs: TabDef[] = [
  { id: "transactions", label: "Transactions" },
  { id: "revenue", label: "Revenue Events" },
  { id: "claims", label: "My Claims" },
  { id: "burns", label: "Burns" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TreasuryTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("revenue");

  return (
    <div>
      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--color-gsd-border-subtle)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-theme duration-200 ${
              activeTab === tab.id
                ? "border-b-2 border-[var(--color-gsd-accent)] text-[var(--color-gsd-accent-hover)]"
                : "text-[var(--color-gsd-text-muted)] hover:text-[var(--color-gsd-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "transactions" && <TransactionList />}
      {activeTab === "revenue" && <RevenueDistribution />}
      {activeTab === "claims" && <ClaimPanel />}
      {activeTab === "burns" && <BurnHistory />}
    </div>
  );
}
