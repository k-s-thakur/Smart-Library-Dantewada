export interface IsbnMetadata {
  isbn: string;
  title: string;
  subtitle?: string;
  authors: string;
  publisher?: string;
  publicationYear?: number;
  coverImageUrl?: string;
  category?: string;
  ddcCode?: string;
}

export async function lookupIsbnMetadata(isbn: string): Promise<IsbnMetadata | null> {
  const cleanIsbn = isbn.replace(/[-\s]/g, "").trim();
  if (!cleanIsbn) return null;

  try {
    // 1. Try Open Library Books API
    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
    const res = await fetch(olUrl, {
      headers: { "User-Agent": "SLMTS-SmartLibrary/1.0" },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const bookData = data[`ISBN:${cleanIsbn}`];

      if (bookData) {
        const authors = Array.isArray(bookData.authors)
          ? bookData.authors.map((a: { name: string }) => a.name).join(", ")
          : "";

        const publisher = Array.isArray(bookData.publishers) && bookData.publishers.length > 0
          ? bookData.publishers[0].name
          : undefined;

        let pubYear: number | undefined;
        if (bookData.publish_date) {
          const match = bookData.publish_date.match(/\b(19\d\d|20\d\d)\b/);
          if (match) pubYear = parseInt(match[1], 10);
        }

        const coverImageUrl =
          bookData.cover?.medium ||
          bookData.cover?.large ||
          `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`;

        const subjects = Array.isArray(bookData.subjects) && bookData.subjects.length > 0
          ? bookData.subjects.slice(0, 3).map((s: { name: string }) => s.name).join(", ")
          : undefined;

        return {
          isbn: cleanIsbn,
          title: bookData.title || "",
          subtitle: bookData.subtitle,
          authors: authors || "Unknown Author",
          publisher,
          publicationYear: pubYear,
          coverImageUrl,
          category: subjects,
          ddcCode: bookData.classifications?.dewey_decimal_class?.[0],
        };
      }
    }
  } catch (err) {
    console.warn("Failed fetching from OpenLibrary, proceeding without metadata prefill:", err);
  }

  return null;
}
