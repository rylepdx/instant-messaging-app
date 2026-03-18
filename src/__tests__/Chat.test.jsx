import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Chat from "../pages/Chat";

// Mock apiClient
jest.mock("../lib/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock socketClient
const mockEmit = jest.fn();
jest.mock("../lib/socketClient", () => ({
  initializeSocket: jest.fn(),
  setMessageHandler: jest.fn(),
  getSocket: () => ({ emit: mockEmit }),
  disconnectSocket: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

import { apiClient } from "../lib/apiClient";
import { setMessageHandler } from "../lib/socketClient";

describe("Chat Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock responses
    apiClient.get.mockImplementation((url) => {
      if (url === "/api/auth/userinfo") {
        return Promise.resolve({
          data: { id: "user1", firstName: "Apple", lastName: "User" },
        });
      }
      if (url === "/api/contacts/get-contacts-for-list") {
        return Promise.resolve({ data: { contacts: [] } });
      }
      if (url === "/api/channel/get-user-channels") {
        return Promise.resolve({ data: { channels: [] } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it("renders sidebar with Direct Messages and Channels sections", async () => {
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Direct Messages")).toBeInTheDocument();
      expect(screen.getByText("Channels")).toBeInTheDocument();
    });
  });

  it("shows empty state when no contact or channel is selected", async () => {
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText(/no conversation selected/i)).toBeInTheDocument()
    );
  });

  it("shows + New DM button in sidebar", async () => {
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText("+ New DM")).toBeInTheDocument()
    );
  });

  it("shows + New Channel button in sidebar", async () => {
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText("+ New Channel")).toBeInTheDocument()
    );
  });

  it("shows DM search input when + New DM is clicked", async () => {
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("+ New DM"));
    await userEvent.click(screen.getByText("+ New DM"));
    expect(screen.getByPlaceholderText("Search by name or email...")).toBeInTheDocument();
  });

  it("shows channel creation form when + New Channel is clicked", async () => {
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("+ New Channel"));
    await userEvent.click(screen.getByText("+ New Channel"));
    expect(screen.getByPlaceholderText("Channel name...")).toBeInTheDocument();
  });

  it("shows 'No conversations yet' when contacts list is empty", async () => {
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText("No conversations yet")).toBeInTheDocument()
    );
  });

  it("shows 'No channels yet' when channels list is empty", async () => {
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText("No channels yet")).toBeInTheDocument()
    );
  });

  it("shows contacts in sidebar when contacts are loaded", async () => {
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

    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText("Carrot User")).toBeInTheDocument()
    );
  });

  it("navigates to /login when userinfo fails (unauthenticated)", async () => {
    apiClient.get.mockRejectedValueOnce({ response: { status: 401 } });
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
  });

  it("calls logout API and navigates to /login when Logout is clicked", async () => {
    apiClient.post.mockResolvedValueOnce({});
    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("↩ Logout"));
    await userEvent.click(screen.getByText("↩ Logout"));
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/auth/logout");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("emits sendMessage via socket when message is sent to a contact", async () => {
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
    apiClient.post.mockResolvedValueOnce({ data: { messages: [] } });

    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("Carrot User"));
    await userEvent.click(screen.getByText("Carrot User"));
    await waitFor(() => screen.getByPlaceholderText(/Message/i));

    await userEvent.type(screen.getByPlaceholderText(/Message/i), "Hello!");
    await userEvent.click(screen.getByText("Send ↑"));

    expect(mockEmit).toHaveBeenCalledWith("sendMessage", expect.objectContaining({
      content: "Hello!",
      sender: "user1",
      recipient: "user2",
    }));
  });

  it("displays incoming message from socket handler", async () => {
    let capturedHandler = null;
    setMessageHandler.mockImplementation((handler) => {
      capturedHandler = handler;
    });

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
    apiClient.post.mockResolvedValueOnce({ data: { messages: [] } });

    render(<MemoryRouter><Chat /></MemoryRouter>);
    await waitFor(() => screen.getByText("Carrot User"));
    await userEvent.click(screen.getByText("Carrot User"));

    await waitFor(() => expect(capturedHandler).not.toBeNull());

    // Simulate incoming message from other user
    capturedHandler({
      _id: "msg1",
      sender: "user2",
      recipient: "user1",
      content: "Hey there!",
      messageType: "text",
    });

    await waitFor(() =>
      expect(screen.getByText("Hey there!")).toBeInTheDocument()
    );
  });
});