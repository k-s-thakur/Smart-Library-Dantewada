"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  DoorOpen,
  Calendar,
  Layers,
  Search,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function StudentPortalPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentData = async () => {
    try {
      const res = await fetch("/api/student/dashboard");
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error("Failed to fetch student data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Loading your personal library record...</p>
          </div>
        </div>
      </div>
    );
  }

  const patron = data?.patron;
  const policy = data?.policy;
  const activeLoans = data?.activeLoans || [];
  const unpaidFines = data?.unpaidFinesTotal || 0;
  const currentSession = data?.currentSession;
  const visitHistory = data?.visitHistory || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{patron?.fullName || "Student Portal"}</h1>
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {patron?.patronType || "UNDERGRADUATE"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ID: <strong className="text-slate-200 font-mono">{patron?.institutionalId}</strong> • {patron?.department} • Batch: {patron?.batch}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Search Catalog (OPAC)</span>
          </Link>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Active Loans & Quota */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-bold">
              <span>Borrowing Allowance</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{activeLoans.length}</span>
              <span className="text-xs text-slate-400">of {policy?.maxBooks || 4} books borrowed</span>
            </div>
            <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (activeLoans.length / (policy?.maxBooks || 4)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Current Library Visit Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-bold">
              <span>Library Attendance</span>
              <DoorOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3">
              {currentSession ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Currently Inside Library</span>
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-400">
                  Not checked in currently
                </div>
              )}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {currentSession
                ? `Entered at ${new Date(currentSession.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "Tap card at entrance turnstile"}
            </div>
          </div>

          {/* Fines */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-bold">
              <span>Outstanding Fines</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className={`text-3xl font-extrabold ${unpaidFines > 0 ? "text-amber-400" : "text-white"}`}>
                ₹{unpaidFines}
              </span>
              <span className="text-xs text-slate-400">unpaid balance</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Grace period: {policy?.gracePeriodDays || 2} days • Rate: ₹{policy?.fineRatePerDay || 2}/day
            </div>
          </div>

          {/* Card UID */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-bold">
              <span>Digital Card UID</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <span className="font-mono text-sm font-bold text-purple-300 bg-purple-950/40 px-2 py-1 rounded border border-purple-500/30 inline-block">
                {patron?.card || "No Card Linked"}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Valid institutional RFID credential
            </div>
          </div>
        </div>

        {/* Active Loans Section */}
        <div className="mt-8">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>My Active Loans & Due Dates ({activeLoans.length})</span>
          </h2>

          {activeLoans.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="font-bold text-white text-sm">No books currently borrowed</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                You have {policy?.maxBooks || 4} available borrowing slots. Search the catalog to find books!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLoans.map((loan: any) => {
                const isOverdue = loan.status === "OVERDUE" || new Date() > new Date(loan.dueDate);
                return (
                  <div
                    key={loan.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                      isOverdue
                        ? "bg-red-950/20 border-red-800/80"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-white text-sm line-clamp-1">
                          {loan.copy.book.title}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            isOverdue
                              ? "bg-red-500/20 text-red-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {isOverdue ? "OVERDUE" : "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">by {loan.copy.book.authors}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Due Date</span>
                        <span className={`font-semibold ${isOverdue ? "text-red-400" : "text-slate-200"}`}>
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Barcode</span>
                        <span className="font-mono text-slate-300 text-[11px]">{loan.copy.barcode}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Personal Library Visit History (PRD Section 22, 25) */}
        <div className="mt-10">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>My Library Visit History (Privacy-Protected)</span>
          </h2>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4">Exit Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {visitHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No library visits recorded yet.
                    </td>
                  </tr>
                ) : (
                  visitHistory.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(v.entryTime).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {v.exitTime
                          ? new Date(v.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : "—"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        {v.durationMinutes ? `${v.durationMinutes} mins` : "Active now"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.status === "OPEN"
                              ? "bg-emerald-500/20 text-emerald-300 animate-pulse"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {v.status === "OPEN" ? "INSIDE" : "COMPLETED"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
