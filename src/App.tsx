import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { ProjectFilter } from './components/ProjectFilter';
import { EventList } from './components/EventList';
import { AuthModal } from './components/AuthModal';
import { EventModal } from './components/EventModal';
import { useAuth } from './hooks/useAuth';
import { useEvents } from './hooks/useEvents';
import { PROJECTS, type CalendarEvent } from './types/event';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { events, loading: eventsLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  
  const [visibleProjects, setVisibleProjects] = useState<Set<string>>(
    new Set(PROJECTS.map(p => p.name))
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleToggleProject = (project: string) => {
    const newVisible = new Set(visibleProjects);
    if (newVisible.has(project)) {
      newVisible.delete(project);
    } else {
      newVisible.add(project);
    }
    setVisibleProjects(newVisible);
  };

  const handleDateClick = (date: string) => {
    if (user?.isAdmin) {
      setSelectedEvent(null);
      setSelectedDate(date);
      setShowEventModal(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (user?.isAdmin) {
      setSelectedEvent(event);
      setSelectedDate('');
      setShowEventModal(true);
    }
  };

  const handleNewEventClick = () => {
    if (user?.isAdmin) {
      setSelectedEvent(null);
      setSelectedDate(new Date().toISOString());
      setShowEventModal(true);
    }
  };

  const handleEventSave = async (eventData: any) => {
    if (selectedEvent) {
      await updateEvent(selectedEvent.id, eventData);
    } else {
      await createEvent(eventData);
    }
    setShowEventModal(false);
  };

  const handleEventDelete = async (id: string) => {
    await deleteEvent(id);
    setShowEventModal(false);
  };

  if (authLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg text-gray-600 dark:text-gray-400">読み込み中...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header 
        onLoginClick={() => setShowAuthModal(true)}
        onNewEventClick={handleNewEventClick}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-3">
            <Calendar
              events={events}
              visibleProjects={visibleProjects}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              isAdmin={user?.isAdmin || false}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProjectFilter
              visibleProjects={visibleProjects}
              onToggleProject={handleToggleProject}
            />
            
            <EventList
              events={events}
              visibleProjects={visibleProjects}
              onEventClick={handleEventClick}
              isAdmin={user?.isAdmin || false}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSave={handleEventSave}
        onDelete={selectedEvent ? handleEventDelete : undefined}
        event={selectedEvent}
        initialDate={selectedDate}
      />
    </div>
  );
}

export default App;