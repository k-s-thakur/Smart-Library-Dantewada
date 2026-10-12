import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing tables (in proper order)
  await prisma.auditLog.deleteMany();
  await prisma.deviceEvent.deleteMany();
  await prisma.gateEvent.deleteMany();
  await prisma.gateSession.deleteMany();
  await prisma.fineTransaction.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.patronCard.deleteMany();
  await prisma.user.deleteMany();
  await prisma.patron.deleteMany();
  await prisma.borrowingPolicy.deleteMany();
  await prisma.device.deleteMany();

  console.log("Cleared old data.");

  // 1. Borrowing Policies
  const policies = await Promise.all([
    prisma.borrowingPolicy.create({
      data: {
        patronType: "UNDERGRADUATE",
        maxBooks: 4,
        loanDurationDays: 14,
        gracePeriodDays: 2,
        fineRatePerDay: 2.0,
        maxFine: 200.0,
      },
    }),
    prisma.borrowingPolicy.create({
      data: {
        patronType: "POSTGRADUATE",
        maxBooks: 8,
        loanDurationDays: 30,
        gracePeriodDays: 3,
        fineRatePerDay: 3.0,
        maxFine: 300.0,
      },
    }),
    prisma.borrowingPolicy.create({
      data: {
        patronType: "FACULTY",
        maxBooks: 15,
        loanDurationDays: 90,
        gracePeriodDays: 7,
        fineRatePerDay: 0.0,
        maxFine: 0.0,
      },
    }),
    prisma.borrowingPolicy.create({
      data: {
        patronType: "STAFF",
        maxBooks: 5,
        loanDurationDays: 30,
        gracePeriodDays: 5,
        fineRatePerDay: 1.0,
        maxFine: 100.0,
      },
    }),
  ]);

  console.log(`Created ${policies.length} borrowing policies.`);

  // 2. Patrons
  const aarav = await prisma.patron.create({
    data: {
      institutionalId: "CS-2023-042",
      fullName: "Aarav Sharma",
      email: "aarav.sharma@library.edu",
      phone: "+91 9876543210",
      department: "Computer Science & Engineering",
      program: "B.Tech",
      batch: "2023-2027",
      patronType: "UNDERGRADUATE",
      status: "ACTIVE",
      cards: {
        create: {
          cardUid: "CARD_AARAV_01",
          status: "ACTIVE",
        },
      },
    },
  });

  const priya = await prisma.patron.create({
    data: {
      institutionalId: "CS-2023-088",
      fullName: "Priya Patel",
      email: "priya.patel@library.edu",
      phone: "+91 9876543211",
      department: "Computer Science & Engineering",
      program: "B.Tech",
      batch: "2023-2027",
      patronType: "UNDERGRADUATE",
      status: "ACTIVE",
      cards: {
        create: {
          cardUid: "CARD_PRIYA_02",
          status: "ACTIVE",
        },
      },
    },
  });

  const vikram = await prisma.patron.create({
    data: {
      institutionalId: "FAC-CS-012",
      fullName: "Dr. Vikram Sen",
      email: "vikram.sen@library.edu",
      phone: "+91 9876543212",
      department: "Computer Science & Engineering",
      program: "Faculty",
      batch: "Staff",
      patronType: "FACULTY",
      status: "ACTIVE",
      cards: {
        create: {
          cardUid: "CARD_VIKRAM_03",
          status: "ACTIVE",
        },
      },
    },
  });

  const ananya = await prisma.patron.create({
    data: {
      institutionalId: "PG-AI-2024-05",
      fullName: "Ananya Gupta",
      email: "ananya.gupta@library.edu",
      phone: "+91 9876543213",
      department: "Artificial Intelligence",
      program: "M.Tech",
      batch: "2024-2026",
      patronType: "POSTGRADUATE",
      status: "ACTIVE",
      cards: {
        create: {
          cardUid: "CARD_ANANYA_04",
          status: "ACTIVE",
        },
      },
    },
  });

  const rohan = await prisma.patron.create({
    data: {
      institutionalId: "MECH-2022-119",
      fullName: "Rohan Verma",
      email: "rohan.verma@library.edu",
      phone: "+91 9876543214",
      department: "Mechanical Engineering",
      program: "B.Tech",
      batch: "2022-2026",
      patronType: "UNDERGRADUATE",
      status: "SUSPENDED", // Suspended patron for testing validation
      cards: {
        create: {
          cardUid: "CARD_ROHAN_05",
          status: "ACTIVE",
        },
      },
    },
  });

  console.log("Created sample patrons with cards.");

  // 3. User Accounts
  const hashedPassword = await bcrypt.hash("password123", 10);
  const adminHashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      email: "admin@library.edu",
      passwordHash: adminHashedPassword,
      name: "Library System Administrator",
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      email: "librarian@library.edu",
      passwordHash: hashedPassword,
      name: "Senior Chief Librarian",
      role: "LIBRARIAN",
    },
  });

  await prisma.user.create({
    data: {
      email: "aarav.sharma@library.edu",
      passwordHash: hashedPassword,
      name: "Aarav Sharma",
      role: "STUDENT",
      patronId: aarav.id,
    },
  });

  console.log("Created user accounts for Admin, Librarian, and Student.");

  // 4. Hardware Devices
  await prisma.device.createMany({
    data: [
      {
        deviceId: "DESK_PAD_01",
        name: "Circulation Desk RFID Pad #1",
        deviceType: "DESK_READER",
        status: "ONLINE",
        lastSeenAt: new Date(),
      },
      {
        deviceId: "GATE_ENTRY_01",
        name: "Main Entrance Gate Turnstile",
        deviceType: "GATE_ENTRY",
        status: "ONLINE",
        lastSeenAt: new Date(),
      },
      {
        deviceId: "GATE_EXIT_01",
        name: "Main Exit Gate Turnstile",
        deviceType: "GATE_EXIT",
        status: "ONLINE",
        lastSeenAt: new Date(),
      },
    ],
  });

  console.log("Registered hardware devices.");

  // 5. Books & Physical Copies
  const book1 = await prisma.book.create({
    data: {
      isbn: "9780132350884",
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      authors: "Robert C. Martin",
      publisher: "Prentice Hall",
      edition: "1st Edition",
      publicationYear: 2008,
      category: "Computer Science",
      ddcCode: "005.1",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg",
      copies: {
        create: [
          {
            copyNumber: 1,
            barcode: "BC100101",
            rfidTagUid: "E28011702000001",
            shelfLocation: "Rack A1 - Shelf 2",
            status: "AVAILABLE",
          },
          {
            copyNumber: 2,
            barcode: "BC100102",
            rfidTagUid: "E28011702000002",
            shelfLocation: "Rack A1 - Shelf 2",
            status: "AVAILABLE",
          },
          {
            copyNumber: 3,
            barcode: "BC100103",
            rfidTagUid: "E28011702000003",
            shelfLocation: "Rack A1 - Shelf 2",
            status: "AVAILABLE",
          },
        ],
      },
    },
    include: { copies: true },
  });

  const book2 = await prisma.book.create({
    data: {
      isbn: "9780262033848",
      title: "Introduction to Algorithms",
      subtitle: "Third Edition",
      authors: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
      publisher: "MIT Press",
      edition: "3rd Edition",
      publicationYear: 2009,
      category: "Algorithms",
      ddcCode: "005.13",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg",
      copies: {
        create: [
          {
            copyNumber: 1,
            barcode: "BC100201",
            rfidTagUid: "E28011702000004",
            shelfLocation: "Rack A2 - Shelf 1",
            status: "ISSUED", // Borrowed by Aarav
          },
          {
            copyNumber: 2,
            barcode: "BC100202",
            rfidTagUid: "E28011702000005",
            shelfLocation: "Rack A2 - Shelf 1",
            status: "AVAILABLE",
          },
        ],
      },
    },
    include: { copies: true },
  });

  const book3 = await prisma.book.create({
    data: {
      isbn: "9780201633610",
      title: "Design Patterns: Elements of Reusable Object-Oriented Software",
      authors: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
      publisher: "Addison-Wesley",
      edition: "1st Edition",
      publicationYear: 1994,
      category: "Software Engineering",
      ddcCode: "005.12",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780201633610-M.jpg",
      copies: {
        create: [
          {
            copyNumber: 1,
            barcode: "BC100301",
            rfidTagUid: "E28011702000006",
            shelfLocation: "Rack B1 - Shelf 3",
            status: "OVERDUE", // Overdue by Priya
          },
          {
            copyNumber: 2,
            barcode: "BC100302",
            rfidTagUid: "E28011702000007",
            shelfLocation: "Rack B1 - Shelf 3",
            status: "AVAILABLE",
          },
        ],
      },
    },
    include: { copies: true },
  });

  const book4 = await prisma.book.create({
    data: {
      isbn: "9781449373320",
      title: "Designing Data-Intensive Applications",
      subtitle: "The Big Ideas Behind Reliable, Scalable, and Maintainable Systems",
      authors: "Martin Kleppmann",
      publisher: "O'Reilly Media",
      edition: "1st Edition",
      publicationYear: 2017,
      category: "Distributed Systems",
      ddcCode: "005.74",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9781449373320-M.jpg",
      copies: {
        create: [
          {
            copyNumber: 1,
            barcode: "BC100401",
            rfidTagUid: "E28011702000008",
            shelfLocation: "Rack B2 - Shelf 1",
            status: "AVAILABLE",
          },
        ],
      },
    },
    include: { copies: true },
  });

  const book5 = await prisma.book.create({
    data: {
      isbn: "9780133594140",
      title: "Computer Networking: A Top-Down Approach",
      authors: "James F. Kurose, Keith W. Ross",
      publisher: "Pearson",
      edition: "7th Edition",
      publicationYear: 2016,
      category: "Networking",
      ddcCode: "004.6",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780133594140-M.jpg",
      copies: {
        create: [
          {
            copyNumber: 1,
            barcode: "BC100501",
            rfidTagUid: "E28011702000009",
            shelfLocation: "Rack C1 - Shelf 2",
            status: "AVAILABLE",
          },
        ],
      },
    },
    include: { copies: true },
  });

  console.log("Created 5 books with individual physical copies.");

  // 6. Loans & Fines
  // Active loan for Aarav (issued 3 days ago, due in 11 days)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const elevenDaysAhead = new Date(Date.now() + 11 * 24 * 60 * 60 * 1000);

  await prisma.loan.create({
    data: {
      copyId: book2.copies[0].id,
      patronId: aarav.id,
      issuedAt: threeDaysAgo,
      dueDate: elevenDaysAhead,
      status: "ACTIVE",
    },
  });

  // Overdue loan for Priya (issued 25 days ago, due 11 days ago)
  const twentyFiveDaysAgo = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);
  const elevenDaysAgo = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000);

  const overdueLoan = await prisma.loan.create({
    data: {
      copyId: book3.copies[0].id,
      patronId: priya.id,
      issuedAt: twentyFiveDaysAgo,
      dueDate: elevenDaysAgo,
      status: "OVERDUE",
    },
  });

  // Fine for overdue loan: 11 overdue days - 2 grace days = 9 days * ₹2 = ₹18
  await prisma.fineTransaction.create({
    data: {
      loanId: overdueLoan.id,
      patronId: priya.id,
      amount: 18.0,
      status: "UNPAID",
    },
  });

  console.log("Created active & overdue loans and fine transaction.");

  // 7. Gate Attendance Sessions
  // Aarav is currently inside (entered 45 mins ago, session OPEN)
  const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000);
  const aaravSession = await prisma.gateSession.create({
    data: {
      patronId: aarav.id,
      entryTime: fortyFiveMinutesAgo,
      status: "OPEN",
    },
  });

  await prisma.gateEvent.create({
    data: {
      sessionId: aaravSession.id,
      deviceId: "GATE_ENTRY_01",
      eventType: "ENTRY",
      cardUid: "CARD_AARAV_01",
      rawTimestamp: fortyFiveMinutesAgo,
      status: "ACCEPTED",
    },
  });

  // Ananya visited earlier today (entered 3 hrs ago, left 1 hr ago, duration 120 mins)
  const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const ananyaSession = await prisma.gateSession.create({
    data: {
      patronId: ananya.id,
      entryTime: threeHoursAgo,
      exitTime: oneHourAgo,
      durationMinutes: 120,
      status: "CLOSED",
    },
  });

  await prisma.gateEvent.createMany({
    data: [
      {
        sessionId: ananyaSession.id,
        deviceId: "GATE_ENTRY_01",
        eventType: "ENTRY",
        cardUid: "CARD_ANANYA_04",
        rawTimestamp: threeHoursAgo,
        status: "ACCEPTED",
      },
      {
        sessionId: ananyaSession.id,
        deviceId: "GATE_EXIT_01",
        eventType: "EXIT",
        cardUid: "CARD_ANANYA_04",
        rawTimestamp: oneHourAgo,
        status: "ACCEPTED",
      },
    ],
  });

  console.log("Created gate entry/exit sessions.");

  // 8. Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: "system",
      action: "SYSTEM_INITIALIZED",
      entityType: "SYSTEM",
      metadataJson: JSON.stringify({ note: "Initial MVP seed data loaded successfully" }),
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
