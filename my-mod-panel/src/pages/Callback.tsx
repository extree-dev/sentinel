import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    
    if (code) {
      axios.post('http://localhost:3001/api/auth/discord', { code })
        .then(response => {
          localStorage.setItem('token', response.data.token);
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('Auth error:', error);
          navigate('/');
        });
    } else {
      navigate('/');
    }
  }, [navigate]);

  return <div>Processing authentication...</div>;
}