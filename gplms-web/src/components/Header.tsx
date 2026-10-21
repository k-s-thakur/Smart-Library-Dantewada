"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  QrCode,
  Layers,
  Banknote,
  Users,
  User,
  LogOut,
  Library,
} from "lucide-react";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  memberId?: string | null;
  memberNo?: string | null;
}

export default function Header() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setCurrentUser(data.user || null);
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const switchRole = async (role: string) => {
    try {
      await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      await fetchUser();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    window.location.href = "/";
  };

  const isStaff =
    currentUser &&
    ["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN", "ACCOUNTS_OPERATOR", "APPROVING_OFFICER"].includes(
      currentUser.role
    );

  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F2] border-b border-[rgba(42,40,35,0.08)] shadow-[0_1px_2px_rgba(42,40,35,0.04)]">
      {/* Top Utility Bar - Soft Linen Subdued */}
      <div className="bg-[#F6F2EA] border-b border-[rgba(42,40,35,0.06)] px-6 py-2 text-xs text-[#8B8678] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7A8B6F]"></span>
          <span className="font-medium text-[#2A2823]">
            सार्वजनिक ई-पुस्तकालय · Government Public Library
          </span>
          <span className="hidden sm:inline text-[rgba(42,40,35,0.2)]">/</span>
          <span className="font-mono-num text-[11px] text-[#8B8678]">NIC Standard OPAC</span>
        </div>

        {/* Live Role Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#8B8678] text-[11px] mr-1 hidden sm:inline">Role:</span>
          {[
            { role: "LIBRARIAN", label: "Librarian" },
            { role: "ACCOUNTS_OPERATOR", label: "Accounts" },
            { role: "APPROVING_OFFICER", label: "Approving Officer" },
            { role: "MEMBER", label: "Citizen (Rahul)" },
          ].map((item) => {
            const active = currentUser?.role === item.role;
            return (
              <button
                key={item.role}
                onClick={() => switchRole(item.role)}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-medium transition cursor-pointer ${
                  active
                    ? "bg-[#2A2823] text-[#F6F2EA]"
                    : "bg-[#FBF8F2] text-[#8B8678] border border-[rgba(42,40,35,0.08)] hover:text-[#2A2823] hover:border-[rgba(42,40,35,0.2)]"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {currentUser && (
            <button
              onClick={handleLogout}
              className="ml-2 text-[#8B8678] hover:text-[#2A2823] p-1 transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Masthead Navigation */}
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-[12px] bg-[#F6F2EA] border border-[rgba(42,40,35,0.12)] flex items-center justify-center text-[#2A2823] group-hover:border-[#7A8B6F] transition">
              <Library className="w-5 h-5 text-[#2A2823]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-normal tracking-[-0.02em] text-[#2A2823]">
                  GPLMS
                </span>
                <span className="font-mono-num text-[10px] text-[#7A8B6F] bg-[rgba(122,139,111,0.12)] px-2 py-0.5 rounded-[9999px] font-medium">
                  v1.0
                </span>
              </div>
              <div className="text-[11px] text-[#8B8678] tracking-normal font-normal">
                Government Public Library
              </div>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition flex items-center gap-2 py-1 ${
                pathname === "/"
                  ? "text-[#2A2823] border-b border-[#2A2823]"
                  : "text-[#8B8678] hover:text-[#2A2823]"
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#7A8B6F]" />
              <span>Public OPAC (ग्रंथ सूची)</span>
            </Link>

            {isStaff && (
              <>
                <Link
                  href="/staff/circulation"
                  className={`text-sm font-medium transition flex items-center gap-2 py-1 ${
                    pathname.startsWith("/staff/circulation")
                      ? "text-[#2A2823] border-b border-[#2A2823]"
                      : "text-[#8B8678] hover:text-[#2A2823]"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-[#8B8678]" />
                  <span>Circulation</span>
                </Link>

                <Link
                  href="/staff/inventory"
                  className={`text-sm font-medium transition flex items-center gap-2 py-1 ${
                    pathname.startsWith("/staff/inventory")
                      ? "text-[#2A2823] border-b border-[#2A2823]"
                      : "text-[#8B8678] hover:text-[#2A2823]"
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#8B8678]" />
                  <span>Inventory & DDC</span>
                </Link>

                <Link
                  href="/staff/finance"
                  className={`text-sm font-medium transition flex items-center gap-2 py-1 ${
                    pathname.startsWith("/staff/finance")
                      ? "text-[#2A2823] border-b border-[#2A2823]"
                      : "text-[#8B8678] hover:text-[#2A2823]"
                  }`}
                >
                  <Banknote className="w-4 h-4 text-[#8B8678]" />
                  <span>Revenue & Cash</span>
                </Link>

                <Link
                  href="/staff/members"
                  className={`text-sm font-medium transition flex items-center gap-2 py-1 ${
                    pathname.startsWith("/staff/members")
                      ? "text-[#2A2823] border-b border-[#2A2823]"
                      : "text-[#8B8678] hover:text-[#2A2823]"
                  }`}
                >
                  <Users className="w-4 h-4 text-[#8B8678]" />
                  <span>Members</span>
                </Link>
              </>
            )}

            {currentUser?.role === "MEMBER" && (
              <Link
                href="/member"
                className={`text-sm font-medium transition flex items-center gap-2 py-1 ${
                  pathname.startsWith("/member")
                    ? "text-[#2A2823] border-b border-[#2A2823]"
                    : "text-[#8B8678] hover:text-[#2A2823]"
                }`}
              >
                <User className="w-4 h-4 text-[#7A8B6F]" />
                <span>My Library Card</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User Status / Portal Action */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-[#F6F2EA] border border-[rgba(42,40,35,0.08)] px-3.5 py-1.5 rounded-[12px]">
              <div className="w-7 h-7 rounded-[8px] bg-[#FBF8F2] border border-[rgba(42,40,35,0.12)] text-[#2A2823] flex items-center justify-center font-display text-sm font-medium">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-medium text-[#2A2823]">{currentUser.name}</div>
                <div className="font-mono-num text-[10px] text-[#8B8678]">
                  {currentUser.role.replace(/_/g, " ")}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => switchRole("LIBRARIAN")}
              className="btn-primary text-xs !py-2 !px-4"
            >
              Staff Portal Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
