import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  x: number;
  y: number;
}

interface WorldState {
  timestamp: number;
  players: Player[];
}

const socket: Socket = io('http://localhost:3000');

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [state, setState] = useState<WorldState | null>(null);

  useEffect(() => {
    socket.on('init', (player: Player) => {
      setPlayerId(player.id);
    });

    socket.on('state', (s: WorldState) => {
      setState(s);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      let dx = 0;
      let dy = 0;
      const speed = 5;
      if (key === 'arrowup' || key === 'w') dy = -speed;
      if (key === 'arrowdown' || key === 's') dy = speed;
      if (key === 'arrowleft' || key === 'a') dx = -speed;
      if (key === 'arrowright' || key === 'd') dx = speed;
      if (dx !== 0 || dy !== 0) {
        socket.emit('move', { dx, dy });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    state.players.forEach((p) => {
      ctx.fillStyle = p.id === playerId ? 'red' : 'blue';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [state, playerId]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Super Game Prototype</h2>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        style={{ border: '1px solid #333' }}
      />
      <p>Use WASD or arrow keys to move.</p>
    </div>
  );
}