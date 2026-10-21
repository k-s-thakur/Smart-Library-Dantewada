"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Receipt as ReceiptIcon,
  RotateCcw,
  PlusCircle,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  User,
  CreditCard,
} from "lucide-react";

interface MemberItem {
  id: string;
  fullName: string;
  memberNo: string;
  email: string;
  phone?: string;
  category: string;
}

interface FeeCharge {
  id: string;
  chargeType: string;
  description?: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
  createdAt: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  operatorId: string;
  status: string;
  createdAt: string;
  receipt?: {
    id: string;
    receiptNo: string;
    status: string;
    issueDate: string;
  };
  reversal?: {
    reversalReason: string;
    authorizedBy: string;
    reversedAt: string;
  };
  member: {
    id: string;
    fullName: string;
    memberNo: string;
  };
  allocations: {
    id: string;
    amount: number;
    charge: {
      id: string;
      chargeType: string;
      description?: string;
    };
  }[];
}

interface CollectionSummary {
  totalPaymentsCount: number;
  activeReceiptsCount: number;
  totalGrossCollection: number;
  totalReversedAmount: number;
  netCollection: number;
  methodBreakdown: Record<string, number>;
}

export default function FinanceManagementPage() {
  const [activeTab, setActiveTab] = useState<"collect" | "assess" | "history" | "report">("collect");
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberCharges, setMemberCharges] = useState<FeeCharge[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);

  // Collect Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [allocations, setAllocations] = useState<{ [chargeId: string]: number }>({});
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<any | null>(null);

  // Assess Charge Form State
  const [assessMemberId, setAssessMemberId] = useState<string>("");
  const [assessType, setAssessType] = useState<string>("MEMBERSHIP_FEE");
  const [assessAmount, setAssessAmount] = useState<number>(50);
  const [assessDescription, setAssessDescription] = useState<string>("");
  const [submittingCharge, setSubmittingCharge] = useState(false);

  // Reversal Form State
  const [reversalTarget, setReversalTarget] = useState<PaymentRecord | null>(null);
  const [reversalReason, setReversalReason] = useState<string>("");
  const [submittingReversal, setSubmittingReversal] = useState(false);

  // Reports & History State
  const [paymentsHistory, setPaymentsHistory] = useState<PaymentRecord[]>([]);
  const [reportSummary, setReportSummary] = useState<CollectionSummary | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedReceiptView, setSelectedReceiptView] = useState<any | null>(null);

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    fetchMembers();
    fetchPaymentsHistory();
    fetchCollectionReport();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMemberCharges = async (memberId: string) => {
    if (!memberId) {
      setMemberCharges([]);
      setAllocations({});
      return;
    }
    setLoadingCharges(true);
    try {
      const res = await fetch(`/api/finance/charges?memberId=${memberId}&status=OUTSTANDING`);
      const data = await res.json();
      const outstanding = (data.charges || []).filter(
        (c: FeeCharge) => c.status === "OUTSTANDING" || c.status === "PARTIALLY_PAID"
      );
      setMemberCharges(outstanding);

      const initAlloc: { [k: string]: number } = {};
      let totalDue = 0;
      for (const ch of outstanding) {
        initAlloc[ch.id] = ch.balance;
        totalDue += ch.balance;
      }
      setAllocations(initAlloc);
      setPaymentAmount(totalDue);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCharges(false);
    }
  };

  const fetchPaymentsHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/finance/payments");
      const data = await res.json();
      setPaymentsHistory(data.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchCollectionReport = async () => {
    try {
      const res = await fetch("/api/finance/reports/collection");
      const data = await res.json();
      setReportSummary(data.report || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMemberSelect = (mId: string) => {
    setSelectedMemberId(mId);
    fetchMemberCharges(mId);
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedMemberId) {
      setErrorMessage("Please select a registered library member");
      return;
    }

    if (paymentAmount <= 0) {
      setErrorMessage("Payment amount must be greater than zero");
      return;
    }

    const allocationItems = Object.entries(allocations)
      .filter(([_, amt]) => amt > 0)
      .map(([chargeId, amt]) => ({ chargeId, amount: Number(amt) }));

    if (allocationItems.length === 0) {
      setErrorMessage("Please allocate funds to at least one fee charge");
      return;
    }

    const sumAllocated = allocationItems.reduce((acc, curr) => acc + curr.amount, 0);
    if (Math.abs(sumAllocated - paymentAmount) > 0.01) {
      setErrorMessage(
        `Allocations sum (₹${sumAllocated.toFixed(2)}) must match total payment amount (₹${paymentAmount.toFixed(2)})`
      );
      return;
    }

    setSubmittingPayment(true);
    try {
      const idempotencyKey = `PAY-${selectedMemberId}-${Date.now()}`;
      const res = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          amount: paymentAmount,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          idempotencyKey,
          allocations: allocationItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post payment");
      }

      setSuccessMessage(`Payment recorded. Official Receipt #${data.receipt?.receiptNo} generated.`);
      setPaymentSuccessReceipt(data.receipt);
      fetchMemberCharges(selectedMemberId);
      fetchPaymentsHistory();
      fetchCollectionReport();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleAssessCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!assessMemberId) {
      setErrorMessage("Please select a member to assess charges against");
      return;
    }

    setSubmittingCharge(true);
    try {
      const res = await fetch("/api/finance/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: assessMemberId,
          chargeType: assessType,
          amount: assessAmount,
          description: assessDescription || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assess charge");
      }

      setSuccessMessage(`Fee charge of ₹${assessAmount} created for member.`);
      setAssessDescription("");
      if (selectedMemberId === assessMemberId) {
        fetchMemberCharges(assessMemberId);
      }
      fetchCollectionReport();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to assess charge");
    } finally {
      setSubmittingCharge(false);
    }
  };

  const handleReversePayment = async () => {
    if (!reversalTarget || !reversalReason) return;
    setSubmittingReversal(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/finance/payments/${reversalTarget.id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reversalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Reversal failed");
      }

      setSuccessMessage(`Payment reversed. Associated receipt cancelled and charge balances restored.`);
      setReversalTarget(null);
      setReversalReason("");
      fetchPaymentsHistory();
      fetchCollectionReport();
      if (selectedMemberId) {
        fetchMemberCharges(selectedMemberId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reverse payment");
    } finally {
      setSubmittingReversal(false);
    }
  };

  const openReceiptViewer = async (receiptIdOrPaymentId: string) => {
    try {
      const res = await fetch(`/api/finance/receipts/${receiptIdOrPaymentId}`);
      const data = await res.json();
      if (data.receipt) {
        setSelectedReceiptView(data.receipt);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sample data points for Soft Linen Pure SVG line chart
  const trendPoints = [
    { day: "Mon", val: 120 },
    { day: "Tue", val: 240 },
    { day: "Wed", val: 180 },
    { day: "Thu", val: 320 },
    { day: "Fri", val: 290 },
    { day: "Sat", val: 410 },
    { day: "Today", val: reportSummary ? reportSummary.netCollection : 450 },
  ];
  const maxVal = Math.max(...trendPoints.map((p) => p.val), 500);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[rgba(42,40,35,0.06)] pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono-num text-[#7A8B6F]">
            <Banknote className="w-3.5 h-3.5" />
            <span>Revenue & Cash Ledgers · FR-05 & FR-07</span>
          </div>
          <h1 className="font-display text-4xl text-[#2A2823] font-normal tracking-[-0.02em]">
            Finance & Cash Desk
          </h1>
          <p className="text-sm text-[#8B8678] max-w-xl">
            Atomic payment posting, sequential receipt generation (RCP-YYYYMM-XXXXX), and daily ledger reconciliations.
          </p>
        </div>

        {/* Financial Metrics Strip */}
        {reportSummary && (
          <div className="flex items-center gap-4">
            <div className="linen-card !p-4 min-w-[140px] text-center">
              <div className="text-xs text-[#8B8678]">Net Collections</div>
              <div className="font-mono-num text-2xl font-normal text-[#2A2823] mt-0.5">
                ₹{reportSummary.netCollection.toFixed(2)}
              </div>
            </div>
            <div className="linen-card !p-4 min-w-[140px] text-center">
              <div className="text-xs text-[#8B8678]">Active Receipts</div>
              <div className="font-mono-num text-2xl font-normal text-[#7A8B6F] mt-0.5">
                {reportSummary.activeReceiptsCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
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
      <div className="flex items-center gap-3 border-b border-[rgba(42,40,35,0.06)] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("collect")}
          className={activeTab === "collect" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>Collect Cash & Issue Receipt</span>
        </button>
        <button
          onClick={() => setActiveTab("assess")}
          className={activeTab === "assess" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Assess Fees & Fines</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={activeTab === "history" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
        >
          <ReceiptIcon className="w-3.5 h-3.5" />
          <span>Transactions Ledger</span>
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={activeTab === "report" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Daily Reconciliation & Chart</span>
        </button>
      </div>

      {/* TAB 1: COLLECT PAYMENT */}
      {activeTab === "collect" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Member selector */}
            <div className="linen-card space-y-4">
              <h2 className="font-display text-xl text-[#2A2823] font-normal flex items-center gap-2">
                <User className="w-4 h-4 text-[#7A8B6F]" />
                <span>1. Select Citizen Member</span>
              </h2>
              <select
                value={selectedMemberId}
                onChange={(e) => handleMemberSelect(e.target.value)}
                className="linen-input w-full text-xs font-medium cursor-pointer"
              >
                <option value="">-- Choose Member by Name or Member Number --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberNo}) — {m.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Outstanding Charges */}
            <div className="linen-card space-y-6">
              <h2 className="font-display text-xl text-[#2A2823] font-normal flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-[#7A8B6F]" />
                <span>2. Outstanding Charges & Allocation</span>
              </h2>

              {!selectedMemberId ? (
                <div className="text-[#8B8678] text-center py-12 text-xs">
                  Select a member above to inspect outstanding charges.
                </div>
              ) : loadingCharges ? (
                <div className="text-[#8B8678] text-center py-12 text-xs">
                  Loading member charges...
                </div>
              ) : memberCharges.length === 0 ? (
                <div className="text-center py-12 text-[#2A2823] bg-[#F6F2EA] rounded-[12px] p-6 text-xs space-y-1">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-[#7A8B6F] mb-2" />
                  <div className="font-medium">No Outstanding Charges</div>
                  <div className="text-[#8B8678]">All membership fees and overdue fines are settled.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {memberCharges.map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-[#F6F2EA] border border-[rgba(42,40,35,0.06)] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#2A2823]">{ch.chargeType.replace(/_/g, " ")}</span>
                          <span className="font-mono-num text-[10px] text-[#8B8678] bg-[#FBF8F2] px-2 py-0.5 rounded-[4px] border border-[rgba(42,40,35,0.08)]">
                            {ch.status}
                          </span>
                        </div>
                        {ch.description && <div className="text-[#8B8678] text-[11px]">{ch.description}</div>}
                        <div className="font-mono-num text-[11px] text-[#8B8678]">
                          Assessed: ₹{ch.amount.toFixed(2)} · Balance Due: ₹{ch.balance.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[#8B8678]">Allocate ₹:</span>
                        <input
                          type="number"
                          min="0"
                          max={ch.balance}
                          step="0.01"
                          value={allocations[ch.id] || 0}
                          onChange={(e) => {
                            const val = Math.min(ch.balance, Math.max(0, parseFloat(e.target.value) || 0));
                            const updated = { ...allocations, [ch.id]: val };
                            setAllocations(updated);
                            const newTotal = Object.values(updated).reduce((a, b) => a + b, 0);
                            setPaymentAmount(Number(newTotal.toFixed(2)));
                          }}
                          className="linen-input w-28 text-right font-mono-num text-xs !py-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment submission card */}
          <div>
            <form onSubmit={handlePostPayment} className="linen-card space-y-6 sticky top-28">
              <div>
                <h2 className="font-display text-xl text-[#2A2823] font-normal">
                  3. Post Payment
                </h2>
                <p className="text-xs text-[#8B8678] mt-1">
                  Sequential receipt issued atomically.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B8678] mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="linen-input w-full text-xs font-medium cursor-pointer"
                  >
                    <option value="CASH">Cash at Counter</option>
                    <option value="MANUAL_CHALLAN">Treasury Challan / Bank</option>
                    <option value="DEMAND_DRAFT">Demand Draft</option>
                    <option value="OTHER_APPROVED">Other Approved Manual Entry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8B8678] mb-1.5">
                    Reference / Challan No.
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. CHN-2026-9812"
                    className="linen-input w-full font-mono-num text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8B8678] mb-1.5">
                    Total Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="linen-input w-full font-mono-num text-2xl font-medium text-[#2A2823]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingPayment || paymentAmount <= 0 || !selectedMemberId}
                className="btn-primary w-full text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>{submittingPayment ? "Posting Atomically..." : "Post Payment & Issue Receipt"}</span>
              </button>

              <div className="text-[11px] text-[#8B8678] border-t border-[rgba(42,40,35,0.06)] pt-4">
                Concurrency-safe sequential number format: <span className="font-mono-num font-medium text-[#2A2823]">RCP-YYYYMM-XXXXX</span>.
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ASSESS FEES & FINES */}
      {activeTab === "assess" && (
        <div className="max-w-2xl mx-auto linen-card space-y-6">
          <div>
            <h2 className="font-display text-2xl text-[#2A2823] font-normal">
              Assess Approved Fee or Fine
            </h2>
            <p className="text-xs text-[#8B8678] mt-1">
              Record membership dues, renewal charges, late fines, or lost book recovery dues.
            </p>
          </div>

          <form onSubmit={handleAssessCharge} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Citizen Member *</label>
              <select
                value={assessMemberId}
                onChange={(e) => setAssessMemberId(e.target.value)}
                required
                className="linen-input w-full text-xs cursor-pointer"
              >
                <option value="">-- Choose Member --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberNo}) — {m.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Charge Category *</label>
              <select
                value={assessType}
                onChange={(e) => setAssessType(e.target.value)}
                className="linen-input w-full text-xs cursor-pointer"
              >
                <option value="MEMBERSHIP_FEE">Annual Membership Fee</option>
                <option value="RENEWAL_FEE">Card / Membership Renewal Fee</option>
                <option value="LATE_FINE">Overdue Return Fine</option>
                <option value="LOST_BOOK">Lost Book Replacement Charge</option>
                <option value="DAMAGED_BOOK">Damaged Book Assessment</option>
                <option value="OTHER_FEE">Other Department-Approved Charge</option>
              </select>
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={assessAmount}
                onChange={(e) => setAssessAmount(parseFloat(e.target.value) || 0)}
                className="linen-input w-full font-mono-num text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Assessment Remarks</label>
              <textarea
                rows={3}
                value={assessDescription}
                onChange={(e) => setAssessDescription(e.target.value)}
                placeholder="e.g. Assessment per library rule 14B; 7 days overdue"
                className="linen-input w-full text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submittingCharge || !assessMemberId}
              className="btn-primary w-full text-xs"
            >
              {submittingCharge ? "Assessing..." : "Create Fee Charge Record"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS & RECEIPTS REGISTER */}
      {activeTab === "history" && (
        <div className="linen-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(42,40,35,0.06)] pb-4">
            <div>
              <h2 className="font-display text-xl text-[#2A2823] font-normal">
                Payments & Receipts Ledger
              </h2>
              <p className="text-xs text-[#8B8678]">
                Immutable historical register of receipts, allocations, and authorized reversals.
              </p>
            </div>
            <button onClick={fetchPaymentsHistory} className="btn-secondary !text-xs !py-2 !px-4">
              Refresh Ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-num">
              <thead>
                <tr className="border-b border-[rgba(42,40,35,0.06)] text-[#8B8678]">
                  <th className="py-3 px-3 font-normal">Receipt No.</th>
                  <th className="py-3 px-3 font-normal">Date</th>
                  <th className="py-3 px-3 font-normal">Member</th>
                  <th className="py-3 px-3 font-normal">Amount</th>
                  <th className="py-3 px-3 font-normal">Method</th>
                  <th className="py-3 px-3 font-normal">Status</th>
                  <th className="py-3 px-3 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(42,40,35,0.06)] text-[#2A2823]">
                {paymentsHistory.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-3 font-medium text-[#7A8B6F]">
                      {p.receipt?.receiptNo || "N/A"}
                    </td>
                    <td className="py-3 px-3 text-[#8B8678]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="font-medium text-[#2A2823]">{p.member.fullName}</div>
                      <div className="text-[10px] text-[#8B8678] font-mono-num">{p.member.memberNo}</div>
                    </td>
                    <td className="py-3 px-3 font-medium">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-[#8B8678]">
                      {p.paymentMethod.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] text-[#7A8B6F] bg-[rgba(122,139,111,0.08)] px-2 py-0.5 rounded-[4px]">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => openReceiptViewer(p.id)}
                        className="btn-ghost !text-xs !p-0"
                      >
                        Receipt
                      </button>
                      {p.status === "POSTED" && (
                        <button
                          onClick={() => setReversalTarget(p)}
                          className="btn-ghost !text-xs !p-0 text-[#8B8678]"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RECONCILIATION REPORT WITH PURE SVG LINE CHART */}
      {activeTab === "report" && reportSummary && (
        <div className="space-y-12">
          {/* Summary Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="linen-card space-y-1">
              <div className="text-xs text-[#8B8678]">Gross Collections</div>
              <div className="font-mono-num text-2xl font-normal text-[#2A2823]">
                ₹{reportSummary.totalGrossCollection.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#8B8678]">{reportSummary.totalPaymentsCount} transactions</div>
            </div>
            <div className="linen-card space-y-1">
              <div className="text-xs text-[#8B8678]">Reversals Total</div>
              <div className="font-mono-num text-2xl font-normal text-[#8B8678]">
                ₹{reportSummary.totalReversedAmount.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#8B8678]">Audit authorized</div>
            </div>
            <div className="linen-card space-y-1">
              <div className="text-xs text-[#8B8678]">Net Cash in Hand</div>
              <div className="font-mono-num text-2xl font-normal text-[#2A2823]">
                ₹{reportSummary.netCollection.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#7A8B6F]">Reconciled ledger</div>
            </div>
            <div className="linen-card space-y-1">
              <div className="text-xs text-[#8B8678]">Active Receipts</div>
              <div className="font-mono-num text-2xl font-normal text-[#7A8B6F]">
                {reportSummary.activeReceiptsCount}
              </div>
              <div className="text-[11px] text-[#8B8678]">Sequential check pass</div>
            </div>
          </div>

          {/* Pure SVG Minimalist Line Chart from DESIGN.md */}
          <div className="linen-card space-y-6">
            <div>
              <h3 className="font-display text-xl text-[#2A2823] font-normal">
                Daily Revenue Collection Velocity
              </h3>
              <p className="text-xs text-[#8B8678] mt-1">
                Rendered strictly according to Soft Linen chart tokens: 1.75px sage line, no gridlines, no fills, stone axis, single dot marker at latest reading.
              </p>
            </div>

            <div className="pt-6 pb-2">
              <svg viewBox="0 0 700 200" className="w-full h-48 overflow-visible">
                {/* Horizontal Baseline in stone border */}
                <line x1="40" y1="160" x2="680" y2="160" stroke="#8B8678" strokeWidth="1" opacity="0.25" />

                {/* Polyline: 1.75px sage line */}
                {(() => {
                  const xStep = (680 - 40) / (trendPoints.length - 1);
                  const points = trendPoints
                    .map((pt, i) => {
                      const x = 40 + i * xStep;
                      const y = 160 - (pt.val / maxVal) * 120;
                      return `${x},${y}`;
                    })
                    .join(" ");

                  const lastX = 40 + (trendPoints.length - 1) * xStep;
                  const lastY = 160 - (trendPoints[trendPoints.length - 1].val / maxVal) * 120;

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#7A8B6F"
                        strokeWidth="1.75"
                        points={points}
                      />
                      {/* Highlight Strategy: Last dot marker */}
                      <circle
                        cx={lastX}
                        cy={lastY}
                        r="4.5"
                        fill="#7A8B6F"
                      />
                      <circle
                        cx={lastX}
                        cy={lastY}
                        r="7"
                        fill="none"
                        stroke="#7A8B6F"
                        strokeWidth="1"
                        opacity="0.4"
                      />
                    </>
                  );
                })()}

                {/* Axis Labels in stone */}
                {trendPoints.map((pt, i) => {
                  const xStep = (680 - 40) / (trendPoints.length - 1);
                  const x = 40 + i * xStep;
                  return (
                    <text
                      key={pt.day}
                      x={x}
                      y="180"
                      textAnchor="middle"
                      fill="#8B8678"
                      fontSize="10"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {pt.day}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Breakdown by Payment Method */}
          <div className="linen-card space-y-4">
            <h3 className="font-display text-lg text-[#2A2823] font-normal">
              Collection Breakdown by Tender Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono-num text-xs">
              {Object.entries(reportSummary.methodBreakdown).map(([method, amount]) => (
                <div key={method} className="bg-[#F6F2EA] border border-[rgba(42,40,35,0.06)] rounded-[12px] p-4">
                  <div className="text-[#8B8678] font-sans">{method.replace(/_/g, " ")}</div>
                  <div className="text-xl font-normal text-[#2A2823] mt-1">₹{amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {(selectedReceiptView || paymentSuccessReceipt) && (
        <div className="fixed inset-0 z-50 bg-[rgba(42,40,35,0.45)] backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#FBF8F2] border border-[rgba(42,40,35,0.08)] rounded-[18px] max-w-lg w-full p-8 shadow-[0_32px_80px_-24px_rgba(122,139,111,0.4)] relative space-y-6">
            <button
              onClick={() => {
                setSelectedReceiptView(null);
                setPaymentSuccessReceipt(null);
              }}
              className="absolute top-6 right-6 text-[#8B8678] hover:text-[#2A2823] text-xl font-light cursor-pointer"
            >
              ✕
            </button>

            {/* Receipt Content Printable Container */}
            <div id="printable-receipt" className="space-y-6">
              <div className="text-center border-b border-[rgba(42,40,35,0.08)] pb-4 space-y-1">
                <div className="text-[10px] font-mono-num text-[#8B8678] uppercase tracking-wider">
                  Government Public Library · GPLMS
                </div>
                <h3 className="font-display text-2xl font-normal text-[#2A2823]">
                  Official Cash Receipt
                </h3>
                <p className="text-xs text-[#8B8678]">
                  State Public Library Administration · NIC Compliant Voucher
                </p>
              </div>

              {(() => {
                const r = selectedReceiptView || paymentSuccessReceipt;
                return (
                  <div className="space-y-4 text-xs font-mono-num">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[#8B8678]">Receipt No: </span>
                        <strong className="text-[#2A2823] font-medium">{r.receiptNo}</strong>
                      </div>
                      <div>
                        <span className="text-[#8B8678]">Date: </span>
                        <span>{new Date(r.issueDate || r.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-[#F6F2EA] p-4 rounded-[12px] space-y-1 text-xs">
                      <div>
                        <span className="text-[#8B8678]">Citizen: </span>
                        <span className="text-[#2A2823] font-sans font-medium">{r.member?.fullName || "Registered Member"}</span> ({r.member?.memberNo || selectedMemberId})
                      </div>
                      <div>
                        <span className="text-[#8B8678]">Receipt Status: </span>
                        <span className="text-[#7A8B6F]">{r.status || "ISSUED"}</span>
                      </div>
                      <div>
                        <span className="text-[#8B8678]">Operator: </span>
                        <span>{r.operatorId}</span>
                      </div>
                    </div>

                    {r.payment?.allocations && (
                      <div className="border border-[rgba(42,40,35,0.08)] rounded-[12px] overflow-hidden text-xs bg-[#FBF8F2]">
                        <table className="w-full">
                          <thead className="bg-[#F6F2EA] border-b border-[rgba(42,40,35,0.06)] text-[#8B8678]">
                            <tr>
                              <th className="p-2.5 text-left font-normal">Fee Charge Description</th>
                              <th className="p-2.5 text-right font-normal">Allocated (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[rgba(42,40,35,0.06)] text-[#2A2823]">
                            {r.payment.allocations.map((a: any) => (
                              <tr key={a.id}>
                                <td className="p-2.5 font-sans">{a.charge?.chargeType?.replace(/_/g, " ") || "Fee Charge"}</td>
                                <td className="p-2.5 text-right font-medium">₹{a.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-[rgba(42,40,35,0.08)] text-sm">
                      <span className="font-display text-[#2A2823]">Total Tendered:</span>
                      <span className="font-medium text-[#2A2823] text-base">₹{(r.totalAmount || paymentAmount).toFixed(2)}</span>
                    </div>

                    <div className="text-[10px] text-[#8B8678] text-center pt-2">
                      Official computer-generated receipt voucher. Government Public Library Administration.
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[rgba(42,40,35,0.06)]">
              <button
                onClick={() => window.print()}
                className="btn-primary flex-1 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
              <button
                onClick={() => {
                  setSelectedReceiptView(null);
                  setPaymentSuccessReceipt(null);
                }}
                className="btn-secondary text-xs !py-2.5 !px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 bg-[rgba(42,40,35,0.45)] backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#FBF8F2] border border-[rgba(42,40,35,0.08)] text-[#2A2823] rounded-[18px] max-w-md w-full p-8 space-y-6 shadow-[0_32px_80px_-24px_rgba(122,139,111,0.4)]">
            <div>
              <h3 className="font-display text-xl text-[#2A2823] font-normal">
                Authorized Payment Reversal
              </h3>
              <p className="text-xs text-[#8B8678] mt-1">
                Reversing Payment #{reversalTarget.id.substring(0, 8)} of ₹{reversalTarget.amount.toFixed(2)}. Associated receipt ({reversalTarget.receipt?.receiptNo}) will be marked CANCELLED and balances reopened.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8B8678] mb-1.5">
                Audit Justification Reason *
              </label>
              <textarea
                rows={3}
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Cash incorrectly tendered; approved by Chief Librarian"
                className="linen-input w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReversalTarget(null)}
                className="btn-secondary text-xs !py-2 !px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleReversePayment}
                disabled={submittingReversal || !reversalReason.trim()}
                className="btn-primary text-xs !py-2 !px-4"
              >
                {submittingReversal ? "Processing..." : "Confirm Reversal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
