import { useState } from 'react';
import type { CalendarEvent } from '../types/event';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize Google API
  const initializeGoogleAPI = async () => {
    return new Promise((resolve, reject) => {
      if (typeof window.gapi !== 'undefined' && window.gapi.auth2) {
        resolve(window.gapi);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            // Initialize both client and auth2
            await window.gapi.client.init({
              apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
              clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
              scope: 'https://www.googleapis.com/auth/calendar'
            });

            // Ensure auth2 is properly initialized
            await window.gapi.auth2.init({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/calendar'
            });

            resolve(window.gapi);
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Connect to Google Calendar
  const connectToGoogle = async () => {
    setLoading(true);
    try {
      await initializeGoogleAPI();
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      
      setIsConnected(true);
      return { success: true };
    } catch (error) {
      console.error('Google Calendar connection failed:', error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from Google Calendar
  const disconnectFromGoogle = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        await authInstance.signOut();
      }
      setIsConnected(false);
      return { success: true };
    } catch (error) {
      console.error('Google Calendar disconnect failed:', error);
      return { success: false, error: error as Error };
    }
  };

  // Export event to Google Calendar
  const exportToGoogleCalendar = async (event: CalendarEvent) => {
    setLoading(true);
    try {
      if (!isConnected) {
        const result = await connectToGoogle();
        if (!result.success) {
          throw new Error('Google Calendar接続に失敗しました');
        }
      }

      const googleEvent: GoogleCalendarEvent = {
        id: event.id,
        summary: `[${event.project}] ${event.title}`,
        description: event.memo || '',
        location: event.location || '',
        start: {
          dateTime: event.start,
        },
        end: {
          dateTime: event.end || event.start,
        },
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent,
      });

      return { success: true, data: response.result };
    } catch (error) {
      console.error('Export to Google Calendar failed:', error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  // Import events from Google Calendar
  const importFromGoogleCalendar = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      if (!isConnected) {
        const result = await connectToGoogle();
        if (!result.success) {
          throw new Error('Google Calendar接続に失敗しました');
        }
      }

      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate || new Date().toISOString(),
        timeMax: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events: CalendarEvent[] = response.result.items?.map((item: GoogleCalendarEvent) => ({
        id: item.id,
        project: 'SEVENDAO', // Default project
        title: item.summary || 'Untitled Event',
        start: item.start.dateTime || item.start.date || '',
        end: item.end?.dateTime || item.end?.date || null,
        location: item.location || null,
        memo: item.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [];

      return { success: true, data: events };
    } catch (error) {
      console.error('Import from Google Calendar failed:', error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  // Generate Google Calendar URL for quick add
  const generateGoogleCalendarUrl = (event: CalendarEvent) => {
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[${event.project}] ${event.title}`,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: event.memo || '',
      location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return {
    isConnected,
    loading,
    connectToGoogle,
    disconnectFromGoogle,
    exportToGoogleCalendar,
    importFromGoogleCalendar,
    generateGoogleCalendarUrl,
  };
}