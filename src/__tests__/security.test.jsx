import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Chat from "../pages/Chat";
import Login from "../pages/Login";
import Signup from "../pages/Signup";

jest.mock("../lib/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockEmit = jest.fn();
jest.mock("../lib/socketClient", () => ({
  initializeSocket: jest.fn(),
  setMessageHandler: jest.fn(),
  getSocket: () => ({ emit: mockEmit }),
  disconnectSocket: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

import { apiClient } from "../lib/apiClient";
import { setMessageHandler } from "../lib/socketClient";

describe("Security Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get.mockImplementation((url) => {
      if (url === "/api/auth/userinfo")
        return Promise.resolve({ data: { id: "user1", firstName: "Apple", lastName: "User" } });
      if (url === "/api/contacts/get-contacts-for-list")
        return Promise.resolve({
          data: { contacts: [{ _id: "user2", firstName: "Carrot", lastName: "User", email: "carrot@test.com" }] },
        });
      if (url === "/api/channel/get-user-channels")
        return Promise.resolve({ data: { channels: [] } });
      return Promise.resolve({ data: {} });
    });
    apiClient.post.mockResolvedValue({ data: { messages: [] } });
  });

  // XSS Tests
  it("XSS: script tag in message is rendered as plain text, not executed", async () => {
    let capturedHandler = null;
    setMessageHandler.mockImplementation((h) => { capturedHandler = h; });

    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("Carrot User"));
    await userEvent.click(screen.getByText("Carrot User"));
    await waitFor(() => expect(capturedHandler).not.toBeNull());

    capturedHandler({
      _id: "xss1",
      sender: "user2",
      content: "<script>alert('xss')</script>",
      messageType: "text",
    });

    await waitFor(() => {
      // The content should be rendered as text, not as an executable script
      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    });

    // No script tag should be injected into the DOM
    expect(document.querySelector("script[data-xss]")).toBeNull();
  });

  it("XSS: img onerror payload in message is rendered as plain text", async () => {
    let capturedHandler = null;
    setMessageHandler.mockImplementation((h) => { capturedHandler = h; });

    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("Carrot User"));
    await userEvent.click(screen.getByText("Carrot User"));
    await waitFor(() => expect(capturedHandler).not.toBeNull());

    capturedHandler({
      _id: "xss2",
      sender: "user2",
      content: "<img src=x onerror=alert(1)>",
      messageType: "text",
    });

    await waitFor(() => {
      expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    });
  });

  it("XSS: HTML link tag in message is rendered as plain text", async () => {
    let capturedHandler = null;
    setMessageHandler.mockImplementation((h) => { capturedHandler = h; });

    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("Carrot User"));
    await userEvent.click(screen.getByText("Carrot User"));
    await waitFor(() => expect(capturedHandler).not.toBeNull());

    capturedHandler({
      _id: "xss3",
      sender: "user2",
      content: '<a href="javascript:alert(1)">click me</a>',
      messageType: "text",
    });

    await waitFor(() => {
      expect(screen.getByText('<a href="javascript:alert(1)">click me</a>')).toBeInTheDocument();
    });
  });

  // SQL Injection Tests

  it("SQL injection: payload in login email field is sent as plain text to API", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 400 } });
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(
      screen.getByPlaceholderText("Enter email"),
      "' OR '1'='1"
    );
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password");
    await userEvent.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ email: "' OR '1'='1" })
      );
    });
    // App should not crash — it handles the error gracefully
    expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
  });

  it("SQL injection: DROP TABLE payload in signup is handled gracefully", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 400 } });
    render(<MemoryRouter><Signup /></MemoryRouter>);
    await userEvent.type(
      screen.getByPlaceholderText("Enter email"),
      "'; DROP TABLE users; --"
    );
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password");
    await userEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/auth/signup",
        expect.objectContaining({ email: "'; DROP TABLE users; --" })
      );
    });
    expect(screen.getByText("Missing email or password.")).toBeInTheDocument();
  });

  it("SQL injection: payload in message content is rendered as plain text", async () => {
    let capturedHandler = null;
    setMessageHandler.mockImplementation((h) => { capturedHandler = h; });

    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("Carrot User"));
    await userEvent.click(screen.getByText("Carrot User"));
    await waitFor(() => expect(capturedHandler).not.toBeNull());

    capturedHandler({
      _id: "sql1",
      sender: "user2",
      content: "'; DROP TABLE messages; --",
      messageType: "text",
    });

    await waitFor(() => {
      expect(screen.getByText("'; DROP TABLE messages; --")).toBeInTheDocument();
    });
  });

  // Authentication Gating Tests
  it("unauthenticated access to chat redirects to login", async () => {
    const mockNav = jest.fn();
    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(mockNav);
    apiClient.get.mockRejectedValueOnce({ response: { status: 401 } });

    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => expect(mockNav).toHaveBeenCalledWith("/login"));
  });

  it("brute force: multiple failed logins show error without crashing", async () => {
    apiClient.post.mockRejectedValue({ response: { status: 400 } });
    render(<MemoryRouter><Login /></MemoryRouter>);

    for (let i = 0; i < 5; i++) {
      await userEvent.clear(screen.getByPlaceholderText("Enter email"));
      await userEvent.clear(screen.getByPlaceholderText("••••••••"));
      await userEvent.type(screen.getByPlaceholderText("Enter email"), "test@test.com");
      await userEvent.type(screen.getByPlaceholderText("••••••••"), `wrongpassword${i}`);
      await userEvent.click(screen.getByText("Sign In"));
    }

    await waitFor(() =>
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument()
    );
    // App should still be functional after multiple failures
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });
});