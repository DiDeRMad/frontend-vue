import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface WorldState {
  timestamp: number;
  players: Player[];
  world: { width: number; height: number };
}

const socket: Socket = io('http://localhost:3000');

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [state, setState] = useState<WorldState | null>(null);
  const [nameInput, setNameInput] = useState('');

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

      // draw name
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, p.x, p.y - 15);
    });
  }, [state, playerId]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      socket.emit('setName', nameInput.trim());
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Super Game Prototype</h2>
      <form onSubmit={handleNameSubmit} style={{ marginBottom: 8 }}>
        <input
          placeholder="Enter name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
        <button type="submit">Set</button>
      </form>
      <canvas
        ref={canvasRef}
        width={state?.world.width ?? 600}
        height={state?.world.height ?? 600}
        style={{ border: '1px solid #333' }}
      />
      <p>Use WASD or arrow keys to move.</p>
    </div>
  );
}