import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Mail, Clock, Save } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from '../types/notification';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { settings, updateSettings, requestPermission } = useNotifications();
  const [formData, setFormData] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
    
    // ブラウザ通知の許可状態をチェック
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings(formData);
      onClose();
    } catch (err) {
      console.error('Failed to save notification settings:', err);
    }
    setLoading(false);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setPermissionGranted(granted);
    if (granted) {
      setFormData(prev => ({ ...prev, pushNotifications: true }));
    }
  };

  const handleReminderToggle = (minutes: number) => {
    setFormData(prev => ({
      ...prev,
      reminderMinutes: prev.reminderMinutes.includes(minutes)
        ? prev.reminderMinutes.filter(m => m !== minutes)
        : [...prev.reminderMinutes, minutes].sort((a, b) => a - b)
    }));
  };

  const reminderOptions = [
    { value: 5, label: '5分前' },
    { value: 15, label: '15分前' },
    { value: 30, label: '30分前' },
    { value: 60, label: '1時間前' },
    { value: 120, label: '2時間前' },
    { value: 1440, label: '1日前' },
    { value: 2880, label: '2日前' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    通知設定
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* ブラウザ通知 */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  ブラウザ通知
                </h3>
                
                {!permissionGranted && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                      ブラウザ通知を受け取るには、通知の許可が必要です。
                    </p>
                    <button
                      onClick={handleRequestPermission}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      通知を許可する
                    </button>
                  </div>
                )}

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pushNotifications && permissionGranted}
                    onChange={(e) => setFormData(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    disabled={!permissionGranted}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className={`text-sm ${!permissionGranted ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    ブラウザ通知を有効にする
                  </span>
                </label>
              </div>

              {/* メール通知 */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  メール通知
                </h3>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    メール通知を有効にする
                  </span>
                </label>
              </div>

              {/* イベント通知 */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  イベント通知
                </h3>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.newEventNotifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, newEventNotifications: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      新しいイベントの通知
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.eventUpdateNotifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventUpdateNotifications: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      イベント更新の通知
                    </span>
                  </label>
                </div>
              </div>

              {/* リマインダー設定 */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  リマインダー
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  イベント開始前に通知するタイミングを選択してください
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {reminderOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.reminderMinutes.includes(option.value)}
                        onChange={() => handleReminderToggle(option.value)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  キャンセル
                </button>
                <motion.button
                  onClick={handleSave}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <Save className="w-4 h-4" />
                  <span>{loading ? '保存中...' : '保存'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}