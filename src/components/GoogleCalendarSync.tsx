import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Download, Upload, ExternalLink, Settings, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import type { CalendarEvent } from '../types/event';

interface GoogleCalendarSyncProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onImportEvents: (events: CalendarEvent[]) => Promise<void>;
}

export function GoogleCalendarSync({ isOpen, onClose, events, onImportEvents }: GoogleCalendarSyncProps) {
  const {
    isConnected,
    loading,
    connectToGoogle,
    disconnectFromGoogle,
    exportToGoogleCalendar,
    importFromGoogleCalendar,
  } = useGoogleCalendar();

  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [importedEvents, setImportedEvents] = useState<CalendarEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnect = async () => {
    const result = await connectToGoogle();
    if (result.success) {
      setMessage({ type: 'success', text: 'Googleカレンダーに接続しました' });
    } else {
      setMessage({ type: 'error', text: 'Googleカレンダーへの接続に失敗しました' });
    }
  };

  const handleDisconnect = async () => {
    const result = await disconnectFromGoogle();
    if (result.success) {
      setMessage({ type: 'success', text: 'Googleカレンダーから切断しました' });
    } else {
      setMessage({ type: 'error', text: 'Googleカレンダーからの切断に失敗しました' });
    }
  };

  const handleExportSelected = async () => {
    if (selectedEvents.size === 0) {
      setMessage({ type: 'error', text: 'エクスポートするイベントを選択してください' });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const eventId of selectedEvents) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        const result = await exportToGoogleCalendar(event);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }
    }

    if (errorCount === 0) {
      setMessage({ type: 'success', text: `${successCount}件のイベントをエクスポートしました` });
      setSelectedEvents(new Set());
    } else {
      setMessage({ type: 'error', text: `${successCount}件成功、${errorCount}件失敗しました` });
    }
  };

  const handleImport = async () => {
    const result = await importFromGoogleCalendar();
    if (result.success) {
      setImportedEvents(result.data);
      setMessage({ type: 'success', text: `${result.data.length}件のイベントを取得しました` });
    } else {
      setMessage({ type: 'error', text: 'Googleカレンダーからのインポートに失敗しました' });
    }
  };

  const handleImportSelected = async () => {
    if (importedEvents.length === 0) {
      setMessage({ type: 'error', text: 'インポートするイベントがありません' });
      return;
    }

    try {
      await onImportEvents(importedEvents);
      setMessage({ type: 'success', text: `${importedEvents.length}件のイベントをインポートしました` });
      setImportedEvents([]);
    } catch (error) {
      setMessage({ type: 'error', text: 'イベントのインポートに失敗しました' });
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelection = new Set(selectedEvents);
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId);
    } else {
      newSelection.add(eventId);
    }
    setSelectedEvents(newSelection);
  };

  const selectAllEvents = () => {
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map(e => e.id)));
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedEvents(new Set());
    setImportedEvents([]);
    setMessage(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Googleカレンダー連携
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Connection Status */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {isConnected ? 'Googleカレンダーに接続済み' : 'Googleカレンダーに未接続'}
                    </span>
                  </div>
                  <button
                    onClick={isConnected ? handleDisconnect : handleConnect}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isConnected
                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {loading ? '処理中...' : isConnected ? '切断' : '接続'}
                  </button>
                </div>
              </div>

              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                    message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    message.type === 'success'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {message.text}
                  </p>
                </motion.div>
              )}

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('export')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'export'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  エクスポート
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'import'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  インポート
                </button>
              </div>

              {/* Export Tab */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Googleカレンダーにエクスポート
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllEvents}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                      >
                        {selectedEvents.size === events.length ? '全て解除' : '全て選択'}
                      </button>
                      <button
                        onClick={handleExportSelected}
                        disabled={!isConnected || selectedEvents.size === 0 || loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                      >
                        選択したイベントをエクスポート
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedEvents.has(event.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => toggleEventSelection(event.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              [{event.project}] {event.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(event.start).toLocaleString('ja-JP')}
                              {event.location && ` • ${event.location}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedEvents.has(event.id)}
                              onChange={() => toggleEventSelection(event.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Tab */}
              {activeTab === 'import' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Googleカレンダーからインポート
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleImport}
                        disabled={!isConnected || loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                      >
                        イベントを取得
                      </button>
                      {importedEvents.length > 0 && (
                        <button
                          onClick={handleImportSelected}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                        >
                          インポート実行
                        </button>
                      )}
                    </div>
                  </div>

                  {importedEvents.length > 0 && (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {importedEvents.map((event, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(event.start).toLocaleString('ja-JP')}
                            {event.location && ` • ${event.location}`}
                          </p>
                          {event.memo && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {event.memo}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {importedEvents.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        「イベントを取得」ボタンをクリックして、Googleカレンダーからイベントを取得してください
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}