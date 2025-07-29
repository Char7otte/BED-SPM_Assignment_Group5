$(document).ready(function() {
    // Global variables
    const currentUserId = 8; // Using user 8 since that's your test user
    let currentWeekStart = getStartOfWeek(new Date());
    let weeklyMedications = [];
    let reminderInterval;
    let snoozedReminders = new Set();

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
    loadWeeklyMedications();
    startReminderSystem();
    updateWeekDisplay();

    // Event Listeners
    $('#prev-week').click(function() {
        currentWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        loadWeeklyMedications();
        updateWeekDisplay();
    });

    $('#next-week').click(function() {
        currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        loadWeeklyMedications();
        updateWeekDisplay();
    });

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
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    function updateWeekDisplay() {
        const endOfWeek = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const startStr = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        $('#current-week').text(`${startStr} - ${endStr}`);
    }

    async function loadWeeklyMedications() {
        try {
            $('#loading-message').show();
            
            const startDate = currentWeekStart.toISOString().split('T')[0];
            const endDate = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const response = await fetch(`/medications/user/${currentUserId}/weekly?startDate=${startDate}&endDate=${endDate}`);
            
            if (!response.ok) {
                throw new Error('Failed to load weekly medications');
            }
            
            const data = await response.json();
            weeklyMedications = Array.isArray(data) ? data : data.medications || [];
            
            $('#loading-message').hide();
            displayWeeklyCalendar(weeklyMedications);
            updateWeeklySummary(weeklyMedications);
            
        } catch (error) {
            console.error('Error loading weekly medications:', error);
            $('#loading-message').html(`
                <div class="alert alert-danger">
                    <i class="fa fa-exclamation-triangle"></i> 
                    <strong>Error loading weekly medications.</strong> Please refresh the page to try again.
                </div>
            `);
        }
    }

    function displayWeeklyCalendar(medications) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let calendarHtml = '<div class="weekly-calendar">';
        
        // Create header row
        calendarHtml += '<div class="calendar-header row">';
        days.forEach(day => {
            calendarHtml += `<div class="col-md-1 col-sm-2 day-header text-center">
                <h4>${day}</h4>
            </div>`;
        });
        calendarHtml += '</div>';
        
        // Create calendar days
        calendarHtml += '<div class="calendar-days row">';
        
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(currentWeekStart.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = currentDay.toISOString().split('T')[0];
            const dayName = days[currentDay.getDay()];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            // Filter medications for this day
            const dayMedications = medications.filter(med => med.medication_date === dateStr);
            
            calendarHtml += `
                <div class="col-md-1 col-sm-2 calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">
                        <strong>${currentDay.getDate()}</strong>
                        ${isToday ? '<span class="today-label">TODAY</span>' : ''}
                    </div>
                    <div class="day-medications">
            `;
            
            if (dayMedications.length === 0) {
                calendarHtml += '<div class="no-medications">No medications</div>';
            } else {
                // Sort medications by time
                dayMedications.sort((a, b) => {
                    return new Date(`1970/01/01 ${a.medication_time}`) - new Date(`1970/01/01 ${b.medication_time}`);
                });
                
                dayMedications.forEach(med => {
                    const time12 = convertTo12Hour(med.medication_time);
                    const timeDisplay = `${time12.hour}:${time12.minute} ${time12.ampm}`;
                    const statusClass = med.is_taken ? 'taken' : 'pending';
                    const statusIcon = med.is_taken ? 'fa-check-circle' : 'fa-clock-o';
                    
                    calendarHtml += `
                        <div class="medication-item ${statusClass}" data-med-id="${med.medication_id}">
                            <div class="med-time">
                                <i class="fa ${statusIcon}"></i> ${timeDisplay}
                            </div>
                            <div class="med-name" title="${med.medication_name}">
                                ${med.medication_name.length > 12 ? med.medication_name.substring(0, 12) + '...' : med.medication_name}
                            </div>
                            <div class="med-dosage">${med.medication_dosage}</div>
                            <div class="med-actions">
                                ${!med.is_taken ? 
                                    `<button class="btn btn-xs btn-success take-btn" onclick="markAsTakenWeekly(${med.medication_id})">
                                        <i class="fa fa-check"></i>
                                    </button>` : 
                                    `<span class="taken-badge"><i class="fa fa-check"></i></span>`
                                }
                                <button class="btn btn-xs btn-primary edit-btn" onclick="openEditModalWeekly(${med.medication_id})">
                                    <i class="fa fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
            
            calendarHtml += `
                    </div>
                </div>
            `;
        }
        
        calendarHtml += '</div></div>';
        $('#weekly-calendar').html(calendarHtml);
    }

    function updateWeeklySummary(medications) {
        const total = medications.length;
        const taken = medications.filter(med => med.is_taken).length;
        const remaining = total - taken;
        const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
        
        $('#weekly-total').text(total);
        $('#weekly-taken').text(taken);
        $('#weekly-remaining').text(remaining);
        $('#weekly-progress')
            .css('width', percentage + '%')
            .text(percentage + '%');
    }

    // Time conversion helpers
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

    // Setup time dropdowns
    function setupTimeDropdowns() {
        $('#time-hour, #time-minute, #time-ampm').change(function() {
            const hour = $('#time-hour').val();
            const minute = $('#time-minute').val();
            const ampm = $('#time-ampm').val();
            
            if (hour && minute && ampm) {
                const time24 = convertTo24Hour(hour, minute, ampm);
                $('#time').val(time24);
            }
        });
        
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

    // CRUD Operations
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
                loadWeeklyMedications();
                $('#medication-form')[0].reset();
                showSuccessMessage('Medication added successfully!');
            },
            error: function(error) {
                console.error('Error adding medication:', error);
                alert('Failed to add medication. Please try again.');
            }
        });
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
                loadWeeklyMedications();
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
                loadWeeklyMedications();
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
                        const time12 = convertTo12Hour(med.medication_time);
                        const timeDisplay = `${time12.hour}:${time12.minute} ${time12.ampm}`;
                        html += `
                            <div class="search-result-item" style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 3px;">
                                <h5 style="margin: 0 0 5px 0;">${med.medication_name}</h5>
                                <p style="margin: 0; font-size: 12px; color: #666;">
                                    <strong>Dosage:</strong> ${med.medication_dosage}<br>
                                    <strong>Time:</strong> ${timeDisplay}<br>
                                    <strong>Date:</strong> ${med.medication_date}
                                </p>
                                ${med.is_taken ? 
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

    // Reminder System
    function startReminderSystem() {
        checkForReminders();
        reminderInterval = setInterval(checkForReminders, 30000);
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
        const time12 = convertTo12Hour(reminder.medication_time);
        const timeDisplay = `${time12.hour}:${time12.minute} ${time12.ampm}`;
        
        const reminderHtml = `
            <div class="reminder-item">
                <h4>${reminder.medication_name}</h4>
                <p><strong>Dosage:</strong> ${reminder.medication_dosage}</p>
                <p><strong>Time:</strong> ${timeDisplay}</p>
                ${reminder.medication_notes ? `<p><strong>Notes:</strong> ${reminder.medication_notes}</p>` : ''}
                <div class="alert alert-warning">
                    <i class="fa fa-clock-o"></i> It's time to take your medication!
                </div>
            </div>
        `;

        $('#reminderContent').html(reminderHtml);
        $('#acknowledgeReminder').data('med-id', reminder.medication_id);
        $('#snoozeReminder').data('med-id', reminder.medication_id);
        $('#reminderPopup').modal('show');
    }

    function showSuccessMessage(message) {
        const alertHtml = `
            <div class="alert alert-success alert-dismissible" role="alert" style="margin-top: 20px;">
                <button type="button" class="close" data-dismiss="alert">
                    <span>&times;</span>
                </button>
                <i class="fa fa-check-circle"></i> <strong>${message}</strong>
            </div>
        `;
        $('#weekly-calendar').prepend(alertHtml);
        
        setTimeout(() => {
            $('.alert-success').fadeOut();
        }, 5000);
    }

    // Initialize
    setupTimeDropdowns();

    // Global functions for inline onclick handlers
    window.markAsTakenWeekly = async function(medicationId) {
        try {
            const response = await fetch(`/medications/${currentUserId}/${medicationId}/is-taken`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to mark medication as taken');

            showSuccessMessage('Medication marked as taken!');
            await loadWeeklyMedications();
            
        } catch (error) {
            console.error('Error marking medication as taken:', error);
            alert('Failed to mark medication as taken. Please try again.');
        }
    };

    window.openEditModalWeekly = function(medicationId) {
        const medication = weeklyMedications.find(med => med.medication_id === medicationId);
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

    function updateTakenStatus(medicationId) {
        markAsTakenWeekly(medicationId);
    }
});
