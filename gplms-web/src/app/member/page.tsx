"use client";

import { useEffect, useState } from "react";
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  Banknote,
  Receipt as ReceiptIcon,
  CheckCircle2,
  Bookmark,
  RefreshCw,
  QrCode,
} from "lucide-react";

interface MemberProfile {
  id: string;
  memberNo: string;
  fullName: string;
  email: string;
  phone?: string;
  category: string;
  status: string;
  expiryDate: string;
  maxBooks: number;
  totalOutstandingDues: number;
  activeLoansCount: number;
  loans: {
    id: string;
    issuedAt: string;
    dueDate: string;
    status: string;
    renewalCount: number;
    copy: {
      accessionNo: string;
      shelfLocation: string;
      book: {
        title: string;
        isbn: string;
        ddcCode?: string;
      };
    };
  }[];
  reservations: {
    id: string;
    queuePosition: number;
    status: string;
    reservedAt: string;
    book: {
      title: string;
      isbn: string;
    };
  }[];
  feeCharges: {
    id: string;
    chargeType: string;
    description?: string;
    amount: number;
    paidAmount: number;
    balance: number;
    status: string;
    createdAt: string;
  }[];
  receipts: {
    id: string;
    receiptNo: string;
    totalAmount: number;
    issueDate: string;
    status: string;
  }[];
}

export default function CitizenDashboardPage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const memberId = meData.user?.memberId;

      if (!memberId) {
        const membersRes = await fetch("/api/members");
        const membersData = await membersRes.json();
        const firstM = membersData.members?.[0];
        if (firstM) {
          const detailRes = await fetch(`/api/members/${firstM.id}`);
          const detailData = await detailRes.json();
          setProfile(detailData.member);
        }
      } else {
        const res = await fetch(`/api/members/${memberId}`);
        const data = await res.json();
        setProfile(data.member);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRenew = async (loanId: string) => {
    setActionMessage("");
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
      setActionMessage(`Loan renewed. New due date: ${new Date(data.newDueDate).toLocaleDateString()}`);
      fetchProfile();
    } catch (err: any) {
      setActionMessage(`Notice: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-[#8B8678] text-sm">
        Loading citizen library account...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-[#8B8678] text-sm">
        No active citizen session found. Please switch role in top bar to Citizen (Rahul).
      </div>
    );
  }

  const activeLoans = profile.loans.filter((l) => l.status === "ACTIVE");

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
      {/* Citizen Digital Card Hero */}
      <div className="linen-card flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[14px] bg-[#F6F2EA] border border-[rgba(42,40,35,0.12)] text-[#2A2823] flex items-center justify-center font-display text-2xl font-normal">
            {profile.fullName.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-normal text-[#2A2823] tracking-[-0.02em]">
                {profile.fullName}
              </h1>
              <span className="text-[11px] font-mono-num text-[#7A8B6F] bg-[rgba(122,139,111,0.08)] px-2.5 py-0.5 rounded-[9999px]">
                {profile.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#8B8678] font-mono-num">
              <span>Member ID: <strong className="text-[#2A2823] font-medium">{profile.memberNo}</strong></span>
              <span>·</span>
              <span className="font-sans">{profile.category.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>

        {/* Status Quotas */}
        <div className="flex items-center gap-8 bg-[#F6F2EA] border border-[rgba(42,40,35,0.06)] px-6 py-4 rounded-[14px] text-xs">
          <div>
            <div className="text-[#8B8678]">Books on Loan</div>
            <div className="font-mono-num text-xl font-normal text-[#2A2823] mt-0.5">
              {activeLoans.length} of {profile.maxBooks}
            </div>
          </div>
          <div className="h-8 w-px bg-[rgba(42,40,35,0.08)]" />
          <div>
            <div className="text-[#8B8678]">Outstanding Dues</div>
            <div className="font-mono-num text-xl font-normal text-[#2A2823] mt-0.5">
              ₹{profile.totalOutstandingDues.toFixed(2)}
            </div>
          </div>
          <div className="h-8 w-px bg-[rgba(42,40,35,0.08)]" />
          <div>
            <div className="text-[#8B8678]">Card Validity</div>
            <div className="font-mono-num text-xs font-medium text-[#2A2823] mt-1">
              {new Date(profile.expiryDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-[#FBF8F2] border border-[#7A8B6F]/40 text-[#2A2823] px-6 py-4 rounded-[12px] text-xs">
          {actionMessage}
        </div>
      )}

      {/* Grid: Active Loans & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Borrowed Books */}
        <div className="lg:col-span-2 space-y-8">
          <div className="linen-card space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(42,40,35,0.06)] pb-4">
              <div className="flex items-center gap-2.5 font-display text-xl text-[#2A2823] font-normal">
                <BookOpen className="w-4 h-4 text-[#7A8B6F]" />
                <span>Currently Borrowed Books ({activeLoans.length})</span>
              </div>
            </div>

            {activeLoans.length === 0 ? (
              <div className="text-center py-16 text-[#8B8678] text-xs">
                You have no active loans. Search the OPAC catalogue to borrow books.
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((l) => {
                  const isOverdue = new Date(l.dueDate) < new Date();
                  return (
                    <div
                      key={l.id}
                      className="bg-[#F6F2EA] border border-[rgba(42,40,35,0.06)] rounded-[14px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5">
                        <h4 className="font-display text-base text-[#2A2823] font-normal">{l.copy.book.title}</h4>
                        <div className="text-[#8B8678] font-mono-num text-[11px]">
                          Accession No: <span className="text-[#2A2823]">{l.copy.accessionNo}</span> · DDC: {l.copy.book.ddcCode || "General"}
                        </div>
                        <div className="text-[#8B8678] text-[11px] font-mono-num">
                          Issued: {new Date(l.issuedAt).toLocaleDateString()} · Renewals: {l.renewalCount}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right font-mono-num">
                          <span className="text-[10px] text-[#8B8678] block">Due Date</span>
                          <span className={`text-xs font-medium ${isOverdue ? "text-[#8B8678] underline" : "text-[#7A8B6F]"}`}>
                            {new Date(l.dueDate).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRenew(l.id)}
                          className="btn-ghost !text-xs !p-0"
                        >
                          <RefreshCw className="w-3 h-3 inline mr-1" />
                          <span>Renew Online</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Reservations */}
          {profile.reservations.length > 0 && (
            <div className="linen-card space-y-6">
              <div className="flex items-center gap-2.5 font-display text-xl text-[#2A2823] font-normal border-b border-[rgba(42,40,35,0.06)] pb-4">
                <Bookmark className="w-4 h-4 text-[#7A8B6F]" />
                <span>Reserved Titles in Queue ({profile.reservations.length})</span>
              </div>
              <div className="space-y-3 text-xs font-mono-num">
                {profile.reservations.map((r) => (
                  <div key={r.id} className="bg-[#F6F2EA] border border-[rgba(42,40,35,0.06)] p-4 rounded-[12px] flex justify-between items-center">
                    <div>
                      <div className="font-sans font-medium text-[#2A2823]">{r.book.title}</div>
                      <div className="text-[10px] text-[#8B8678]">Reserved: {new Date(r.reservedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[#7A8B6F] text-[11px]">
                        Queue Position #{r.queuePosition}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Dues & Official Receipts */}
        <div className="space-y-8">
          {/* Outstanding charges */}
          <div className="linen-card space-y-4">
            <h3 className="font-display text-lg text-[#2A2823] font-normal flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#7A8B6F]" />
              <span>Outstanding Fees & Fines</span>
            </h3>

            {profile.feeCharges.filter((c) => c.status !== "PAID").length === 0 ? (
              <div className="text-center py-6 text-xs text-[#7A8B6F] space-y-1">
                <CheckCircle2 className="w-5 h-5 mx-auto opacity-70" />
                <div>Zero pending dues. Account in good standing.</div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs font-mono-num">
                {profile.feeCharges
                  .filter((c) => c.status !== "PAID")
                  .map((c) => (
                    <div key={c.id} className="bg-[#F6F2EA] p-3 rounded-[10px] border border-[rgba(42,40,35,0.06)] flex justify-between items-center">
                      <div>
                        <div className="font-sans font-medium text-[#2A2823]">{c.chargeType.replace(/_/g, " ")}</div>
                        <div className="text-[10px] text-[#8B8678] font-sans">{c.description || "Library Charge"}</div>
                      </div>
                      <div className="font-medium text-[#2A2823]">₹{c.balance.toFixed(2)}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Past Official Receipts */}
          <div className="linen-card space-y-4">
            <h3 className="font-display text-lg text-[#2A2823] font-normal flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4 text-[#7A8B6F]" />
              <span>Payment Receipts Archive</span>
            </h3>

            {profile.receipts.length === 0 ? (
              <div className="text-center py-6 text-[#8B8678] text-xs">No receipts recorded yet.</div>
            ) : (
              <div className="space-y-2 text-xs font-mono-num">
                {profile.receipts.map((rcp) => (
                  <div key={rcp.id} className="bg-[#F6F2EA] p-3 rounded-[10px] border border-[rgba(42,40,35,0.06)] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-[#2A2823]">{rcp.receiptNo}</div>
                      <div className="text-[10px] text-[#8B8678]">{new Date(rcp.issueDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[#2A2823]">₹{rcp.totalAmount.toFixed(2)}</div>
                      <span className="text-[10px] text-[#7A8B6F]">{rcp.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
