'use client';

import { useEffect, useState } from 'react';
import { ServerCard } from './ServerCard';

type Server = {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
};

export function ServerList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch('/api/discord/guilds');
        const data = await res.json();
        setServers(data.filter((s: Server) => s.permissions.includes('MANAGE_GUILD')));
      } catch (err) {
        console.error('Failed to fetch servers', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  if (loading) return <div>Loading servers...</div>;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  );
}