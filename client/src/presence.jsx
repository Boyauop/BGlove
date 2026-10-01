import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function usePresence() {
  const [presence, setPresence] = useState({});
  useEffect(() => {
    const token = localStorage.getItem('bglove_token');
    if (!token) return undefined;
    const socket = io({ auth: { token }, transports: ['websocket', 'polling'] });
    const heartbeat = window.setInterval(() => socket.emit('presence:heartbeat'), 15_000);
    socket.on('presence:snapshot', setPresence);
    return () => { window.clearInterval(heartbeat); socket.disconnect(); };
  }, []);
  return presence;
}

export function PresenceLabel({ userId, presence }) {
  const state = presence?.[userId];
  if (state?.status === 'live') return <span className="presence live"><i aria-hidden="true" /> Live now</span>;
  return <span className="presence offline">Offline</span>;
}