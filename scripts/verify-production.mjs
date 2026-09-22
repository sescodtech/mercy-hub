#!/usr/bin/env node
const required = ["MONGODB_URI", "AUTH_SECRET"];
const recommended = [
  "NEXT_PUBLIC_APP_URL",
  "PAYSTACK_SECRET_KEY",
  "PAYSTACK_WEBHOOK_SECRET",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
];

const missing = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Required environment variables: OK");
if (missingRecommended.length) {
  console.warn(`Recommended variables not configured: ${missingRecommended.join(", ")}`);
}
console.log("Production configuration preflight: OK");
