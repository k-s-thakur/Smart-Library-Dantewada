"use client";

import { useEffect, useState } from "react";
import {
  Search,
  BookOpen,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Info,
  X,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface BookCopy {
  id: string;
  copyNumber: number;
  barcode: string;
  rfidTagUid: string;
  shelfLocation: string;
  status: string;
}

interface Book {
  id: string;
  isbn: string;
  title: string;
  subtitle?: string;
  authors: string;
  publisher?: string;
  edition?: string;
  publicationYear?: number;
  category?: string;
  ddcCode?: string;
  coverImageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  copies: BookCopy[];
}

export default function OpacCatalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const categories = [
    "ALL",
    "Computer Science",
    "Algorithms",
    "Software Engineering",
    "Distributed Systems",
    "Networking",
    "Artificial Intelligence",
  ];

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (availableOnly) params.set("available", "true");

      const res = await fetch(`/api/books?${params.toString()}`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error("Failed to load catalog books", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, availableOnly]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Public Access Catalog (OPAC)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Institutional Library Catalog & Resource Discovery
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Search physical books, check real-time shelf availability, verify RFID locations, and track borrowing status across the library.
          </p>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Title, Author, ISBN, or Keyword..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-lg text-sm transition"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60"
                }`}
              >
                {cat === "ALL" ? "All Subjects" : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="text-sm text-slate-400">
            Showing <span className="font-semibold text-white">{books.length}</span> titles
            {selectedCategory !== "ALL" && (
              <span> in <span className="text-emerald-400">{selectedCategory}</span></span>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Show Available Only</span>
          </label>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Searching catalog...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800 mt-6">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-200">No books found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              Try adjusting your search query, selecting another category, or unchecking "Show Available Only".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {books.map((book) => {
              const isAvailable = book.availableCopies > 0;
              return (
                <div
                  key={book.id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700 hover:shadow-xl transition flex flex-col group"
                >
                  {/* Book Card Top Image / Banner */}
                  <div className="h-44 bg-slate-800/60 relative overflow-hidden flex items-center justify-center p-4">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="h-full object-contain drop-shadow group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-20 h-28 bg-emerald-950/80 border border-emerald-500/30 rounded flex items-center justify-center text-emerald-400">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}

                    {/* Availability Tag */}
                    <div className="absolute top-2.5 right-2.5">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{book.availableCopies} of {book.totalCopies} Available</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                          <Clock className="w-3 h-3" />
                          <span>All {book.totalCopies} Issued</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {book.category && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {book.category}
                        </span>
                      )}
                      <h3 className="font-bold text-slate-100 text-sm mt-2 line-clamp-2 group-hover:text-emerald-400 transition">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        by {book.authors}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between mb-2">
                        <span>ISBN: {book.isbn}</span>
                        {book.ddcCode && <span>DDC: {book.ddcCode}</span>}
                      </div>

                      <button
                        onClick={() => setSelectedBook(book)}
                        className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700/60"
                      >
                        <Info className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Copies & Shelves</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Book Copies Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded">
                  {selectedBook.category || "General Collection"}
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedBook.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">by {selectedBook.authors}</p>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">ISBN</span>
                <span className="font-semibold text-slate-200">{selectedBook.isbn}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">DDC Code</span>
                <span className="font-semibold text-slate-200">{selectedBook.ddcCode || "N/A"}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Publisher</span>
                <span className="font-semibold text-slate-200">{selectedBook.publisher || "N/A"}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Year</span>
                <span className="font-semibold text-slate-200">{selectedBook.publicationYear || "N/A"}</span>
              </div>
            </div>

            {/* Individual Physical Copies Table */}
            <div className="mt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Physical Copies & Shelf Tracking ({selectedBook.copies.length} copies)</span>
              </h4>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Copy #</th>
                      <th className="py-2.5 px-3">Barcode</th>
                      <th className="py-2.5 px-3">RFID UID</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {selectedBook.copies.map((copy) => (
                      <tr key={copy.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold">Copy #{copy.copyNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{copy.barcode}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{copy.rfidTagUid}</td>
                        <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{copy.shelfLocation || "General Stacks"}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              copy.status === "AVAILABLE"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : copy.status === "ISSUED"
                                ? "bg-blue-500/20 text-blue-300"
                                : copy.status === "OVERDUE"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {copy.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedBook(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
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
