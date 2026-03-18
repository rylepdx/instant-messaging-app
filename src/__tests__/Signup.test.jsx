import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Signup from "../pages/Signup";

jest.mock("../lib/apiClient", () => ({
  apiClient: { post: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

import { apiClient } from "../lib/apiClient";

describe("Signup Component", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders signup form with email, password, and submit button", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("shows error when fields are empty", async () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    await userEvent.click(screen.getByText("Create Account"));
    expect(screen.getByText("Email and password are required.")).toBeInTheDocument();
  });

  it("navigates to /profile on successful signup", async () => {
    apiClient.post.mockResolvedValueOnce({ status: 201, data: {} });
    render(<MemoryRouter><Signup /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "new@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByText("Create Account"));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/profile"));
  });

  it("shows error when email already exists (409)", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 409 } });
    render(<MemoryRouter><Signup /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "existing@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByText("Create Account"));
    await waitFor(() =>
      expect(screen.getByText("An account with this email already exists.")).toBeInTheDocument()
    );
  });

  it("shows error on missing fields (400)", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 400 } });
    render(<MemoryRouter><Signup /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByText("Create Account"));
    await waitFor(() =>
      expect(screen.getByText("Missing email or password.")).toBeInTheDocument()
    );
  });

  it("shows generic error on server failure", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 500 } });
    render(<MemoryRouter><Signup /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("Enter email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByText("Create Account"));
    await waitFor(() =>
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument()
    );
  });

  it("has a link to the login page", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });
});