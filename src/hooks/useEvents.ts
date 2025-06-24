import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent, EventFormData } from '../types/event';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      console.error('Exception fetching events:', err);
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const createEvent = async (eventData: EventFormData) => {
    try {
      console.log('Creating event with data:', eventData);
      
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        throw new Error(`イベントの作成に失敗しました: ${error.message}`);
      }

      console.log('Event created successfully:', data);
      await fetchEvents();
      return data;
    } catch (err) {
      console.error('Exception creating event:', err);
      throw err;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<EventFormData>) => {
    try {
      console.log('Updating event:', id, eventData);
      
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        throw new Error(`イベントの更新に失敗しました: ${error.message}`);
      }

      console.log('Event updated successfully:', data);
      await fetchEvents();
      return data;
    } catch (err) {
      console.error('Exception updating event:', err);
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      console.log('Deleting event:', id);
      
      // First check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('認証が必要です。ログインしてください。');
      }

      // Check if user has admin privileges
      const isAdmin = user.email === 'admin@sevendao.dev' || 
                     user.user_metadata?.role === 'admin' ||
                     user.app_metadata?.role === 'admin';
      
      if (!isAdmin) {
        throw new Error('管理者権限が必要です。');
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        
        // Provide more specific error messages
        if (error.code === 'PGRST116') {
          throw new Error('削除するイベントが見つかりません。');
        } else if (error.code === '42501') {
          throw new Error('削除権限がありません。管理者としてログインしてください。');
        } else if (error.message.includes('JWT')) {
          throw new Error('認証エラーです。再度ログインしてください。');
        } else {
          throw new Error(`イベントの削除に失敗しました: ${error.message}`);
        }
      }

      console.log('Event deleted successfully');
      await fetchEvents();
    } catch (err) {
      console.error('Exception deleting event:', err);
      
      // Handle network errors specifically
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        throw new Error('ネットワークエラーです。インターネット接続を確認してください。');
      }
      
      throw err;
    }
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
}