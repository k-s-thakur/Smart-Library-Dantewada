"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Sparkles,
  Layers,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCopyModalOpen, setIsAddCopyModalOpen] = useState(false);
  const [selectedBookForCopy, setSelectedBookForCopy] = useState<Book | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  // Form states for Add Book
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [publisher, setPublisher] = useState("");
  const [edition, setEdition] = useState("");
  const [publicationYear, setPublicationYear] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [ddcCode, setDdcCode] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [copiesCount, setCopiesCount] = useState(2);
  const [shelfLocation, setShelfLocation] = useState("Rack A1 - Shelf 1");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Form state for single Add Copy
  const [singleBarcode, setSingleBarcode] = useState("");
  const [singleRfidUid, setSingleRfidUid] = useState("");
  const [singleShelf, setSingleShelf] = useState("Rack A1 - Shelf 1");
  const [copySubmitting, setCopySubmitting] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error("Failed to load books", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchBooks, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleIsbnLookup = async () => {
    if (!isbn.trim()) {
      setFormError("Please enter an ISBN first.");
      return;
    }
    setLookupLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const res = await fetch(`/api/books/lookup-isbn?isbn=${encodeURIComponent(isbn.trim())}`);
      const data = await res.json();
      if (res.ok && data.metadata) {
        const meta = data.metadata;
        setTitle(meta.title || "");
        setSubtitle(meta.subtitle || "");
        setAuthors(meta.authors || "");
        if (meta.publisher) setPublisher(meta.publisher);
        if (meta.publicationYear) setPublicationYear(meta.publicationYear.toString());
        if (meta.category) setCategory(meta.category);
        if (meta.ddcCode) setDdcCode(meta.ddcCode);
        if (meta.coverImageUrl) setCoverImageUrl(meta.coverImageUrl);
        setFormSuccess("Metadata retrieved successfully from Open Library!");
      } else {
        setFormError(data.error?.message || "No metadata found. You can enter details manually.");
      }
    } catch (err) {
      setFormError("Error connecting to ISBN metadata service.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!isbn.trim() || !title.trim() || !authors.trim()) {
      setFormError("ISBN, Title, and Authors are required.");
      return;
    }

    const cleanIsbn = isbn.replace(/[-\s]/g, "").trim();

    // Generate physical copies data
    const copies = [];
    const timestampSuffix = Math.floor(Math.random() * 900 + 100);
    for (let i = 1; i <= copiesCount; i++) {
      copies.push({
        barcode: `BC${timestampSuffix}${i}`,
        rfidTagUid: `E2801170200${timestampSuffix}${i}`,
        shelfLocation,
      });
    }

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn: cleanIsbn,
          title,
          subtitle,
          authors,
          publisher,
          edition,
          publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
          category,
          ddcCode,
          coverImageUrl,
          copies,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error?.message || "Failed to catalog book.");
        return;
      }

      setFormSuccess(`Book successfully cataloged with ${copiesCount} physical copies!`);
      setTimeout(() => {
        setIsAddModalOpen(false);
        resetAddForm();
        fetchBooks();
      }, 1000);
    } catch (err) {
      setFormError("Network error creating book.");
    }
  };

  const resetAddForm = () => {
    setIsbn("");
    setTitle("");
    setSubtitle("");
    setAuthors("");
    setPublisher("");
    setEdition("");
    setPublicationYear("");
    setCategory("Computer Science");
    setDdcCode("");
    setCoverImageUrl("");
    setCopiesCount(2);
    setShelfLocation("Rack A1 - Shelf 1");
    setFormError("");
    setFormSuccess("");
  };

  const handleAddSingleCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForCopy) return;

    setCopySubmitting(true);
    try {
      const res = await fetch("/api/copies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedBookForCopy.id,
          barcode: singleBarcode.trim(),
          rfidTagUid: singleRfidUid.trim(),
          shelfLocation: singleShelf.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Failed to add copy.");
        return;
      }

      setIsAddCopyModalOpen(false);
      setSingleBarcode("");
      setSingleRfidUid("");
      fetchBooks();
    } catch {
      alert("Error creating copy.");
    } finally {
      setCopySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              <span>Book Inventory & RFID Tagging</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage bibliographic titles, track physical copies, bind RFID tag UIDs, and assign shelf locations.
            </p>
          </div>

          <button
            onClick={() => {
              resetAddForm();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Catalog New Book</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog by title, author, ISBN, or subject..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap">
            Total titles: <strong className="text-white">{books.length}</strong>
          </div>
        </div>

        {/* Books Table */}
        <div className="mt-6 overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/60 shadow">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Book Title & Details</th>
                <th className="py-3 px-4">ISBN</th>
                <th className="py-3 px-4">Subject & DDC</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading inventory...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No books in catalog. Click "Catalog New Book" to add one.
                  </td>
                </tr>
              ) : (
                books.map((b) => {
                  const isExpanded = expandedBookId === b.id;
                  return (
                    <div key={b.id} className="contents">
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={b.coverImageUrl || "https://placehold.co/40x55/1e293b/white?text=Book"}
                            alt={b.title}
                            className="w-9 h-12 object-contain bg-slate-800 rounded border border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div>
                            <div className="font-semibold text-white line-clamp-1">{b.title}</div>
                            <div className="text-[11px] text-slate-400">by {b.authors}</div>
                            {b.publisher && (
                              <div className="text-[10px] text-slate-500">{b.publisher} ({b.publicationYear || "N/A"})</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-200">{b.isbn}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 block w-max">
                            {b.category || "General"}
                          </span>
                          {b.ddcCode && (
                            <span className="text-[10px] text-slate-400 mt-1 block">DDC: {b.ddcCode}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.availableCopies > 0
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {b.availableCopies} / {b.totalCopies} Available
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBookForCopy(b);
                              const rand = Math.floor(Math.random() * 900 + 100);
                              setSingleBarcode(`BC${rand}${b.copies.length + 1}`);
                              setSingleRfidUid(`E2801170200${rand}${b.copies.length + 1}`);
                              setIsAddCopyModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium"
                          >
                            + Add Copy
                          </button>
                          <button
                            onClick={() => setExpandedBookId(isExpanded ? null : b.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            <span>Copies ({b.copies.length})</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Physical Copies Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={5} className="p-4 border-t border-b border-slate-800">
                            <div className="pl-4 border-l-2 border-emerald-500">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Tracked Physical Copies for "{b.title}"</span>
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {b.copies.map((copy) => (
                                  <div
                                    key={copy.id}
                                    className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col justify-between"
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="font-bold text-white">Copy #{copy.copyNumber}</span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          copy.status === "AVAILABLE"
                                            ? "bg-emerald-500/20 text-emerald-300"
                                            : copy.status === "ISSUED"
                                            ? "bg-blue-500/20 text-blue-300"
                                            : "bg-red-500/20 text-red-300"
                                        }`}
                                      >
                                        {copy.status}
                                      </span>
                                    </div>
                                    <div className="text-[11px] space-y-0.5 text-slate-400">
                                      <div>Barcode: <span className="font-mono text-slate-200">{copy.barcode}</span></div>
                                      <div>RFID UID: <span className="font-mono text-emerald-400">{copy.rfidTagUid}</span></div>
                                      <div className="flex items-center gap-1 text-slate-400">
                                        <MapPin className="w-3 h-3 text-slate-500" />
                                        <span>{copy.shelfLocation || "General Stacks"}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Catalog New Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Catalog New Book (PRD Journey 1)</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* ISBN Lookup Input */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  ISBN & Auto-Lookup (Section 45)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="e.g. 9780131103627 or 9780132350884"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleIsbnLookup}
                    disabled={lookupLoading}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lookupLoading ? "Looking up..." : "Lookup"}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Fetches title, authors, publisher, year, and cover art automatically.
                </p>
              </div>

              {/* Title & Subtitle */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Book Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The C Programming Language"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Authors *</label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. Brian W. Kernighan, Dennis M. Ritchie"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Publisher</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="e.g. Prentice Hall"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Publication Year</label>
                  <input
                    type="number"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                    placeholder="e.g. 1988"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category / Subject</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Programming"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">DDC Classification Code</label>
                  <input
                    type="text"
                    value={ddcCode}
                    onChange={(e) => setDdcCode(e.target.value)}
                    placeholder="e.g. 005.133"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Physical Copies Section */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Physical Copies to Create (PRD Section 6)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Initial Copies Count</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={copiesCount}
                      onChange={(e) => setCopiesCount(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Shelf Location</label>
                    <input
                      type="text"
                      value={shelfLocation}
                      onChange={(e) => setShelfLocation(e.target.value)}
                      placeholder="e.g. Rack A1 - Shelf 3"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Each copy will be assigned an automatic unique Barcode and RFID Tag UID with status <strong>AVAILABLE</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Single Copy Modal */}
      {isAddCopyModalOpen && selectedBookForCopy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Physical Copy to "{selectedBookForCopy.title}"</span>
              </h3>
              <button onClick={() => setIsAddCopyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSingleCopy} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Barcode *</label>
                <input
                  type="text"
                  value={singleBarcode}
                  onChange={(e) => setSingleBarcode(e.target.value)}
                  placeholder="e.g. BC100999"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">RFID Tag UID *</label>
                <input
                  type="text"
                  value={singleRfidUid}
                  onChange={(e) => setSingleRfidUid(e.target.value)}
                  placeholder="e.g. E28011702000099"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Shelf Location</label>
                <input
                  type="text"
                  value={singleShelf}
                  onChange={(e) => setSingleShelf(e.target.value)}
                  placeholder="e.g. Rack B2 - Shelf 1"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCopyModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={copySubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {copySubmitting ? "Adding..." : "Add Copy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
