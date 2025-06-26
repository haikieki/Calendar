export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'たった今';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}日前`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}週間前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}ヶ月前`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}年前`;
}

export function formatEventTime(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (!end) {
    return `${formatDate(start)} ${formatTime(start)}`;
  }

  const isSameDay = start.toDateString() === end.toDateString();
  
  if (isSameDay) {
    return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
  } else {
    return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
  }
}