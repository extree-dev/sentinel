import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    
    if (error) {
      const reason = params.get('reason') || 'unknown';
      navigate(`/?error=${error}&reason=${reason}`);
      return;
    }

    // Если успешный callback, перенаправляем на страницу успеха
    navigate('/dashboard');
  }, [navigate]);

  return <div>Processing authentication...</div>;
}