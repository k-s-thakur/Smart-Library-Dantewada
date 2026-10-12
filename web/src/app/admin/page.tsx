"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  DoorOpen,
  ArrowRight,
  Repeat,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface DashboardMetrics {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  overdueCopies: number;
  lostCopies: number;
  totalPatrons: number;
  activePatrons: number;
  currentlyInside: number;
  todaysVisits: number;
  todaysIssues: number;
  todaysReturns: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLoans, setRecentLoans] = useState<any[]>([]);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/analytics/dashboard");
      const data = await res.json();
      setMetrics(data.metrics || null);
      setRecentLoans(data.recentLoans || []);
      setRecentVisits(data.recentVisits || []);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Operational Dashboard</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live library inventory, RFID circulation transactions, and gate attendance metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/circulation"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Circulation Desk</span>
            </Link>
            <Link
              href="/admin/gate"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gate Monitor</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Aggregating live library statistics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* Currently Inside / Occupancy */}
              <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-xl p-4 shadow">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Current Occupancy</span>
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{metrics?.currentlyInside ?? 0}</span>
                  <span className="text-xs text-emerald-300">patrons inside</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Today's total visits: <strong className="text-slate-200">{metrics?.todaysVisits ?? 0}</strong>
                </div>
              </div>

              {/* Total Inventory & Available */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Physical Copies</span>
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{metrics?.totalCopies ?? 0}</span>
                  <span className="text-xs text-slate-400">across {metrics?.totalTitles ?? 0} titles</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{metrics?.availableCopies ?? 0} copies available on shelf</span>
                </div>
              </div>

              {/* Active Loans / Issued */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Books Issued</span>
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{metrics?.issuedCopies ?? 0}</span>
                  <span className="text-xs text-slate-400">active loans</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Today's issues: <strong className="text-slate-200">{metrics?.todaysIssues ?? 0}</strong> | returns: <strong className="text-slate-200">{metrics?.todaysReturns ?? 0}</strong>
                </div>
              </div>

              {/* Overdue Loans */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Overdue Loans</span>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-red-400">{metrics?.overdueCopies ?? 0}</span>
                  <span className="text-xs text-slate-400">require return</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Active patrons: <strong className="text-slate-200">{metrics?.activePatrons ?? 0}</strong> of {metrics?.totalPatrons ?? 0}
                </div>
              </div>
            </div>

            {/* Live Activity Feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Recent Loans */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-emerald-400" />
                    <span>Recent Circulation Activity</span>
                  </h3>
                  <Link
                    href="/admin/circulation"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentLoans.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No recent loans recorded.</p>
                  ) : (
                    recentLoans.map((loan) => (
                      <div
                        key={loan.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs flex items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{loan.copy.book.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Patron: <strong className="text-slate-300">{loan.patron.fullName}</strong> ({loan.patron.institutionalId})
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              loan.status === "ACTIVE"
                                ? "bg-blue-500/20 text-blue-300"
                                : loan.status === "OVERDUE"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {loan.status}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Due: {new Date(loan.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Gate Visits */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-emerald-400" />
                    <span>Recent Gate Visits</span>
                  </h3>
                  <Link
                    href="/admin/gate"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <span>Gate Console</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentVisits.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No recent gate visits recorded.</p>
                  ) : (
                    recentVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs flex items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">{visit.patron.fullName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {visit.patron.department || "General"} | {visit.patron.institutionalId}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              visit.status === "OPEN"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-slate-700/60 text-slate-300"
                            }`}
                          >
                            {visit.status === "OPEN" ? "INSIDE NOW" : "COMPLETED"}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {visit.status === "OPEN"
                              ? `Entered: ${new Date(visit.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : `Duration: ${visit.durationMinutes ?? 0} mins`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
