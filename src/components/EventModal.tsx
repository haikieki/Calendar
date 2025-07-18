import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, FileText, Clock, AlertCircle, Copy, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { PROJECTS, LOCATIONS, type CalendarEvent, type EventFormData } from '../types/event';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  event?: CalendarEvent | null;
  copyingEvent?: CalendarEvent | null;
  initialDate?: string;
}

export function EventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  event, 
  copyingEvent,
  initialDate 
}: EventModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      project: 'SEVENDAO',
      title: '',
      start: '',
      end: '',
      location: '',
      memo: '',
    }
  });

  const memoValue = watch('memo');
  const locationValue = watch('location');

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start);
      const endDate = event.end ? new Date(event.end) : null;
      
      // Check if the location is in our predefined list
      const isCustomLocation = event.location && !LOCATIONS.some(loc => loc.value === event.location);
      
      reset({
        project: event.project,
        title: event.title,
        start: startDate.toISOString().slice(0, 16),
        end: endDate?.toISOString().slice(0, 16) || '',
        location: isCustomLocation ? 'その他' : (event.location || ''),
        memo: event.memo || '',
      });
      
      setShowCustomLocation(isCustomLocation);
      if (isCustomLocation) {
        setValue('location', event.location || '');
      }
    } else if (copyingEvent) {
      // When copying an event, use the event data but with new date/time
      const date = initialDate ? new Date(initialDate) : new Date();
      const isCustomLocation = copyingEvent.location && !LOCATIONS.some(loc => loc.value === copyingEvent.location);
      
      reset({
        project: copyingEvent.project,
        title: `${copyingEvent.title} (コピー)`,
        start: date.toISOString().slice(0, 16),
        end: '',
        location: isCustomLocation ? 'その他' : (copyingEvent.location || ''),
        memo: copyingEvent.memo || '',
      });
      
      setShowCustomLocation(isCustomLocation);
      if (isCustomLocation) {
        setValue('location', copyingEvent.location || '');
      }
    } else if (initialDate) {
      const date = new Date(initialDate);
      reset({
        project: 'SEVENDAO',
        title: '',
        start: date.toISOString().slice(0, 16),
        end: '',
        location: '',
        memo: '',
      });
      setShowCustomLocation(false);
    }
  }, [event, copyingEvent, initialDate, reset, setValue]);

  // Handle location dropdown change
  useEffect(() => {
    if (locationValue === 'その他') {
      setShowCustomLocation(true);
      setValue('location', '');
    } else {
      setShowCustomLocation(false);
    }
  }, [locationValue, setValue]);

  const handleClose = () => {
    onClose();
    reset();
    setError('');
    setShowPreview(false);
    setShowCustomLocation(false);
    setDeleteLoading(false);
  };

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    setError('');

    try {
      // Validate dates
      const startDate = new Date(data.start);
      const endDate = data.end ? new Date(data.end) : null;
      
      if (endDate && endDate <= startDate) {
        throw new Error('終了日時は開始日時より後に設定してください');
      }

      // Convert dates to ISO strings
      const formattedData: EventFormData = {
        ...data,
        start: startDate.toISOString(),
        end: endDate ? endDate.toISOString() : undefined,
        // Ensure empty strings are converted to null for optional fields
        location: data.location?.trim() || undefined,
        memo: data.memo?.trim() || undefined,
      };

      console.log('Submitting event data:', formattedData);
      await onSave(formattedData);
      handleClose();
    } catch (err) {
      console.error('Error saving event:', err);
      setError(err instanceof Error ? err.message : 'イベントの保存中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    
    if (confirm('このイベントを削除してもよろしいですか？この操作は取り消せません。')) {
      setDeleteLoading(true);
      setError('');
      
      try {
        await onDelete(event.id);
        handleClose();
      } catch (err) {
        console.error('Error deleting event:', err);
        setError(err instanceof Error ? err.message : 'イベントの削除中にエラーが発生しました');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const selectedProject = PROJECTS.find(p => p.name === watch('project'));

  const getModalTitle = () => {
    if (copyingEvent) return 'イベントをコピー';
    if (event) return 'イベント編集';
    return '新規イベント';
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${selectedProject?.color}20` }}
                >
                  {copyingEvent ? (
                    <Copy className="w-5 h-5" style={{ color: selectedProject?.color }} />
                  ) : (
                    <Calendar className="w-5 h-5" style={{ color: selectedProject?.color }} />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getModalTitle()}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-6 space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">エラーが発生しました</p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      プロジェクト <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('project', { required: 'プロジェクトを選択してください' })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {PROJECTS.map((project) => (
                        <option key={project.name} value={project.name}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {errors.project && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.project.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      タイトル <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('title', { 
                        required: 'タイトルを入力してください',
                        minLength: { value: 1, message: 'タイトルを入力してください' }
                      })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="イベントタイトル"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      開始日時 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register('start', { required: '開始日時を入力してください' })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {errors.start && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      終了日時
                    </label>
                    <input
                      type="datetime-local"
                      {...register('end')}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    場所
                  </label>
                  {!showCustomLocation ? (
                    <select
                      {...register('location')}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {LOCATIONS.map((location) => (
                        <option key={location.value} value={location.value}>
                          {location.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        {...register('location')}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="カスタム場所を入力"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomLocation(false);
                          setValue('location', '');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                      >
                        プリセットから選択
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <FileText className="w-4 h-4 inline mr-1" />
                      メモ (Markdown対応)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      {showPreview ? '編集' : 'プレビュー'}
                    </button>
                  </div>
                  
                  {showPreview ? (
                    <div className="w-full h-32 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 overflow-y-auto">
                      <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                        {memoValue || '*プレビューするには内容を入力してください*'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      {...register('memo')}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder="イベントの詳細情報（Markdown記法対応）"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div>
                  {event && onDelete && (
                    <motion.button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading || deleteLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {deleteLoading ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>{deleteLoading ? '削除中...' : '削除'}</span>
                    </motion.button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    type="button"
                    onClick={handleClose}
                    disabled={loading || deleteLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    キャンセル
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading || deleteLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{loading ? '保存中...' : '保存'}</span>
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}