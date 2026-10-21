import { prisma } from "../prisma";

export interface SearchCatalogParams {
  query?: string;
  categoryCode?: string;
  ddcPrefix?: string;
  language?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}

export async function searchCatalogue(params: SearchCatalogParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 12));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.query && params.query.trim().length > 0) {
    const q = params.query.trim();
    where.OR = [
      { title: { contains: q } },
      { subtitle: { contains: q } },
      { isbn: { contains: q } },
      { ddcCode: { contains: q } },
      { description: { contains: q } },
      { authors: { some: { author: { name: { contains: q } } } } },
      { publisher: { name: { contains: q } } },
      { category: { name: { contains: q } } },
    ];
  }

  if (params.categoryCode) {
    where.category = { code: params.categoryCode };
  }

  if (params.ddcPrefix) {
    where.ddcCode = { startsWith: params.ddcPrefix };
  }

  if (params.language) {
    where.language = { contains: params.language };
  }

  if (params.availableOnly) {
    where.copies = {
      some: {
        status: "AVAILABLE",
      },
    };
  }

  const [totalCount, books] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      include: {
        authors: { include: { author: true } },
        publisher: true,
        category: true,
        copies: {
          select: {
            id: true,
            accessionNo: true,
            status: true,
            shelfLocation: true,
            copyNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items = books.map((b) => {
    const totalCopies = b.copies.length;
    const availableCopies = b.copies.filter((c) => c.status === "AVAILABLE").length;
    const issuedCopies = b.copies.filter((c) => c.status === "ISSUED").length;
    const referenceOnlyCopies = b.copies.filter((c) => c.status === "REFERENCE_ONLY").length;

    return {
      id: b.id,
      isbn: b.isbn,
      title: b.title,
      subtitle: b.subtitle,
      edition: b.edition,
      publicationYear: b.publicationYear,
      language: b.language,
      ddcCode: b.ddcCode,
      bookNumber: b.bookNumber,
      description: b.description,
      coverImageUrl: b.coverImageUrl,
      publisher: b.publisher?.name || "Government Press / Standard Pub",
      category: b.category?.name || "General",
      authors: b.authors.map((a) => a.author.name).join(", "),
      totalCopies,
      availableCopies,
      issuedCopies,
      referenceOnlyCopies,
      primaryLocation: b.copies[0]?.shelfLocation || "General Stack",
      copies: b.copies,
    };
  });

  return {
    items,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

export async function getBookDetails(idOrIsbn: string) {
  const book = await prisma.book.findFirst({
    where: {
      OR: [{ id: idOrIsbn }, { isbn: idOrIsbn }],
    },
    include: {
      authors: { include: { author: true } },
      publisher: true,
      category: true,
      copies: {
        orderBy: { copyNumber: "asc" },
      },
      reservations: {
        where: { status: "PENDING" },
        include: {
          member: {
            select: { id: true, memberNo: true, fullName: true },
          },
        },
        orderBy: { queuePosition: "asc" },
      },
    },
  });

  if (!book) {
    throw new Error(`Book with ID or ISBN "${idOrIsbn}" not found`);
  }

  const availableCopies = book.copies.filter((c) => c.status === "AVAILABLE").length;

  return {
    ...book,
    authorsList: book.authors.map((a) => a.author.name),
    availableCopies,
    totalCopies: book.copies.length,
  };
}

export interface CreateBookInput {
  isbn: string;
  title: string;
  subtitle?: string;
  edition?: string;
  publicationYear?: number;
  language?: string;
  ddcCode?: string;
  bookNumber?: string;
  description?: string;
  authorNames: string[];
  publisherName?: string;
  categoryName?: string;
  categoryCode?: string;
  initialCopiesCount?: number;
  shelfLocation?: string;
  acquisitionCost?: number;
  actorId: string;
}

export async function createBookWithCopies(input: CreateBookInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Check duplicate ISBN
    const existing = await tx.book.findUnique({ where: { isbn: input.isbn } });
    if (existing) {
      throw new Error(`Book with ISBN "${input.isbn}" already exists in the catalogue.`);
    }

    // 2. Handle publisher
    let publisherId: string | null = null;
    if (input.publisherName) {
      const pub = await tx.publisher.upsert({
        where: { name: input.publisherName },
        create: { name: input.publisherName },
        update: {},
      });
      publisherId = pub.id;
    }

    // 3. Handle category
    let categoryId: string | null = null;
    if (input.categoryName) {
      const code = input.categoryCode || input.categoryName.toUpperCase().replace(/\s+/g, "_");
      const cat = await tx.category.upsert({
        where: { code },
        create: { name: input.categoryName, code, ddcPrefix: input.ddcCode?.split(".")[0] || null },
        update: {},
      });
      categoryId = cat.id;
    }

    // 4. Create book
    const book = await tx.book.create({
      data: {
        isbn: input.isbn,
        title: input.title,
        subtitle: input.subtitle || null,
        edition: input.edition || null,
        publicationYear: input.publicationYear || new Date().getFullYear(),
        language: input.language || "Hindi/English",
        ddcCode: input.ddcCode || null,
        bookNumber: input.bookNumber || null,
        description: input.description || null,
        publisherId,
        categoryId,
      },
    });

    // 5. Connect Authors
    for (const authorName of input.authorNames) {
      const author = await tx.author.upsert({
        where: { name: authorName.trim() },
        create: { name: authorName.trim() },
        update: {},
      });
      await tx.bookAuthor.create({
        data: {
          bookId: book.id,
          authorId: author.id,
        },
      });
    }

    // 6. Create initial physical copies with sequential accession numbers & QR tokens
    const copiesCount = Math.max(1, input.initialCopiesCount || 1);
    const copiesCreated = [];

    for (let i = 1; i <= copiesCount; i++) {
      const accessionNo = `ACC-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}-${i}`;
      const qrCodeToken = `QR-GPLMS-${accessionNo}`;

      const copy = await tx.bookCopy.create({
        data: {
          bookId: book.id,
          accessionNo,
          copyNumber: i,
          qrCodeToken,
          shelfLocation: input.shelfLocation || "General Stack A",
          acquisitionCost: input.acquisitionCost || 250.0,
          condition: "NEW",
          status: "AVAILABLE",
        },
      });
      copiesCreated.push(copy);
    }

    // 7. Audit Log
    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "BOOK_CREATED",
        entityType: "Book",
        entityId: book.id,
        metadataJson: JSON.stringify({
          isbn: book.isbn,
          title: book.title,
          copiesCount,
        }),
      },
    });

    return {
      book,
      copies: copiesCreated,
    };
  });
}
