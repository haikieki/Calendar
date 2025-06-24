import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent, EventFormData } from '../types/event';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const createEvent = async (eventData: EventFormData) => {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    await fetchEvents();
    return data;
  };

  const updateEvent = async (id: string, eventData: Partial<EventFormData>) => {
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await fetchEvents();
    return data;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    await fetchEvents();
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