import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, LogIn, LogOut, Plus } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import { NotificationSettings } from './NotificationSettings';

interface HeaderProps {
  onLoginClick: () => void;
  onNewEventClick: () => void;
}

export function Header({ onLoginClick, onNewEventClick }: HeaderProps) {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user, signOut } = useAuth();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="glass-card border-b border-gray-200/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <img 
                  src="/49311281b407599fe966d8b236dabd35 copy.jpg" 
                  alt="SEVEN DAO Logo" 
                  className="w-8 h-8 object-contain"
                />
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
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium backdrop-blur-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">新規イベント</span>
                </motion.button>
              )}

              {user && (
                <NotificationBell 
                  onSettingsClick={() => setShowNotificationSettings(true)} 
                />
              )}

              <motion.button
                onClick={toggleDarkMode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors backdrop-blur-sm"
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
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors backdrop-blur-sm"
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
                  className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium backdrop-blur-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">ログイン</span>
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </>
  );
}