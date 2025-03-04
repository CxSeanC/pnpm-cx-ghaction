const fs = require("fs");

describe("Dependency Validation", () => {
  test("pnpm-lock.yaml should exist", () => {
    expect(fs.existsSync("pnpm-lock.yaml")).toBe(true);
  });

  test("package-lock.json should be generated", () => {
    expect(fs.existsSync("build/cache/package-lock.json")).toBe(true);
  });

  test("package.json should match converted package-lock.json", () => {
    const packageJson = require("../package.json");
    const packageLock = require("../build/cache/package-lock.json");

    expect(packageLock.packages).toBeDefined();
    expect(packageLock.packages[""].version).toBe(packageJson.version);
  });
});