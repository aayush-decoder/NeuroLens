import { POST } from "@/app/api/upload/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";

// Mock next-auth
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => "mock-next-auth-handler"),
  getServerSession: jest.fn(),
}));

// We allow actual S3 upload or just testing the response.
// The real POST handler is used. Since env variables have AWS keys,
// it will really hit S3 unless blocked.

describe("Integration: /api/upload Route", () => {
  let testUser: any;

  beforeAll(async () => {
    // Create a real test user in Prisma
    testUser = await prisma.user.create({
      data: {
        username: "upload_tester_" + Date.now(),
        email: "upload_tester_" + Date.now() + "@test.com",
        password: "password123",
      },
    });
  });

  afterAll(async () => {
    // Clean up created entities
    if (testUser) {
      await prisma.userFile.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should upload a file and store its URL in database", async () => {
    // Mock session so API thinks user is authenticated
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, name: testUser.username },
    });

    const formData = new FormData();
    const filePath = path.join(process.cwd(), "public", "sample_pdf.pdf");

    // Check if sample file exists, if not just create a dummy buffer acting as pdf
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(filePath);
    } catch {
      fileBuffer = Buffer.from("dummy pdf content", "utf-8");
    }

    // Node 20+ has native File constructor
    const file = new File([new Uint8Array(fileBuffer)], "sample_pdf.pdf", {
      type: "application/pdf",
    });

    formData.append("file", file);
    formData.append("path", "test-uploads");

    // Construct the standard request object that the Next route expects
    const request = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    // Invoke the Route Handler directly
    const response = await POST(request);
    
    // Validate HTTP Success
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.url).toBeDefined();

    // Verify it was correctly stored in Prisma DB
    const userFile = await prisma.userFile.findFirst({
      where: { userId: testUser.id },
    });

    expect(userFile).not.toBeNull();
    expect(userFile?.url).toBe(json.url);
    expect(userFile?.path).toBe("test-uploads");
    
  }, 20000); // 20s timeout to allow AWS S3 upload
});
