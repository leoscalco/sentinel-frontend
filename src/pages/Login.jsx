import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // The path the user was trying to go to before being redirected to login
    const from = location.state?.from?.pathname || "/dashboard";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError('Falha no login: verifique suas credenciais.');
        }
    };

    const handleGoogleSuccess = (credentialResponse) => {
        // Here you would typically send the credentialResponse.credential to the backend
        // to verify the token and authenticate/register the user.
        console.log("Google token:", credentialResponse.credential);
        alert('Funcionalidade de Login com Google conectada! Necessário validar token no servidor no proximo passo.');
    };

    return (
        <div className="min-h-screen flex text-brand-navy bg-brand-gray items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-brand-navy">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Login</h1>
                    <p className="text-gray-500">Acesse o seu portal do Sentinel</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold mb-1">E-mail</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-navy focus:outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Senha</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-navy focus:outline-none" 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full bg-brand-navy text-white font-bold py-3 rounded mt-2 hover:bg-blue-900 transition bg-opacity-95"
                    >
                        Entrar
                    </button>
                </form>

                <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute border-t border-gray-300 w-full"></div>
                    <span className="bg-white px-3 text-sm text-gray-500 relative">Ou entre com</span>
                </div>

                <div className="flex justify-center mb-6">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Ocorreu um erro com o login do Google.')}
                        shape="rectangular"
                        theme="outline"
                        size="large"
                    />
                </div>

                <div className="text-center text-sm">
                    Ainda não tem conta? <Link to="/register" className="font-bold text-brand-navy hover:underline">Cadastre-se</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
