import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import {
  initializeSocket,
  setMessageHandler,
  getSocket,
  disconnectSocket,
} from "../lib/socketClient";

// Styles
const s = {
  app: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
    background: "#0f0f1a",
    color: "#e0e0e0",
  },
  sidebar: {
    width: "260px",
    minWidth: "260px",
    background: "#1a1a2e",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    padding: "0",
  },
  sidebarHeader: {
    padding: "20px 16px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  appTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 4px 0",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "16px 16px 6px",
  },
  sidebarItem: (active) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    cursor: "pointer",
    background: active ? "rgba(102,126,234,0.2)" : "transparent",
    borderLeft: active ? "3px solid #667eea" : "3px solid transparent",
    transition: "background 0.15s",
  }),
  sidebarItemName: {
    fontSize: "14px",
    color: "#ddd",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,80,80,0.6)",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px 4px",
    borderRadius: "4px",
    opacity: 0,
    transition: "opacity 0.15s",
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    fontSize: "12px",
    padding: "6px 16px",
    margin: "4px 16px 8px",
    borderRadius: "8px",
    width: "calc(100% - 32px)",
    transition: "all 0.15s",
  },
  searchBox: {
    margin: "4px 16px 8px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "13px",
    width: "calc(100% - 32px)",
    boxSizing: "border-box",
    outline: "none",
  },
  searchResult: {
    padding: "6px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#ccc",
    transition: "background 0.1s",
  },
  cancelBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.35)",
    fontSize: "12px",
    cursor: "pointer",
    padding: "0 16px 8px",
  },
  sidebarFooter: {
    marginTop: "auto",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  footerBtn: {
    background: "none",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
  },
  logoutBtn: {
    background: "rgba(255,80,80,0.1)",
    border: "1px solid rgba(255,80,80,0.2)",
    color: "#ff8080",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatHeader: {
    padding: "16px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "#1a1a2e",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  chatTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    margin: 0,
  },
  chatSubtitle: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.4)",
    margin: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  messageBubble: (isMine) => ({
    display: "flex",
    justifyContent: isMine ? "flex-end" : "flex-start",
    marginBottom: "2px",
  }),
  bubbleInner: (isMine) => ({
    background: isMine
      ? "linear-gradient(135deg, #667eea, #764ba2)"
      : "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    maxWidth: "65%",
    fontSize: "14px",
    lineHeight: "1.5",
    wordBreak: "break-word",
    boxShadow: isMine ? "0 2px 12px rgba(102,126,234,0.3)" : "none",
  }),
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.2)",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
    opacity: 0.4,
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: "13px",
    opacity: 0.6,
  },
  inputArea: {
    padding: "16px 24px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    background: "#1a1a2e",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  messageInput: {
    flex: 1,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  sendBtn: {
    padding: "12px 20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
    whiteSpace: "nowrap",
  },
  errorBar: {
    background: "rgba(255,80,80,0.15)",
    border: "1px solid rgba(255,80,80,0.3)",
    color: "#ff8080",
    padding: "8px 16px",
    fontSize: "13px",
    margin: "8px 16px",
    borderRadius: "8px",
  },
  channelCreateBox: {
    margin: "4px 16px 8px",
    padding: "12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
  },
  memberTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(102,126,234,0.25)",
    color: "#aab4f8",
    borderRadius: "12px",
    padding: "3px 10px",
    fontSize: "12px",
    margin: "2px",
  },
  memberTagX: {
    cursor: "pointer",
    opacity: 0.7,
    fontSize: "11px",
  },
  noItems: {
    padding: "6px 16px 10px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.2)",
    fontStyle: "italic",
  },
};

// Component
function Chat() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  // DM search
  const [showDMSearch, setShowDMSearch] = useState(false);
  const [dmSearchTerm, setDmSearchTerm] = useState("");
  const [dmSearchResults, setDmSearchResults] = useState([]);

  // Channels
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Hover state for delete buttons
  const [hoveredItem, setHoveredItem] = useState(null);

  const currentUserRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get current user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get("/api/auth/userinfo");
        setCurrentUser(response.data);
        currentUserRef.current = response.data;
      } catch {
        navigate("/login");
      }
    };
    fetchUser();
  }, []);

  // Connect socket after user loads
  useEffect(() => {
    if (!currentUser) return;
    initializeSocket(currentUser.id);
    setMessageHandler((message) => {
      const senderId = message.sender?._id || message.sender;
      if (senderId !== currentUserRef.current?.id) {
        setMessages((prev) => [...prev, { ...message, sender: senderId }]);
      }
    });
    return () => disconnectSocket();
  }, [currentUser]);

  // Fetch contacts
  useEffect(() => {
    apiClient
      .get("/api/contacts/get-contacts-for-list")
      .then((r) => setContacts(r.data.contacts))
      .catch(() => setError("Could not load contacts."));
  }, []);

  // Fetch channels
  useEffect(() => {
    apiClient
      .get("/api/channel/get-user-channels")
      .then((r) => setChannels(r.data.channels))
      .catch(() => {});
  }, []);

  // Fetch DM messages when contact selected
  useEffect(() => {
    if (!selectedContact) return;
    apiClient
      .post("/api/messages/get-messages", { id: selectedContact._id })
      .then((r) => setMessages(r.data.messages))
      .catch(() => setError("Could not load messages."));
  }, [selectedContact]);

  // Handlers

  const handleSendMessage = () => {
    if (!newMessage.trim() || (!selectedContact && !selectedChannel) || !currentUser) return;

    if (selectedChannel) {
      // Channels: add locally (no send endpoint in backend)
      setMessages((prev) => [
        ...prev,
        { _id: Date.now(), sender: currentUser.id, content: newMessage, messageType: "text" },
      ]);
    } else {
      // DM: send via socket
      const msg = {
        sender: currentUser.id,
        recipient: selectedContact._id,
        content: newMessage,
        messageType: "text",
      };
      setMessages((prev) => [...prev, { ...msg, _id: Date.now() }]);
      getSocket()?.emit("sendMessage", msg);
    }
    setNewMessage("");
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {}
    navigate("/login");
  };

  const handleSelectChannel = async (channel) => {
    console.log("channel object:", JSON.stringify(channel));
    setSelectedContact(null);
    setSelectedChannel(channel);
    const id = channel._id || channel.id;
    try {
      const res = await apiClient.get(`/api/channel/get-channelmessages/${id}`);
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const handleDeleteContact = async (contact) => {
    try {
      await apiClient.delete(`/api/contacts/delete-dm/${contact._id}`);
      setContacts((prev) => prev.filter((c) => c._id !== contact._id));
      if (selectedContact?._id === contact._id) { setSelectedContact(null); setMessages([]); }
    } catch { setError("Could not delete conversation."); }
  };

  const handleDeleteChannel = async (channel) => {
  const id = channel._id || channel.id;
  try {
    await apiClient.delete(`/api/channel/deletechannel/${id}`);
  } catch {
    // Backend may not support this endpoint (remove locally anyway)
  }
  setChannels((prev) => prev.filter((c) => (c._id || c.id) !== id));
  if ((selectedChannel?._id || selectedChannel?.id) === id) {
    setSelectedChannel(null);
    setMessages([]);
  }
};

  const handleDMSearch = async (value) => {
    setDmSearchTerm(value);
    if (!value.trim()) { setDmSearchResults([]); return; }
    try {
      const res = await apiClient.post("/api/contacts/search", { searchTerm: value });
      setDmSearchResults(res.data.contacts);
    } catch { setDmSearchResults([]); }
  };

  const handleMemberSearch = async (value) => {
    setMemberSearch(value);
    if (!value.trim()) { setMemberResults([]); return; }
    try {
      const res = await apiClient.post("/api/contacts/search", { searchTerm: value });
      setMemberResults(res.data.contacts);
    } catch { setMemberResults([]); }
  };

  const handleAddMember = (contact) => {
    if (selectedMembers.find((m) => m._id === contact._id)) return;
    setSelectedMembers((prev) => [...prev, contact]);
    setMemberSearch("");
    setMemberResults([]);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      const res = await apiClient.post("/api/channel/create-channel", {
        name: newChannelName,
        members: [currentUser.id, ...selectedMembers.map((m) => m._id)],
      });
      setChannels((prev) => [...prev, res.data.channel]);
      setNewChannelName("");
      setSelectedMembers([]);
      setMemberSearch("");
      setMemberResults([]);
      setShowCreateChannel(false);
    } catch { setError("Could not create channel."); }
  };

  // Render

  const chatTitle = selectedChannel
    ? `# ${selectedChannel.name}`
    : selectedContact
    ? `${selectedContact.firstName} ${selectedContact.lastName}`
    : null;

  return (
    <div style={s.app}>
      {/* ── Sidebar ── */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <p style={s.appTitle}>💬 Messenger</p>
          {currentUser && (
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: 0 }}>
              {currentUser.firstName} {currentUser.lastName}
            </p>
          )}
        </div>

        {error && <div style={s.errorBar}>{error}</div>}

        {/* ── Direct Messages ── */}
        <p style={s.sectionLabel}>Direct Messages</p>
        <button style={s.addBtn} onClick={() => setShowDMSearch(true)}>+ New DM</button>

        {showDMSearch && (
          <>
            <input
              autoFocus
              style={s.searchBox}
              placeholder="Search by name or email..."
              value={dmSearchTerm}
              onChange={(e) => handleDMSearch(e.target.value)}
            />
            {dmSearchResults.map((c) => (
              <div
                key={c._id}
                style={s.searchResult}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                onClick={() => {
                  setSelectedContact(c);
                  setSelectedChannel(null);
                  setShowDMSearch(false);
                  setDmSearchTerm("");
                  setDmSearchResults([]);
                  setContacts((prev) => prev.find((x) => x._id === c._id) ? prev : [...prev, c]);
                }}
              >
                {c.firstName} {c.lastName}
                <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "6px", fontSize: "12px" }}>{c.email}</span>
              </div>
            ))}
            <button style={s.cancelBtn} onClick={() => { setShowDMSearch(false); setDmSearchTerm(""); setDmSearchResults([]); }}>
              Cancel
            </button>
          </>
        )}

        {contacts.length === 0 && !showDMSearch && (
          <p style={s.noItems}>No conversations yet</p>
        )}

        {contacts.map((contact) => (
          <div
            key={contact._id}
            style={s.sidebarItem(selectedContact?._id === contact._id)}
            onMouseEnter={() => setHoveredItem(`dm-${contact._id}`)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => { setSelectedContact(contact); setSelectedChannel(null); }}
          >
            <span style={s.sidebarItemName}>
              {contact.firstName} {contact.lastName}
            </span>
            <button
              style={{ ...s.deleteBtn, opacity: hoveredItem === `dm-${contact._id}` ? 1 : 0 }}
              onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact); }}
              title="Delete conversation"
            >✕</button>
          </div>
        ))}

        {/* ── Channels ── */}
        <p style={s.sectionLabel}>Channels</p>
        <button style={s.addBtn} onClick={() => setShowCreateChannel(true)}>+ New Channel</button>

        {showCreateChannel && (
          <div style={s.channelCreateBox}>
            <input
              autoFocus
              style={{ ...s.searchBox, margin: "0 0 8px 0", width: "100%", boxSizing: "border-box" }}
              placeholder="Channel name..."
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
            <input
              style={{ ...s.searchBox, margin: "0 0 4px 0", width: "100%", boxSizing: "border-box" }}
              placeholder="Add members (search by name)..."
              value={memberSearch}
              onChange={(e) => handleMemberSearch(e.target.value)}
            />
            {memberResults.map((c) => (
              <div
                key={c._id}
                style={{ ...s.searchResult, padding: "5px 0" }}
                onClick={() => handleAddMember(c)}
              >
                + {c.firstName} {c.lastName}
              </div>
            ))}
            {selectedMembers.length > 0 && (
              <div style={{ margin: "6px 0" }}>
                {selectedMembers.map((m) => (
                  <span key={m._id} style={s.memberTag}>
                    {m.firstName} {m.lastName}
                    <span style={s.memberTagX} onClick={() => setSelectedMembers((prev) => prev.filter((x) => x._id !== m._id))}>✕</span>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <button
                onClick={handleCreateChannel}
                style={{ flex: 1, padding: "7px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
              >Create</button>
              <button
                onClick={() => { setShowCreateChannel(false); setNewChannelName(""); setSelectedMembers([]); setMemberSearch(""); setMemberResults([]); }}
                style={{ flex: 1, padding: "7px", background: "rgba(255,255,255,0.06)", color: "#aaa", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}
              >Cancel</button>
            </div>
          </div>
        )}

        {channels.length === 0 && !showCreateChannel && (
          <p style={s.noItems}>No channels yet</p>
        )}

        {channels.map((channel) => {
          const id = channel._id || channel.id;
          const selectedId = selectedChannel?._id || selectedChannel?.id;
          return (
            <div
              key={id}
              style={s.sidebarItem(selectedId === id)}
              onMouseEnter={() => setHoveredItem(`ch-${id}`)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleSelectChannel(channel)}
            >
              <span style={s.sidebarItemName}># {channel.name}</span>
              <button
                style={{ ...s.deleteBtn, opacity: hoveredItem === `ch-${id}` ? 1 : 0 }}
                onClick={(e) => { e.stopPropagation(); handleDeleteChannel(channel); }}
                title="Delete channel"
              >✕</button>
            </div>
          );
        })}

        {/* ── Footer ── */}
        <div style={s.sidebarFooter}>
          <button style={s.footerBtn} onClick={() => navigate("/profile")}>✏️ Edit Profile</button>
          <button style={s.logoutBtn} onClick={handleLogout}>↩ Logout</button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={s.main}>
        {!selectedContact && !selectedChannel ? (
          <div style={s.emptyState}>
            <span style={s.emptyIcon}>💬</span>
            <p style={s.emptyText}>No conversation selected</p>
            <p style={s.emptySubtext}>Choose a contact or channel from the sidebar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={s.chatHeader}>
              <div>
                <p style={s.chatTitle}>{chatTitle}</p>
                <p style={s.chatSubtitle}>
                  {selectedChannel ? "Channel" : "Direct Message"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={s.messagesArea}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", marginTop: "40px", fontSize: "14px" }}>
                  No messages yet. Say hello! 👋
                </div>
              )}
              {messages.map((msg) => {
                const senderId = msg.sender?._id || msg.sender;
                const isMine = senderId === currentUser?.id;
                return (
                  <div key={msg._id} style={s.messageBubble(isMine)}>
                    <div style={s.bubbleInner(isMine)}>{msg.content}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={s.inputArea}>
              <input
                style={s.messageInput}
                type="text"
                placeholder={`Message ${chatTitle}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                style={{ ...s.sendBtn, opacity: newMessage.trim() ? 1 : 0.5 }}
              >
                Send ↑
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;