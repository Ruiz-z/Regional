import { test } from "node:test";
import { Buffer } from "node:buffer";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(
  readFileSync(
    new URL(
      "../features/notifications/lib/notificationRoute.ts",
      import.meta.url,
    ),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const { notificationRoute } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
test("push valido abre la zona con parcela", () => {
  assert.deepEqual(
    notificationRoute({ zoneId: "zone-1", parcelId: "parcel-1" }),
    { pathname: "/zona/[id]", params: { id: "zone-1", parcelId: "parcel-1" } },
  );
});
test("rechaza enlaces externos y payload incompleto", () => {
  for (const payload of [
    { url: "https://evil.example" },
    { zoneId: "../admin", parcelId: "parcel-1" },
    { zoneId: "zone-1" },
    { zoneId: 1, parcelId: "parcel-1" },
  ])
    assert.equal(notificationRoute(payload), null);
});
