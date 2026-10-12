"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Repeat,
  Users,
  ShieldCheck,
  DoorOpen,
  GraduationCap,
  LogOut,
  UserCheck,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "LIBRARIAN" | "STUDENT";
  patron?: {
    id: string;
    fullName: string;
    institutionalId: string;
  } | null;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setCurrentUser(data.user || null);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const switchDemoRole = async (role: string) => {
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoRole: role }),
      });
      await fetchUser();
      if (role === "STUDENT") {
        router.push("/student");
      } else {
        router.push("/admin");
      }
    } catch (err) {
      console.error("Failed demo role switch", err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.push("/");
  };

  const isStaff = currentUser?.role === "ADMIN" || currentUser?.role === "LIBRARIAN";

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Demo Toolbar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SLMTS MVP Demo Switcher:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => switchDemoRole("ADMIN")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              currentUser?.role === "ADMIN"
                ? "bg-purple-600 text-white shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            👑 Super Admin
          </button>
          <button
            onClick={() => switchDemoRole("LIBRARIAN")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              currentUser?.role === "LIBRARIAN"
                ? "bg-emerald-600 text-white shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            📚 Librarian
          </button>
          <button
            onClick={() => switchDemoRole("STUDENT")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              currentUser?.role === "STUDENT"
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            🎓 Student (Aarav)
          </button>
          {currentUser && (
            <button
              onClick={handleLogout}
              className="ml-2 px-2 py-1 rounded text-red-300 hover:bg-red-950/60 flex items-center gap-1"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow group-hover:bg-emerald-500 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight leading-none text-white">
                SLMTS
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Smart Library System
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                pathname === "/"
                  ? "bg-slate-800 text-emerald-400"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>OPAC Catalog</span>
            </Link>

            {isStaff && (
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname === "/admin"
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/circulation"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname.startsWith("/admin/circulation")
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                  <span>Circulation Desk</span>
                </Link>
                <Link
                  href="/admin/books"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname.startsWith("/admin/books")
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Books & RFID</span>
                </Link>
                <Link
                  href="/admin/patrons"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname.startsWith("/admin/patrons")
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Patrons</span>
                </Link>
                <Link
                  href="/admin/gate"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname.startsWith("/admin/gate")
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>Gate Monitor</span>
                </Link>
              </>
            )}

            {currentUser?.role === "STUDENT" && (
              <Link
                href="/student"
                className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  pathname.startsWith("/student")
                    ? "bg-slate-800 text-emerald-400"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>My Library Portal</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-semibold text-slate-200">{currentUser.name}</span>
                <span className="ml-1.5 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  {currentUser.role}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => switchDemoRole("LIBRARIAN")}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-2 rounded-md transition shadow"
            >
              Sign In (Demo)
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
