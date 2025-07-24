// components/DiscordAuth.tsx
import { useEffect } from 'react';

const DiscordAuth = () => {
  const handleLogin = () => {
    const clientId = 'YOUR_CLIENT_ID';
    const redirectUri = encodeURIComponent('http://localhost:3000/auth/callback');
    const scope = encodeURIComponent('identify guilds');
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    window.location.href = discordAuthUrl;
  };

  return (
    <div className="auth-container">
      <h2>Вход через Discord</h2>
      <button onClick={handleLogin} className="discord-login-btn">
        Войти с помощью Discord
      </button>
    </div>
  );
};

export default DiscordAuth;