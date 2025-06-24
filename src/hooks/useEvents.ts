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
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        throw new Error(`イベントの削除に失敗しました: ${error.message}`);
      }

      console.log('Event deleted successfully');
      await fetchEvents();
    } catch (err) {
      console.error('Exception deleting event:', err);
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