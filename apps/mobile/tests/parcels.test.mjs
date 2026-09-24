import { test } from "node:test";
import { Buffer } from "node:buffer";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(
  readFileSync(new URL("../shared/lib/parcels.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const { mapParcel, aggregateState } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
test("contrato real sin telemetria conserva datos ausentes", () => {
  const parcel = mapParcel({
    id: "p",
    ownerId: "owner",
    name: "Norte",
    crop: "Vid",
    location: "MX",
    zones: [{ id: "z", parcelId: "p", name: "A1", humidityThreshold: 45 }],
  });
  assert.equal(parcel.zoneCount, 1);
  assert.equal(parcel.zones[0].latestHumidity, null);
  assert.equal(parcel.zones[0].pestState, "UNKNOWN");
  assert.equal(aggregateState(parcel.zones), "UNKNOWN");
  assert.equal(aggregateState([]), "UNKNOWN");
});
test("agregado respeta intervencion, monitoreo y datos incompletos", () => {
  assert.equal(
    aggregateState([{ pestState: "NORMAL" }, { pestState: "MONITOREO" }]),
    "MONITOREO",
  );
  assert.equal(
    aggregateState([{ pestState: "MONITOREO" }, { pestState: "INTERVENCION" }]),
    "INTERVENCION",
  );
  assert.equal(
    aggregateState([{ pestState: "NORMAL" }, { pestState: "UNKNOWN" }]),
    "UNKNOWN",
  );
});
