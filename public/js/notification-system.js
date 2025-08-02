// Immediate alert function that works without waiting for the class
function createImmediateAlert(message, type) {
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        alertContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;';
        document.body.appendChild(alertContainer);
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = 'margin-bottom: 10px; padding: 10px; border-radius: 4px; position: relative;';
    
    // Set background colors
    const colors = {
        success: '#d4edda',
        warning: '#fff3cd',
        danger: '#f8d7da',
        info: '#d1ecf1'
    };
    alert.style.backgroundColor = colors[type] || colors.info;
    
    alert.innerHTML = `
        <button type="button" class="close" onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer;">
            <span>&times;</span>
        </button>
        <div style="margin-right: 30px;">${message}</div>
    `;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

class MedicationNotificationSystem {
    constructor() {
        this.notificationPermission = 'default';
        this.activeReminders = new Map();
        this.checkInterval = null;
        this.userId = null;
        this.init();
    }

    async init() {
        // Request notification permission on page load
        await this.requestNotificationPermission();
        
        // Create modal container for custom notifications
        this.createModalContainer();
        
        // Start checking for reminders every minute
        this.startReminderCheck();
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            try {
                this.notificationPermission = await Notification.requestPermission();
                console.log('Notification permission:', this.notificationPermission);
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                this.notificationPermission = 'denied';
            }
        } else {
            console.log('Browser does not support notifications');
            this.notificationPermission = 'denied';
        }
    }

    createModalContainer() {
        // Create custom modal for reminders
        const modalHTML = `
            <div id="medication-reminder-modal" class="modal fade" tabindex="-1" role="dialog" style="z-index: 9999;">
                <div class="modal-dialog modal-sm" role="document">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h4 class="modal-title">
                                <i class="fa fa-bell"></i> Medication Reminder
                            </h4>
                        </div>
                        <div class="modal-body">
                            <div id="reminder-content"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" id="take-now-btn">
                                <i class="fa fa-check"></i> Take Now
                            </button>
                            <button type="button" class="btn btn-default" id="dismiss-reminder-btn">
                                <i class="fa fa-times"></i> Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page if it doesn't exist
        if (!document.getElementById('medication-reminder-modal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listeners
            document.getElementById('dismiss-reminder-btn').addEventListener('click', () => {
                this.dismissModal();
            });
        }
    }

    setUserId(userId) {
        this.userId = userId;
    }

    startReminderCheck() {
        // Check every minute for upcoming medications
        this.checkInterval = setInterval(() => {
            this.checkForUpcomingMedications();
        }, 60000); // 60 seconds

        // Also check immediately
        this.checkForUpcomingMedications();
    }

    stopReminderCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    async checkForUpcomingMedications() {
        if (!this.userId) return;

        try {
            const response = await fetch(`/medications/user/${this.userId}/upcoming-reminders`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const upcomingMeds = await response.json();
                
                if (upcomingMeds && upcomingMeds.length > 0) {
                    upcomingMeds.forEach(med => {
                        this.showReminder(med);
                    });
                }
            }
        } catch (error) {
            console.error('Error checking for upcoming medications:', error);
        }
    }

    showReminder(medication) {
        const reminderId = `med_${medication.medication_id}`;
        
        // Don't show duplicate reminders
        if (this.activeReminders.has(reminderId)) {
            return;
        }

        this.activeReminders.set(reminderId, medication);

        // Try browser notification first
        if (this.notificationPermission === 'granted') {
            this.showBrowserNotification(medication);
        }

        // Always show custom modal as well for better visibility
        this.showCustomModal(medication);
        
        // Add visual indicator to medication list
        this.addVisualIndicator(medication);
    }

    showBrowserNotification(medication) {
        const timeFormatted = this.formatTime(medication.medication_time);
        
        try {
            const notification = new Notification('Medication Reminder', {
                body: `Time to take ${medication.medication_name} (${medication.medication_dosage}) at ${timeFormatted}`,
                icon: '/favicon.ico', // Use favicon as fallback
                tag: `medication_${medication.medication_id}`,
                requireInteraction: false // Remove this to avoid issues
            });

            notification.onclick = () => {
                window.focus();
                this.showCustomModal(medication);
                notification.close();
            };

            // Auto-close after 30 seconds
            setTimeout(() => {
                if (notification) {
                    notification.close();
                }
            }, 30000);
        } catch (error) {
            console.error('Error showing browser notification:', error);
            // Fallback to just showing the modal
        }
    }

    showCustomModal(medication) {
        const modal = document.getElementById('medication-reminder-modal');
        const content = document.getElementById('reminder-content');
        const takeNowBtn = document.getElementById('take-now-btn');
        
        if (!modal || !content || !takeNowBtn) return;

        const timeFormatted = this.formatTime(medication.medication_time);
        const relativeTime = this.getRelativeTime(medication.medication_date, medication.medication_time);
        
        content.innerHTML = `
            <div class="text-center">
                <i class="fa fa-medkit fa-3x text-warning mb-3" style="margin-bottom: 15px;"></i>
                <h5><strong>${medication.medication_name}</strong></h5>
                <p class="text-muted">${medication.medication_dosage}</p>
                <p><strong>Scheduled time:</strong> ${timeFormatted}</p>
                <p class="text-info"><small>${relativeTime}</small></p>
                ${medication.medication_notes ? `<p class="text-muted"><small><i class="fa fa-sticky-note"></i> ${medication.medication_notes}</small></p>` : ''}
            </div>
        `;

        // Update take now button
        takeNowBtn.onclick = () => {
            this.takeMedicationFromReminder(medication);
        };

        // Show modal
        if (typeof $ !== 'undefined' && $.fn.modal) {
            $(modal).modal('show');
        } else {
            modal.style.display = 'block';
            modal.classList.add('in');
            document.body.classList.add('modal-open');
        }

        // Auto-dismiss after 2 minutes
        setTimeout(() => {
            this.dismissModal();
        }, 120000);
    }

    addVisualIndicator(medication) {
        // Add pulsing indicator to medication in the list
        const medicationElements = document.querySelectorAll(`[data-medication-id="${medication.medication_id}"]`);
        
        medicationElements.forEach(element => {
            element.classList.add('medication-reminder-active');
            
            // Add reminder badge
            if (!element.querySelector('.reminder-badge')) {
                const badge = document.createElement('span');
                badge.className = 'reminder-badge badge bg-warning';
                badge.innerHTML = '<i class="fa fa-bell"></i> Due Soon';
                badge.style.cssText = 'position: absolute; top: 5px; right: 5px; animation: pulse 2s infinite; background-color: #f0ad4e; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;';
                
                element.style.position = 'relative';
                element.appendChild(badge);
            }
        });
    }

    async takeMedicationFromReminder(medication) {
        try {
            const response = await fetch(`/medications/${this.userId}/${medication.medication_id}/is-taken`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.showAlert('Medication marked as taken successfully!', 'success');
                
                // Remove reminder
                this.removeReminder(medication.medication_id);
                this.dismissModal();
                
                // Refresh medication list if function is available
                if (typeof loadDailyMedications === 'function') {
                    loadDailyMedications(this.userId);
                } else if (typeof loadWeeklyMedications === 'function') {
                    loadWeeklyMedications(this.userId);
                } else if (typeof loadAllMedications === 'function') {
                    loadAllMedications(this.userId);
                }
                
                // Show low quantity warning if applicable
                if (result.isLowQuantity) {
                    this.showAlert(result.message, 'warning');
                }
            } else {
                throw new Error('Failed to mark medication as taken');
            }
        } catch (error) {
            console.error('Error taking medication:', error);
            this.showAlert('Error marking medication as taken: ' + error.message, 'danger');
        }
    }

    removeReminder(medicationId) {
        const reminderId = `med_${medicationId}`;
        this.activeReminders.delete(reminderId);
        
        // Remove visual indicators
        const elements = document.querySelectorAll(`[data-medication-id="${medicationId}"]`);
        elements.forEach(element => {
            element.classList.remove('medication-reminder-active');
            const badge = element.querySelector('.reminder-badge');
            if (badge) {
                badge.remove();
            }
        });
    }

    dismissModal() {
        const modal = document.getElementById('medication-reminder-modal');
        if (modal) {
            if (typeof $ !== 'undefined' && $.fn.modal) {
                $(modal).modal('hide');
            } else {
                modal.style.display = 'none';
                modal.classList.remove('in');
                document.body.classList.remove('modal-open');
            }
        }
    }

    formatTime(timeString) {
        if (!timeString) return 'Not specified';
        
        if (window.DateUtils && typeof window.DateUtils.formatTime === 'function') {
            return DateUtils.formatTime(timeString);
        }
        
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0]);
            const minutes = timeParts[1];
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes} ${ampm}`;
        }
        return timeString;
    }

    getRelativeTime(date, time) {
        if (window.DateUtils && typeof window.DateUtils.getRelativeTime === 'function') {
            return DateUtils.getRelativeTime(date, time);
        }
        
        const now = new Date();
        const medDateTime = new Date(`${date}T${time}`);
        const diffMinutes = Math.round((medDateTime - now) / (1000 * 60));
        
        if (diffMinutes <= 0) {
            return 'Now';
        } else if (diffMinutes < 60) {
            return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
        }
    }

    showAlert(message, type = 'success') {
        if (typeof showAlert === 'function') {
            showAlert(message, type);
        } else {
            // Fallback alert system
            this.createFallbackAlert(message, type);
        }
    }

    createFallbackAlert(message, type) {
        // Create fallback alert if showAlert function doesn't exist
        let alertContainer = document.getElementById('alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alert-container';
            alertContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;';
            document.body.appendChild(alertContainer);
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.cssText = 'margin-bottom: 10px; padding: 10px; border-radius: 4px; position: relative;';
        
        // Set background colors
        const colors = {
            success: '#d4edda',
            warning: '#fff3cd',
            danger: '#f8d7da',
            info: '#d1ecf1'
        };
        alert.style.backgroundColor = colors[type] || colors.info;
        
        alert.innerHTML = `
            <button type="button" class="close" onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer;">
                <span>&times;</span>
            </button>
            <div style="margin-right: 30px;">${message}</div>
        `;
        
        alertContainer.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    // Utility functions for missing showLoading and showError
    showLoading(message = 'Loading...') {
        if (typeof window.showLoading === 'function') {
            window.showLoading(message);
        } else {
            this.createFallbackAlert(message, 'info');
        }
    }

    showError(message) {
        if (typeof window.showError === 'function') {
            window.showError(message);
        } else {
            this.createFallbackAlert(message, 'danger');
        }
    }

    destroy() {
        this.stopReminderCheck();
        this.activeReminders.clear();
    }
}

// Global instance
if (!window.medicationNotificationSystem) {
    window.medicationNotificationSystem = new MedicationNotificationSystem();
}

// Make utility functions globally available IMMEDIATELY
window.showLoading = window.showLoading || function(message = 'Loading...') {
    console.log('Loading:', message);
    // Create immediate fallback alert
    createImmediateAlert(message, 'info');
};

window.showError = window.showError || function(message) {
    console.error('Error:', message);
    // Create immediate fallback alert
    createImmediateAlert(message, 'danger');
};
