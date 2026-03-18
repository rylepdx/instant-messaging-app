module.exports = {
  testEnvironment: "jsdom",
  setupFiles: ["./src/jest.setup.js"],
  testMatch: ["**/__tests__/**/*.test.jsx", "**/__tests__/**/*.test.js"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/__mocks__/fileMock.cjs",
  },
};
