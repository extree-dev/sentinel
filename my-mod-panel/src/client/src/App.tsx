import '../styles/globals.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Header } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Home } from '../pages/Home';


// Обязательно должен быть экспорт по умолчанию
export default function App() {
    return (
        <Router>
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Home />}/>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </main>
            <Footer />

        </Router>
    );
};