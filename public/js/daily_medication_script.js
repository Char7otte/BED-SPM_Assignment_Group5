$(document).ready(function() {
    // Global variables
    const currentUserId = 8; // Using user 8 since that's your test user
    let dailyMedications = [];
    let reminderInterval;
    let snoozedReminders = new Set(); // Track snoozed reminders

    function decodeJwtPayload(token) {
    const jwt = token.split(" ")[1]; // remove 'Bearer'
    const payloadBase64 = jwt.split(".")[1]; // get payload
    const payloadJson = atob(payloadBase64); // decode base64
    return JSON.parse(payloadJson); // parse to JSON
    }

    function isTokenExpired(token) {
        const decoded = decodeJwtPayload(token);
        if (!decoded || !decoded.exp) return true;
        return decoded.exp < Date.now() / 1000;
    }

    const token = localStorage.getItem('token');
    console.log("Token from localStorage:", token);
    if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirect to login
    }

    // Check for token in cookies if not found in localStorage
    if (!localStorage.getItem('token')) {
        const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
        if (match) {
            localStorage.setItem('token', decodeURIComponent(match[1]));
        } else {
            window.location.href = "/login.html";
        }
    }

    // Initialize the page
    displayCurrentDate();
    loadDailyMedications();
    startReminderSystem();

    // Event Listeners
    $('#save-med-btn').click(addMedication);
    $('#update-med-btn').click(updateMedication);
    $('#delete-med-btn').click(deleteMedication);

    // Search functionality
    $('#search-btn').click(function() {
        const searchTerm = $('#search-input').val().trim();
        if (searchTerm) {
            searchMedications(searchTerm);
        }
    });

    $('#search-input').keypress(function(e) {
        if (e.which === 13) {
            $('#search-btn').click();
        }
    });

    // Set default values when Add Medication modal is opened
    $('#addMedModal').on('show.bs.modal', function() {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        $('#medication-date').val(today);
        $('#prescription-start').val(today);
        $('#prescription-end').val(thirtyDaysLater);
        $('#reminders').prop('checked', true);
    });

    // Reminder popup event listeners
    $('#acknowledgeReminder').click(function() {
        $('#reminderPopup').modal('hide');
        const medicationId = $(this).data('med-id');
        if (medicationId) {
            updateTakenStatus(medicationId);
        }
    });

    $('#snoozeReminder').click(function() {
        const medicationId = $(this).data('med-id');
        if (medicationId) {
            snoozedReminders.add(medicationId);
            setTimeout(() => {
                snoozedReminders.delete(medicationId);
            }, 5 * 60 * 1000); // 5 minutes
        }
        $('#reminderPopup').modal('hide');
    });

    // Functions
    function displayCurrentDate() {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        $('#current-date').text(today.toLocaleDateString('en-US', options));
    }

    // Replace your existing loadDailyMedications function with this:
    async function loadDailyMedications() {
        try {
            // Show loading message if element exists
            const loadingElement = $('#loading-message');
            if (loadingElement.length) {
                loadingElement.show();
            }
            
            const response = await fetch(`/medications/user/${currentUserId}/daily`);
            
            if (!response.ok) {
                throw new Error('Failed to load daily medications');
            }
            
            const data = await response.json();
            
            // Handle different response formats
            if (data.medications) {
                dailyMedications = data.medications;
            } else if (Array.isArray(data)) {
                dailyMedications = data;
            } else {
                dailyMedications = [];
            }
            
            // Hide loading message
            if (loadingElement.length) {
                loadingElement.hide();
            }
            
            displayDailyMedications(dailyMedications);
            updateDailyProgress(dailyMedications);
            
            // Set up reminder checking
            if (reminderInterval) clearInterval(reminderInterval);
            reminderInterval = setInterval(checkForReminders, 30000);
            
        } catch (error) {
            console.error('Error loading daily medications:', error);
            const loadingElement = $('#loading-message');
            if (loadingElement.length) {
                loadingElement.html(`
                    <div class="alert alert-danger">
                        <i class="fa fa-exclamation-triangle"></i> 
                        <strong>Error loading medications.</strong> Please refresh the page to try again.
                    </div>
                `);
            }
        }
    }

    // Helper function to map backend data to frontend format
    function mapMedicationData(med) {
        return {
            id: med.medication_id,
            name: med.medication_name,
            dosage: med.medication_dosage,
            quantity: med.medication_quantity,
            time: med.medication_time,
            notes: med.medication_notes,
            isTaken: med.is_taken,
            date: med.medication_date,
            reminders: med.medication_reminders,
            prescriptionStart: med.prescription_startdate,
            prescriptionEnd: med.prescription_enddate
        };
    }

    function displayDailyMedications(medications) {
        if (medications.length === 0) {
            $('#medication-container').html(`
                <div class="alert alert-info text-center" style="font-size: 20px; padding: 40px;">
                    <i class="fa fa-smile-o fa-4x" style="color: #27ae60; margin-bottom: 20px;"></i><br>
                    <strong>Great News!</strong><br>
                    <span style="font-size: 18px;">You have no medications scheduled for today.</span>
                </div>
            `);
            return;
        }

        // Sort by time
        const sortedMeds = medications.sort((a, b) => {
            return new Date(`1970/01/01 ${a.medication_time}`) - new Date(`1970/01/01 ${b.medication_time}`);
        });

        let html = '';
        sortedMeds.forEach(medication => {
            html += displayDailyMedicationForElderly(medication);
        });
        
        $('#medication-container').html(html);
    }

    // Time conversion helpers (same as before)
    function convertTo12Hour(time24) {
        if (!time24) return { hour: '', minute: '', ampm: '' };
        
        const [hours, minutes] = time24.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        
        return {
            hour: hour12.toString().padStart(2, '0'),
            minute: minutes,
            ampm: ampm
        };
    }

    function convertTo24Hour(hour12, minute, ampm) {
        if (!hour12 || !minute || !ampm) return '';
        
        let hour24 = parseInt(hour12);
        if (ampm === 'AM' && hour24 === 12) hour24 = 0;
        if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
        
        return `${hour24.toString().padStart(2, '0')}:${minute}`;
    }

    function displayDailyMedicationForElderly(medication) {
        const time12 = convertTo12Hour(medication.medication_time);
        const timeDisplay = `${time12.hour}:${time12.minute} ${time12.ampm}`;
        const currentTime = new Date();
        const medTime = new Date(`${medication.medication_date} ${medication.medication_time}`);
        const isTimeToTake = currentTime >= medTime;
        
        // Determine card styling based on status
        let cardClass = 'medication-card';
        let statusBadge = '';
        let actionButton = '';
        
        if (medication.is_taken) {
            cardClass += ' medication-taken';
            statusBadge = '<span class="label label-success pull-right"><i class="fa fa-check"></i> TAKEN</span>';
            actionButton = `
                <button class="btn btn-secondary btn-lg" disabled style="margin-bottom: 10px;">
                    <i class="fa fa-check-circle"></i> Already Taken
                </button>`;
        } else if (isTimeToTake) {
            cardClass += ' medication-due';
            statusBadge = '<span class="label label-warning pull-right animate-pulse"><i class="fa fa-clock-o"></i> DUE NOW</span>';
            actionButton = `
                <button class="btn btn-success btn-lg take-medication-btn" 
                        onclick="markAsTakenDaily(${medication.medication_id})" 
                        style="margin-bottom: 10px; animation: pulse 2s infinite;">
                    <i class="fa fa-check"></i> TAKE NOW
                </button>`;
        } else {
            statusBadge = '<span class="label label-info pull-right"><i class="fa fa-clock-o"></i> SCHEDULED</span>';
            actionButton = `
                <button class="btn btn-default btn-lg" 
                        onclick="markAsTakenDaily(${medication.medication_id})" 
                        style="margin-bottom: 10px;">
                    <i class="fa fa-check"></i> Mark as Taken
                </button>`;
        }
        
        return `
            <div class="${cardClass}" data-id="${medication.medication_id}" style="position: relative;">
                ${statusBadge}
                <h3><i class="fa fa-pills"></i> ${medication.medication_name}</h3>
                <div class="row">
                    <div class="col-md-8">
                        <p><strong><i class="fa fa-clock-o"></i> Time:</strong> 
                           <span class="medication-time" style="font-size: 24px; color: ${isTimeToTake ? '#e74c3c' : '#2c3e50'};">
                               ${timeDisplay}
                           </span>
                        </p>
                        <p><strong><i class="fa fa-prescription-bottle"></i> Dosage:</strong> 
                           <span style="font-size: 20px;">${medication.medication_dosage || 'As prescribed'}</span>
                        </p>
                        ${medication.medication_quantity ? 
                            `<p><strong><i class="fa fa-pills"></i> Quantity Remaining:</strong> 
                             <span style="font-size: 18px;">${medication.medication_quantity}</span></p>` : ''
                        }
                        ${medication.medication_notes ? 
                            `<p><strong><i class="fa fa-sticky-note"></i> Notes:</strong> 
                             <span style="font-size: 16px; font-style: italic;">${medication.medication_notes}</span></p>` : ''
                        }
                    </div>
                    <div class="col-md-4 text-center">
                        <div class="medication-actions">
                            ${actionButton}
                            <button class="btn btn-primary" onclick="openEditModal(${medication.medication_id})" style="margin-bottom: 5px;">
                                <i class="fa fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-info" onclick="setMedicationReminder(${medication.medication_id})" style="margin-bottom: 5px;">
                                <i class="fa fa-bell"></i> Remind Me
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function updateDailyProgress(medications) {
        const total = medications.length;
        const taken = medications.filter(med => med.is_taken).length;
        const remaining = total - taken;
        const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
        
        // Update counters
        $('#total-meds').text(total);
        $('#taken-meds').text(taken);
        $('#remaining-meds').text(remaining);
        
        // Update progress bar
        $('#daily-progress')
            .css('width', percentage + '%')
            .text(percentage + '%');
        
        // Show/hide completion elements
        if (percentage === 100 && total > 0) {
            $('#mark-all-taken').hide();
            $('#completion-message').show();
            celebrateDailyCompletion();
        } else if (remaining > 0) {
            $('#mark-all-taken').show();
            $('#completion-message').hide();
        } else {
            $('#mark-all-taken').hide();
            $('#completion-message').hide();
        }
    }

    function addMedication() {
        const medication = {
            user_id: parseInt(currentUserId),
            medication_name: $('#name').val(),
            medication_date: $('#medication-date').val(),
            medication_time: $('#time').val(),
            medication_dosage: $('#dosage').val(),
            medication_quantity: $('#quantity').val(),
            medication_notes: $('#notes').val() || '',
            medication_reminders: $('#reminders').is(':checked'),
            prescription_startdate: $('#prescription-start').val(),
            prescription_enddate: $('#prescription-end').val(),
            is_taken: false
        };

        $.ajax({
            url: '/medications',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(medication),
            success: function() {
                $('#addMedModal').modal('hide');
                loadDailyMedications();
                $('#medication-form')[0].reset();
                showSuccessMessage('Medication added successfully!');
            },
            error: function(error) {
                console.error('Error adding medication:', error);
                alert('Failed to add medication. Please try again.');
            }
        });
    }

    function openEditModal(medication) {
        $('#edit-medication-id').val(medication.id);
        $('#edit-name').val(medication.name);
        $('#edit-dosage').val(medication.dosage);
        $('#edit-quantity').val(medication.quantity);
        $('#edit-medication-date').val(medication.date);
        $('#edit-time').val(medication.time);
        $('#edit-notes').val(medication.notes || '');
        $('#edit-prescription-start').val(medication.prescriptionStart);
        $('#edit-prescription-end').val(medication.prescriptionEnd);
        $('#edit-reminders').prop('checked', medication.reminders);
        $('#editMedModal').modal('show');
    }

    function updateMedication() {
        const medicationId = $('#edit-medication-id').val();
        const medication = {
            userId: parseInt(currentUserId),
            medicationName: $('#edit-name').val(),
            medicationDate: $('#edit-medication-date').val(),
            medicationTime: $('#edit-time').val(),
            medicationDosage: $('#edit-dosage').val(),
            medicationQuantity: $('#edit-quantity').val(),
            medicationNotes: $('#edit-notes').val() || '',
            medicationReminders: $('#edit-reminders').is(':checked'),
            prescriptionStartDate: $('#edit-prescription-start').val(),
            prescriptionEndDate: $('#edit-prescription-end').val(),
            isTaken: false
        };

        $.ajax({
            url: `/medications/${currentUserId}/${medicationId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(medication),
            success: function() {
                $('#editMedModal').modal('hide');
                loadDailyMedications();
                showSuccessMessage('Medication updated successfully!');
            },
            error: function(error) {
                console.error('Error updating medication:', error);
                alert('Failed to update medication. Please try again.');
            }
        });
    }

    function deleteMedication() {
        if (!confirm('Are you sure you want to delete this medication?')) return;

        const medId = $('#edit-medication-id').val();
        $.ajax({
            url: `/medications/${currentUserId}/${medId}`,
            method: 'DELETE',
            success: function() {
                $('#editMedModal').modal('hide');
                loadDailyMedications();
                showSuccessMessage('Medication deleted successfully!');
            },
            error: function(error) {
                console.error('Error deleting medication:', error);
                alert('Failed to delete medication. Please try again.');
            }
        });
    }

    function searchMedications(searchTerm) {
        $.ajax({
            url: `/medications/user/${currentUserId}/search?name=${searchTerm}`,
            method: 'GET',
            success: function(data) {
                $('#search-results').show();
                if (data.length > 0) {
                    let html = '';
                    data.forEach(med => {
                        const mappedMed = mapMedicationData(med);
                        html += `
                            <div class="search-result-item" style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 3px;">
                                <h5 style="margin: 0 0 5px 0;">${mappedMed.name}</h5>
                                <p style="margin: 0; font-size: 12px; color: #666;">
                                    <strong>Dosage:</strong> ${mappedMed.dosage}<br>
                                    <strong>Quantity:</strong> ${mappedMed.quantity}<br>
                                    <strong>Time:</strong> ${formatTime(mappedMed.time)}<br>
                                    <strong>Date:</strong> ${mappedMed.date}
                                </p>
                                ${mappedMed.isTaken ? 
                                    '<span class="label label-success">Taken</span>' : 
                                    '<span class="label label-warning">Pending</span>'
                                }
                            </div>
                        `;
                    });
                    $('#search-results-body').html(html);
                } else {
                    $('#search-results-body').html('<p>No medications found matching your search.</p>');
                }
            },
            error: function(error) {
                console.error('Error searching medications:', error);
                $('#search-results-body').html('<p class="text-danger">Error searching medications. Please try again.</p>');
            }
        });
    }

    // Reminder System Functions
    function startReminderSystem() {
        checkForReminders();
        reminderInterval = setInterval(checkForReminders, 30000); // Check every 30 seconds
    }

    function checkForReminders() {
        $.ajax({
            url: `/medications/user/${currentUserId}/reminders`,
            method: 'GET',
            success: function(reminders) {
                if (reminders && reminders.length > 0) {
                    reminders.forEach(reminder => {
                        if (!snoozedReminders.has(reminder.medication_id)) {
                            showReminderPopup(reminder);
                        }
                    });
                }
            },
            error: function(error) {
                console.error('Error checking reminders:', error);
            }
        });
    }

    function showReminderPopup(reminder) {
        const reminderHtml = `
            <div class="reminder-item" style="margin-bottom: 15px; padding: 15px; border: 1px solid #f0ad4e; border-radius: 5px; background-color: #fcf8e3;">
                <h4 style="margin-top: 0; color: #8a6d3b;">
                    <i class="fa fa-pills"></i> ${reminder.medication_name}
                </h4>
                <p><strong>Dosage:</strong> ${reminder.medication_dosage}</p>
                <p><strong>Scheduled Time:</strong> ${formatTime(reminder.medication_time)}</p>
                ${reminder.medication_notes ? `<p><strong>Notes:</strong> ${reminder.medication_notes}</p>` : ''}
                <div class="alert alert-warning" style="margin-bottom: 0;">
                    <i class="fa fa-clock-o"></i> This medication is due in 5 minutes or less!
                </div>
            </div>
        `;

        $('#reminderContent').html(reminderHtml);
        $('#acknowledgeReminder').data('med-id', reminder.medication_id);
        $('#snoozeReminder').data('med-id', reminder.medication_id);
        $('#reminderPopup').modal('show');

        // Browser notification if supported
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Medication Reminder: ${reminder.medication_name}`, {
                body: `Time to take your ${reminder.medication_dosage} dose`,
                icon: '/favicon.ico'
            });
        }
    }

    // Mark all remaining as taken
    $('#mark-all-taken').click(async function() {
        if (confirm('Are you sure you want to mark ALL remaining medications as taken?')) {
            try {
                const response = await fetch(`/medications/${currentUserId}/tick-all`, {
                    method: 'PUT'
                });

                if (!response.ok) throw new Error('Failed to mark all medications');

                showDailySuccessMessage('🎉 All remaining medications marked as taken!');
                await loadDailyMedications();
            } catch (error) {
                console.error('Error marking all medications:', error);
                showDailyErrorMessage('❌ Unable to mark all medications. Please try again.');
            }
        }
    });

    // Helper function to format time for display
    function formatTime(time24) {
        const time12 = convertTo12Hour(time24);
        return `${time12.hour}:${time12.minute} ${time12.ampm}`;
    }

    // Global function for marking medication as taken (called from HTML)
    window.markAsTakenDaily = async function(medicationId) {
        try {
            // Add visual feedback immediately
            const card = $(`.medication-card[data-id="${medicationId}"]`);
            const button = card.find('.take-medication-btn');
            
            button.prop('disabled', true)
                  .html('<i class="fa fa-spinner fa-spin"></i> Taking...');
            
            const response = await fetch(`/medications/${currentUserId}/${medicationId}/is-taken`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to mark medication as taken');

            const result = await response.json();
            
            // Show success message
            showDailySuccessMessage(`✅ Great job! You've taken your ${result.medicationName || 'medication'}.`);
            
            // Reload to update display
            await loadDailyMedications();
            
            // Check for quantity warning
            if (result.isLowQuantity) {
                showDailyWarningMessage(`⚠️ ${result.message} Please refill soon.`);
            }

        } catch (error) {
            console.error('Error marking medication as taken:', error);
            showDailyErrorMessage('❌ Unable to mark medication as taken. Please try again.');
            
            // Reset button on error
            const card = $(`.medication-card[data-id="${medicationId}"]`);
            const button = card.find('.take-medication-btn');
            button.prop('disabled', false)
                  .html('<i class="fa fa-check"></i> TAKE NOW');
        }
    };

    // Global function for opening edit modal (called from HTML)
    window.openEditModal = function(medicationId) {
        const medication = dailyMedications.find(med => med.medication_id === medicationId);
        if (!medication) return;

        const time12 = convertTo12Hour(medication.medication_time);
        
        $('#edit-medication-id').val(medication.medication_id);
        $('#edit-name').val(medication.medication_name);
        $('#edit-dosage').val(medication.medication_dosage);
        $('#edit-quantity').val(medication.medication_quantity);
        $('#edit-medication-date').val(medication.medication_date);
        $('#edit-notes').val(medication.medication_notes || '');
        $('#edit-prescription-start').val(medication.prescription_startdate);
        $('#edit-prescription-end').val(medication.prescription_enddate);
        $('#edit-reminders').prop('checked', medication.medication_reminders);
        
        $('#edit-time-hour').val(time12.hour);
        $('#edit-time-minute').val(time12.minute);
        $('#edit-time-ampm').val(time12.ampm);
        $('#edit-time').val(medication.medication_time);
        
        $('#editMedModal').modal('show');
    };

    // Global function for setting medication reminder (called from HTML)
    window.setMedicationReminder = function(medicationId) {
        const medication = dailyMedications.find(med => med.medication_id === medicationId);
        if (!medication) return;
        
        const time12 = convertTo12Hour(medication.medication_time);
        const timeDisplay = `${time12.hour}:${time12.minute} ${time12.ampm}`;
        
        alert(`⏰ Reminder set for ${medication.medication_name} at ${timeDisplay}.\nYou'll be notified when it's time to take this medication.`);
    };

    // Enhanced message functions
    function showDailySuccessMessage(message) {
        showDailyMessage(message, 'success');
    }

    function showDailyWarningMessage(message) {
        showDailyMessage(message, 'warning');
    }

    function showDailyErrorMessage(message) {
        showDailyMessage(message, 'danger');
    }

    function showDailyMessage(message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible" role="alert" style="font-size: 18px; margin-top: 20px;">
                <button type="button" class="close" data-dismiss="alert" style="font-size: 24px;">
                    <span>&times;</span>
                </button>
                <i class="fa fa-2x ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}" 
                   style="margin-bottom: 10px;"></i><br>
                <strong style="font-size: 20px;">${message}</strong>
            </div>
        `;
        $('#medication-container').prepend(alertHtml);
        
        // Auto-hide after 6 seconds
        setTimeout(() => {
            $(`.alert-${type}`).fadeOut();
        }, 6000);
    }

    // Setup time dropdowns (same as before)
    function setupTimeDropdowns() {
        // For add medication modal
        $('#time-hour, #time-minute, #time-ampm').change(function() {
            const hour = $('#time-hour').val();
            const minute = $('#time-minute').val();
            const ampm = $('#time-ampm').val();
            
            if (hour && minute && ampm) {
                const time24 = convertTo24Hour(hour, minute, ampm);
                $('#time').val(time24);
            }
        });
        
        // For edit medication modal
        $('#edit-time-hour, #edit-time-minute, #edit-time-ampm').change(function() {
            const hour = $('#edit-time-hour').val();
            const minute = $('#edit-time-minute').val();
            const ampm = $('#edit-time-ampm').val();
            
            if (hour && minute && ampm) {
                const time24 = convertTo24Hour(hour, minute, ampm);
                $('#edit-time').val(time24);
            }
        });
    }

    // Update your existing loadDailyMedications function
    async function loadDailyMedications() {
        try {
            // Show loading message if element exists
            const loadingElement = $('#loading-message');
            if (loadingElement.length) {
                loadingElement.show();
            }
            
            const response = await fetch(`/medications/user/${currentUserId}/daily`);
            
            if (!response.ok) {
                throw new Error('Failed to load daily medications');
            }
            
            const data = await response.json();
            
            // Handle different response formats
            if (data.medications) {
                dailyMedications = data.medications;
            } else if (Array.isArray(data)) {
                dailyMedications = data;
            } else {
                dailyMedications = [];
            }
            
            // Hide loading message
            if (loadingElement.length) {
                loadingElement.hide();
            }
            
            displayDailyMedications(dailyMedications);
            updateDailyProgress(dailyMedications);
            
            // Set up reminder checking
            if (reminderInterval) clearInterval(reminderInterval);
            reminderInterval = setInterval(checkForReminders, 30000);
            
        } catch (error) {
            console.error('Error loading daily medications:', error);
            const loadingElement = $('#loading-message');
            if (loadingElement.length) {
                loadingElement.html(`
                    <div class="alert alert-danger">
                        <i class="fa fa-exclamation-triangle"></i> 
                        <strong>Error loading medications.</strong> Please refresh the page to try again.
                    </div>
                `);
            }
        }
    }

    // Update your existing displayDailyMedications function
    function displayDailyMedications(medications) {
        if (medications.length === 0) {
            $('#medication-container').html(`
                <div class="alert alert-info text-center" style="font-size: 20px; padding: 40px;">
                    <i class="fa fa-smile-o fa-4x" style="color: #27ae60; margin-bottom: 20px;"></i><br>
                    <strong>Great News!</strong><br>
                    <span style="font-size: 18px;">You have no medications scheduled for today.</span>
                </div>
            `);
            return;
        }

        // Sort by time
        const sortedMeds = medications.sort((a, b) => {
            return new Date(`1970/01/01 ${a.medication_time}`) - new Date(`1970/01/01 ${b.medication_time}`);
        });

        let html = '';
        sortedMeds.forEach(medication => {
            html += displayDailyMedicationForElderly(medication);
        });
        
        $('#medication-container').html(html);
    }

    // Mark all remaining as taken
    $('#mark-all-taken').click(async function() {
        if (confirm('Are you sure you want to mark ALL remaining medications as taken?')) {
            try {
                const response = await fetch(`/medications/${currentUserId}/tick-all`, {
                    method: 'PUT'
                });

                if (!response.ok) throw new Error('Failed to mark all medications');

                showDailySuccessMessage('🎉 All remaining medications marked as taken!');
                await loadDailyMedications();
            } catch (error) {
                console.error('Error marking all medications:', error);
                showDailyErrorMessage('❌ Unable to mark all medications. Please try again.');
            }
        }
    });

    // Initialize when document ready
    $(document).ready(function() {
        // Your existing initialization code...
        setupTimeDropdowns();
        
        // Set today's date as default for new medications
        const today = new Date().toISOString().split('T')[0];
        $('#medication-date').val(today);
        
        // Display current date
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        $('#current-date').text(new Date().toLocaleDateString('en-US', options));
    });
})