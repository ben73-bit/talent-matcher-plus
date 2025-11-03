import { useState, useEffect } from 'react';

export interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  timestamp: number;
}

const NOTIFICATIONS_STORAGE_KEY = 'app_notifications';
const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Nuovo candidato aggiunto",
    description: "Un nuovo candidato è stato inserito nel sistema",
    time: "2 ore fa",
    timestamp: Date.now() - 2 * 60 * 60 * 1000
  },
  {
    id: 2,
    title: "Colloquio programmato",
    description: "Colloquio fissato per domani alle 10:00",
    time: "5 ore fa",
    timestamp: Date.now() - 5 * 60 * 60 * 1000
  },
  {
    id: 3,
    title: "Aggiornamento sistema",
    description: "Nuove funzionalità disponibili",
    time: "1 giorno fa",
    timestamp: Date.now() - 24 * 60 * 60 * 1000
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (stored) {
          setNotifications(JSON.parse(stored));
        } else {
          setNotifications(DEFAULT_NOTIFICATIONS);
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
      setIsInitialized(true);
    };

    loadNotifications();
  }, []);

  const deleteNotification = (id: number) => {
    setNotifications((prev) => {
      const updated = prev.filter((notif) => notif.id !== id);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    setNotifications((prev) => {
      const newId = Math.max(...prev.map((n) => n.id), 0) + 1;
      const newNotification: Notification = {
        ...notification,
        id: newId,
        timestamp: Date.now(),
      };
      const updated = [newNotification, ...prev];
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
  };

  const markAllAsRead = () => {
    const updated = notifications.map((notif) => ({
      ...notif,
      unread: false,
    }));
    setNotifications(updated);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  };

  return {
    notifications,
    isInitialized,
    deleteNotification,
    addNotification,
    clearAllNotifications,
    markAllAsRead,
  };
}
