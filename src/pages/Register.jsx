import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        crm: '',
        address: '',
        phone_24h: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao realizar o cadastro. Tente novamente.');
        }
    };

    return (
        <div className="min-h-screen flex text-brand-navy bg-brand-gray items-center justify-center py-12 px-4 font-sans">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg border-t-4 border-brand-champagne">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Cadastro</h1>
                    <p className="text-gray-500">Proteja-se na prática médica com o Sentinel</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Nome Completo</label>
                        <input name="name" type="text" required onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-navy focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">E-mail</label>
                            <input name="email" type="email" required onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-navy focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Senha</label>
                            <input name="password" type="password" required onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-navy focus:outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">CRM</label>
                            <input name="crm" type="text" required onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-navy focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Telefone (24h)</label>
                            <input name="phone_24h" type="text" required onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-navy focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Endereço da Clínica/Consultório</label>
                        <input name="address" type="text" required onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-navy focus:outline-none" />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full bg-brand-navy text-brand-champagne font-bold py-3 rounded mt-4 hover:bg-blue-900 transition bg-opacity-95"
                    >
                        Criar Conta
                    </button>
                </form>

                <div className="text-center mt-6 text-sm">
                    Já possui conta? <Link to="/login" className="font-bold text-brand-navy hover:underline">Fazer Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
