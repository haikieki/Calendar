import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PROJECTS, type CalendarEvent } from '../types/event';

interface EventListProps {
  events: CalendarEvent[];
  visibleProjects: Set<string>;
  onEventClick: (event: CalendarEvent) => void;
  isAdmin: boolean;
}

export function EventList({ events, visibleProjects, onEventClick, isAdmin }: EventListProps) {
  const filteredEvents = events.filter(event => visibleProjects.has(event.project));
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  
  const upcomingEvents = sortedEvents.filter(event => 
    new Date(event.start) >= new Date()
  ).slice(0, 10);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getProjectColor = (projectName: string) => {
    return PROJECTS.find(p => p.name === projectName)?.color || '#6B7280';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          今後のイベント
        </h2>
      </div>
      
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {visibleProjects.size === 0 ? 'プロジェクトを選択してください' : '予定されたイベントはありません'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => {
              const { date, time } = formatDate(event.start);
              const projectColor = getProjectColor(event.project);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    isAdmin ? 'hover:shadow-md' : ''
                  }`}
                  style={{ borderLeftColor: projectColor }}
                  onClick={() => isAdmin && onEventClick(event)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center space-x-1 mt-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: projectColor }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {event.project}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {date}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {time}
                      </div>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      {event.location}
                    </div>
                  )}
                  
                  {event.memo && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      <ReactMarkdown className="prose prose-xs dark:prose-invert">
                        {event.memo.slice(0, 100)}
                        {event.memo.length > 100 ? '...' : ''}
                      </ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}