module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],
  moduleNameMapper: {
    "\\.css$": "identity-obj-proxy",
    "\\.(png|jpe?g|gif|svg)$": "<rootDir>/src/tests/fileMock.js",
  },
  testMatch: ["<rootDir>/src/tests/**/*.test.{js,jsx}"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/tests/**", "!src/main.jsx"],
  coverageThreshold: {
    global: { statements: 100, branches: 100, functions: 100, lines: 100 },
  },
};
