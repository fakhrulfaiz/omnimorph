import { describe, expect, it } from "vitest";
import { convertData, jsonToXml, minifyJson, parseCsv, prettyJson, toCsv, xmlToJson } from "./json";

const people = [
  { name: "Ada", year: 1815 },
  { name: "Alan, Turing", year: 1912 },
];

describe("JSON ↔ CSV", () => {
  it("converts an object array to CSV and back", () => {
    const csv = toCsv(people);
    expect(csv).toContain("name,year");
    expect(csv).toContain('"Alan, Turing"');
    const roundTrip = parseCsv(csv);
    expect(roundTrip).toEqual([
      { name: "Ada", year: "1815" },
      { name: "Alan, Turing", year: "1912" },
    ]);
  });

  it("wraps primitive JSON values as a value column", () => {
    expect(toCsv(["a", "b"])).toBe("value\na\nb\n");
  });
});

describe("JSON pretty / minify", () => {
  it("pretty-prints and minifies the same value", () => {
    const value = { ok: true, n: 1 };
    expect(prettyJson(value)).toBe("{\n  \"ok\": true,\n  \"n\": 1\n}\n");
    expect(minifyJson(value)).toBe('{"ok":true,"n":1}');
  });
});

describe("JSON ↔ XML", () => {
  it("round-trips a simple object", () => {
    const xml = jsonToXml({ city: "Paris", ok: true });
    expect(xml).toContain("<city>Paris</city>");
    expect(xmlToJson(xml)).toEqual({ city: "Paris", ok: true });
  });

  it("round-trips an array as item nodes", () => {
    const xml = jsonToXml(["x", "y"]);
    expect(xmlToJson(xml)).toEqual(["x", "y"]);
  });
});

describe("convertData", () => {
  it("pretty-prints JSON through the handler", async () => {
    const file = new File(['{"a":1}'], "n.json", { type: "application/json" });
    const blob = await convertData(file, "json", "json-pretty");
    expect(await blob.text()).toBe("{\n  \"a\": 1\n}\n");
  });

  it("converts JSON to CSV through the handler", async () => {
    const file = new File([JSON.stringify(people)], "n.json", {
      type: "application/json",
    });
    const blob = await convertData(file, "json", "csv");
    expect(await blob.text()).toMatch(/^name,year\nAda,1815\n/);
  });
});
