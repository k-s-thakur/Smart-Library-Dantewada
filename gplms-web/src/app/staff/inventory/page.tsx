"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  PlusCircle,
  Printer,
  QrCode,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface BookCopyItem {
  id: string;
  accessionNo: string;
  copyNumber: number;
  qrCodeToken: string;
  shelfLocation: string;
  acquisitionCost: number;
  status: string;
  book: {
    id: string;
    title: string;
    isbn: string;
    ddcCode?: string;
    bookNumber?: string;
    authors: { author: { name: string } }[];
  };
}

export default function InventoryAccessionPage() {
  const [activeTab, setActiveTab] = useState<"register" | "add">("register");
  const [copies, setCopies] = useState<BookCopyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLabelCopy, setSelectedLabelCopy] = useState<BookCopyItem | null>(null);

  // Add Book Form
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [edition, setEdition] = useState("1st Edition");
  const [publicationYear, setPublicationYear] = useState("2024");
  const [language, setLanguage] = useState("Hindi/English");
  const [ddcCode, setDdcCode] = useState("005.133");
  const [bookNumber, setBookNumber] = useState("");
  const [authors, setAuthors] = useState("");
  const [publisher, setPublisher] = useState("Publications Division, Govt of India");
  const [categoryName, setCategoryName] = useState("Computer Science & IT");
  const [copiesCount, setCopiesCount] = useState(2);
  const [shelfLocation, setShelfLocation] = useState("Aisle 4, Rack D, Shelf 1");
  const [acquisitionCost, setAcquisitionCost] = useState(350);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchAccessionCopies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalogue?limit=50");
      const data = await res.json();
      const allCopies: BookCopyItem[] = [];
      for (const b of data.items || []) {
        for (const c of b.copies || []) {
          allCopies.push({
            ...c,
            qrCodeToken: `QR-GPLMS-${c.accessionNo}`,
            acquisitionCost: 250,
            book: {
              id: b.id,
              title: b.title,
              isbn: b.isbn,
              ddcCode: b.ddcCode,
              bookNumber: b.bookNumber,
              authors: [{ author: { name: b.authors } }],
            },
          });
        }
      }
      setCopies(allCopies);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessionCopies();
  }, []);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isbn.trim() || !title.trim() || !authors.trim()) {
      setErrorMessage("Please fill all required fields: ISBN, Title, and Authors.");
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await fetch("/api/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn: isbn.trim(),
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          edition,
          publicationYear: parseInt(publicationYear, 10),
          language,
          ddcCode: ddcCode.trim() || undefined,
          bookNumber: bookNumber.trim() || undefined,
          authorNames: authors.split(",").map((a) => a.trim()).filter(Boolean),
          publisherName: publisher.trim() || undefined,
          categoryName: categoryName.trim() || undefined,
          initialCopiesCount: copiesCount,
          shelfLocation,
          acquisitionCost: Number(acquisitionCost),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create book");
      }

      setSuccessMessage(`Book "${data.book.title}" added to catalogue with ${data.copies.length} copies.`);
      setIsbn("");
      setTitle("");
      setSubtitle("");
      setAuthors("");
      fetchAccessionCopies();
      setActiveTab("register");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add book");
    } finally {
      setSubmittingAdd(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[rgba(42,40,35,0.06)] pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono-num text-[#7A8B6F]">
            <Layers className="w-3.5 h-3.5" />
            <span>Cataloguing & Accession · FR-02</span>
          </div>
          <h1 className="font-display text-4xl text-[#2A2823] font-normal tracking-[-0.02em]">
            Accession & Inventory
          </h1>
          <p className="text-sm text-[#8B8678] max-w-xl">
            Physical copy registry, Dewey Decimal Classification, and printable accession spine labels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("register")}
            className={activeTab === "register" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Accession Register</span>
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={activeTab === "add" ? "btn-primary !text-xs !py-2.5 !px-5" : "btn-secondary !text-xs !py-2.5 !px-5"}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Title & Copies</span>
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

      {/* TAB 1: ACCESSION REGISTER */}
      {activeTab === "register" && (
        <div className="linen-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(42,40,35,0.06)] pb-4">
            <div>
              <h2 className="font-display text-xl text-[#2A2823] font-normal">
                Physical Copy Register
              </h2>
              <p className="text-xs text-[#8B8678]">
                {copies.length} physical copies catalogued with sequential accession codes.
              </p>
            </div>
            <button onClick={fetchAccessionCopies} className="btn-secondary !text-xs !py-2 !px-4">
              Refresh Copies
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-[#8B8678] text-xs">Loading copies register...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-num">
                <thead>
                  <tr className="border-b border-[rgba(42,40,35,0.06)] text-[#8B8678]">
                    <th className="py-3 px-3 font-normal">Accession No.</th>
                    <th className="py-3 px-3 font-normal">Title & Authors</th>
                    <th className="py-3 px-3 font-normal">DDC Class</th>
                    <th className="py-3 px-3 font-normal">Shelf Stack</th>
                    <th className="py-3 px-3 font-normal">Status</th>
                    <th className="py-3 px-3 font-normal text-right">Spine Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(42,40,35,0.06)] text-[#2A2823]">
                  {copies.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-3 font-medium text-[#7A8B6F]">{c.accessionNo}</td>
                      <td className="py-3 px-3 font-sans">
                        <div className="font-medium text-[#2A2823]">{c.book.title}</div>
                        <div className="text-[11px] text-[#8B8678]">{c.book.authors[0]?.author?.name || "Author"}</div>
                      </td>
                      <td className="py-3 px-3 text-[#8B8678]">{c.book.ddcCode || "General"}</td>
                      <td className="py-3 px-3 text-[#8B8678]">{c.shelfLocation || "General Stack"}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] text-[#7A8B6F] bg-[rgba(122,139,111,0.08)] px-2 py-0.5 rounded-[4px]">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedLabelCopy(c)}
                          className="btn-ghost !text-xs !p-0"
                        >
                          <Printer className="w-3.5 h-3.5 inline mr-1" />
                          <span>Print Label</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD BOOK & COPIES */}
      {activeTab === "add" && (
        <form onSubmit={handleAddBook} className="linen-card max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="font-display text-2xl text-[#2A2823] font-normal">
              Catalog New Title & Allocate Copies
            </h2>
            <p className="text-xs text-[#8B8678] mt-1">
              Create bibliographic metadata record and allocate initial physical accessioned copies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">ISBN *</label>
              <input
                type="text"
                required
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="e.g. 9780131103627"
                className="linen-input w-full font-mono-num text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern Operating Systems"
                className="linen-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Design, Principles and Kernels"
                className="linen-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Author(s) (comma separated) *</label>
              <input
                type="text"
                required
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="e.g. Andrew S. Tanenbaum, Herbert Bos"
                className="linen-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Dewey Decimal Code (DDC)</label>
              <input
                type="text"
                value={ddcCode}
                onChange={(e) => setDdcCode(e.target.value)}
                placeholder="e.g. 005.43"
                className="linen-input w-full font-mono-num text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Cutter / Book Number</label>
              <input
                type="text"
                value={bookNumber}
                onChange={(e) => setBookNumber(e.target.value)}
                placeholder="e.g. TAN-MOS"
                className="linen-input w-full font-mono-num text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Initial Copies Count</label>
              <input
                type="number"
                min="1"
                max="20"
                value={copiesCount}
                onChange={(e) => setCopiesCount(parseInt(e.target.value, 10) || 1)}
                className="linen-input w-full font-mono-num text-xs"
              />
            </div>

            <div>
              <label className="block text-[#8B8678] mb-1.5 font-medium">Shelf Stack Location</label>
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="e.g. Aisle 4, Rack D, Shelf 2"
                className="linen-input w-full text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingAdd}
            className="btn-primary w-full text-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submittingAdd ? "Cataloguing..." : "Save Title & Generate Copies"}</span>
          </button>
        </form>
      )}

      {/* QR Spine Label Modal */}
      {selectedLabelCopy && (
        <div className="fixed inset-0 z-50 bg-[rgba(42,40,35,0.45)] backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#FBF8F2] border border-[rgba(42,40,35,0.08)] rounded-[18px] max-w-sm w-full p-8 shadow-[0_32px_80px_-24px_rgba(122,139,111,0.4)] space-y-6 relative">
            <button
              onClick={() => setSelectedLabelCopy(null)}
              className="absolute top-6 right-6 text-[#8B8678] hover:text-[#2A2823] text-xl font-light cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center border-b border-[rgba(42,40,35,0.06)] pb-4 space-y-1">
              <div className="text-[10px] font-mono-num text-[#8B8678] uppercase tracking-wider">
                Government Public Library
              </div>
              <h3 className="font-display text-lg text-[#2A2823] font-normal">
                Accession Spine Label
              </h3>
            </div>

            {/* Printable Label Container */}
            <div
              id="printable-spine"
              className="border border-[rgba(42,40,35,0.12)] p-6 rounded-[12px] flex flex-col items-center justify-center text-center space-y-3 bg-[#F6F2EA]"
            >
              <div className="w-20 h-20 bg-[#FBF8F2] border border-[rgba(42,40,35,0.12)] flex items-center justify-center rounded-[8px]">
                <QrCode className="w-12 h-12 text-[#2A2823]" />
              </div>

              <div className="font-mono-num text-sm font-medium text-[#2A2823]">
                {selectedLabelCopy.accessionNo}
              </div>
              <div className="text-xs font-normal text-[#2A2823] line-clamp-1">
                {selectedLabelCopy.book.title}
              </div>
              <div className="text-[11px] font-mono-num text-[#8B8678]">
                DDC {selectedLabelCopy.book.ddcCode || "000"} · {selectedLabelCopy.book.bookNumber || "BOOK"}
              </div>
              <div className="text-[10px] text-[#8B8678]">
                {selectedLabelCopy.shelfLocation}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="btn-primary flex-1 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Physical Label</span>
              </button>
              <button
                onClick={() => setSelectedLabelCopy(null)}
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
