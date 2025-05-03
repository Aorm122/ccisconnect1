import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./styles.css";

function App() {
  // Username prompt and state
  const [username, setUsername] = useState(() => {
    const name = window.prompt("Enter your username:") || "Anonymous";
    return name;
  });

  // Socket, messages, input, and file state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [counter, setCounter] = useState(0);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const serverOffsetRef = useRef(0);

  // Setup socket connection and listeners
  useEffect(() => {
    socketRef.current = io("/", {
      auth: {
        serverOffset: serverOffsetRef.current,
        username: username,
      },
      ackTimeout: 10000,
      retries: 3,
    });

    socketRef.current.on("chat message", (msg, serverOffset, sender) => {
      setMessages((prev) => [
        ...prev,
        { msg, sender: sender || "Anonymous" },
      ]);
      serverOffsetRef.current = serverOffset;
    });

    return () => {
      socketRef.current.disconnect();
    };
    // eslint-disable-next-line
  }, [username]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle logout (reload page)
  const handleLogout = () => {
    window.location.reload();
  };

  // Handle sending messages or file
  const handleSubmit = async (e) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket) return;

    if (file) {
      // Handle file upload
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        const clientOffset = `${socket.id}-${counter}`;
        setCounter((cnt) => cnt + 1);
        const fileMsg = `📎 ${data.originalName}: ${window.location.origin}${data.filePath}`;
        socket.emit("chat message", fileMsg, clientOffset);
      } catch (err) {
        console.error("Upload failed:", err);
      }
      setFile(null);
    } else if (input.trim()) {
      const clientOffset = `${socket.id}-${counter}`;
      setCounter((cnt) => cnt + 1);
      socket.emit("chat message", input.trim(), clientOffset);
      setInput("");
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>
          <span style={{ color: "rgb(29, 29, 106)" }}> C</span>
          CIS
          <span style={{ color: "rgb(29, 29, 106)" }}>C</span>
          onnect
        </h2>
        <nav>
          <button>All</button>
          {/* Add more buttons nalang??? */}
        </nav>
      </aside>

      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <nav>
            <button className="active">Chat</button>
            <button>Contacts</button>
            <button>Templates</button>
            <button>My Projects</button>
          </nav>
          <div className="profile">
            <span id="navbar-username">{username}</span>
            <button id="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="content">
          {/* Chat Section */}
          <section className="chat-section">
            <div className="searchbar">
              <input
                type="text"
                id="searchInput"
                placeholder="Search messages..."
                // Add search logic if needed
                disabled
              />
            </div>
            <ul
              id="messages"
              className="messages"
              ref={messagesEndRef}
              style={{ overflowY: "auto", flex: 1 }}
            >
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={m.sender === username ? "self" : ""}
                >
                  {m.sender}: {m.msg}
                </li>
              ))}
            </ul>
            <form
              id="form"
              className="chat-form"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              <input
                id="input"
                type="text"
                autoComplete="off"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!!file}
              />
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <label
                htmlFor="fileInput"
                style={{
                  background: "#6366f1",
                  color: "white",
                  borderRadius: "2rem",
                  padding: "0.5rem 1rem",
                  marginRight: "0.5rem",
                  cursor: "pointer",
                  display: file ? "none" : "inline-block",
                }}
              >
                📎
              </label>
              <button type="submit">
                Send
              </button>
            </form>
          </section>

          {/* Info Panel */}
          <aside className="info-panel">
            <div className="section">
              <h3>General Info</h3>
              <p id="userName">Name: (N/A)</p>
              <p id="studno">Student No.: (N/A)</p>
              <p id="userPhone">Phone: (N/A)</p>
              <p id="userEmail">Email: (N/A)</p>
              <p>
                Status: <span style={{ color: "green" }}>Active</span>
              </p>
            </div>
            <div className="section">
              <h3>Notes</h3>
              <p>No notes yet.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;