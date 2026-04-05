import { SignJWT } from "jose";

async function test() {
  const secret = new TextEncoder().encode("change-me");
  
  try {
    const payload = { sub: "123", email: "test@test.com", username: null };
    // This will error TS but let's test it
    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);
    console.log(token);
  } catch(e) {
    console.error(e);
  }
}

test();
