import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, LogIn, UserPlus, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signin') {
        const { error } = await signIn({ email, password });
        if (error) {
          setError(error.message);
        } else {
          handleClose();
        }
      } else {
        const { error } = await signUp({ 
          email, 
          password, 
          full_name: fullName.trim() || undefined 
        });
        if (error) {
          setError(error.message);
        } else {
          setMessage('アカウントが作成されました。確認メールをご確認ください。');
          setTimeout(() => {
            handleClose();
          }, 2000);
        }
      }
    } catch (err) {
      setError('予期しないエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('パスワードリセットにはメールアドレスが必要です。');
      return;
    }

    setLoading(true);
    setError('');
    
    const { error } = await resetPassword(email);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('パスワードリセットメールを送信しました。');
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setMessage('');
    setMode('signin');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setMessage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {mode === 'signin' ? (
                      <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {mode === 'signin' ? 'ログイン' : 'アカウント作成'}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      お名前
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="山田太郎"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    パスワード
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      placeholder={mode === 'signup' ? '8文字以上のパスワード' : 'パスワードを入力'}
                      required
                      minLength={mode === 'signup' ? 8 : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      8文字以上で入力してください
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{mode === 'signin' ? 'ログイン中...' : 'アカウント作成中...'}</span>
                    </div>
                  ) : (
                    mode === 'signin' ? 'ログイン' : 'アカウント作成'
                  )}
                </motion.button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <button
                    onClick={toggleMode}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    {mode === 'signin' 
                      ? 'アカウントをお持ちでない方はこちら' 
                      : '既にアカウントをお持ちの方はこちら'
                    }
                  </button>
                </div>

                {mode === 'signin' && (
                  <div className="text-center">
                    <button
                      onClick={handlePasswordReset}
                      disabled={loading}
                      className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium disabled:opacity-50"
                    >
                      パスワードを忘れた方はこちら
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  デモ用管理者アカウント:<br />
                  <strong>admin@sevendao.dev</strong> / <strong>password123</strong>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}