import { useEffect, useRef } from 'react'; // Добавлен useRef
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Callback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Флаг для отслеживания выполнения запроса
    const requestInProgress = useRef(false); // Используем useRef напрямую

    useEffect(() => {
        const code = searchParams.get('code');
        
        if (!code) {
            console.error("No authorization code found in URL");
            navigate('/');
            return;
        }

        // Если запрос уже выполняется - игнорируем повторный вызов
        if (requestInProgress.current) return;
        requestInProgress.current = true;

        console.log("Exchanging authorization code:", code);
        
        const exchangeCode = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/discord/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Token exchange failed');
                }

                const data = await response.json();
                console.log('Received tokens from server:', data);
                
                localStorage.setItem('discord_access_token', data.access_token);
                navigate('/dashboard');
            } catch (error) {
                console.error('Callback error:', error);
                navigate('/');
            } finally {
                requestInProgress.current = false;
            }
        };

        exchangeCode();
    }, [navigate, searchParams]);

    return (
        <div className="callback-container">
            <h2>Processing Discord login...</h2>
            <p>Please wait while we authenticate your account.</p>
        </div>
    );
}