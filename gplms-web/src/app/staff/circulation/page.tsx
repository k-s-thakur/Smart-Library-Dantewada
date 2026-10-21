"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
} from "lucide-react";

interface ActiveLoan {
  id: string;
  issuedAt: string;
  dueDate: string;
  renewalCount: number;
  status: string;
  member: {
    id: string;
    memberNo: string;
    fullName: string;
    phone?: string;
    category: string;
  };
  copy: {
    accessionNo: string;
    shelfLocation: string;
    book: {
      id: string;
      title: string;
      isbn: string;
      ddcCode?: string;
    };
  };
}

export default function CirculationDeskPage() {
  const [activeTab, setActiveTab] = useState<"issue" | "return" | "active">("issue");
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // Issue Form State
  const [issueMemberNo, setIssueMemberNo] = useState("");
  const [issueCopyToken, setIssueCopyToken] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueSuccessData, setIssueSuccessData] = useState<any | null>(null);

  // Return Form State
  const [returnCopyToken, setReturnCopyToken] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccessData, setReturnSuccessData] = useState<any | null>(null);

  // Feedback Messages
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchActiveLoans = async () => {
    setLoadingLoans(true);
    try {
      const res = await fetch("/api/circulation/active");
      const data = await res.json();
      setActiveLoans(data.loans || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLoans(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIssueSuccessData(null);

    if (!issueMemberNo.trim() || !issueCopyToken.trim()) {
      setErrorMessage("Please enter both Member Number/ID and Book Accession/QR Token");
      return;
    }

    setSubmittingIssue(true);
    try {
      const res = await fetch("/api/circulation/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIdentifier: issueMemberNo.trim(),
          copyIdentifier: issueCopyToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue book");
      }

      setSuccessMessage(`Book "${data.book.title}" successfully issued to ${data.member.name}.`);
      setIssueSuccessData(data);
      setIssueCopyToken("");
      fetchActiveLoans();
    } catch (err: any) {
      setErrorMessage(err.message || "Circulation issue error");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setReturnSuccessData(null);

    if (!returnCopyToken.trim()) {
      setErrorMessage("Please scan or enter the Book Accession Number or QR Token");
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await fetch("/api/circulation/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copyIdentifier: returnCopyToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process return");
      }

      let msg = `Book "${data.book.title}" returned by ${data.member.name}.`;
      if (data.isOverdue && data.assessedFineAmount > 0) {
        msg += ` Overdue fine of ₹${data.assessedFineAmount} recorded.`;
      }
      setSuccessMessage(msg);
      setReturnSuccessData(data);
      setReturnCopyToken("");
      fetchActiveLoans();
    } catch (err: any) {
      setErrorMessage(err.message || "Circulation return error");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleRenew = async (loanId: string) => {
    try {
      const res = await fetch("/api/circulation/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Renewal failed");
      }
      setSuccessMessage(`Loan extended. New due date: ${new Date(data.newDueDate).toLocaleDateString()}`);
      fetchActiveLoans();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to renew loan");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[rgba(42,40,35,0.06)] pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono-num text-[#7A8B6F]">
            <QrCode className="w-3.5 h-3.5" />
            <span>Circulation Operations · FR-04</span>
          </div>
          <h1 className="font-display text-4xl text-[#2A2823] font-normal tracking-[-0.02em]">
            Circulation Desk
          </h1>
          <p className="text-sm text-[#8B8678] max-w-xl">
            Atomic book check-outs, QR accession verification, loan duration rules, and instant return processing.
          </p>
        </div>

        {/* Counter Cards */}
        <div className="flex items-center gap-4">
          <div className="linen-card !p-4 min-w-[140px] text-center">
            <div className="text-xs text-[#8B8678]">Active Loans</div>
            <div className="font-mono-num text-2xl font-normal text-[#2A2823] mt-0.5">
              {activeLoans.length}
            </div>
          </div>
          <div className="linen-card !p-4 min-w-[140px] text-center">
            <div className="text-xs text-[#8B8678]">Overdue Status</div>
            <div className="font-mono-num text-2xl font-normal text-[#8B8678] mt-0.5">
              {activeLoans.filter((l) => new Date(l.dueDate) < new Date()).length}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Feedback Banner */}
      {errorMessage && (
        <div className="bg-[#FBF8F2] border border-[rgba(42,40,35,0.18)] text-[#2A2823] px-6 py-4 rounded-[12px] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-[#8B8678] shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="text-[#8B8678] hover:text-[#2A2823]">
            ✕
          </button>
        </div>
      )}
      {successMessage && (
        <div className="bg-[#FBF8F2] border border-[#7A8B6F]/40 text-[#2A2823] px-6 py-4 rounded-[12px] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-[#7A8B6F] shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-[#8B8678] hover:text-[#2A2823]">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[rgba(42,40,35,0.06)] pb-4">
        <button
          onClick={() => setActiveTab("issue")}
          className={activeTab === "issue" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Issue Book (निर्गमन)</span>
        </button>
        <button
          onClick={() => setActiveTab("return")}
          className={activeTab === "return" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Return & Overdue (वापसी)</span>
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={activeTab === "active" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Active Register ({activeLoans.length})</span>
        </button>
      </div>

      {/* TAB 1: ISSUE BOOK */}
      {activeTab === "issue" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <form onSubmit={handleIssueSubmit} className="linen-card space-y-6">
            <div>
              <h2 className="font-display text-xl text-[#2A2823] font-normal">
                Book Issue Protocol
              </h2>
              <p className="text-xs text-[#8B8678] mt-1">
                Enter registered citizen identifier and scan physical accession copy code.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8B8678] mb-1.5">
                  Citizen Identifier (Member No. or Registered Email)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GPL-2026-00001 or rahul.verma@example.com"
                  value={issueMemberNo}
                  onChange={(e) => setIssueMemberNo(e.target.value)}
                  className="linen-input w-full font-mono-num text-xs"
                />
                <div className="flex gap-3 mt-2 text-[11px] text-[#8B8678]">
                  <span>Quick pick:</span>
                  <button
                    type="button"
                    onClick={() => setIssueMemberNo("GPL-2026-00001")}
                    className="btn-ghost !p-0 text-[11px]"
                  >
                    Rahul (GPL-2026-00001)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setIssueMemberNo("GPL-2026-00002")}
                    className="btn-ghost !p-0 text-[11px]"
                  >
                    Priya (GPL-2026-00002)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B8678] mb-1.5">
                  Book Accession Code (Barcode / QR Token)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Scan copy barcode or enter e.g. ACC-2026-00003"
                  value={issueCopyToken}
                  onChange={(e) => setIssueCopyToken(e.target.value)}
                  className="linen-input w-full font-mono-num text-xs"
                />
                <div className="flex gap-3 mt-2 text-[11px] text-[#8B8678]">
                  <span>Sample copies:</span>
                  <button
                    type="button"
                    onClick={() => setIssueCopyToken("ACC-2026-00003")}
                    className="btn-ghost !p-0 text-[11px]"
                  >
                    Godaan (ACC-2026-00003)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setIssueCopyToken("ACC-2026-00005")}
                    className="btn-ghost !p-0 text-[11px]"
                  >
                    K&R C (ACC-2026-00005)
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingIssue}
              className="btn-primary w-full text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submittingIssue ? "Verifying Policy & Issuing..." : "Confirm Book Issue"}</span>
            </button>
          </form>

          {/* Issue Confirmation Voucher */}
          <div className="linen-card space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-xl text-[#2A2823] font-normal">
                Transaction Voucher
              </h3>
              <p className="text-xs text-[#8B8678] mt-1">
                Issued physical copy confirmation and computed due date schedule.
              </p>
            </div>

            {issueSuccessData ? (
              <div className="bg-[#F6F2EA] border border-[rgba(42,40,35,0.08)] rounded-[12px] p-6 space-y-4 text-xs font-mono-num">
                <div className="flex items-center gap-2 text-[#7A8B6F] font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Physical Copy Loan Confirmed</span>
                </div>
                <div className="space-y-2 text-[#2A2823]">
                  <div className="flex justify-between">
                    <span className="text-[#8B8678]">Title:</span>
                    <span className="font-medium">{issueSuccessData.book.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B8678]">Accession No:</span>
                    <span>{issueSuccessData.book.accessionNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B8678]">Borrower:</span>
                    <span>{issueSuccessData.member.name} ({issueSuccessData.member.memberNo})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B8678]">Due Date:</span>
                    <span className="text-[#7A8B6F] font-medium">
                      {new Date(issueSuccessData.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B8678]">Shelf Stack:</span>
                    <span>{issueSuccessData.book.shelfLocation}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-[#8B8678] text-xs leading-relaxed">
                Awaiting input. Enter citizen identifier and accession code on the left to generate an atomic loan.
              </div>
            )}
            <div className="text-[11px] text-[#8B8678]">
              Automated policy checks: Max 3 books per general member · 14 days duration · Overdue fines barrier.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETURN BOOK */}
      {activeTab === "return" && (
        <div className="max-w-2xl mx-auto space-y-8">
          <form onSubmit={handleReturnSubmit} className="linen-card space-y-6">
            <div>
              <h2 className="font-display text-xl text-[#2A2823] font-normal">
                Check-In & Overdue Reconciliation
              </h2>
              <p className="text-xs text-[#8B8678] mt-1">
                Scan accession barcode on book return to mark copy available and assess fine if past due date.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8B8678] mb-1.5">
                Book Accession Number or QR Token
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ACC-2026-00001"
                value={returnCopyToken}
                onChange={(e) => setReturnCopyToken(e.target.value)}
                className="linen-input w-full font-mono-num text-xs"
              />
              <div className="mt-2 text-[11px] text-[#8B8678]">
                <span>Sample on loan: </span>
                <button
                  type="button"
                  onClick={() => setReturnCopyToken("ACC-2026-00001")}
                  className="btn-ghost !p-0 text-[11px]"
                >
                  Wings of Fire (ACC-2026-00001)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingReturn}
              className="btn-primary w-full text-xs"
            >
              <Repeat className="w-4 h-4" />
              <span>{submittingReturn ? "Processing..." : "Process Return & Check Overdue"}</span>
            </button>
          </form>

          {returnSuccessData && (
            <div className="linen-card space-y-4 text-xs font-mono-num">
              <div className="flex items-center gap-2 text-[#7A8B6F] font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Return Logged Successfully</span>
              </div>
              <div className="bg-[#F6F2EA] p-4 rounded-[12px] space-y-2 border border-[rgba(42,40,35,0.06)]">
                <div>Book: {returnSuccessData.book.title} ({returnSuccessData.book.accessionNo})</div>
                <div>Citizen: {returnSuccessData.member.name} ({returnSuccessData.member.memberNo})</div>
                <div>Copy Restored Status: {returnSuccessData.newCopyStatus}</div>
                {returnSuccessData.isOverdue ? (
                  <div className="pt-2 border-t border-[rgba(42,40,35,0.08)] text-[#8B8678]">
                    Overdue Notice: ₹{returnSuccessData.assessedFineAmount} assessed. Posted to Accounts ledger.
                  </div>
                ) : (
                  <div className="text-[#7A8B6F]">Returned on schedule. Zero overdue charges.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE LOANS REGISTER */}
      {activeTab === "active" && (
        <div className="linen-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(42,40,35,0.06)] pb-4">
            <div>
              <h2 className="font-display text-xl text-[#2A2823] font-normal">
                Active Loans Register
              </h2>
              <p className="text-xs text-[#8B8678]">
                Real-time tracking of accessioned copies currently in circulation.
              </p>
            </div>
            <button onClick={fetchActiveLoans} className="btn-secondary !text-xs !py-2 !px-4">
              Refresh Register
            </button>
          </div>

          {loadingLoans ? (
            <div className="text-center py-16 text-[#8B8678] text-xs">Loading register...</div>
          ) : activeLoans.length === 0 ? (
            <div className="text-center py-16 text-[#8B8678] text-xs">
              No books currently on loan. All copies are in stack.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-num">
                <thead>
                  <tr className="border-b border-[rgba(42,40,35,0.06)] text-[#8B8678]">
                    <th className="py-3 px-3 font-normal">Accession No.</th>
                    <th className="py-3 px-3 font-normal">Book Title</th>
                    <th className="py-3 px-3 font-normal">Citizen Member</th>
                    <th className="py-3 px-3 font-normal">Issued</th>
                    <th className="py-3 px-3 font-normal">Due Date</th>
                    <th className="py-3 px-3 font-normal">Status</th>
                    <th className="py-3 px-3 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(42,40,35,0.06)] text-[#2A2823]">
                  {activeLoans.map((l) => {
                    const isOverdue = new Date(l.dueDate) < new Date();
                    return (
                      <tr key={l.id}>
                        <td className="py-3 px-3 font-medium text-[#7A8B6F]">{l.copy.accessionNo}</td>
                        <td className="py-3 px-3 max-w-xs truncate font-sans">{l.copy.book.title}</td>
                        <td className="py-3 px-3 font-sans">
                          <div>{l.member.fullName}</div>
                          <div className="text-[10px] text-[#8B8678] font-mono-num">{l.member.memberNo}</div>
                        </td>
                        <td className="py-3 px-3 text-[#8B8678]">{new Date(l.issuedAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          <span className={isOverdue ? "text-[#8B8678] underline" : "text-[#2A2823]"}>
                            {new Date(l.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] text-[#7A8B6F] bg-[rgba(122,139,111,0.08)] px-2 py-0.5 rounded-[4px]">
                            {isOverdue ? "OVERDUE" : "ON LOAN"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleRenew(l.id)}
                            className="btn-ghost !text-xs !p-0"
                          >
                            Renew (+14d)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
