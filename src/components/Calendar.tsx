import React, { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { motion } from 'framer-motion';
import { PROJECTS, type CalendarEvent } from '../types/event';

interface CalendarProps {
  events: CalendarEvent[];
  visibleProjects: Set<string>;
  onDateClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  isAdmin: boolean;
}

export function Calendar({ 
  events, 
  visibleProjects, 
  onDateClick, 
  onEventClick, 
  isAdmin 
}: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Filter events based on visible projects
  const filteredEvents = events
    .filter(event => visibleProjects.has(event.project))
    .map(event => {
      const project = PROJECTS.find(p => p.name === event.project);
      return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end || undefined,
        backgroundColor: project?.color || '#6B7280',
        borderColor: project?.color || '#6B7280',
        textColor: '#FFFFFF',
        extendedProps: {
          project: event.project,
          location: event.location,
          memo: event.memo,
          originalEvent: event,
        },
      };
    });

  useEffect(() => {
    // Force calendar to re-render when events change
    const calendar = calendarRef.current?.getApi();
    if (calendar) {
      calendar.refetchEvents();
    }
  }, [filteredEvents]);

  const handleDateClick = (selectInfo: any) => {
    if (isAdmin) {
      onDateClick(selectInfo.dateStr);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    if (isAdmin) {
      const originalEvent = clickInfo.event.extendedProps.originalEvent;
      onEventClick(originalEvent);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          locale="ja"
          firstDay={1} // Monday
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          buttonText={{
            today: '今日',
            month: '月',
            week: '週',
            day: '日',
            list: 'リスト'
          }}
          events={filteredEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
          moreLinkText="他"
          eventMouseEnter={(mouseEnterInfo) => {
            const event = mouseEnterInfo.event;
            const tooltip = document.createElement('div');
            tooltip.className = 'calendar-tooltip';
            tooltip.innerHTML = `
              <div class="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-3 rounded-lg shadow-lg max-w-xs">
                <div class="font-semibold">${event.title}</div>
                <div class="text-sm mt-1">${event.extendedProps.project}</div>
                ${event.extendedProps.location ? `<div class="text-sm text-gray-300 dark:text-gray-600 mt-1">📍 ${event.extendedProps.location}</div>` : ''}
                ${event.extendedProps.memo ? `<div class="text-sm text-gray-300 dark:text-gray-600 mt-1">${event.extendedProps.memo.slice(0, 100)}${event.extendedProps.memo.length > 100 ? '...' : ''}</div>` : ''}
              </div>
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = mouseEnterInfo.el.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - 10) + 'px';
            tooltip.style.transform = 'translateY(-100%)';
            tooltip.style.zIndex = '1000';
            tooltip.style.pointerEvents = 'none';
            
            mouseEnterInfo.el.addEventListener('mouseleave', () => {
              if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
              }
            });
          }}
          viewDidMount={() => {
            // Apply dark mode styles
            const isDark = document.documentElement.classList.contains('dark');
            const calendarEl = calendarRef.current?.getApi().el;
            if (calendarEl) {
              if (isDark) {
                calendarEl.classList.add('fc-theme-dark');
              } else {
                calendarEl.classList.remove('fc-theme-dark');
              }
            }
          }}
        />
      </div>
    </motion.div>
  );
}