import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const blue = "#2557a7";
const white = "#ffffff";
const border = "#d4d2d0";
const text = "#2d2d2d";
const red = "#b91c1c";

const S = {
  header: {
    background: white,
    borderBottom: "2px solid #e0dede",
    padding: "0 1.5rem",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
    height: "56px",
    display: "flex",
    alignItems: "center",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: "1.8rem",
    fontWeight: 900,
    color: blue,
    textDecoration: "none",
    letterSpacing: "-1px",
    fontStyle: "italic",
  },
  hamburger: {
    position: "relative",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: `1px solid ${border}`,
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1.2rem",
    color: text,
  },
  badge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    background: red,
    color: white,
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    fontSize: "0.65rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: white,
    border: `1px solid ${border}`,
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    minWidth: "210px",
    zIndex: 200,
    overflow: "hidden",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.7rem 1rem",
    fontSize: "0.9rem",
    color: text,
    textDecoration: "none",
    borderBottom: `1px solid ${border}`,
    background: "none",
    border: "none",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  itemBadge: {
    background: red,
    color: white,
    borderRadius: "20px",
    padding: "0.1rem 0.45rem",
    fontSize: "0.68rem",
    fontWeight: 700,
    minWidth: "18px",
    textAlign: "center",
  },
  divider: { height: "1px", background: border },
  signOut: {
    display: "block",
    padding: "0.7rem 1rem",
    fontSize: "0.9rem",
    color: red,
    background: "none",
    border: "none",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  },
};

export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    api.get("/notifications/")
      .then(({ data }) => setUnread(data.filter((n) => !n.is_read).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const close = () => setOpen(false);

  const handleLogout = async () => {
    try { await api.post("/auth/logout/", { refresh: localStorage.getItem("refresh_token") }); } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <header style={S.header} className="rec-header">
      <div style={S.inner}>
        <Link to="/" style={S.logo}>Skai</Link>

        <div style={{ position: "relative" }} ref={menuRef}>
          <button style={S.hamburger} onClick={() => setOpen((v) => !v)} aria-label="Menu">
            ☰
            {unread > 0 && <span style={S.badge}>{unread > 99 ? "99+" : unread}</span>}
          </button>

          {open && (
            <div style={S.dropdown}>
              <Link to="/profile" style={S.item} onClick={close}>
                Profile
              </Link>
              <Link to="/applications" style={S.item} onClick={close}>
                My Applications
              </Link>
              <Link to="/reviews" style={S.item} onClick={close}>
                Reviews
              </Link>
              <Link to="/notifications" style={{ ...S.item, borderBottom: "none" }} onClick={close}>
                Notifications
                {unread > 0 && (
                  <span style={S.itemBadge}>{unread > 99 ? "99+" : unread}</span>
                )}
              </Link>
              <div style={S.divider} />
              <button style={S.signOut} onClick={handleLogout}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
