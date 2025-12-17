import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, type: NotificationType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'error': return <XCircle className="text-red-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
      case 'info': return <Info className="text-blue-500" size={20} />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'border-l-4 border-emerald-500 bg-white';
      case 'error': return 'border-l-4 border-red-500 bg-white';
      case 'warning': return 'border-l-4 border-amber-500 bg-white';
      case 'info': return 'border-l-4 border-blue-500 bg-white';
    }
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-lg shadow-xl shadow-slate-200 flex items-start gap-3 animate-in slide-in-from-right-full fade-in duration-300 ${getStyles(notification.type)}`}
          >
            <div className="mt-0.5 shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 mr-2">
              <p className={`text-sm font-medium ${notification.type === 'error' ? 'text-red-800' : 'text-slate-800'}`}>
                {notification.message}
              </p>
            </div>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};