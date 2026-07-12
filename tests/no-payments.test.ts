/**
 * No-payments architecture (docs/NO-PAYMENTS-POSTURE.md): this application
 * never collects money. These tests FAIL if payment machinery is introduced.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe("no-payments architecture", () => {
  it("no payment-related dependency (stripe et al.) in any dependency section", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const allDeps = Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.optionalDependencies,
      ...pkg.peerDependencies,
    }).map((d) => d.toLowerCase());
    for (const forbidden of ["stripe", "braintree", "square", "paypal", "@stripe"]) {
      expect(allDeps.filter((d) => d.includes(forbidden))).toEqual([]);
    }
  });

  it("no payment/checkout/billing/webhook API route exists", () => {
    const apiDir = path.join(ROOT, "src", "app", "api");
    const offenders = walk(apiDir).filter((r) =>
      /payment|checkout|billing|stripe|invoice|subscription|charge/i.test(
        path.relative(apiDir, r)
      )
    );
    expect(offenders).toEqual([]);
  });

  it("no payment imports, checkout components, or payment tables in src/", () => {
    const files = walk(path.join(ROOT, "src")).filter((p) => /\.(ts|tsx)$/.test(p));
    const offenders: string[] = [];
    for (const p of files) {
      const c = fs.readFileSync(p, "utf8");
      if (/from ["']stripe["']|require\(["']stripe["']\)/.test(c)) offenders.push(`${p}: stripe import`);
      if (/STRIPE_[A-Z_]*KEY/.test(c)) offenders.push(`${p}: stripe key env`);
      if (/CREATE TABLE[^;]*(payment|invoice|billing)/i.test(c)) offenders.push(`${p}: payment table`);
      if (/checkout/i.test(c) && !p.includes("no-payments")) offenders.push(`${p}: checkout reference`);
    }
    expect(offenders).toEqual([]);
  });

  it("no client-facing software-fee field exists in the intake configuration", () => {
    const files = walk(path.join(ROOT, "src", "config")).filter((p) => /\.(ts|json)$/.test(p));
    const offenders: string[] = [];
    for (const p of files) {
      const c = fs.readFileSync(p, "utf8");
      // Fee-like FIELD IDS (client-entered billing/fee/software-charge data).
      if (/fieldId?\s*[:=]\s*["'][^"']*(software_fee|platform_fee|billing|payment)/i.test(c)) {
        offenders.push(p);
      }
      if (/token[_ ]?billing|surcharge|subscription[_ ]?fee/i.test(c)) offenders.push(p);
    }
    expect(offenders).toEqual([]);
  });

  it("no payment webhook handler anywhere", () => {
    const files = walk(path.join(ROOT, "src")).filter((p) => /\.(ts|tsx)$/.test(p));
    const offenders = files.filter((p) =>
      /webhook/i.test(fs.readFileSync(p, "utf8")) || /webhook/i.test(p)
    );
    expect(offenders).toEqual([]);
  });
});
