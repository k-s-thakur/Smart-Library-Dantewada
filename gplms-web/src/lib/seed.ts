import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function seedGplmsDatabase() {
  console.log("Seeding GPLMS Government Public Library database...");

  // 1. Clear existing records cleanly
  await prisma.auditLog.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.paymentReversal.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.receiptSequence.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeCharge.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.bookAuthor.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.category.deleteMany();
  await prisma.libraryPolicy.deleteMany();
  await prisma.member.deleteMany();
  await prisma.staffUser.deleteMany();

  // 2. Create Staff Users
  const defaultPasswordHash = await bcrypt.hash("Admin@123", 10);

  const superAdmin = await prisma.staffUser.create({
    data: {
      email: "superadmin@gplms.gov.in",
      passwordHash: defaultPasswordHash,
      name: "Dr. K. S. Thakur",
      role: "SUPER_ADMIN",
      phone: "+91-9811002233",
    },
  });

  const libraryAdmin = await prisma.staffUser.create({
    data: {
      email: "head.librarian@gplms.gov.in",
      passwordHash: defaultPasswordHash,
      name: "Smt. Sunita Mukherjee",
      role: "LIBRARY_ADMIN",
      phone: "+91-9811002234",
    },
  });

  const librarian = await prisma.staffUser.create({
    data: {
      email: "librarian@gplms.gov.in",
      passwordHash: defaultPasswordHash,
      name: "Devendra Patel",
      role: "LIBRARIAN",
      phone: "+91-9811002235",
    },
  });

  const accountsOperator = await prisma.staffUser.create({
    data: {
      email: "accounts@gplms.gov.in",
      passwordHash: defaultPasswordHash,
      name: "Manoj Agarwal",
      role: "ACCOUNTS_OPERATOR",
      phone: "+91-9811002236",
    },
  });

  const approvingOfficer = await prisma.staffUser.create({
    data: {
      email: "approver@gplms.gov.in",
      passwordHash: defaultPasswordHash,
      name: "Rajeshwar Rao",
      role: "APPROVING_OFFICER",
      phone: "+91-9811002237",
    },
  });

  // 3. Create Library Policies
  await prisma.libraryPolicy.createMany({
    data: [
      {
        category: "GENERAL_CITIZEN",
        loanDurationDays: 14,
        maxBooks: 3,
        gracePeriodDays: 2,
        fineRatePerDay: 2.0,
        maxFine: 150.0,
        allowRenewal: true,
        renewalLimit: 2,
      },
      {
        category: "STUDENT",
        loanDurationDays: 21,
        maxBooks: 4,
        gracePeriodDays: 3,
        fineRatePerDay: 1.0,
        maxFine: 100.0,
        allowRenewal: true,
        renewalLimit: 3,
      },
      {
        category: "SENIOR_CITIZEN",
        loanDurationDays: 28,
        maxBooks: 5,
        gracePeriodDays: 5,
        fineRatePerDay: 1.0,
        maxFine: 50.0,
        allowRenewal: true,
        renewalLimit: 3,
      },
      {
        category: "RESEARCHER",
        loanDurationDays: 30,
        maxBooks: 8,
        gracePeriodDays: 3,
        fineRatePerDay: 2.0,
        maxFine: 200.0,
        allowRenewal: true,
        renewalLimit: 4,
      },
    ],
  });

  // 4. Create Categories
  const catCS = await prisma.category.create({
    data: { name: "Computer Science & IT", code: "CS_IT", ddcPrefix: "005" },
  });
  const catLit = await prisma.category.create({
    data: { name: "Indian & World Literature", code: "LITERATURE", ddcPrefix: "891" },
  });
  const catHist = await prisma.category.create({
    data: { name: "History & Heritage", code: "HISTORY", ddcPrefix: "954" },
  });
  const catLaw = await prisma.category.create({
    data: { name: "Constitution & Governance", code: "LAW_GOV", ddcPrefix: "342" },
  });
  const catSci = await prisma.category.create({
    data: { name: "Natural Science & Physics", code: "SCIENCES", ddcPrefix: "530" },
  });

  // 5. Create Publishers
  const pubOxford = await prisma.publisher.create({
    data: { name: "Oxford University Press", address: "YMCA Library Building, Jai Singh Road, New Delhi" },
  });
  const pubGov = await prisma.publisher.create({
    data: { name: "Publications Division, Govt of India", address: "Soochna Bhawan, CGO Complex, New Delhi" },
  });
  const pubPearson = await prisma.publisher.create({
    data: { name: "Pearson Education India", address: "Sector 62, Noida" },
  });
  const pubSahitya = await prisma.publisher.create({
    data: { name: "Sahitya Akademi", address: "Rabindra Bhavan, 35 Ferozeshah Road, New Delhi" },
  });

  // 6. Create Authors
  const autAPJ = await prisma.author.create({ data: { name: "Dr. A. P. J. Abdul Kalam" } });
  const autPremchand = await prisma.author.create({ data: { name: "Munshi Premchand" } });
  const autAmbedkar = await prisma.author.create({ data: { name: "Dr. B. R. Ambedkar" } });
  const autTanenbaum = await prisma.author.create({ data: { name: "Andrew S. Tanenbaum" } });
  const autRitchie = await prisma.author.create({ data: { name: "Dennis M. Ritchie" } });
  const autKernighan = await prisma.author.create({ data: { name: "Brian W. Kernighan" } });

  // 7. Create Books with Accession Numbers and Physical Copies
  const book1 = await prisma.book.create({
    data: {
      isbn: "9788173711466",
      title: "Wings of Fire: An Autobiography",
      subtitle: "An inspiring journey of the Missile Man of India",
      edition: "1st Anniversary Edition",
      publicationYear: 1999,
      language: "English / Hindi Translation Available",
      ddcCode: "920.054",
      bookNumber: "KAL-WOF",
      description: "An extraordinary autobiographical narrative tracing Dr. Kalam's early life, career at ISRO, and leadership in Indian missile technology.",
      publisherId: pubGov.id,
      categoryId: catHist.id,
      coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
      copies: {
        create: [
          {
            accessionNo: "ACC-2026-0001",
            copyNumber: 1,
            qrCodeToken: "QR-GPLMS-ACC-2026-0001",
            shelfLocation: "Aisle 1, Rack B, Shelf 2",
            acquisitionCost: 295.0,
            status: "AVAILABLE",
          },
          {
            accessionNo: "ACC-2026-0002",
            copyNumber: 2,
            qrCodeToken: "QR-GPLMS-ACC-2026-0002",
            shelfLocation: "Aisle 1, Rack B, Shelf 2",
            acquisitionCost: 295.0,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });
  await prisma.bookAuthor.create({ data: { bookId: book1.id, authorId: autAPJ.id } });

  const book2 = await prisma.book.create({
    data: {
      isbn: "9788171673407",
      title: "Godaan (गोदान)",
      subtitle: "The Gift of a Cow - Masterpiece of Hindi Literature",
      edition: "Standard Sahitya Edition",
      publicationYear: 1936,
      language: "Hindi",
      ddcCode: "891.433",
      bookNumber: "PRE-GOD",
      description: "Premchand's seminal classic depicting the socio-economic reality, resilience, and tribulations of rural Indian farmers.",
      publisherId: pubSahitya.id,
      categoryId: catLit.id,
      coverImageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600",
      copies: {
        create: [
          {
            accessionNo: "ACC-2026-0003",
            copyNumber: 1,
            qrCodeToken: "QR-GPLMS-ACC-2026-0003",
            shelfLocation: "Aisle 3, Rack A, Shelf 1",
            acquisitionCost: 180.0,
            status: "AVAILABLE",
          },
          {
            accessionNo: "ACC-2026-0004",
            copyNumber: 2,
            qrCodeToken: "QR-GPLMS-ACC-2026-0004",
            shelfLocation: "Aisle 3, Rack A, Shelf 1",
            acquisitionCost: 180.0,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });
  await prisma.bookAuthor.create({ data: { bookId: book2.id, authorId: autPremchand.id } });

  const book3 = await prisma.book.create({
    data: {
      isbn: "9780131103627",
      title: "The C Programming Language",
      subtitle: "ANSI C Version - The Definitive Guide",
      edition: "2nd Edition",
      publicationYear: 1988,
      language: "English",
      ddcCode: "005.133",
      bookNumber: "KER-CPR",
      description: "Known affectionately as K&R, this book is the foundational reference and tutorial for the C programming language.",
      publisherId: pubPearson.id,
      categoryId: catCS.id,
      coverImageUrl: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600",
      copies: {
        create: [
          {
            accessionNo: "ACC-2026-0005",
            copyNumber: 1,
            qrCodeToken: "QR-GPLMS-ACC-2026-0005",
            shelfLocation: "Aisle 4, Rack D, Shelf 3",
            acquisitionCost: 450.0,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });
  await prisma.bookAuthor.create({ data: { bookId: book3.id, authorId: autKernighan.id } });
  await prisma.bookAuthor.create({ data: { bookId: book3.id, authorId: autRitchie.id } });

  const book4 = await prisma.book.create({
    data: {
      isbn: "9780132126953",
      title: "Computer Networks",
      subtitle: "A Systems Approach to Modern Networking",
      edition: "5th International Edition",
      publicationYear: 2011,
      language: "English",
      ddcCode: "004.6",
      bookNumber: "TAN-NET",
      description: "Comprehensive guide to communication protocols, Ethernet, TCP/IP architecture, wireless networks, and network security.",
      publisherId: pubPearson.id,
      categoryId: catCS.id,
      coverImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600",
      copies: {
        create: [
          {
            accessionNo: "ACC-2026-0006",
            copyNumber: 1,
            qrCodeToken: "QR-GPLMS-ACC-2026-0006",
            shelfLocation: "Aisle 4, Rack D, Shelf 4",
            acquisitionCost: 650.0,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });
  await prisma.bookAuthor.create({ data: { bookId: book4.id, authorId: autTanenbaum.id } });

  const book5 = await prisma.book.create({
    data: {
      isbn: "9788185952994",
      title: "The Constitution of India (भारत का संविधान)",
      subtitle: "Authoritative Bare Act with Amendments & Landmark Case Summaries",
      edition: "Government Law Edition 2024",
      publicationYear: 2024,
      language: "Bilingual (Hindi / English)",
      ddcCode: "342.54",
      bookNumber: "AMB-CON",
      description: "The supreme law of India, framing political principles, procedures, rights, directive principles, and duties of citizens.",
      publisherId: pubGov.id,
      categoryId: catLaw.id,
      coverImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600",
      copies: {
        create: [
          {
            accessionNo: "ACC-2026-0007",
            copyNumber: 1,
            qrCodeToken: "QR-GPLMS-ACC-2026-0007",
            shelfLocation: "Reference Desk (Ref-01)",
            acquisitionCost: 500.0,
            status: "REFERENCE_ONLY",
          },
          {
            accessionNo: "ACC-2026-0008",
            copyNumber: 2,
            qrCodeToken: "QR-GPLMS-ACC-2026-0008",
            shelfLocation: "Aisle 2, Rack A, Shelf 1",
            acquisitionCost: 500.0,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });
  await prisma.bookAuthor.create({ data: { bookId: book5.id, authorId: autAmbedkar.id } });

  // 8. Create Registered Citizens / Members
  const expiryNextYear = new Date();
  expiryNextYear.setFullYear(expiryNextYear.getFullYear() + 1);

  const member1 = await prisma.member.create({
    data: {
      memberNo: "GPL-2026-0001",
      fullName: "Rahul Verma",
      email: "rahul.verma@example.com",
      phone: "+91-9876543210",
      address: "House 42, Civil Lines, Near City Centre",
      category: "GENERAL_CITIZEN",
      status: "ACTIVE",
      expiryDate: expiryNextYear,
      maxBooks: 3,
    },
  });

  const member2 = await prisma.member.create({
    data: {
      memberNo: "GPL-2026-0002",
      fullName: "Priya Sharma",
      email: "priya.sharma@example.edu",
      phone: "+91-9876543211",
      address: "Girls Hostel 3, University Campus",
      category: "STUDENT",
      status: "ACTIVE",
      expiryDate: expiryNextYear,
      maxBooks: 4,
    },
  });

  const member3 = await prisma.member.create({
    data: {
      memberNo: "GPL-2026-0003",
      fullName: "Dr. Vikramaditya Sen",
      email: "vikram.sen@example.org",
      phone: "+91-9876543212",
      address: "B-12 Officers Enclave, Sector 4",
      category: "SENIOR_CITIZEN",
      status: "ACTIVE",
      expiryDate: expiryNextYear,
      maxBooks: 5,
    },
  });

  // 9. Create Active Loan for Rahul Verma on Copy ACC-2026-0001
  const copy1 = await prisma.bookCopy.findUnique({ where: { accessionNo: "ACC-2026-0001" } });
  if (copy1) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await prisma.loan.create({
      data: {
        copyId: copy1.id,
        memberId: member1.id,
        dueDate,
        status: "ACTIVE",
        issuedBy: librarian.name,
      },
    });

    await prisma.bookCopy.update({
      where: { id: copy1.id },
      data: { status: "ISSUED" },
    });
  }

  // 10. Create Fee Charges and Sample Paid Receipt for Priya Sharma
  const feeCharge1 = await prisma.feeCharge.create({
    data: {
      memberId: member2.id,
      chargeType: "MEMBERSHIP_FEE",
      description: "Student Annual Membership Fee",
      amount: 50.0,
      paidAmount: 50.0,
      balance: 0.0,
      status: "PAID",
    },
  });

  const payment1 = await prisma.payment.create({
    data: {
      memberId: member2.id,
      amount: 50.0,
      paymentMethod: "CASH",
      operatorId: accountsOperator.id,
      idempotencyKey: "SEED-PAY-001",
      status: "POSTED",
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: payment1.id,
      chargeId: feeCharge1.id,
      amount: 50.0,
    },
  });

  await prisma.receiptSequence.create({
    data: {
      prefix: `RCP-202610`,
      lastNumber: 1,
    },
  });

  await prisma.receipt.create({
    data: {
      receiptNo: "RCP-202610-00001",
      paymentId: payment1.id,
      memberId: member2.id,
      operatorId: accountsOperator.name,
      totalAmount: 50.0,
      status: "ISSUED",
    },
  });

  // Create an outstanding overdue fine charge for Rahul Verma
  await prisma.feeCharge.create({
    data: {
      memberId: member1.id,
      chargeType: "LATE_FINE",
      description: "Overdue Return Fine for Book ACC-2026-0003 (3 days late)",
      amount: 6.0,
      paidAmount: 0.0,
      balance: 6.0,
      status: "OUTSTANDING",
    },
  });

  console.log("GPLMS Seed completed successfully!");
}

seedGplmsDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
