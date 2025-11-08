import React, { useEffect, useState, createContext, useContext } from "react";

/*
  CPM Community - app.jsx
  Single-file React app (paste into a create-react-app / Vite project as App.jsx)

  - Mock client-side auth (signup/login) with Google / Discord / YouTube "buttons" (mocked)
  - Three admin accounts, with MAIN ADMIN credentials prefilled (as requested). Main admin can view/edit/delete local accounts.
  - Simple pages: Auth (signup/login), Home, Community (WhatsApp-like group chat), Notifications, Important Lesson
  - Upload support for images/gifs/audio/apk/zip (files stored in-memory / localStorage as blobs URLs)
  - Verified tick on admin accounts
  - Vertical header with logos (Home, Community, Settings)
  - Mostly red & black color scheme (Tailwind classes used)

  NOTE: This is a front-end mock. For production you MUST implement secure backend auth, file storage, validation.
*/

// ---------- Mock constants & helpers ----------
const MAIN_ADMIN = { username: "MAGCP", email: "manoalii847@gmail.com", password: "magcp10611061", role: "main_admin" };
const SECONDARY_ADMIN = { username: "ADMIN2", email: "admin2@cpm.local", password: "admin2pass", role: "admin_pending" };
const TERTIARY_ADMIN = { username: "ADMIN3", email: "admin3@cpm.local", password: "admin3pass", role: "admin_pending" };

const defaultUsers = [
  { id: 1, username: MAIN_ADMIN.username, email: MAIN_ADMIN.email, role: "main_admin", verified: true, avatar: null },
  { id: 2, username: SECONDARY_ADMIN.username, email: SECONDARY_ADMIN.email, role: "admin", verified: true, avatar: null },
  { id: 3, username: TERTIARY_ADMIN.username, email: TERTIARY_ADMIN.email, role: "admin", verified: true, avatar: null },
];

const makeId = () => Math.random().toString(36).slice(2, 9);

// ---------- Contexts ----------
const AppContext = createContext();
const useApp = () => useContext(AppContext);

// ---------- Main App ----------
export default function App() {
  const [route, setRoute] = useState(localStorage.getItem("cpm_route") || "auth");

  // users & messages persist in localStorage (simple mock)
  const [users, setUsers] = useState(() => {
    const raw = localStorage.getItem("cpm_users");
    if (raw) return JSON.parse(raw);
    // seed admins
    return defaultUsers;
  });

  const [messages, setMessages] = useState(() => {
    const raw = localStorage.getItem("cpm_messages");
    return raw ? JSON.parse(raw) : [];
  });

  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("cpm_auth");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => localStorage.setItem("cpm_users", JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem("cpm_messages", JSON.stringify(messages)), [messages]);
  useEffect(() => localStorage.setItem("cpm_auth", JSON.stringify(auth)), [auth]);
  useEffect(() => localStorage.setItem("cpm_route", route), [route]);

  // simple login function (mock)
  function login({ emailOrUser, password }) {
    // allow login by username or email
    const found = users.find(
      (u) => (u.email?.toLowerCase() === emailOrUser?.toLowerCase() || u.username?.toLowerCase() === emailOrUser?.toLowerCase())
    );

    // built-in check for main admin credentials provided by user
    if (!found) {
      if (emailOrUser === MAIN_ADMIN.username || emailOrUser === MAIN_ADMIN.email) {
        if (password === MAIN_ADMIN.password) {
          const adminUser = defaultUsers[0];
          setAuth(adminUser);
          return { ok: true };
        }
      }
      return { ok: false, error: "User not found" };
    }

    // in this mock we don't store passwords for other users. if password matches main admin pass, allow main admin impersonation
    if (found.email === MAIN_ADMIN.email) {
      if (password === MAIN_ADMIN.password) {
        setAuth(found);
        return { ok: true };
      }
      return { ok: false, error: "Invalid password" };
    }

    // allow login without password for simple accounts in this mock
    setAuth(found);
    return { ok: true };
  }

  function logout() {
    setAuth(null);
    setRoute("auth");
  }

  function signup({ username, email, avatar }) {
    // basic uniqueness check
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, error: "Username taken" };
    }
    const id = Date.now();
    const newUser = { id, username, email, avatar: avatar || null, role: "user", verified: false };
    setUsers((s) => [...s, newUser]);
    setAuth(newUser);
    return { ok: true }; 
  }

  function sendMessage({ text, file, authorId }) {
    const id = makeId();
    const msg = { id, text: text || "", file: file || null, authorId, ts: Date.now() };
    setMessages((m) => [...m, msg]);
  }

  function deleteUser(targetId) {
    setUsers((u) => u.filter((x) => x.id !== targetId));
    // remove messages by user
    setMessages((m) => m.filter((msg) => msg.authorId !== targetId));
  }

  function editUser(id, patch) {
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  return (
    <AppContext.Provider value={{ users, messages, auth, login, logout, signup, sendMessage, deleteUser, editUser, setRoute }}>
      <div className="min-h-screen bg-black text-white flex">
        {/* vertical left nav */}
        <aside className="w-20 bg-red-900 p-3 flex flex-col items-center gap-4">
          <div className="text-2xl font-bold">CPM</div>
          <NavButton label="Home" onClick={() => setRoute("home")} />
          <NavButton label="Community" onClick={() => setRoute("community")} />
          <NavButton label="Notifications" onClick={() => setRoute("notifications")} />
          <NavButton label="Settings" onClick={() => setRoute("settings")} />
          <div className="mt-auto text-xs opacity-80">CPM Community</div>
        </aside>

        {/* main area */}
        <main className="flex-1 p-6">
          <TopBar />

          <div className="mt-6">
            {route === "auth" && <AuthPage onRouteChange={setRoute} />}
            {route === "home" && <HomePage />}
            {route === "community" && <CommunityPage />}
            {route === "notifications" && <NotificationsPage />}
            {route === "important" && <ImportantLesson />}
            {route === "settings" && <SettingsPage />}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
}

// ---------- UI Components ----------
function NavButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="w-full py-2 rounded-lg hover:bg-red-800 text-sm">
      {label}
    </button>
  );
}

function TopBar() {
  const { auth, logout } = useApp();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">CPM Community</h1>
      <div className="flex items-center gap-4">
        {auth ? (
          <>
            <div className="flex items-center gap-2">
              <small className="opacity-80">{auth.username}</small>
              {auth.role && (auth.role === "main_admin" || auth.role === "admin") && <VerifiedTick />}
            </div>
            <button onClick={logout} className="bg-red-700 px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <div className="text-sm opacity-70">Not signed in</div>
        )}
      </div>
    </div>
  );
}

function VerifiedTick() {
  return (
    <span title="Admin verified" className="ml-1 inline-flex items-center px-2 py-0.5 bg-white/10 rounded text-xs">
      ✓
    </span>
  );
}

// ---------- Auth Page ----------
function AuthPage({ onRouteChange }) {
  const { login, signup, auth } = useApp();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState(null);

  useEffect(() => { if (auth) onRouteChange("home"); }, [auth, onRouteChange]);

  function handleLogin(e) {
    e.preventDefault();
    const res = login({ emailOrUser: form.email || form.username, password: form.password });
    if (!res.ok) setError(res.error);
  }

  function handleSignup(e) {
    e.preventDefault();
    const res = signup({ username: form.username || `user_${makeId()}`, email: form.email || `${makeId()}@mail.local` });
    if (!res.ok) setError(res.error);
    else onRouteChange("home");
  }

  function mockOAuth(provider) {
    // For the mock: create a user with provider name
    const uname = `${provider}_user_${makeId()}`;
    const res = signup({ username: uname, email: `${uname}@${provider}.local` });
    if (res.ok) onRouteChange("home");
  }

  return (
    <div className="max-w-2xl mx-auto bg-gray-900/50 p-6 rounded-lg">
      <div className="flex gap-6">
        <div className="w-1/2">
          <h2 className="text-xl font-semibold mb-3">{isSignup ? "Create account" : "Sign in"}</h2>
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="flex flex-col gap-3">
            {isSignup && (
              <input value={form.username} onChange={(e)=>setForm(f=>({...f, username: e.target.value}))} placeholder="Username" className="p-2 rounded bg-black/60" />
            )}
            <input value={form.email} onChange={(e)=>setForm(f=>({...f, email: e.target.value}))} placeholder="Email or Username" className="p-2 rounded bg-black/60" />
            <input value={form.password} onChange={(e)=>setForm(f=>({...f, password: e.target.value}))} placeholder="Password" type="password" className="p-2 rounded bg-black/60" />
            <div className="flex gap-2">
              <button type="submit" className="bg-red-700 px-4 py-2 rounded">{isSignup ? "Sign up" : "Login"}</button>
              <button type="button" onClick={()=>setIsSignup(s=>!s)} className="px-3 py-2 border rounded">{isSignup?"Already have an account?":"Create account"}</button>
            </div>
            {error && <div className="text-red-400">{error}</div>}

            <div className="mt-4">
              <div className="text-sm opacity-80 mb-2">Or sign up with</div>
              <div className="flex flex-col gap-2">
                <OAuthButton provider="Google" onClick={()=>mockOAuth("google")} />
                <OAuthButton provider="Discord" onClick={()=>mockOAuth("discord")} />
                <OAuthButton provider="YouTube" onClick={()=>mockOAuth("youtube")} extraLabel="(subscribe required - mocked)" />
              </div>
            </div>

            <div className="mt-4 text-xs opacity-70">After signup you'll be taken to the Home page automatically. Important items: <button onClick={()=>onRouteChange("important")} className="underline">Important lesson</button></div>
          </form>
        </div>

        <div className="w-1/2">
          <h3 className="text-lg font-medium">Admin login</h3>
          <p className="text-xs opacity-70">Main admin credentials (mocked):</p>
          <pre className="bg-black/50 p-3 rounded mt-2 text-sm">UserName: MAGCP
email: manoalii847@gmail.com
Password: magcp10611061</pre>
          <p className="mt-3 text-xs opacity-70">Other admin accounts require permission from main admin.</p>
        </div>
      </div>
    </div>
  );
}

function OAuthButton({ provider, onClick, extraLabel }) {
  const logos = { Google: "Go", Discord: "Di", YouTube: "Yo" };
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-2 rounded bg-white/5">
      <span className="text-xl">{logos[provider] || "🔘"}</span>
      <div className="text-sm text-left">
        <div>Sign up with {provider}</div>
        {extraLabel && <div className="text-xs opacity-70">{extraLabel}</div>}
      </div>
    </button>
  );
}

// ---------- Home Page ----------
function HomePage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Home</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 p-4 rounded">
          <h3 className="font-medium mb-2">Featured app</h3>
          <p className="text-sm opacity-70">This displays the Play Store page you requested as a link. (Embedding Play Store content may be blocked — this is a simple link.)</p>
          <a className="mt-3 inline-block underline" href="https://play.google.com/store/apps/details?id=com.olzhas.carparking.multyplayer" target="_blank" rel="noreferrer">Open Play Store page for the app</a>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <h3 className="font-medium mb-2">Quick links</h3>
          <div className="flex flex-col gap-2">
            <button className="p-2 rounded bg-red-800" onClick={()=>window.alert('Open community (or use left nav)')}>Go to Community</button>
            <button className="p-2 rounded bg-red-800" onClick={()=>window.alert('View notifications')}>Notifications</button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium">Public feed</h3>
        <p className="text-sm opacity-70">All signed-in users can send messages in the Community page (after signup/login).</p>
      </div>
    </div>
  );
}

// ---------- Community Page (WhatsApp-like group) ----------
function CommunityPage() {
  const { messages, users, auth, sendMessage } = useApp();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    // create a blob URL for the file to preview in messages
    const url = URL.createObjectURL(f);
    setFile({ name: f.name, url, size: f.size, type: f.type });
  }

  function onSend(e) {
    e.preventDefault();
    if (!auth) return alert("Please sign up / login first.");
    sendMessage({ text, file, authorId: auth.id });
    setText("");
    setFile(null);
  }

  return (
    <div className="bg-gray-900/40 p-4 rounded">
      <h2 className="text-xl font-semibold mb-3">Community Group</h2>
      <div className="border rounded bg-black p-3 max-h-96 overflow-y-auto">
        {messages.length === 0 && <div className="text-sm opacity-60">No messages yet — be the first!</div>}
        {messages.map((m) => (
          <MessageItem key={m.id} m={m} author={users.find((u) => u.id === m.authorId)} />
        ))}
      </div>

      <form className="mt-3 flex gap-2" onSubmit={onSend}>
        <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Write a message..." className="flex-1 p-2 rounded bg-black/60" />
        <input type="file" onChange={handleFileChange} className="hidden" id="fileInput" />
        <label htmlFor="fileInput" className="px-3 py-2 border rounded cursor-pointer">Attach</label>
        <button type="submit" className="bg-red-700 px-4 py-2 rounded">Send</button>
      </form>

      {file && (
        <div className="mt-2 text-sm opacity-80">Attached: {file.name} ({Math.round(file.size/1024)} KB)</div>
      )}
    </div>
  );
}

function MessageItem({ m, author }) {
  return (
    <div className="mb-3">
      <div className="text-xs opacity-70">{author ? author.username : "Unknown"} {author?.role && (author.role === "main_admin" || author.role === "admin") && <VerifiedTick />}</div>
      <div className="mt-1 p-2 bg-red-900/10 rounded">{m.text}</div>
      {m.file && (
        <div className="mt-1">
          <a href={m.file.url} download={m.file.name} className="underline text-sm">Download {m.file.name}</a>
        </div>
      )}
    </div>
  );
}

// ---------- Notifications & Important ----------
function NotificationsPage() {
  const { messages } = useApp();
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Notifications</h2>
      <div className="bg-gray-900 p-4 rounded">
        <div className="text-sm opacity-70">Recent messages count: {messages.length}</div>
      </div>
    </div>
  );
}

function ImportantLesson() {
  return (
    <div className="bg-gray-900 p-4 rounded">
      <h2 className="text-xl font-semibold mb-3">Important lesson (signup page note)</h2>
      <ol className="list-decimal pl-5 text-sm opacity-90">
        <li>Create a unique username.</li>
        <li>Main admin controls are protected — in a real app they should use secure backend auth.</li>
        <li>Files you upload are stored locally in the browser in this demo only; do not upload private files here.</li>
      </ol>
    </div>
  );
}

// ---------- Settings & Admin Controls ----------
function SettingsPage() {
  const { users, auth, deleteUser, editUser } = useApp();

  const isMainAdmin = auth?.role === "main_admin";

  function handleDelete(id) {
    if (!isMainAdmin) return alert("Only main admin can delete accounts.");
    if (!confirm("Delete this user and their messages?")) return;
    deleteUser(id);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Settings / Admin</h2>
      <div className="bg-gray-900 p-4 rounded">
        <h3 className="font-medium">Users</h3>
        <div className="mt-2 grid gap-2">
          {users.map((u) => (
            <div key={u.id} className="p-2 border rounded flex items-center justify-between">
              <div>
                <div>{u.username} {u.role && (u.role === "main_admin" || u.role === "admin") && <VerifiedTick />}</div>
                <div className="text-xs opacity-70">{u.email}</div>
              </div>
              <div className="flex gap-2">
                {isMainAdmin && <button onClick={()=>handleDelete(u.id)} className="px-3 py-1 rounded bg-red-700 text-sm">Delete</button>}
                {isMainAdmin && <button onClick={()=>editUser(u.id, { username: u.username+"_edited" })} className="px-3 py-1 rounded border text-sm">Edit</button>}
                <h6>Made with MAG CP</h6>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
