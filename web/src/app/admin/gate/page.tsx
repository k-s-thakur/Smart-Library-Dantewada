"use client";

import { useEffect, useState } from "react";
import {
  DoorOpen,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Users,
  Repeat,
  Radio,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function GateMonitorPage() {
  const [occupancy, setOccupancy] = useState<number>(0);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulator controls
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [cardUid, setCardUid] = useState("CARD_PRIYA_02");
  const [simulating, setSimulating] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);

  const fetchGateData = async () => {
    try {
      const res = await fetch("/api/gate/events");
      const data = await res.json();
      setOccupancy(data.occupancy ?? 0);
      setActiveSessions(data.activeSessions || []);
      setRecentEvents(data.recentEvents || []);
    } catch (err) {
      console.error("Failed to fetch gate data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateData();
    const interval = setInterval(fetchGateData, 4000); // 4s polling for live activity
    return () => clearInterval(interval);
  }, []);

  const handleSimulateTap = async (selectedUid?: string, selectedDir?: "IN" | "OUT") => {
    const tapUid = selectedUid || cardUid;
    const tapDir = selectedDir || direction;
    if (!tapUid.trim()) return;

    setSimulating(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/gate/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardUid: tapUid.trim(),
          direction: tapDir,
          deviceId: tapDir === "IN" ? "GATE_ENTRY_01" : "GATE_EXIT_01",
          eventId: `sim_${Date.now()}`,
        }),
      });

      const data = await res.json();
      setLastResult(data);
      fetchGateData();
    } catch {
      setLastResult({
        accepted: false,
        action: "ERROR",
        message: "Network error sending gate event.",
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <DoorOpen className="w-6 h-6 text-emerald-400" />
                <span>Gate Attendance & Occupancy Monitor</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time RFID/NFC gate telemetry, occupancy monitoring, duplicate entry prevention, and visit session durations.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Turnstile Readers:</span>
            <strong className="text-emerald-400">ONLINE (2/2)</strong>
          </div>
        </div>

        {/* Top Metric & Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Live Occupancy Metric Card */}
          <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span>Real-Time Inside Library</span>
                <Users className="w-5 h-5" />
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-5xl font-black text-white">{occupancy}</span>
                <span className="text-sm font-semibold text-emerald-300">patrons currently inside</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Synchronized with Entry Turnstile (GATE_ENTRY_01) and Exit Turnstile (GATE_EXIT_01).
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-500/20 text-xs text-slate-300">
              Active visit sessions open: <strong className="text-white">{activeSessions.length}</strong>
            </div>
          </div>

          {/* Interactive Turnstile Simulator */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Interactive Gate Turnstile Simulator (PRD Section 15-18)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Gate Direction</label>
                <div className="flex bg-slate-950 border border-slate-700 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDirection("IN")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      direction === "IN" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    ENTRY (IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("OUT")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      direction === "OUT" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    EXIT (OUT)
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-xs mb-1">RFID/NFC Card UID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cardUid}
                    onChange={(e) => setCardUid(e.target.value)}
                    placeholder="Enter Card UID..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSimulateTap()}
                    disabled={simulating || !cardUid.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow transition"
                  >
                    {simulating ? "Tapping..." : "Simulate Tap"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Tap Demo Chips */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                Quick-Tap Test Cards (Test Acceptance Criteria 4, 5, 6):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCardUid("CARD_PRIYA_02");
                    handleSimulateTap("CARD_PRIYA_02", "IN");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500 text-xs text-left"
                >
                  <span className="font-semibold text-slate-200 block text-[11px]">Priya Patel (IN)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">CARD_PRIYA_02</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardUid("CARD_AARAV_01");
                    handleSimulateTap("CARD_AARAV_01", "IN");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500 text-xs text-left"
                  title="Aarav is already inside - tests duplicate entry rejection"
                >
                  <span className="font-semibold text-slate-200 block text-[11px]">Aarav (Duplicate Entry Test)</span>
                  <span className="text-[10px] text-amber-400 font-mono">Already Inside</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardUid("CARD_AARAV_01");
                    handleSimulateTap("CARD_AARAV_01", "OUT");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 text-xs text-left"
                >
                  <span className="font-semibold text-slate-200 block text-[11px]">Aarav (OUT - Close Session)</span>
                  <span className="text-[10px] text-blue-400 font-mono">Calculate Duration</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardUid("CARD_ROHAN_05");
                    handleSimulateTap("CARD_ROHAN_05", "IN");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-800/80 hover:bg-red-900/50 text-xs text-left"
                >
                  <span className="font-semibold text-red-300 block text-[11px]">Rohan (Suspended Test)</span>
                  <span className="text-[10px] text-red-400 font-mono">CARD_ROHAN_05</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardUid("CARD_UNKNOWN_99");
                    handleSimulateTap("CARD_UNKNOWN_99", "IN");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500 text-xs text-left"
                >
                  <span className="font-semibold text-slate-300 block text-[11px]">Unknown Card (Denied)</span>
                  <span className="text-[10px] text-slate-500 font-mono">CARD_UNKNOWN_99</span>
                </button>
              </div>
            </div>

            {/* Last Result Alert */}
            {lastResult && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
                  lastResult.accepted
                    ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
                    : lastResult.action === "DUPLICATE_ENTRY"
                    ? "bg-amber-950/70 border-amber-800 text-amber-300"
                    : "bg-red-950/70 border-red-800 text-red-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {lastResult.accepted ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-[12px]">
                      {lastResult.action}: {lastResult.patronName || lastResult.reason}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      {lastResult.message ||
                        (lastResult.direction === "IN"
                          ? "Entry session opened. Occupancy +1"
                          : `Exit recorded. Duration: ${lastResult.durationMinutes ?? 0} mins. Occupancy -1`)}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] shrink-0 font-bold">
                  Occupancy: {lastResult.occupancy}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sessions & Event Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Active Sessions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Patrons Currently Inside Library ({activeSessions.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Patron</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Entry Time</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        Library is currently empty.
                      </td>
                    </tr>
                  ) : (
                    activeSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {session.patron.fullName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {session.patron.department || "General"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(session.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              // Find their card or institutionalId
                              handleSimulateTap(session.patron.institutionalId, "OUT");
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px] font-bold"
                          >
                            Tap Exit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Gate Events Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Turnstile Event Feed</span>
            </h3>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {recentEvents.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No turnstile events recorded yet.</p>
              ) : (
                recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                          evt.eventType === "ENTRY"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {evt.eventType === "ENTRY" ? "IN" : "OUT"}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200">
                          {evt.session?.patron?.fullName || `Card: ${evt.cardUid}`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {evt.deviceId} • {new Date(evt.rawTimestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          evt.status === "ACCEPTED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {evt.status}
                      </span>
                      {evt.reason && (
                        <div className="text-[9px] text-red-400 mt-0.5 text-right font-medium">
                          {evt.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
