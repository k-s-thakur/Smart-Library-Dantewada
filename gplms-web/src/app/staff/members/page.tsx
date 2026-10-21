"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Printer,
  QrCode,
} from "lucide-react";

interface MemberRecord {
  id: string;
  memberNo: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  category: string;
  status: string;
  registrationDate: string;
  expiryDate: string;
  maxBooks: number;
  loans: { id: string }[];
  feeCharges: { id: string; balance: number }[];
}

export default function MembersManagementPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "register">("directory");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);

  // Register Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<string>("GENERAL_CITIZEN");
  const [submittingReg, setSubmittingReg] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/members${q}`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage("Full Name and Email are mandatory.");
      return;
    }

    setSubmittingReg(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          category,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register citizen");
      }

      setSuccessMessage(`Citizen "${data.member.fullName}" registered. Assigned Member ID: ${data.member.memberNo}`);
      setFullName("");
      setEmail("");
      setPhone("");
      setAddress("");
      fetchMembers();
      setActiveTab("directory");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to register member");
    } finally {
      setSubmittingReg(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[rgba(42,40,35,0.06)] pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono-num text-[#7A8B6F]">
            <Users className="w-3.5 h-3.5" />
            <span>Membership Management · FR-03</span>
          </div>
          <h1 className="font-display text-4xl text-[#2A2823] font-normal tracking-[-0.02em]">
            Citizen Membership Directory
          </h1>
          <p className="text-sm text-[#8B8678] max-w-xl">
            Citizen registration, sequential membership IDs (GPL-YYYY-XXXXX), quota management, and digital card issuance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("directory")}
            className={activeTab === "directory" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directory</span>
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={activeTab === "register" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Citizen</span>
          </button>
        </div>
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

      {/* TAB 1: DIRECTORY */}
      {activeTab === "directory" && (
        <div className="linen-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(42,40,35,0.06)] pb-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#8B8678] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search citizen name, ID, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="linen-input w-full pl-10 text-xs"
              />
            </div>
            <div className="text-xs text-[#8B8678]">
              Registered Citizens: <strong className="text-[#2A2823] font-mono-num">{members.length}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-num">
              <thead>
                <tr className="border-b border-[rgba(42,40,35,0.06)] text-[#8B8678]">
                  <th className="py-3 px-3 font-normal">Member ID</th>
                  <th className="py-3 px-3 font-normal">Citizen Name</th>
                  <th className="py-3 px-3 font-normal">Contact</th>
                  <th className="py-3 px-3 font-normal">Category</th>
                  <th className="py-3 px-3 font-normal">Active Loans</th>
                  <th className="py-3 px-3 font-normal">Dues</th>
                  <th className="py-3 px-3 font-normal">Status</th>
                  <th className="py-3 px-3 font-normal text-right">Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(42,40,35,0.06)] text-[#2A2823]">
                {members.map((m) => {
                  const dues = m.feeCharges.reduce((a, b) => a + b.balance, 0);
                  return (
                    <tr key={m.id}>
                      <td className="py-3 px-3 font-medium text-[#7A8B6F]">{m.memberNo}</td>
                      <td className="py-3 px-3 font-sans font-medium text-[#2A2823]">{m.fullName}</td>
                      <td className="py-3 px-3 text-[#8B8678]">
                        <div>{m.email}</div>
                        {m.phone && <div className="text-[10px]">{m.phone}</div>}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="text-[11px] text-[#8B8678]">
                          {m.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium">{m.loans.length}</span> / {m.maxBooks}
                      </td>
                      <td className="py-3 px-3">
                        <span className={dues > 0 ? "text-[#8B8678] underline" : "text-[#7A8B6F]"}>
                          ₹{dues.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] text-[#7A8B6F] bg-[rgba(122,139,111,0.08)] px-2 py-0.5 rounded-[4px]">
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedMember(m)}
                          className="btn-ghost !text-xs !p-0"
                        >
                          View Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTER CITIZEN */}
      {activeTab === "register" && (
        <form onSubmit={handleRegister} className="linen-card max-w-2xl mx-auto space-y-8">
          <div>
            <h2 className="font-display text-2xl text-[#2A2823] font-normal">
              Register New Public Library Member
            </h2>
            <p className="text-xs text-[#8B8678] mt-1">
              Assigns sequential Member ID (GPL-YYYY-XXXXX) and establishes borrowing quota.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Full Citizen Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Chandra Verma"
                className="linen-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh.verma@example.gov.in"
                className="linen-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Mobile Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91-9876543210"
                className="linen-input w-full font-mono-num text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Membership Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="linen-input w-full text-xs cursor-pointer"
              >
                <option value="GENERAL_CITIZEN">General Citizen (3 Books / 14 Days)</option>
                <option value="STUDENT">Student (4 Books / 21 Days)</option>
                <option value="SENIOR_CITIZEN">Senior Citizen (5 Books / 28 Days)</option>
                <option value="RESEARCHER">Academic Researcher (8 Books / 30 Days)</option>
                <option value="GOVT_STAFF">Government Official (5 Books / 21 Days)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Residential Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Residential Address for library card communication"
                className="linen-input w-full text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingReg}
            className="btn-primary w-full text-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submittingReg ? "Registering..." : "Complete Registration & Issue Member ID"}</span>
          </button>
        </form>
      )}

      {/* Member Card Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-[rgba(42,40,35,0.45)] backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#FBF8F2] border border-[rgba(42,40,35,0.08)] text-[#2A2823] rounded-[18px] max-w-sm w-full p-8 shadow-[0_32px_80px_-24px_rgba(122,139,111,0.4)] relative space-y-6">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-6 right-6 text-[#8B8678] hover:text-[#2A2823] text-xl font-light cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center border-b border-[rgba(42,40,35,0.06)] pb-4 space-y-1">
              <div className="text-[10px] font-mono-num text-[#8B8678] uppercase tracking-wider">
                Government Public Library
              </div>
              <h3 className="font-display text-xl text-[#2A2823] font-normal">
                Citizen Digital Card
              </h3>
            </div>

            <div
              id="printable-card"
              className="bg-[#F6F2EA] border border-[rgba(42,40,35,0.08)] p-6 rounded-[14px] flex flex-col items-center text-center space-y-3"
            >
              <div className="w-16 h-16 rounded-[12px] bg-[#FBF8F2] border border-[rgba(42,40,35,0.12)] text-[#2A2823] flex items-center justify-center font-display text-2xl font-normal">
                {selectedMember.fullName.charAt(0)}
              </div>
              <div className="font-display text-base text-[#2A2823] font-normal">{selectedMember.fullName}</div>
              <div className="font-mono-num text-xs font-medium text-[#7A8B6F]">{selectedMember.memberNo}</div>
              <div className="text-[10px] text-[#8B8678] bg-[#FBF8F2] px-2.5 py-1 rounded-[6px] border border-[rgba(42,40,35,0.06)]">
                {selectedMember.category.replace(/_/g, " ")}
              </div>
            </div>

            <div className="text-xs space-y-2 text-[#8B8678] font-mono-num">
              <div className="flex justify-between">
                <span>Valid Until:</span>
                <span className="text-[#2A2823]">{new Date(selectedMember.expiryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Borrow Limit:</span>
                <span className="text-[#2A2823]">{selectedMember.maxBooks} Books Max</span>
              </div>
              <div className="flex justify-between">
                <span>Active Loans:</span>
                <span className="text-[#2A2823]">{selectedMember.loans.length} Borrowed</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="btn-primary flex-1 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Physical Card</span>
              </button>
              <button
                onClick={() => setSelectedMember(null)}
                className="btn-secondary text-xs !py-2.5 !px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
