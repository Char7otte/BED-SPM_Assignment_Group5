(function() {
    'use strict';
    
    // Prevent multiple declarations
    if (window.DateUtils) {
        console.log('DateUtils already exists, skipping redeclaration');
        return;
    }

    const DateUtils = {
        formatDate: function(dateString) {
            if (!dateString) return 'Not specified';
            
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Invalid date';
                
                const options = { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                };
                return date.toLocaleDateString('en-US', options);
            } catch (error) {
                console.error('Error formatting date:', error);
                return 'Invalid date';
            }
        },

        formatTime: function(timeString) {
            if (!timeString) return 'Not specified';
            
            try {
                const timeParts = timeString.split(':');
                if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0]);
                    const minutes = timeParts[1];
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    return `${displayHours}:${minutes} ${ampm}`;
                }
                return timeString;
            } catch (error) {
                console.error('Error formatting time:', error);
                return timeString;
            }
        },

        getRelativeTime: function(date, time) {
            try {
                const now = new Date();
                let medDateTime;
                
                if (time) {
                    medDateTime = new Date(`${date}T${time}`);
                } else {
                    medDateTime = new Date(date);
                }
                
                if (isNaN(medDateTime.getTime())) return 'Invalid date';
                
                const diffMinutes = Math.round((medDateTime - now) / (1000 * 60));
                
                if (diffMinutes <= 0) {
                    return 'Now';
                } else if (diffMinutes < 60) {
                    return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
                } else if (diffMinutes < 1440) { // Less than 24 hours
                    const hours = Math.floor(diffMinutes / 60);
                    return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
                } else {
                    const days = Math.floor(diffMinutes / 1440);
                    return `in ${days} day${days !== 1 ? 's' : ''}`;
                }
            } catch (error) {
                console.error('Error calculating relative time:', error);
                return 'Unknown';
            }
        }
    };

    // Safely assign to window
    Object.defineProperty(window, 'DateUtils', {
        value: DateUtils,
        writable: false,
        configurable: false
    });

    console.log('DateUtils loaded successfully');
})();
