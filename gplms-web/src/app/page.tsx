"use client";

import { useEffect, useState } from "react";
import {
  Search,
  BookOpen,
  MapPin,
  Clock,
  CheckCircle2,
  Bookmark,
  Layers,
  ChevronRight,
  Library,
} from "lucide-react";

interface BookCopy {
  id: string;
  accessionNo: string;
  copyNumber: number;
  shelfLocation: string;
  status: string;
}

interface BookItem {
  id: string;
  isbn: string;
  title: string;
  subtitle?: string;
  edition?: string;
  publicationYear?: number;
  language: string;
  ddcCode?: string;
  bookNumber?: string;
  description?: string;
  coverImageUrl?: string;
  publisher: string;
  category: string;
  authors: string;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  referenceOnlyCopies: number;
  primaryLocation: string;
  copies: BookCopy[];
}

export default function PublicOpacPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [reservationMessage, setReservationMessage] = useState<string>("");
  const [reserving, setReserving] = useState(false);

  const fetchCatalogue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (availableOnly) params.set("available", "true");

      const res = await fetch(`/api/catalogue?${params.toString()}`);
      const data = await res.json();
      setBooks(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();
  }, [selectedCategory, availableOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalogue();
  };

  const handleReserveBook = async (bookId: string) => {
    setReserving(true);
    setReservationMessage("");
    try {
      const res = await fetch("/api/circulation/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Reservation failed");
      }
      setReservationMessage(
        `Reservation confirmed. Position #${data.queuePosition} in queue. You will be notified when ready.`
      );
    } catch (err: any) {
      setReservationMessage(`Notice: ${err.message}`);
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="space-y-36 pb-36">
      {/* Editorial Hero Section with Soft Linen 160px rhythm */}
      <section className="pt-24 pb-16 px-6 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-[9999px] bg-[#FBF8F2] border border-[rgba(42,40,35,0.08)] text-xs text-[#8B8678]">
          <Library className="w-3.5 h-3.5 text-[#7A8B6F]" />
          <span>Government Public Library · Online Public Access Catalogue</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-[4.75rem] leading-[1.05] tracking-[-0.025em] text-[#2A2823] font-normal">
          Catalogue & Public Reference
        </h1>

        <p className="text-base sm:text-[1.0625rem] leading-[1.65] text-[#8B8678] max-w-2xl mx-auto font-normal">
          Search titles across the Dewey Decimal Classification, verify stack locations, and review copy availability in quiet order.
        </p>

        {/* Search Bar - Recipe */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-2xl mx-auto bg-[#FBF8F2] p-2 rounded-[18px] border border-[rgba(42,40,35,0.12)] shadow-[0_1px_2px_rgba(42,40,35,0.04)]"
        >
          <div className="flex items-center gap-3 flex-1 w-full px-4">
            <Search className="w-4 h-4 text-[#8B8678] shrink-0" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN, or DDC classification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[#2A2823] text-[0.9375rem] outline-none placeholder:text-[#8B8678] py-2"
            />
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto text-sm shrink-0">
            Search OPAC
          </button>
        </form>

        {/* DDC Classification Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          {[
            { id: "", label: "All Classes" },
            { id: "CS_IT", label: "000 Computer Science" },
            { id: "LAW_GOV", label: "300 Law & Governance" },
            { id: "SCIENCES", label: "500 Natural Sciences" },
            { id: "LITERATURE", label: "800 Literature" },
            { id: "HISTORY", label: "900 History" },
          ].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3.5 py-1.5 rounded-[9999px] transition cursor-pointer ${
                  active
                    ? "bg-[#2A2823] text-[#F6F2EA]"
                    : "bg-[#FBF8F2] text-[#8B8678] border border-[rgba(42,40,35,0.08)] hover:text-[#2A2823] hover:border-[rgba(42,40,35,0.2)]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Catalog Stacks Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(42,40,35,0.06)] pb-6">
          <div className="flex items-center gap-2.5 text-sm text-[#8B8678]">
            <BookOpen className="w-4 h-4 text-[#7A8B6F]" />
            <span>
              Registered titles: <strong className="text-[#2A2823] font-mono-num font-medium">{books.length}</strong>
            </span>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-[#8B8678] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded accent-[#7A8B6F]"
            />
            <span>Show available copies only</span>
          </label>
        </div>

        {/* Books Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="linen-card h-80 animate-pulse bg-[#FBF8F2]/60" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="linen-card text-center py-20 space-y-4">
            <BookOpen className="w-8 h-8 text-[#8B8678] mx-auto opacity-60" />
            <h3 className="font-display text-xl text-[#2A2823]">No catalogue records match your criteria</h3>
            <p className="text-xs text-[#8B8678] max-w-sm mx-auto">
              Please refine your search keywords or select another Dewey Decimal class.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((b) => (
              <div
                key={b.id}
                className="linen-card linen-card-interactive flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Category & DDC Code */}
                  <div className="flex items-center justify-between text-xs text-[#8B8678]">
                    <span className="font-medium">{b.category}</span>
                    {b.ddcCode && (
                      <span className="font-mono-num text-[11px] text-[#7A8B6F] bg-[rgba(122,139,111,0.08)] px-2 py-0.5 rounded-[6px]">
                        DDC {b.ddcCode}
                      </span>
                    )}
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3 className="font-display text-xl leading-snug text-[#2A2823] font-normal">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="text-xs text-[#8B8678] mt-1 line-clamp-1">{b.subtitle}</p>
                    )}
                    <p className="text-xs text-[#8B8678] mt-2 font-medium">By {b.authors}</p>
                  </div>

                  {/* Metadata Box */}
                  <div className="bg-[#F6F2EA] p-3 rounded-[12px] border border-[rgba(42,40,35,0.06)] font-mono-num text-[11px] text-[#8B8678] space-y-1">
                    <div className="flex justify-between">
                      <span>ISBN</span>
                      <span className="text-[#2A2823]">{b.isbn}</span>
                    </div>
                    {b.bookNumber && (
                      <div className="flex justify-between">
                        <span>Call No.</span>
                        <span className="text-[#2A2823]">{b.bookNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Language</span>
                      <span className="text-[#2A2823]">{b.language}</span>
                    </div>
                  </div>

                  {/* Shelf Location */}
                  <div className="flex items-center gap-2 text-xs text-[#8B8678]">
                    <MapPin className="w-3.5 h-3.5 text-[#7A8B6F] shrink-0" />
                    <span className="truncate">{b.primaryLocation}</span>
                  </div>
                </div>

                {/* Footer Availability & Action */}
                <div className="mt-8 pt-4 border-t border-[rgba(42,40,35,0.06)] flex items-center justify-between">
                  <div>
                    {b.availableCopies > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#7A8B6F] font-mono-num">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {b.availableCopies} of {b.totalCopies} available
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-[#8B8678] font-mono-num">
                        All copies on loan ({b.issuedCopies})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedBook(b)}
                    className="btn-ghost text-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>Inspect Copies</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Library Timings, Rules & Directives (Section gap 160px) */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="linen-card space-y-8">
          <div className="flex items-center gap-4 border-b border-[rgba(42,40,35,0.06)] pb-6">
            <div className="w-10 h-10 rounded-[12px] bg-[#F6F2EA] flex items-center justify-center text-[#7A8B6F]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-normal text-[#2A2823]">
                Library Timings & Citizen Directives
              </h2>
              <p className="text-xs text-[#8B8678] mt-0.5">
                Standard operating regulations for the Government Public Library
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-[#8B8678] leading-relaxed">
            <div className="space-y-2">
              <div className="font-display text-sm text-[#2A2823]">Hours of Operation</div>
              <div>Monday – Saturday: 09:00 AM – 08:00 PM</div>
              <div>Sundays & Gazetted Holidays: 10:00 AM – 05:00 PM</div>
              <div>Reference Desk: Active during all operational hours</div>
            </div>

            <div className="space-y-2">
              <div className="font-display text-sm text-[#2A2823]">Citizen Entitlements</div>
              <div>General Citizens: 3 books for 14 calendar days</div>
              <div>Overdue assessment: ₹2.00 per diem following grace period</div>
              <div>Renewal permitted once if no active reservation queue</div>
            </div>

            <div className="space-y-2">
              <div className="font-display text-sm text-[#2A2823]">Circulation Protocol</div>
              <div>Accession barcode scanning is mandatory for all transactions</div>
              <div>Sequential receipts issued for all payments</div>
              <div>Reference archive volumes restricted to reading hall</div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Detail & Accession Copies Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-[rgba(42,40,35,0.45)] backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#FBF8F2] border border-[rgba(42,40,35,0.08)] text-[#2A2823] rounded-[18px] max-w-2xl w-full p-8 space-y-6 shadow-[0_32px_80px_-24px_rgba(122,139,111,0.4)] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedBook(null);
                setReservationMessage("");
              }}
              className="absolute top-6 right-6 text-[#8B8678] hover:text-[#2A2823] text-xl font-light cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-2">
              <div className="text-xs text-[#7A8B6F] font-mono-num">
                {selectedBook.category} · DDC {selectedBook.ddcCode || "General"}
              </div>
              <h2 className="font-display text-3xl font-normal text-[#2A2823]">
                {selectedBook.title}
              </h2>
              {selectedBook.subtitle && (
                <p className="text-xs text-[#8B8678]">{selectedBook.subtitle}</p>
              )}
              <p className="text-xs text-[#8B8678]">Authors: {selectedBook.authors}</p>
            </div>

            {selectedBook.description && (
              <p className="text-xs text-[#2A2823]/80 bg-[#F6F2EA] p-4 rounded-[12px] border border-[rgba(42,40,35,0.06)] leading-relaxed">
                {selectedBook.description}
              </p>
            )}

            {/* Copies and Accession table */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-[#8B8678] flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#7A8B6F]" />
                <span>Physical Copies & Shelf Location</span>
              </div>

              <div className="border border-[rgba(42,40,35,0.08)] rounded-[12px] overflow-hidden text-xs bg-[#FBF8F2]">
                <table className="w-full text-left">
                  <thead className="bg-[#F6F2EA] text-[#8B8678] border-b border-[rgba(42,40,35,0.06)]">
                    <tr>
                      <th className="p-3 font-normal">Accession No.</th>
                      <th className="p-3 font-normal">Shelf Location</th>
                      <th className="p-3 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(42,40,35,0.06)] font-mono-num text-[11px]">
                    {selectedBook.copies.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 text-[#2A2823] font-medium">{c.accessionNo}</td>
                        <td className="p-3 text-[#8B8678]">{c.shelfLocation || "General Stack"}</td>
                        <td className="p-3">
                          <span className="text-[#7A8B6F]">{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reserve Action */}
            <div className="pt-4 border-t border-[rgba(42,40,35,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#8B8678]">
                {selectedBook.availableCopies > 0
                  ? "Available for loan at the circulation desk."
                  : "Currently on loan. You may queue a reservation."}
              </div>

              <button
                onClick={() => handleReserveBook(selectedBook.id)}
                disabled={reserving}
                className="btn-primary text-xs w-full sm:w-auto"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{reserving ? "Processing..." : "Place Reservation"}</span>
              </button>
            </div>

            {reservationMessage && (
              <div className="bg-[#F6F2EA] p-3 rounded-[12px] border border-[rgba(42,40,35,0.08)] text-xs text-[#2A2823]">
                {reservationMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
