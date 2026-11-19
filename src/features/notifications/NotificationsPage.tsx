import { Bell } from 'lucide-react';
import { useState } from 'react';
import { SectionHeader, Card } from '@/components/ui/demo-ui';
import { NOTIFICATION_MESSAGES } from './messages';
import { NotificationList, NotificationListHeaderBadge } from './NotificationList';
import { useNotificationPolling } from './useNotificationPolling';

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useNotificationPolling({ enabled: true, onCount: setUnreadCount });

  return (
    <div>
      <SectionHeader
        title={NOTIFICATION_MESSAGES.panelTitle}
        subtitle="Eventos de proyecto, reuniones, issues y documentación"
      />
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-white/6 px-6 py-4">
          <Bell size={16} className="text-[#9CA3AF]" aria-hidden="true" />
          <span className="text-sm font-medium text-[#F9FAFB]">
            {NOTIFICATION_MESSAGES.panelTitle}
          </span>
          <NotificationListHeaderBadge count={unreadCount} />
        </div>
        <NotificationList
          unreadOnly={unreadOnly}
          onUnreadOnlyChange={setUnreadOnly}
          onUnreadCountChange={setUnreadCount}
        />
      </Card>
    </div>
  );
}
