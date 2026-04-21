import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  host: "neurolens-efinity.c1kw8ccm4554.ap-south-1.rds.amazonaws.com",
  user: "postgres",
  password: "neurolensveryveryveryhardpassword2026",
  database: "postgres",
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // important for RDS
  },
});

async function test() {
  try {
    await client.connect();
    console.log("✅ Connected to DB!");
    await client.end();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

test();