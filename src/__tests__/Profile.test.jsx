import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Profile from "../pages/Profile";

jest.mock("../lib/apiClient", () => ({
  apiClient: { post: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

import { apiClient } from "../lib/apiClient";

describe("Profile Component", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders profile form with first name, last name, and save button", () => {
    render(<MemoryRouter><Profile /></MemoryRouter>);
    expect(screen.getByPlaceholderText("John")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Doe")).toBeInTheDocument();
    expect(screen.getByText("Save & Continue")).toBeInTheDocument();
  });

  it("shows error when first name is empty", async () => {
    render(<MemoryRouter><Profile /></MemoryRouter>);
    await userEvent.click(screen.getByText("Save & Continue"));
    expect(screen.getByText("First name and last name are required.")).toBeInTheDocument();
  });

  it("shows error when last name is empty", async () => {
    render(<MemoryRouter><Profile /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("John"), "John");
    await userEvent.click(screen.getByText("Save & Continue"));
    expect(screen.getByText("First name and last name are required.")).toBeInTheDocument();
  });

  it("navigates to /chat on successful profile save", async () => {
    apiClient.post.mockResolvedValueOnce({ status: 200, data: {} });
    render(<MemoryRouter><Profile /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("John"), "John");
    await userEvent.type(screen.getByPlaceholderText("Doe"), "Doe");
    await userEvent.click(screen.getByText("Save & Continue"));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/chat"));
  });

  it("shows error on missing fields (400)", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 400 } });
    render(<MemoryRouter><Profile /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("John"), "John");
    await userEvent.type(screen.getByPlaceholderText("Doe"), "Doe");
    await userEvent.click(screen.getByText("Save & Continue"));
    await waitFor(() =>
      expect(screen.getByText("Missing required fields.")).toBeInTheDocument()
    );
  });

  it("shows generic error on server failure", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 500 } });
    render(<MemoryRouter><Profile /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText("John"), "John");
    await userEvent.type(screen.getByPlaceholderText("Doe"), "Doe");
    await userEvent.click(screen.getByText("Save & Continue"));
    await waitFor(() =>
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument()
    );
  });
});