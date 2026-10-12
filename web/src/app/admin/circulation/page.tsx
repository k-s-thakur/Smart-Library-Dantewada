"use client";

import { useEffect, useState } from "react";
import {
  Repeat,
  ArrowRight,
  BookOpen,
  CreditCard,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Layers,
  X,
  Scan,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function CirculationDeskPage() {
  const [activeTab, setActiveTab] = useState<"ISSUE" | "RETURN" | "ACTIVE_LOANS">("ISSUE");

  // Issue States
  const [patronIdentifier, setPatronIdentifier] = useState("");
  const [bookInput, setBookInput] = useState("");
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueResult, setIssueResult] = useState<any | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Return States
  const [returnInput, setReturnInput] = useState("");
  const [returnQueue, setReturnQueue] = useState<string[]>([]);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnResult, setReturnResult] = useState<any | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  // Active Loans States
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);

  // Available books & patrons for quick test pick
  const [quickBooks, setQuickBooks] = useState<any[]>([]);
  const [quickPatrons, setQuickPatrons] = useState<any[]>([]);

  const fetchQuickData = async () => {
    try {
      const [booksRes, patronsRes, loansRes] = await Promise.all([
        fetch("/api/books"),
        fetch("/api/patrons"),
        fetch("/api/circulation/active"),
      ]);

      const booksData = await booksRes.json();
      const patronsData = await patronsRes.json();
      const loansData = await loansRes.json();

      setQuickBooks(booksData.books || []);
      setQuickPatrons(patronsData.patrons || []);
      setActiveLoans(loansData.loans || []);
    } catch (err) {
      console.error("Error fetching circulation data", err);
    }
  };

  useEffect(() => {
    fetchQuickData();
  }, [activeTab]);

  // Issue handlers
  const addBookToIssueQueue = (identifier: string) => {
    const trimmed = identifier.trim();
    if (!trimmed) return;
    if (selectedBooks.includes(trimmed)) return;
    setSelectedBooks([...selectedBooks, trimmed]);
    setBookInput("");
    setIssueError(null);
  };

  const removeBookFromIssueQueue = (identifier: string) => {
    setSelectedBooks(selectedBooks.filter((b) => b !== identifier));
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueLoading(true);
    setIssueError(null);
    setIssueResult(null);

    try {
      const res = await fetch("/api/circulation/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patronIdentifier: patronIdentifier.trim(),
          bookIdentifiers: selectedBooks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIssueError(data.error?.message || "Failed to issue books.");
      } else {
        setIssueResult(data);
        setSelectedBooks([]);
        fetchQuickData();
      }
    } catch {
      setIssueError("Network error during circulation checkout.");
    } finally {
      setIssueLoading(false);
    }
  };

  // Return handlers
  const addReturnItem = (identifier: string) => {
    const trimmed = identifier.trim();
    if (!trimmed) return;
    if (returnQueue.includes(trimmed)) return;
    setReturnQueue([...returnQueue, trimmed]);
    setReturnInput("");
    setReturnError(null);
  };

  const removeReturnItem = (identifier: string) => {
    setReturnQueue(returnQueue.filter((b) => b !== identifier));
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnLoading(true);
    setReturnError(null);
    setReturnResult(null);

    try {
      const res = await fetch("/api/circulation/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookIdentifiers: returnQueue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReturnError(data.error?.message || "Failed to return books.");
      } else {
        setReturnResult(data);
        setReturnQueue([]);
        fetchQuickData();
      }
    } catch {
      setReturnError("Network error during circulation check-in.");
    } finally {
      setReturnLoading(false);
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
              <Repeat className="w-6 h-6 text-emerald-400" />
              <span>RFID Circulation Desk</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Issue and return book copies, automate due date policies, and calculate overdue fines atomically.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("ISSUE")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "ISSUE"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Issue Books (Checkout)
            </button>
            <button
              onClick={() => setActiveTab("RETURN")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "RETURN"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Return Books (Check-in)
            </button>
            <button
              onClick={() => setActiveTab("ACTIVE_LOANS")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "ACTIVE_LOANS"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Active Loans ({activeLoans.length})
            </button>
          </div>
        </div>

        {/* TAB 1: ISSUE BOOKS */}
        {activeTab === "ISSUE" && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Issue Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Step 1 — Identify Patron (Card Tap or ID)</span>
                </h3>

                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">
                    Patron Card UID, Institutional ID, or Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={patronIdentifier}
                      onChange={(e) => setPatronIdentifier(e.target.value)}
                      placeholder="e.g. CARD_AARAV_01 or CS-2023-042"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    {patronIdentifier && (
                      <button
                        type="button"
                        onClick={() => setPatronIdentifier("")}
                        className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick-Pick Test Patrons */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                    Quick-Pick Test Patrons:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickPatrons.map((p) => {
                      const activeCard = p.cards.find((c: any) => c.status === "ACTIVE");
                      const isSuspended = p.status === "SUSPENDED";
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPatronIdentifier(activeCard ? activeCard.cardUid : p.institutionalId)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition text-left ${
                            isSuspended
                              ? "bg-red-950/40 border-red-800/80 text-red-300 hover:bg-red-900/50"
                              : "bg-slate-950/80 border-slate-800 hover:border-emerald-500 text-slate-200"
                          }`}
                        >
                          <div className="font-semibold text-[11px]">{p.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.patronType} | {p.activeLoanCount}/{p.maxBorrowLimit} books
                            {isSuspended && <span className="text-red-400 font-bold ml-1">(SUSPENDED)</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 2: Book RFID / Barcode Scanning */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Scan className="w-4 h-4 text-emerald-400" />
                  <span>Step 2 — Scan or Select Books to Issue</span>
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bookInput}
                    onChange={(e) => setBookInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addBookToIssueQueue(bookInput);
                      }
                    }}
                    placeholder="Enter Book RFID Tag UID or Barcode (e.g. E28011702000001)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addBookToIssueQueue(bookInput)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    + Add Book
                  </button>
                </div>

                {/* Scanned Books Queue */}
                <div className="mt-4">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                    Scanned for Checkout ({selectedBooks.length} items)
                  </span>

                  {selectedBooks.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      No books scanned yet. Scan an RFID tag above or click a quick-pick book below.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedBooks.map((ident) => (
                        <div
                          key={ident}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            <span className="font-mono font-semibold text-emerald-300">{ident}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBookFromIssueQueue(ident)}
                            className="text-slate-400 hover:text-red-400 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick-Pick Available Physical Copies */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                    Quick-Pick Available Copies on Shelf:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickBooks.flatMap((b) =>
                      b.copies
                        .filter((c: any) => c.status === "AVAILABLE")
                        .slice(0, 3)
                        .map((c: any) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => addBookToIssueQueue(c.rfidTagUid)}
                            className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500 text-left text-xs transition"
                          >
                            <div className="font-semibold text-slate-200 truncate">{b.title}</div>
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                              RFID: {c.rfidTagUid} | {c.barcode}
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Summary & Atomic Checkout Button */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow">
                <h3 className="text-sm font-bold text-white mb-3">Transaction Summary</h3>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Patron:</span>
                    <span className="font-semibold font-mono text-white">
                      {patronIdentifier || "Not Selected"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Books Scanned:</span>
                    <span className="font-bold text-emerald-400">{selectedBooks.length}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Transaction Mode:</span>
                    <span className="text-slate-300 font-medium">Atomic Commit (Section 12)</span>
                  </div>
                </div>

                {issueError && (
                  <div className="mt-4 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Transaction Rejected:</strong>
                      <span>{issueError}</span>
                    </div>
                  </div>
                )}

                {issueResult && (
                  <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Issue Completed Successfully!</span>
                    </div>
                    <p className="text-[11px] text-emerald-200">
                      Issued {issueResult.issuedCopies?.length} book(s) to {issueResult.patron?.name}.
                    </p>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                      Due Date: {new Date(issueResult.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleIssueSubmit}
                  disabled={issueLoading || !patronIdentifier || selectedBooks.length === 0}
                  className="w-full mt-6 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Repeat className="w-4 h-4" />
                  <span>{issueLoading ? "Validating & Issuing..." : "Complete Checkout"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RETURN BOOKS */}
        {activeTab === "RETURN" && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Scan className="w-4 h-4 text-emerald-400" />
                  <span>Scan Books on RFID Return Reader</span>
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={returnInput}
                    onChange={(e) => setReturnInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addReturnItem(returnInput);
                      }
                    }}
                    placeholder="Enter Book RFID Tag UID or Barcode..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addReturnItem(returnInput)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    + Add to Return
                  </button>
                </div>

                {/* Return Queue */}
                <div className="mt-4">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                    Scanned for Return ({returnQueue.length} items)
                  </span>

                  {returnQueue.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      No books scanned for return. Scan or click an active loan below.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {returnQueue.map((ident) => (
                        <div
                          key={ident}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs"
                        >
                          <span className="font-mono font-semibold text-emerald-300">{ident}</span>
                          <button
                            type="button"
                            onClick={() => removeReturnItem(ident)}
                            className="text-slate-400 hover:text-red-400 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick-Pick Currently Issued Loans */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                    Quick-Pick Currently Issued / Overdue Books to Return:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeLoans.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => addReturnItem(l.copy.rfidTagUid)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition ${
                          l.status === "OVERDUE"
                            ? "bg-red-950/40 border-red-800/80 hover:bg-red-900/50"
                            : "bg-slate-950 border-slate-800 hover:border-emerald-500"
                        }`}
                      >
                        <div className="font-semibold text-slate-200 truncate">{l.copy.book.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Patron: <strong className="text-slate-300">{l.patron.fullName}</strong>
                          {l.status === "OVERDUE" && <span className="text-red-400 font-bold ml-1">(OVERDUE)</span>}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                          RFID: {l.copy.rfidTagUid}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Process Return */}
            <div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow">
                <h3 className="text-sm font-bold text-white mb-3">Return Summary</h3>

                <p className="text-xs text-slate-400 mb-4">
                  Books will be automatically matched to active loans, returned status restored to AVAILABLE, and overdue fines computed.
                </p>

                {returnError && (
                  <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs">
                    {returnError}
                  </div>
                )}

                {returnResult && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Return Processed!</span>
                    </div>
                    {returnResult.returns?.map((item: any, i: number) => (
                      <div key={i} className="pt-2 border-t border-emerald-900/60 text-[11px]">
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-slate-300">Patron: {item.patronName}</div>
                        {item.fineAmount > 0 ? (
                          <div className="text-amber-300 font-bold mt-0.5">
                            Overdue ({item.overdueDays} days): Fine ₹{item.fineAmount} recorded
                          </div>
                        ) : (
                          <div className="text-emerald-300">Returned on time (No Fine)</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleReturnSubmit}
                  disabled={returnLoading || returnQueue.length === 0}
                  className="w-full mt-6 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Repeat className="w-4 h-4" />
                  <span>{returnLoading ? "Processing Return..." : "Complete Return"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE LOANS */}
        {activeTab === "ACTIVE_LOANS" && (
          <div className="mt-6 border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Borrower (Patron)</th>
                  <th className="py-3 px-4">Barcode & RFID</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {activeLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No active loans currently.
                    </td>
                  </tr>
                ) : (
                  activeLoans.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-white">{l.copy.book.title}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200">{l.patron.fullName}</div>
                        <div className="text-[10px] text-slate-500">{l.patron.institutionalId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>{l.copy.barcode}</div>
                        <div className="text-emerald-400">{l.copy.rfidTagUid}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(l.issuedAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {new Date(l.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === "ACTIVE"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
