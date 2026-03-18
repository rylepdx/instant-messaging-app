# Instant Messaging App

CS 314 Elements of Software Engineering - Winter 2026
Portland State University | Individual Project (Frontend)

GitHub: https://github.com/rylepdx/instant-messaging-app.git

## Overview

Frontend client for a real-time instant messaging web application similar to Slack. The backend was provided by the TA as a black-box URL. The client connects over REST (Axios) and WebSocket (Socket.IO).

The frontend implements the required client-side features, with local UI handling used where backend support was unavailable:

- User registration, login, and logout
- First-time profile setup (first + last name)
- Contact search and new direct message creation
- Load message history per conversation
- Send and receive messages in real time (Socket.IO)
- Delete a direct message conversation
- Create channels with member search
- Navigate between DMs and channels
- Delete channels
- Authentication gating and error handling

## Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| UI        | React + Vite                 |
| REST      | Axios                        |
| Real-time | Socket.IO client             |
| Testing   | Jest + React Testing Library |

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx       — Login form with error handling
│   ├── Signup.jsx      — Registration form with validation
│   ├── Profile.jsx     — First-time profile setup
│   └── Chat.jsx        — Main chat interface (DMs, channels, real-time)
├── lib/
│   ├── apiClient.js    — Axios instance with base URL and ngrok headers
│   └── socketClient.js — Module-level Socket.IO client
└── __tests__/
    ├── Login.test.jsx
    ├── Signup.test.jsx
    ├── Profile.test.jsx
    ├── Chat.test.jsx
    └── security.test.jsx
```

## How to Run

### Install dependencies

```bash
npm install
```

### Set up environment variables

Create a `.env` file in the root:

```
VITE_SERVER_URL=https://pretorial-portliest-vertie.ngrok-free.dev
```

### Start the development server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Run tests

```bash
npm test
```

## Tests

**Unit Tests (Jest + React Testing Library)**
| Test File | Cases | Covers |
|---|---|---|
| Login.test.jsx | 7 | Renders, validation, API errors, navigation |
| Signup.test.jsx | 6 | Renders, validation, conflict errors, navigation |
| Profile.test.jsx | 6 | Renders, validation, API errors, navigation |
| Chat.test.jsx | 11 | Sidebar, contacts, logout, send message, receive message |
| security.test.jsx | 7 | XSS, SQL injection, auth gating, brute force |

**Security Tests**
| Attack | Payload | Result |
|---|---|---|
| SQL Injection | ' OR '1'='1 | Shown as plain text, no effect |
| SQL Injection | ; DROP TABLE users; -- | Shown as plain text, no effect |
| XSS | `<script>alert(1)</script>` | Not executed — React escapes strings |
| XSS (img) | `<img src=x onerror=alert(1)>` | No handler fired |
| Session | Logout + back button | Chat inaccessible until re-login |
| Brute force | 5+ wrong passwords | UI handles errors without crashing |

React escapes all string content by default. `dangerouslySetInnerHTML` is never used for message rendering.

## Challenges

**Real-time socket timing** — Socket was connecting before user info loaded, so the backend could not map the socket to the correct user. Fixed by initializing the socket inside a `useEffect` that runs only after `currentUser` is set, and moving socket registration to a module-level `socketClient.js` to prevent re-registration on re-renders.

**Message deduplication** — Optimistic UI would add a message locally, then the socket `receiveMessage` event would add it again. Fixed by comparing the sender ID against the current user ID and skipping messages that originated from the current user.

**Backend constraints** — The TA-provided backend API primarily supported authentication, contact management, direct message retrieval, and real-time direct messaging. Channel-related functionality was not fully supported by the remote backend used for frontend integration, so some channel behavior was handled with local UI state where necessary.

**Jest + jsdom compatibility** — jsdom did not implement `TextEncoder` or `scrollIntoView`. Fixed by adding polyfills in `jest.setup.js`.

## Known Limitations

- Channel messages are stored locally only and do not sync between users
- Some channel-related behaviors required local UI state workarounds because full backend support was unavailable
- Channel deletion was handled locally in the frontend when backend support was not available
