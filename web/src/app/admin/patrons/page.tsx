"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
  DollarSign,
  UserCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface Patron {
  id: string;
  institutionalId: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  program?: string;
  batch?: string;
  patronType: string;
  status: string;
  activeLoanCount: number;
  maxBorrowLimit: number;
  totalUnpaidFine: number;
  cards: Array<{ id: string; cardUid: string; status: string }>;
}

export default function AdminPatronsPage() {
  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBindModalOpen, setIsBindModalOpen] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null);

  // New Patron Form
  const [institutionalId, setInstitutionalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [program, setProgram] = useState("B.Tech");
  const [batch, setBatch] = useState("2023-2027");
  const [patronType, setPatronType] = useState("UNDERGRADUATE");
  const [cardUid, setCardUid] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Bind Card Form
  const [newCardUid, setNewCardUid] = useState("");
  const [bindLoading, setBindLoading] = useState(false);
  const [bindError, setBindError] = useState("");

  const fetchPatrons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/patrons?${params.toString()}`);
      const data = await res.json();
      setPatrons(data.patrons || []);
    } catch (err) {
      console.error("Failed to load patrons", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPatrons, 250);
    return () => clearTimeout(timer);
  }, [search, typeFilter, statusFilter]);

  const handleCreatePatron = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      const res = await fetch("/api/patrons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionalId,
          fullName,
          email,
          phone,
          department,
          program,
          batch,
          patronType,
          cardUid: cardUid || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error?.message || "Failed to create patron.");
        return;
      }

      setFormSuccess("Patron created successfully!");
      setTimeout(() => {
        setIsAddModalOpen(false);
        setInstitutionalId("");
        setFullName("");
        setEmail("");
        setPhone("");
        setCardUid("");
        fetchPatrons();
      }, 1000);
    } catch {
      setFormError("Network error creating patron.");
    }
  };

  const handleBindCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatron || !newCardUid.trim()) return;

    setBindLoading(true);
    setBindError("");

    try {
      const res = await fetch(`/api/patrons/${selectedPatron.id}/bind-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardUid: newCardUid.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBindError(data.error?.message || "Failed to bind card.");
        return;
      }

      setIsBindModalOpen(false);
      setNewCardUid("");
      fetchPatrons();
    } catch {
      setBindError("Network error binding card.");
    } finally {
      setBindLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <span>Patron Directory & RFID Card Binding</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage students and faculty, assign institutional RFID/NFC cards, and enforce borrowing quotas.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError("");
              setFormSuccess("");
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Patron</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email, department, or Card UID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Patron Types</option>
            <option value="UNDERGRADUATE">Undergraduate</option>
            <option value="POSTGRADUATE">Postgraduate</option>
            <option value="FACULTY">Faculty</option>
            <option value="STAFF">Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* Patrons Table */}
        <div className="mt-6 overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/60 shadow">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Patron Name & ID</th>
                <th className="py-3 px-4">Type & Department</th>
                <th className="py-3 px-4">RFID Card UID</th>
                <th className="py-3 px-4">Borrowing Quota</th>
                <th className="py-3 px-4">Status & Fines</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading patrons...
                  </td>
                </tr>
              ) : patrons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No patrons found.
                  </td>
                </tr>
              ) : (
                patrons.map((p) => {
                  const activeCard = p.cards.find((c) => c.status === "ACTIVE");
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{p.fullName}</div>
                        <div className="text-[11px] font-mono text-emerald-400">{p.institutionalId}</div>
                        <div className="text-[10px] text-slate-500">{p.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                          {p.patronType}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">{p.department || "General"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {activeCard ? (
                          <div className="flex items-center gap-1.5 font-mono text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20 w-max">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{activeCard.cardUid}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No Card Bound</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-slate-200">
                            {p.activeLoanCount} / {p.maxBorrowLimit}
                          </div>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                p.activeLoanCount >= p.maxBorrowLimit ? "bg-red-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, (p.activeLoanCount / p.maxBorrowLimit) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">books borrowed</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.totalUnpaidFine > 0 && (
                          <div className="text-[10px] font-bold text-amber-400 mt-1 flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" />
                            <span>₹{p.totalUnpaidFine} Unpaid Fine</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedPatron(p);
                            setNewCardUid(activeCard ? activeCard.cardUid : `CARD_${p.institutionalId.replace(/-/g, "_")}`);
                            setBindError("");
                            setIsBindModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[11px] font-medium inline-flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{activeCard ? "Rebind Card" : "Bind Card"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Register New Patron Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Register New Patron (PRD Section 8)</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatron} className="mt-4 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Institutional ID *</label>
                  <input
                    type="text"
                    value={institutionalId}
                    onChange={(e) => setInstitutionalId(e.target.value)}
                    placeholder="e.g. CS-2024-099"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Patron Type *</label>
                  <select
                    value={patronType}
                    onChange={(e) => setPatronType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="UNDERGRADUATE">Undergraduate (4 books, 14 days)</option>
                    <option value="POSTGRADUATE">Postgraduate (8 books, 30 days)</option>
                    <option value="FACULTY">Faculty (15 books, 90 days)</option>
                    <option value="STAFF">Staff (5 books, 30 days)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@library.edu"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Batch / Program</label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. 2024-2028"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Optional RFID Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Institutional RFID Card UID (Optional)</span>
                </label>
                <input
                  type="text"
                  value={cardUid}
                  onChange={(e) => setCardUid(e.target.value)}
                  placeholder="e.g. CARD_NEW_01 or tap card on reader"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Create Patron
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bind Card Modal */}
      {isBindModalOpen && selectedPatron && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Bind RFID Card to {selectedPatron.fullName}</span>
              </h3>
              <button onClick={() => setIsBindModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBindCard} className="mt-4 space-y-4 text-xs">
              {bindError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300">
                  {bindError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  RFID / NFC Card UID (PRD Section 9)
                </label>
                <input
                  type="text"
                  value={newCardUid}
                  onChange={(e) => setNewCardUid(e.target.value)}
                  placeholder="e.g. CARD_NEW_101 or tap reader"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Quick Pick Test Cards */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                  Demo Quick-Pick Test UID:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    `CARD_${selectedPatron.institutionalId.replace(/-/g, "_")}`,
                    `CARD_DEMO_${Math.floor(Math.random() * 900 + 100)}`,
                    "CARD_PRIYA_02",
                    "CARD_ROHAN_05",
                  ].map((testUid) => (
                    <button
                      key={testUid}
                      type="button"
                      onClick={() => setNewCardUid(testUid)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700"
                    >
                      {testUid}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBindModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bindLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {bindLoading ? "Linking..." : "Confirm & Bind Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
