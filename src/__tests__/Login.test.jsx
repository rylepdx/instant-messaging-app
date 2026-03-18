import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

jest.mock("../lib/apiClient", () => ({
  apiClient: { post: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

import { apiClient } from "../lib/apiClient";

describe("Login Component", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders login form with email, password, and submit button", () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("shows error when email and password are empty", async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.click(screen.getByText("Sign In"));
    expect(screen.getByText("Email and password are required.")).toBeInTheDocument();
  });

  it("navigates to /chat when login succeeds and profileSetup is true", async () => {
    apiClient.post.mockResolvedValueOnce({
      status: 200,
      data: { user: { profileSetup: true } },
    });
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByText("Sign In"));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/chat"));
  });

  it("navigates to /profile when login succeeds and profileSetup is false", async () => {
    apiClient.post.mockResolvedValueOnce({
      status: 200,
      data: { user: { profileSetup: false } },
    });
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByText("Sign In"));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/profile"));
  });

  it("shows error on invalid credentials (400)", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 400 } });
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "wrongpassword");
    await userEvent.click(screen.getByText("Sign In"));
    await waitFor(() =>
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument()
    );
  });

  it("shows error when account not found (404)", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 404 } });
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "nobody@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByText("Sign In"));
    await waitFor(() =>
      expect(screen.getByText("No account found with that email.")).toBeInTheDocument()
    );
  });

  it("shows generic error on server failure (500)", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 500 } });
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByText("Sign In"));
    await waitFor(() =>
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument()
    );
  });

  it("has a link to the signup page", () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });
});