import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Settings, Moon, Sun, LogIn, LogOut, Plus } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onLoginClick: () => void;
  onNewEventClick: () => void;
}

export function Header({ onLoginClick, onNewEventClick }: HeaderProps) {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SEVEN DAO
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Event Calendar
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {user?.isAdmin && (
              <motion.button
                onClick={onNewEventClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">新規イベント</span>
              </motion.button>
            )}

            <motion.button
              onClick={toggleDarkMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.email}
                  </p>
                  {user.isAdmin && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      管理者
                    </p>
                  )}
                </div>
                <motion.button
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">ログアウト</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={onLoginClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">ログイン</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
}