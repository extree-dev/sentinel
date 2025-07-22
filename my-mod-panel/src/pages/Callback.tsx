import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Callback() {
    const navigate = useNavigate();
  
    useEffect(() => {
      const code = new URLSearchParams(window.location.search).get('code');
      console.log('Received code:', code); // Добавьте это
      
      if (code) {
        axios.post('http://localhost:3001/api/auth/discord', { code })
          .then(response => {
            console.log('Auth response:', response.data); // Добавьте это
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('isAuthenticated', 'true'); // Добавьте это
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/dashboard');
          })
          .catch(error => {
            console.error('Auth error:', error.response?.data || error.message);
            navigate('/');
          });
      } else {
        navigate('/');
      }
    }, [navigate]);
  
    return <div>Processing authentication...</div>;
  }