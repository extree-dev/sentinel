import './css/HomePage.css';
import { useEffect, useState } from 'react';

// Определяем тип для частицы
interface Particle {
    id: number;
    size: number;
    left: number;
    delay: number;
    duration: number;
    opacity: number;
}

// Функция генерации частиц (возвращает массив Particle[])
const generateParticles = (): Particle[] => {
    const particles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
        particles.push({
            id: i,
            size: Math.random() * 10 + 5,
            left: Math.random() * 100,
            delay: Math.random() * 15,
            duration: Math.random() * 10 + 10,
            opacity: Math.random() * 0.3 + 0.1
        });
    }
    return particles;
};

export default function HomePage() {
    // Указываем тип состояния Particle[]
    const [particles, setParticles] = useState<Particle[]>([]);

    const handleLoginClick = () => {
        const clientId = '1394946498386722866'; // Ваш клиент ID
        const redirectUri = encodeURIComponent('http://localhost:5173/callback');
        const scope = encodeURIComponent('identify email');
        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

        window.location.href = discordAuthUrl;
    };

    useEffect(() => {
        setParticles(generateParticles());
    }, []);

    return (
        <div className="home-container">
            {/* Анимированный фон с частицами */}
            <div className="home-bg">
                {particles.map((particle) => (
                    <div
                        key={particle.id}
                        className="particle"
                        style={{
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            left: `${particle.left}%`,
                            top: '120%',
                            opacity: particle.opacity,
                            animation: `float ${particle.duration}s ${particle.delay}s infinite linear`
                        }}
                    />
                ))}
            </div>

            {/* Контент */}
            <h1 className="home-title">Добро пожаловать!</h1>

            <p className="home-description">
                Пожалуйста, войдите в свою учетную запись Discord.
            </p>

            <button className="home-button" tabIndex={0} onClick={handleLoginClick}>
                <span className="button-text">Login with Discord</span>
                <img
                    src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png"
                    alt="Discord Logo"
                    className="button-icon"
                />
            </button>
            <div className="privacy-consent">
                <svg className="privacy-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z" />
                </svg>
                <span className="privacy-text">Нажимая на кнопку, вы соглашаетесь с</span>
                <a
                    href="/privacy-policy"
                    className="privacy-link"
                    onClick={(e) => {
                        e.preventDefault();
                        // Плавный переход с анимацией
                        document.body.style.opacity = '0.8';
                        setTimeout(() => {
                            window.location.href = '/privacy';
                        }, 200);
                    }}
                    aria-label="Политика конфиденциальности"
                    data-micro-interaction="hover"
                >
                    <span className="link-text">Политикой конфиденциальности</span>
                    <svg className="external-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M10 6H6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M18 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M14 6h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </a>
            </div>
        </div>
    );
}