import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(
  readFileSync(
    new URL("../shared/lib/treatmentPolicy.ts", import.meta.url),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const { canTreat } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const valid = {
  role: "AGRICULTOR",
  userId: "owner",
  ownerId: "owner",
  pestState: "MONITOREO",
  lastTreatmentAt: null,
};
test("solo propietario Agricultor puede tratar", () => {
  assert.equal(canTreat(valid), true);
  assert.equal(canTreat({ ...valid, role: "ADMIN" }), false);
  assert.equal(canTreat({ ...valid, userId: "other" }), false);
});
test("Normal y estado ausente no permiten tratamiento", () => {
  for (const pestState of ["NORMAL", "UNKNOWN", undefined])
    assert.equal(canTreat({ ...valid, pestState }), false);
  assert.equal(canTreat({ ...valid, pestState: "INTERVENCION" }), true);
});
test("cooldown de 10 minutos y fechas invalidas fallan cerradas", () => {
  const now = Date.parse("2026-09-24T10:10:00Z");
  assert.equal(
    canTreat({ ...valid, lastTreatmentAt: "2026-09-24T10:00:01Z" }, now),
    false,
  );
  assert.equal(
    canTreat({ ...valid, lastTreatmentAt: "2026-09-24T10:00:00Z" }, now),
    true,
  );
  for (const lastTreatmentAt of [undefined, "invalid", "2026-09-24T11:00:00Z"])
    assert.equal(canTreat({ ...valid, lastTreatmentAt }, now), false);
});
