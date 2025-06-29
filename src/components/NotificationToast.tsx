import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NOTIFICATION_ICONS, NOTIFICATION_COLORS } from '../types/notification';
import type { Notification } from '../types/notification';

export function NotificationToast() {
  const { notifications } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);

  useEffect(() => {
    // 新しい通知をトーストとして表示
    setVisibleToasts(prevToasts => {
      const newNotifications = notifications.filter(n => 
        !n.is_read && 
        !prevToasts.some(t => t.id === n.id)
      );

      if (newNotifications.length > 0) {
        return [...prevToasts, ...newNotifications.slice(0, 3)]; // 最大3つまで
      }
      
      return prevToasts;
    });
  }, [notifications]);

  const removeToast = (notificationId: string) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== notificationId));
  };

  // 自動削除タイマー
  useEffect(() => {
    visibleToasts.forEach(toast => {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 5000); // 5秒後に自動削除

      return () => clearTimeout(timer);
    });
  }, [visibleToasts]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {visibleToasts.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              delay: index * 0.1 
            }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm w-full backdrop-blur-sm"
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 text-lg ${NOTIFICATION_COLORS[notification.type]}`}>
                {NOTIFICATION_ICONS[notification.type]}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              
              <motion.button
                onClick={() => removeToast(notification.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
            
            {/* Progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-1 bg-blue-500 rounded-full mt-3"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}