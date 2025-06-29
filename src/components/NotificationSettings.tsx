import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Mail, Clock, Filter, Save } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { PROJECTS } from '../types/event';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { settings, updateSettings, requestPermission } = useNotifications();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    
    setSaving(true);
    await updateSettings(localSettings);
    setSaving(false);
    onClose();
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      if (!granted) {
        alert('ブラウザの通知許可が必要です。ブラウザの設定から通知を許可してください。');
        return;
      }
    }
    
    setLocalSettings(prev => prev ? { ...prev, push_notifications: enabled } : null);
  };

  const toggleProjectFilter = (projectName: string) => {
    if (!localSettings) return;
    
    const currentFilters = localSettings.project_filters || [];
    const newFilters = currentFilters.includes(projectName)
      ? currentFilters.filter(p => p !== projectName)
      : [...currentFilters, projectName];
    
    setLocalSettings(prev => prev ? { ...prev, project_filters: newFilters } : null);
  };

  const updateReminderMinutes = (minutes: number, enabled: boolean) => {
    if (!localSettings) return;
    
    const currentReminders = localSettings.reminder_minutes || [];
    const newReminders = enabled
      ? [...currentReminders, minutes].sort((a, b) => a - b)
      : currentReminders.filter(m => m !== minutes);
    
    setLocalSettings(prev => prev ? { ...prev, reminder_minutes: newReminders } : null);
  };

  if (!isOpen || !localSettings) return null;

  return (
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
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                通知設定
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* 基本設定 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              基本設定
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    プッシュ通知
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ブラウザ通知を受け取る
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.push_notifications}
                  onChange={(e) => handlePushNotificationToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    新規イベント通知
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    新しいイベントが追加された時
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.new_event_notifications}
                  onChange={(e) => setLocalSettings(prev => prev ? { ...prev, new_event_notifications: e.target.checked } : null)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    イベント更新通知
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    イベントが変更された時
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.event_update_notifications}
                  onChange={(e) => setLocalSettings(prev => prev ? { ...prev, event_update_notifications: e.target.checked } : null)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>
            </div>
          </div>

          {/* リマインダー設定 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              リマインダー
            </h3>
            
            <div className="space-y-3">
              {[
                { minutes: 15, label: '15分前' },
                { minutes: 60, label: '1時間前' },
                { minutes: 1440, label: '1日前' },
                { minutes: 10080, label: '1週間前' },
              ].map(({ minutes, label }) => (
                <label key={minutes} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <input
                    type="checkbox"
                    checked={localSettings.reminder_minutes.includes(minutes)}
                    onChange={(e) => updateReminderMinutes(minutes, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* プロジェクトフィルター */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              プロジェクトフィルター
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              通知を受け取るプロジェクトを選択（未選択の場合は全プロジェクト）
            </p>
            
            <div className="space-y-3">
              {PROJECTS.map((project) => (
                <label key={project.name} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={localSettings.project_filters.length === 0 || localSettings.project_filters.includes(project.name)}
                    onChange={() => toggleProjectFilter(project.name)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {project.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex space-x-3">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              キャンセル
            </motion.button>
            <motion.button
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <Save className="w-4 h-4" />
              <span>{saving ? '保存中...' : '保存'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}