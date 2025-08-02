/**
 * Date and Time Utility Functions
 * Uses a lightweight approach for client-side date formatting
 */

const DateUtils = {
  /**
   * Format date to readable format (e.g., "December 15, 2023")
   */
  formatDate: function(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Format time to readable format (e.g., "2:30 PM")
   */
  formatTime: function(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },

  /**
   * Format datetime to readable format (e.g., "Dec 15, 2023 at 2:30 PM")
   */
  formatDateTime: function(dateString, timeString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    let formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    if (timeString) {
      formatted += ' at ' + this.formatTime(timeString);
    }
    
    return formatted;
  },

  /**
   * Get relative time (e.g., "2 days ago", "in 3 hours")
   */
  getRelativeTime: function(dateString, timeString = null) {
    if (!dateString) return '';
    
    let targetDate = new Date(dateString);
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      targetDate.setHours(parseInt(hours), parseInt(minutes));
    }
    
    const now = new Date();
    const diffMs = targetDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));

    if (Math.abs(diffDays) >= 1) {
      return diffDays > 0 ? `in ${diffDays} day${diffDays !== 1 ? 's' : ''}` : `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
    } else if (Math.abs(diffHours) >= 1) {
      return diffHours > 0 ? `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}` : `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`;
    } else if (Math.abs(diffMinutes) > 5) {
      return diffMinutes > 0 ? `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}` : `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''} ago`;
    } else {
      return 'now';
    }
  },

  /**
   * Format date for input fields (YYYY-MM-DD)
   */
  formatForInput: function(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
};

// Make available globally
window.DateUtils = DateUtils;
