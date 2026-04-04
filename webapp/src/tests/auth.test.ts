import { getServerSession } from "next-auth";

// Mock the next-auth getServerSession function
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("Basic Authentication Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when there is no active session", async () => {
    // Simulate unauthenticated state
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const session = await getServerSession();
    expect(session).toBeNull();
  });

  it("should return user details when authenticated", async () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
      },
    };

    // Simulate authenticated state
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const session = await getServerSession();
    
    expect(session).not.toBeNull();
    expect(session?.user?.email).toBe("test@example.com");
    expect(session?.user?.name).toBe("Test User");
  });
});
