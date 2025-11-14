import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";

// --- DEFINE YOUR SINGLE SOURCE OF TRUTH FOR THE BACKEND URL ---
const BACKEND_URL = "https://music-64ne.onrender.com";

// --- STYLES ---
const GlobalStyles = () => (
  <style>{`
    :root {
      --background-color: #000000;
      --surface-color: #121212;
      --primary-text-color: #ffffff;
      --secondary-text-color: #b3b3b3;
      --accent-color: #E50914; /* Changed to red */
      --hover-color: #282828;
      --scrollbar-thumb-color: #5a5a5a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'CircularSp', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--background-color);
      color: var(--primary-text-color);
      overflow: hidden;
    }
    .music-player-app {
      display: grid;
      grid-template-columns: 250px 1fr;
      grid-template-rows: 1fr auto;
      grid-template-areas: "sidebar main-content" "player player";
      height: 100vh;
      width: 100vw;
    }
    .sidebar {
      grid-area: sidebar;
      background-color: #000;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .logo {
      color: var(--accent-color);
      margin-bottom: 10px;
      font-weight: bold;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sidebar .nav-group, .sidebar .playlist-group { list-style: none; display: flex; flex-direction: column; gap: 15px; }
    .sidebar .nav-item {
      color: var(--secondary-text-color);
      font-weight: bold; cursor: pointer;
      transition: color 0.2s ease-in-out;
      display: flex; align-items: center; gap: 15px; font-size: 0.9rem;
    }
    .sidebar .nav-item:hover, .sidebar .nav-item.active { color: var(--primary-text-color); }
    .sidebar .nav-item.active { color: var(--accent-color); }
    .sidebar hr { border: none; height: 1px; background-color: var(--hover-color); margin: 10px 0; }
    .main-content { grid-area: main-content; overflow-y: auto; background: linear-gradient(to bottom, #222, #121212); position: relative; }
    .header {
      padding: 16px 32px; background-color: rgba(0,0,0,0.5); position: sticky;
      top: 0; z-index: 5; display: flex; justify-content: space-between; align-items: center;
    }
    .header-left { display: flex; gap: 10px; flex-grow: 1; max-width: 400px; }
    .header-right { display: flex; align-items: center; gap: 16px; }
    .search-form input {
      width: 100%; padding: 12px 16px; border: none; border-radius: 50px;
      background-color: var(--hover-color); color: var(--primary-text-color); font-size: 0.9rem;
    }
    .user-profile {
        background-color: #333; color: white; padding: 8px 16px; border-radius: 20px;
        display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem;
    }
    .icon-button { background: none; border: none; color: var(--secondary-text-color); cursor: pointer; position: relative; }
    .icon-button:hover { color: white; }
    .icon-button.active { color: var(--accent-color); }
    .track-list { list-style: none; }
    .track-header, .track-item {
      display: grid; grid-template-columns: 40px 4fr 3fr 2fr 100px; gap: 16px;
      align-items: center; padding: 12px; border-radius: 4px; transition: background-color 0.2s ease-in-out;
    }
    .track-header { color: var(--secondary-text-color); font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 8px; }
    .track-item:hover { background-color: var(--hover-color); }
    .track-item .track-number .index { display: block; }
    .track-item .track-number .play-button { display: none; }
    .track-item:hover .track-number .index { display: none; }
    .track-item:hover .track-number .play-button { display: block; }
    .track-number { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--secondary-text-color); cursor: pointer; }
    .track-info { display: flex; align-items: center; gap: 16px; }
    .track-album-art { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
    .track-title { font-weight: 500; }
    .track-artist, .track-album, .track-duration { font-size: 0.9rem; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .track-actions { display: flex; align-items: center; justify-content: space-between; color: var(--secondary-text-color); }
    .favorite-btn.favorited { color: var(--accent-color); }
    .track-item.playing .track-title { color: var(--accent-color); }
    .player-bar {
      grid-area: player; background-color: var(--surface-color); border-top: 1px solid #282828;
      height: 90px; display: grid; grid-template-columns: 1fr 2fr 1fr;
      align-items: center; padding: 0 16px; z-index: 10;
    }
    .player-track-info { display: flex; align-items: center; gap: 12px; cursor: pointer; }
    .player-controls { display: flex; justify-content: center; align-items: center; gap: 16px; }
    .control-button.play { background-color: var(--primary-text-color); color: #000; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .player-view-container { padding: 24px 32px; }
    .player-view-header { display: flex; gap: 24px; align-items: flex-end; margin-bottom: 24px; }
    .player-view-album-art { width: 232px; height: 232px; min-width: 232px; border-radius: 8px; box-shadow: 0 4px 60px rgba(0,0,0,.5); }
    .player-view-details .track-title-main { font-size: 4rem; font-weight: 900; line-height: 1.1; margin: 0.08em 0; }
    .player-view-controls-bar { display: flex; align-items: center; gap: 24px; padding: 24px 0; }
    .player-view-controls-bar .play-button-main { background-color: var(--accent-color); border: none; border-radius: 50%; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; }
    .player-view-progress-container { width: 100%; max-width: 500px; display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--secondary-text-color); margin-top: -10px; }
    .player-view-progress-wrapper { flex-grow: 1; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; cursor: pointer; }
    .player-view-progress-bar { height: 100%; background: white; border-radius: 2px; width: 0%; }
    .modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex; align-items: center; justify-content: center; z-index: 200;
    }
    .modal-content {
        background-color: var(--surface-color); padding: 40px; border-radius: 8px;
        width: 90%; max-width: 400px; text-align: center; position: relative;
    }
    .modal-content .close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: white; font-size: 1.5rem; cursor:pointer; }
    .modal-content h2 { margin-bottom: 20px; }
    .modal-form { display: flex; flex-direction: column; gap: 15px; }
    .modal-form input {
        padding: 12px; margin-bottom: 15px; border: 1px solid #555; border-radius: 4px;
        background-color: var(--hover-color); color: white;
    }
    .modal-form button {
        padding: 12px; border: none; border-radius: 50px; background-color: var(--accent-color);
        color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;
    }
    .modal-form button:hover { transform: scale(1.03); }
    .modal-content .switch-auth { margin-top: 20px; color: var(--secondary-text-color); font-size: 0.9rem; }
    .modal-content .switch-auth span { color: white; cursor: pointer; text-decoration: underline; }
    .modal-error { color: #ff4d4d; margin-top: 15px; font-size: 0.9rem; }
    .chat-panel-float {
      position: absolute;
      z-index: 150;
      background-color: #181818;
      border: 1px solid #282828;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      width: 340px;
      height: 450px;
      display: flex;
      flex-direction: column;
      resize: both;
      overflow: hidden;
      min-width: 280px;
      min-height: 200px;
    }
    .chat-panel-float.minimized {
        height: 42px;
        resize: none;
    }
    .chat-header {
      background-color: #000;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      flex-shrink: 0;
    }
    .chat-header h3 { margin: 0; font-size: 1rem; }
    .chat-header-controls { display: flex; gap: 8px; }
    .chat-header-controls button { background: none; border: none; color: var(--secondary-text-color); cursor: pointer; }
    .chat-header-controls button:hover { color: white; }
    .chat-body {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
    }
    .chat-messages {
      flex-grow: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chat-message {
        background-color: var(--surface-color);
        padding: 8px 12px;
        border-radius: 12px;
        max-width: 90%;
        align-self: flex-start;
        word-wrap: break-word;
    }
     .chat-message.mine {
        align-self: flex-end;
        background-color: var(--accent-color);
        color: white;
     }
    .chat-message.system { background: none; color: var(--secondary-text-color); font-style: italic; font-size: 0.8rem; align-self: center; }
    .chat-message .user { font-weight: bold; color: var(--accent-color); display: block; font-size: 0.8rem; }
    .chat-message.mine .user { color: #fff; }
    .chat-input-form { display: flex; gap: 8px; padding: 16px; border-top: 1px solid #282828; }
    .chat-input-form input { flex-grow: 1; padding: 10px; border-radius: 20px; border: none; background-color: var(--hover-color); color: white; }
    .chat-input-form button { background: none; border: none; color: var(--accent-color); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .end-session-btn {
        padding: 8px; border: 1px solid var(--accent-color); border-radius: 50px; background-color: transparent;
        color: var(--accent-color); font-weight: bold; cursor: pointer; transition: all 0.2s;
    }
    .end-session-btn:hover { background-color: var(--accent-color); color: white; }
    

    /* --- ✨ RESPONSIVE STYLES FOR MOBILE ✨ --- */
    @media (max-width: 768px) {
      body {
        overflow: auto; /* Allow scrolling on the body */
      }
      
      .music-player-app {
        /* Change to a single column layout with a bottom nav */
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto auto; /* Main, Player, Nav */
        grid-template-areas:
          "main-content"
          "player"
          "sidebar"; /* Remap sidebar to the bottom */
        height: 100vh; /* Ensure it fills the screen */
      }
      
      .main-content {
        /* Add padding at the bottom to not be obscured by the player/nav */
        padding-bottom: 160px;
      }

      /* --- Sidebar becomes Bottom Nav Bar --- */
      .sidebar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: 70px;
        z-index: 100;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        padding: 0;
        border-top: 1px solid var(--hover-color);
        background-color: #000; /* Solid background for nav */
      }

      .logo, .sidebar hr, .sidebar .playlist-group, .sidebar .nav-item span {
        display: none; /* Hide logo, separators, and text labels in nav items */
      }
      
      .sidebar .nav-group {
        flex-direction: row;
        justify-content: space-around;
        width: 100%;
        gap: 0;
        height: 100%;
      }

      .sidebar .nav-item {
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        flex-grow: 1;
        font-size: 0.7rem; /* Smaller font for icon labels if you re-add them */
      }

      .sidebar .nav-item svg {
        width: 28px;
        height: 28px;
      }
      /* Specifically hide text next to icons */
       .sidebar .nav-item > *:not(svg) {
         display: none;
       }


      /* --- Header Adjustments --- */
      .header {
        padding: 12px 16px;
      }
      .user-profile {
        font-size: 0; /* Hide text */
        padding: 8px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
      }
      .user-profile::before {
        content: '👤'; /* Use an emoji or icon font instead of text */
        font-size: 1rem;
      }

      /* --- Track List Simplification --- */
      .track-list-container {
        padding: 0 16px !important;
      }
      .view-title {
        padding: 16px !important;
        font-size: 1.2rem;
      }
      .track-header, .track-item {
        /* Simplify grid to show only essential info */
        grid-template-columns: 30px 1fr 80px;
        gap: 12px;
        padding: 8px;
      }
      .track-header > div:nth-child(3),
      .track-header > div:nth-child(4),
      .track-item > .track-album {
        display: none; /* Hide Album and Genre columns */
      }
      .track-info {
        gap: 12px;
      }
      .track-album-art {
        width: 35px;
        height: 35px;
      }

      /* --- Player Bar Adjustments --- */
      .player-bar {
        height: 75px;
        grid-template-columns: 1fr auto;
        padding: 0 12px;
      }
      .player-controls {
        grid-column: 2;
        gap: 12px;
      }
       .player-track-info .player-track-artist {
         display: none; /* Hide artist name on the small player bar to save space */
       }

      /* --- Full-Screen Player View --- */
      .player-view-container {
        padding: 16px;
      }
      .player-view-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
      }
      .player-view-album-art {
        width: 70vw;
        height: 70vw;
        max-width: 280px;
        max-height: 280px;
      }
      .player-view-details .track-title-main {
        font-size: 1.5rem;
      }
      .player-view-controls-bar {
         justify-content: center;
      }
       .player-view-progress-container {
         max-width: 100%;
       }

      /* --- Modal and Chat Panel --- */
      .modal-content {
        padding: 24px;
      }
      .chat-panel-float {
        /* Make chat full-screen */
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 0;
        resize: none;
        z-index: 250;
      }
      .chat-header {
        cursor: default; /* Disable move cursor */
      }

    }
  `}</style>
);

// --- SVG Icons ---
const PlayIcon = () => (<svg role="img" height="24" width="24" viewBox="0 0 24 24"><path d="M7.05 3.606l13.49 7.788a.7.7 0 010 1.212L7.05 20.394A.7.7 0 016 19.788V4.212a.7.7 0 011.05-.606z"></path></svg>);
const PauseIcon = () => (<svg role="img" height="24" width="24" viewBox="0 0 24 24"><path d="M5.7 3a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7H5.7zm10 0a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7h-2.6z"></path></svg>);
const HomeIcon = () => <svg role="img" height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9.277a2 2 0 0 1 1-1.732l7.5-4.33z"></path></svg>;
const SearchIcon = () => <svg role="img" height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>;
const LibraryIcon = () => <svg role="img" height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"></path></svg>;
const PlusIcon = () => <svg role="img" height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>;
const HeartIcon = ({ filled, size = 16 }) => filled ? <svg role="img" height={size} width={size} viewBox="0 0 24 24"><path fill="currentColor" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> : <svg role="img" height={size} width={size} viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>;
const PeopleIcon = () => <svg role="img" height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path></svg>;
const ChatIcon = () => <svg role="img" height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>;
const SendIcon = () => <svg role="img" height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>;
const CloseIcon = () => <svg role="img" height="18" width="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>;
const MinimizeIcon = () => <svg role="img" height="18" width="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z"></path></svg>;
const MaximizeIcon = () => <svg role="img" height="18" width="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v2H3V3zm0 16h18v2H3v-2z"></path></svg>;
const LogoIcon = () => <svg role="img" height="32" width="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>;

// --- Helper Components ---
const AuthModal = ({ onClose, onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup';
        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Something went wrong');
            if (isLogin) {
                onAuthSuccess(data);
            } else {
                alert('Sign up successful! Please sign in.');
                setIsLogin(true);
            }
        } catch (err) { setError(err.message); }
    };
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="close-btn">&times;</button>
                <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <input type="text" name="username" placeholder="Username" required onChange={(e) => setFormData({...formData, username: e.target.value})} />
                    <input type="password" name="password" placeholder="Password" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    <button type="submit">{isLogin ? 'Sign In' : 'Sign Up'}</button>
                </form>
                {error && <p className="modal-error">{error}</p>}
                <p className="switch-auth">{isLogin ? "Don't have an account? " : "Already have an account? "} <span onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Sign Up' : 'Sign In'}</span></p>
            </div>
        </div>
    );
};

const SessionModal = ({ onClose, onSessionStart }) => {
    const [sessionId, setSessionId] = useState('');
    const createNewSession = () => {
        const newId = Math.random().toString(36).substring(2, 8);
        onSessionStart(newId);
    };
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="close-btn">&times;</button>
                <h2>Listen Together</h2>
                <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSessionStart(sessionId); }}>
                    <input type="text" placeholder="Enter Session ID to join" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
                    <button type="submit" disabled={!sessionId}>Join Session</button>
                </form>
                <div style={{margin: '15px 0'}}>OR</div>
                <button onClick={createNewSession} className="modal-form">Create New Session</button>
            </div>
        </div>
    )
};

const ChatPanel = ({ messages, onSendMessage, sessionId, onEndSession, currentUser, onClose }) => {
    const [chatInput, setChatInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 360, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    const messagesEndRef = useRef(null);
    const chatPanelRef = useRef(null);
    
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages]);
    
    const handleMouseDown = (e) => {
        if (!chatPanelRef.current) return;
        setIsDragging(true);
        const panelRect = chatPanelRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - panelRect.left,
            y: e.clientY - panelRect.top,
        });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
            });
        };
        const handleMouseUp = () => {
            setIsDragging(false);
        };
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleSend = (e) => {
        e.preventDefault();
        if(chatInput.trim()){
            onSendMessage(chatInput);
            setChatInput('');
        }
    };
    return (
        <div 
            ref={chatPanelRef}
            className={`chat-panel-float ${isMinimized ? 'minimized' : ''}`}
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <div className="chat-header" onMouseDown={handleMouseDown}>
                <h3>Session: {sessionId}</h3>
                <div className="chat-header-controls">
                    <button onClick={() => setIsMinimized(!isMinimized)}>
                        {isMinimized ? <MaximizeIcon /> : <MinimizeIcon />}
                    </button>
                    <button onClick={onClose}><CloseIcon/></button>
                </div>
            </div>
            {!isMinimized && (
                <div className="chat-body">
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.isSystem ? 'system' : ''} ${msg.user === currentUser ? 'mine' : ''}`}>
                                {!msg.isSystem && <span className="user">{msg.user}</span>}
                                {msg.text}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                     <form className="chat-input-form" onSubmit={handleSend}>
                        <input type="text" placeholder="Say something..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                        <button type="submit"><SendIcon /></button>
                    </form>
                </div>
            )}
             <div className="chat-footer" style={{padding: '8px', textAlign: 'center'}}>
                 <button className="end-session-btn" onClick={onEndSession}>End Session</button>
             </div>
        </div>
    )
};

const PlayerView = ({ track, albumTracks, isPlaying, progress, duration, onPlayPause, onSelectTrack, isFavorited, toggleFavorite, formatDuration }) => {
    const albumArt = track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '600x600') : '';
    const releaseYear = new Date(track.releaseDate).getFullYear();

    const formatTime = (secs) => {
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="player-view-container">
            <div className="player-view-header">
                <img src={albumArt} alt={track.collectionName} className="player-view-album-art" />
                <div className="player-view-details">
                    <span className="type-label">Song</span>
                    <h1 className="track-title-main">{track.trackName}</h1>
                    <div className="artist-album-info">
                        <span>{track.artistName} • {track.collectionName} • {releaseYear}</span>
                    </div>
                </div>
            </div>
             <div className="player-view-controls-bar">
                <button className="play-button-main" onClick={onPlayPause}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button className={`favorite-btn ${isFavorited ? 'favorited' : ''}`} onClick={() => toggleFavorite(track)}>
                    <HeartIcon filled={isFavorited} size={32} />
                </button>
            </div>
            <div className="player-view-progress-container">
                <span>{formatTime(progress)}</span>
                <div className="player-view-progress-wrapper">
                    <div className="player-view-progress-bar" style={{ width: `${(progress / duration) * 100 || 0}%` }}></div>
                </div>
                <span>{formatTime(duration)}</span>
            </div>
            <div className="track-list-container" style={{padding: '24px 0'}}>
                <ul className="track-list">
                    <li className="track-header" style={{gridTemplateColumns: '40px 1fr 100px'}}>
                        <div>#</div>
                        <div>Title</div>
                        <div style={{textAlign: 'right'}}>Time</div>
                    </li>
                    {albumTracks.map((albumTrack, index) => {
                        const isCurrent = track && track.trackId === albumTrack.trackId;
                        return (
                            <li key={albumTrack.trackId} className={`track-item ${isCurrent && isPlaying ? 'playing' : ''}`} style={{gridTemplateColumns: '40px 1fr 100px'}} onClick={() => onSelectTrack(albumTrack)}>
                                <div className="track-number">
                                    <span className="index">{index + 1}</span>
                                    <button className="play-button">{isCurrent && isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                                </div>
                                <div className="track-info">
                                    <img src={albumTrack.artworkUrl100} alt={albumTrack.trackName} className="track-album-art" />
                                    <div>
                                        <div className="track-title">{albumTrack.trackName}</div>
                                        <div className="track-artist">{albumTrack.artistName}</div>
                                    </div>
                                </div>
                                <div className="track-duration" style={{textAlign: 'right'}}>{formatDuration(albumTrack.trackTimeMillis)}</div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
};

// --- Main App Component ---
const socket = io(BACKEND_URL);

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('profile')));
  const [showAuthModal, setShowAuthModal] = useState(!JSON.parse(localStorage.getItem('profile')));
  const [showSessionModal, setShowSessionModal] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("Top Hits");
  const [tracks, setTracks] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [view, setView] = useState('search');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentAlbumTracks, setCurrentAlbumTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInput, setUserInput] = useState("Top Hits");
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef(null);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('profile', JSON.stringify(data));
    setUser(data);
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('profile');
    setUser(null);
    setFavorites({});
    if(sessionId) handleEndSession();
    setShowAuthModal(true); // Show login modal on signout
  };

  const apiFetch = async (url, options = {}) => {
    const profile = JSON.parse(localStorage.getItem('profile'));
    const token = profile?.token;
    const headers = { ...options.headers, 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) { 
        handleSignOut(); 
        throw new Error('Session expired. Please sign in again.'); 
    }
    return response;
  };

  useEffect(() => {
    if (!user) {
        setShowAuthModal(true);
        return;
    };

    const fetchFavorites = async () => {
        try {
            const response = await apiFetch(`${BACKEND_URL}/api/favorites`);
            if (!response.ok) return;
            const favTracks = await response.json();
            setFavorites(favTracks.reduce((acc, t) => ({...acc, [t.trackId]: t}), {}));
        } catch (error) { console.error("Failed to fetch favorites:", error); }
    };
    fetchFavorites();
  }, [user]);

  useEffect(() => {
    socket.on('connect', () => console.log('Connected to socket server.'));
    socket.on('disconnect', () => console.log('Disconnected from socket server.'));
    socket.on('new_message', (message) => setChatMessages((prev) => [...prev, message]));
    socket.on('user_joined', (message) => setChatMessages((prev) => [...prev, {...message, isSystem: true}]));

    socket.on('update_playback', (data) => {
        setIsSyncing(true);
        const { action, track, timestamp } = data;

        if (track && currentTrack?.trackId !== track.trackId) {
            handlePlayPause(track, true);
        }

        if (action === 'play') {
            if(audioRef.current) {
                audioRef.current.currentTime = timestamp;
                audioRef.current.play().catch(e => console.error("Sync play error:", e));
                setIsPlaying(true);
            }
        } else if (action === 'pause') {
            if(audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = timestamp;
                setIsPlaying(false);
            }
        }
        
        setTimeout(() => setIsSyncing(false), 200);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_message');
      socket.off('update_playback');
      socket.off('user_joined');
    };
  }, [currentTrack]);

  const handleSessionStart = (newSessionId) => {
    socket.emit('join_session', newSessionId);
    setSessionId(newSessionId);
    setShowSessionModal(false);
    setIsChatVisible(true);
    setChatMessages([]);
  };

  const handleEndSession = () => {
    socket.emit('leave_session', sessionId);
    setSessionId(null);
    setIsChatVisible(false);
    setChatMessages([]);
  };
  
  const handleSendMessage = (text) => {
    if (!user) return;
    socket.emit('chat_message', { sessionId, user: user.result.username, text });
  };
  
  useEffect(() => {
    const fetchInitialTracks = async () => {
      if (!searchTerm) return; 
      setIsLoading(true);
      try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=50`);
        const data = await response.json();
        setTracks(data.results.filter(track => track.previewUrl));
      } catch (error) { console.error("Error fetching iTunes API:", error); } 
      finally { setIsLoading(false); }
    };
    fetchInitialTracks();
  }, [searchTerm]);

  const fetchAlbumTracks = async (collectionId) => {
      try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${collectionId}&entity=song`);
        const data = await response.json();
        setCurrentAlbumTracks(data.results.slice(1).filter(t => t.previewUrl));
      } catch (error) { console.error("Failed to fetch album tracks:", error); }
  }

  const handlePlayPause = (track, fromSocket = false) => {
    if (currentTrack && currentTrack.trackId === track.trackId) {
      if (isPlaying) {
          audioRef.current.pause();
          if (sessionId && !isSyncing && !fromSocket) socket.emit('playback_control', { sessionId, action: 'pause', timestamp: audioRef.current.currentTime });
      } else {
          audioRef.current.play().catch(e => console.error("Play error:", e));
          if (sessionId && !isSyncing && !fromSocket) socket.emit('playback_control', { sessionId, action: 'play', timestamp: audioRef.current.currentTime });
      }
      setIsPlaying(!isPlaying);
    } else {
      if (audioRef.current) audioRef.current.pause();
      
      const newAudio = new Audio(track.previewUrl);
      newAudio.crossOrigin = "anonymous";
      
      setCurrentTrack(track);
      if (track.collectionId) fetchAlbumTracks(track.collectionId);
      setView('player');
      audioRef.current = newAudio;
      
      newAudio.play().catch(e => console.error("Error playing new audio:", e));
      setIsPlaying(true);
      
      if (sessionId && !isSyncing && !fromSocket) {
        socket.emit('playback_control', { sessionId, action: 'play', track, timestamp: 0 });
      }
      
      newAudio.onloadedmetadata = () => setDuration(newAudio.duration);
      newAudio.ontimeupdate = () => setProgress(newAudio.currentTime);
      newAudio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
    }
  };

  const handlePlayerPlayPause = () => {
    if (!currentTrack) return;
    handlePlayPause(currentTrack);
  };
 
  const toggleFavorite = async (track) => {
    if (!user) { setShowAuthModal(true); return; }
    const isFavorited = !!favorites[track.trackId];
    const newFavorites = { ...favorites };
    const method = isFavorited ? 'DELETE' : 'POST';
    const endpoint = isFavorited ? `${BACKEND_URL}/api/favorites/${track.trackId}` : `${BACKEND_URL}/api/favorites`;

    if (isFavorited) {
        delete newFavorites[track.trackId];
    } else {
        newFavorites[track.trackId] = track;
    }
    setFavorites(newFavorites);
    
    try {
        const body = method === 'POST' ? JSON.stringify({ track }) : null;
        await apiFetch(endpoint, { method, body });
    } catch (error) {
        console.error(`Failed to update favorite:`, error);
        setFavorites(favorites); // Revert on failure
    }
  };
  
  const handleSearchSubmit = (e) => { 
    e.preventDefault(); 
    setView('search'); 
    setSearchTerm(userInput || "Top Hits");
  };

  const formatDuration = (millis) => { 
      const minutes = Math.floor(millis / 60000); 
      const seconds = ((millis % 60000) / 1000).toFixed(0); 
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; 
  };
  
  if (!user) {
    // MODIFIED: This logic is simplified to always show the modal if not logged in.
    return (
        <>
            <GlobalStyles/>
            <AuthModal onClose={() => { /* Cannot close if not logged in */ }} onAuthSuccess={handleAuthSuccess} />
        </>
    );
  }

  return (
    <>
      <GlobalStyles />
      {showSessionModal && <SessionModal onClose={() => setShowSessionModal(false)} onSessionStart={handleSessionStart} />}
      <div className="music-player-app">
        <aside className="sidebar">
          <div>
              <h1 className="logo"><LogoIcon /> iPlay</h1>
              <ul className="nav-group">
                  <li className={`nav-item ${view === 'search' ? 'active' : ''}`} onClick={() => setView('search')}><HomeIcon /> Home</li>
                  <li className="nav-item"><SearchIcon /> Search</li>
                  <li className="nav-item"><LibraryIcon /> Your Library</li>
              </ul>
          </div>
          <div>
             <ul className="nav-group">
                  <li className="nav-item"><PlusIcon /> Create Playlist</li>
                  <li className={`nav-item ${view === 'favorites' ? 'active' : ''}`} onClick={() => setView('favorites')}><HeartIcon filled={true} /> Liked Songs</li>
                  <li className="nav-item" onClick={() => setShowSessionModal(true)}><PeopleIcon /> Listen Together</li>
             </ul>
             <hr />
          </div>
        </aside>

        <main className="main-content">
          <header className="header">
            <div className="header-left">
                <form className="search-form" onSubmit={handleSearchSubmit}>
                    <input type="text" placeholder="Search for Artists, Songs..." value={userInput} onChange={e => setUserInput(e.target.value)}/>
                </form>
            </div>
            <div className="header-right">
                {sessionId && (
                    <button className={`icon-button ${isChatVisible ? 'active' : ''}`} onClick={() => setIsChatVisible(!isChatVisible)} title="Toggle Chat">
                        <ChatIcon />
                    </button>
                )}
                {/* MODIFIED: Make sure user.result exists before trying to access username */}
                <div className="user-profile" onClick={handleSignOut}>Sign Out ({user?.result?.username})</div>
            </div>
          </header>
          
          {view === 'player' && currentTrack ? (
            <PlayerView track={currentTrack} albumTracks={currentAlbumTracks} isPlaying={isPlaying} progress={progress} duration={duration} onPlayPause={handlePlayerPlayPause} onSelectTrack={handlePlayPause} isFavorited={!!favorites[currentTrack.trackId]} toggleFavorite={toggleFavorite} formatDuration={formatDuration} />
          ) : (
            <>
                <h2 className="view-title" style={{padding: '24px 32px'}}>{view === 'favorites' ? 'Liked Songs' : `Results for "${searchTerm}"`}</h2>
                <div className="track-list-container" style={{padding: '0 32px'}}>
                    {isLoading ? <div>Loading...</div> : 
                    <ul className="track-list">
                        <li className="track-header"><div>#</div><div>Title</div><div>Album</div><div>Genre</div><div>Time</div></li>
                        {(view === 'favorites' ? Object.values(favorites) : tracks).map((track, index) => (
                           <li key={`${track.trackId}-${index}`} className={`track-item ${currentTrack?.trackId === track.trackId && isPlaying ? 'playing' : ''}`}>
                                <div className="track-number" onClick={() => handlePlayPause(track)}>
                                    <span className="index">{index + 1}</span>
                                    <button className="play-button">{currentTrack?.trackId === track.trackId && isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                                </div>
                                <div className="track-info">
                                    <img src={track.artworkUrl100} alt={track.collectionName} className="track-album-art" />
                                    <div>
                                        <div className="track-title">{track.trackName}</div>
                                        <div className="track-artist">{track.artistName}</div>
                                    </div>
                                </div>
                                <div className="track-album">{track.collectionName}</div>
                                <div className="track-album">{track.primaryGenreName}</div>
                                <div className="track-actions">
                                    <button className={`favorite-btn ${!!favorites[track.trackId] ? 'favorited' : ''}`} onClick={() => toggleFavorite(track)}>
                                        <HeartIcon filled={!!favorites[track.trackId]} />
                                    </button>
                                    <span className="track-duration">{formatDuration(track.trackTimeMillis)}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    }
                </div>
            </>
          )}
        </main>
        
        {isChatVisible && sessionId && <ChatPanel 
            messages={chatMessages} 
            onSendMessage={handleSendMessage} 
            sessionId={sessionId} 
            onEndSession={handleEndSession}
            currentUser={user?.result?.username}
            onClose={() => setIsChatVisible(false)}
        />}

        {currentTrack && (
          <footer className="player-bar">
            <div className="player-track-info" onClick={() => setView('player')}>
              <img src={currentTrack.artworkUrl100} alt={currentTrack.collectionName} />
              <div>
                <div className="player-track-title">{currentTrack.trackName}</div>
                <div className="player-track-artist">{currentTrack.artistName}</div>
              </div>
            </div>
            <div className="player-controls">
              <button className="control-button play" onClick={handlePlayerPlayPause}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
            </div>
            <div/>
          </footer>
        )}
      </div>
    </>
  );
}

export default App;

