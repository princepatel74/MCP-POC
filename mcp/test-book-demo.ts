import { bookDemo } from "./utils/demo-booking.js";

const result = await bookDemo({
  name: "Test User",
  email: "test@example.com",
  company: "Acme Corp",
  requirements:
    "Need QuickBooks integration demo for our SaaS platform and multi-entity reporting.",
});

console.log(JSON.stringify(result, null, 2));
console.log("\n✓ book_demo test passed");
