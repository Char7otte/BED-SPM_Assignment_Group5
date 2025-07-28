$(document).ready(function() {
    // Global variables
    const currentUserId = 8; // Using user 8 since that's your test user
    let currentView = 'all';
    let medications = [];
    let reminderInterval;
    let snoozedReminders = new Set(); // Track snoozed reminders

    // Initialize the page
    loadMedications();
    startReminderSystem();

    // Event Listeners
    $('.view-toggle').click(function(e) {
        e.preventDefault();
        $('.view-toggle').removeClass('active');
        $(this).addClass('active');
        currentView = $(this).data('view');
        
        // Handle navigation to daily page
        if (currentView === 'daily') {
            window.location.href = '/medications/daily';
            return;
        }
        
        // Update view description for other views
        let description = '';
        switch(currentView) {
            case 'all':
                description = 'Showing all your medications';
                break;
            case 'weekly':
                description = 'Showing this week\'s medications';
                break;
        }
        $('#view-description').text(description);
        
        loadMedications();
    });

    $('#search-btn').click(function() {
        const searchTerm = $('#search-input').val().trim();
        if (searchTerm) {
            searchMedications(searchTerm);
        }
    });

    $('#save-med-btn').click(addMedication);
    $('#update-med-btn').click(updateMedication);
    $('#delete-med-btn').click(deleteMedication);

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
            // Remove from snoozed list after 5 minutes
            setTimeout(() => {
                snoozedReminders.delete(medicationId);
            }, 5 * 60 * 1000); // 5 minutes
        }
        $('#reminderPopup').modal('hide');
    });

    // Handle Enter key in search
    $('#search-input').keypress(function(e) {
        if (e.which === 13) {
            $('#search-btn').click();
        }
    });

    // Functions
    function loadMedications() {
        let endpoint;
        
        if (currentView === 'daily') {
            endpoint = `/medications/user/${currentUserId}/daily`;
        } else if (currentView === 'weekly') {
            endpoint = `/medications/user/${currentUserId}/weekly`;
        } else {
            // Default to all medications
            endpoint = `/medications/user/${currentUserId}`;
        }

        $.ajax({
            url: endpoint,
            method: 'GET',
            success: function(data) {
                // Handle different response formats
                if (currentView === 'daily' && data.medications) {
                    medications = data.medications.map(mapMedicationData);
                } else if (Array.isArray(data)) {
                    medications = data.map(mapMedicationData);
                } else {
                    medications = [];
                }
                renderMedications();
            },
            error: function(error) {
                console.error('Error loading medications:', error);
                $('#medication-container').html('<div class="alert alert-danger">Failed to load medications. Please try again.</div>');
            }
        });
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
                            <div class="medication-card">
                                <h5>${mappedMed.name}</h5>
                                <p><strong>Dosage:</strong> ${mappedMed.dosage}</p>
                                <p><strong>Time:</strong> ${mappedMed.time}</p>
                                ${mappedMed.notes ? `<p><strong>Notes:</strong> ${mappedMed.notes}</p>` : ''}
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
                alert('Failed to search medications. Please try again.');
            }
        });
    }

    // Reminder System Functions
    function startReminderSystem() {
        // Check for reminders every 30 seconds
        reminderInterval = setInterval(checkForReminders, 30000);
        // Also check immediately
        checkForReminders();
    }

    function checkForReminders() {
        $.ajax({
            url: `/medications/user/${currentUserId}/reminders`,
            method: 'GET',
            success: function(data) {
                if (data && data.length > 0) {
                    // Filter out snoozed reminders
                    const activeReminders = data.filter(med => !snoozedReminders.has(med.medication_id));
                    
                    if (activeReminders.length > 0) {
                        showReminderPopup(activeReminders);
                    }
                }
            },
            error: function(error) {
                console.error('Error checking reminders:', error);
            }
        });
    }

    function showReminderPopup(reminders) {
        // Don't show popup if it's already visible
        if ($('#reminderPopup').hasClass('in')) {
            return;
        }

        let reminderHtml = '';
        if (reminders.length === 1) {
            const med = reminders[0];
            reminderHtml = `
                <div class="reminder-item">
                    <div class="medication-icon">
                        <i class="fa fa-pill fa-3x text-warning"></i>
                    </div>
                    <h4>${med.medication_name}</h4>
                    <p><strong>Time:</strong> ${med.medication_time}</p>
                    <p><strong>Dosage:</strong> ${med.medication_dosage}</p>
                    ${med.medication_notes ? `<p><strong>Notes:</strong> ${med.medication_notes}</p>` : ''}
                    <p class="text-info"><i class="fa fa-clock-o"></i> It's time to take your medication!</p>
                </div>
            `;
            $('#acknowledgeReminder').data('med-id', med.medication_id);
            $('#snoozeReminder').data('med-id', med.medication_id);
        } else {
            reminderHtml = `
                <div class="reminder-item">
                    <div class="medication-icon">
                        <i class="fa fa-pills fa-3x text-warning"></i>
                    </div>
                    <h4>Multiple Medications Due</h4>
                    <p class="text-info"><i class="fa fa-clock-o"></i> You have ${reminders.length} medications to take:</p>
                    <ul class="list-unstyled">
            `;
            
            reminders.forEach(med => {
                reminderHtml += `
                    <li class="reminder-med-item">
                        <strong>${med.medication_name}</strong> - ${med.medication_dosage} at ${med.medication_time}
                        ${med.medication_notes ? `<br><small class="text-muted">${med.medication_notes}</small>` : ''}
                    </li>
                `;
            });
            
            reminderHtml += `
                    </ul>
                </div>
            `;
            
            // For multiple reminders, we'll handle them differently
            $('#acknowledgeReminder').data('med-id', null);
            $('#snoozeReminder').data('med-id', null);
        }

        $('#reminderContent').html(reminderHtml);
        $('#reminderPopup').modal('show');
        
        // Play notification sound if browser supports it
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Medication Reminder', {
                body: reminders.length === 1 ? 
                    `Time to take ${reminders[0].medication_name}` : 
                    `You have ${reminders.length} medications to take`,
                icon: 'https://cdn-icons-png.flaticon.com/512/883/883356.png'
            });
        }
    }

    // Request notification permission when page loads
    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // Call this function when the page loads
    requestNotificationPermission();

    function renderMedications() {
        const $container = $('#medication-container');
        $container.empty();

        if (medications.length === 0) {
            $container.html('<div class="alert alert-info" id="no-meds-message">No medications found. Click "Add Medication" to get started.</div>');
            return;
        }

        // Sort medications by date and time for better display
        const sortedMedications = medications.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateA - dateB;
        });

        sortedMedications.forEach(med => {
            const reminderIcon = med.reminders ? '<i class="fa fa-bell text-success" title="Reminders enabled"></i>' : '<i class="fa fa-bell-slash text-muted" title="No reminders"></i>';
            const takenStatus = med.isTaken ? '<span class="label label-success">Taken</span>' : '<span class="label label-warning">Pending</span>';
            
            const medCard = $(`
                <div class="medication-card" data-med-id="${med.id}">
                    <div class="row">
                        <div class="col-sm-8">
                            <h3>${med.name} ${reminderIcon}</h3>
                            <p><strong>Dosage:</strong> ${med.dosage}</p>
                            <p><strong>Quantity:</strong> ${med.quantity}</p>
                            <p><strong>Schedule:</strong> ${med.date} at ${med.time}</p>
                            ${med.notes ? `<p><strong>Notes:</strong> ${med.notes}</p>` : ''}
                            ${currentView === 'all' && med.prescriptionStart && med.prescriptionEnd ? 
                                `<p><strong>Prescription Period:</strong> ${med.prescriptionStart} to ${med.prescriptionEnd}</p>` : ''}
                            <p><strong>Status:</strong> ${takenStatus}</p>
                        </div>
                        <div class="col-sm-4 text-right">
                            <div class="taken-checkbox">
                                <label>
                                    <input type="checkbox" class="taken-status" ${med.isTaken ? 'checked' : ''}>
                                    Mark as Taken
                                </label>
                            </div>
                            <div class="medication-actions">
                                <button class="btn btn-warning btn-sm edit-med-btn">
                                    <i class="fa fa-edit"></i> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            // Add event listeners to dynamic elements
            medCard.find('.taken-status').change(function() {
                updateTakenStatus(med.id);
            });

            medCard.find('.edit-med-btn').click(function() {
                openEditModal(med);
            });

            $container.append(medCard);
        });
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
                loadMedications();
                $('#medication-form')[0].reset();
                alert('Medication added successfully!');
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
            isTaken: false // Keep current taken status, don't reset it
        };

        $.ajax({
            url: `/medications/${currentUserId}/${medicationId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(medication),
            success: function() {
                $('#editMedModal').modal('hide');
                loadMedications();
                alert('Medication updated successfully!');
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
                loadMedications();
                alert('Medication deleted successfully!');
            },
            error: function(error) {
                console.error('Error deleting medication:', error);
                alert('Failed to delete medication. Please try again.');
            }
        });
    }

    function updateTakenStatus(medId) {
        $.ajax({
            url: `/medications/${currentUserId}/${medId}/is-taken`,
            method: 'PUT',
            contentType: 'application/json',
            success: function() {
                // Reload medications to reflect the change
                loadMedications();
            },
            error: function(error) {
                console.error('Error updating medication status:', error);
                alert('Failed to update medication status. Please try again.');
                // Reload to reset checkbox state
                loadMedications();
            }
        });
    }

    // Time conversion helpers for elderly-friendly dropdowns
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

    // Update time dropdowns when values change
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

    // Enhanced medication display for elderly
    function displayMedicationForElderly(medication) {
        const time12 = convertTo12Hour(medication.medication_time);
        const timeDisplay = `${time12.hour}:${time12.minute} ${time12.ampm}`;
        
        return `
            <div class="medication-card ${medication.is_taken ? 'medication-taken' : ''}" data-id="${medication.medication_id}">
                <h3><i class="fa fa-pills"></i> ${medication.medication_name}</h3>
                <div class="row">
                    <div class="col-md-8">
                        <p><strong><i class="fa fa-clock-o"></i> Time:</strong> 
                           <span class="medication-time">${timeDisplay}</span></p>
                        <p><strong><i class="fa fa-prescription-bottle"></i> Dosage:</strong> ${medication.medication_dosage || 'As prescribed'}</p>
                        <p><strong><i class="fa fa-calendar"></i> Date:</strong> ${formatDate(medication.medication_date)}</p>
                        ${medication.medication_quantity ? `<p><strong><i class="fa fa-pills"></i> Quantity:</strong> ${medication.medication_quantity}</p>` : ''}
                        ${medication.medication_notes ? `<p><strong><i class="fa fa-sticky-note"></i> Notes:</strong> ${medication.medication_notes}</p>` : ''}
                    </div>
                    <div class="col-md-4">
                        <div class="medication-actions">
                            ${!medication.is_taken ? 
                                `<button class="btn btn-success btn-lg" onclick="markAsTaken(${medication.medication_id})" style="margin-bottom: 10px;">
                                    <i class="fa fa-check"></i> Take Now
                                 </button>` : 
                                `<button class="btn btn-secondary btn-lg" disabled style="margin-bottom: 10px;">
                                    <i class="fa fa-check-circle"></i> Taken
                                 </button>`
                            }
                            <button class="btn btn-primary" onclick="openEditModal(${medication.medication_id})" style="margin-bottom: 5px;">
                                <i class="fa fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Enhanced date formatting for elderly
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    // Populate edit modal with elderly-friendly time
    function populateEditModalForElderly(medication) {
        const time12 = convertTo12Hour(medication.medication_time);
        
        $('#edit-medication-id').val(medication.medication_id);
        $('#edit-name').val(medication.medication_name);
        $('#edit-dosage').val(medication.medication_dosage);
        $('#edit-medication-date').val(medication.medication_date);
        $('#edit-quantity').val(medication.medication_quantity);
        $('#edit-notes').val(medication.medication_notes);
        $('#edit-prescription-start').val(medication.prescription_startdate);
        $('#edit-prescription-end').val(medication.prescription_enddate);
        $('#edit-reminders').prop('checked', medication.medication_reminders);
        
        // Set time dropdowns
        $('#edit-time-hour').val(time12.hour);
        $('#edit-time-minute').val(time12.minute);
        $('#edit-time-ampm').val(time12.ampm);
        $('#edit-time').val(medication.medication_time);
    }

    // Initialize elderly-friendly features
    $(document).ready(function() {
        // Your existing code...
        
        // Add these new initializations
        setupTimeDropdowns();
        
        // Override the existing displayMedications function
        function displayMedications(meds) {
            if (meds.length === 0) {
                $('#medication-container').html(`
                    <div class="alert alert-info loading-message" id="no-meds-message">
                        <i class="fa fa-info-circle fa-2x"></i><br>
                        No medications found. Click "Add Medication" to get started.
                    </div>
                `);
                return;
            }

            let html = '';
            meds.forEach(medication => {
                html += displayMedicationForElderly(medication);
            });
            $('#medication-container').html(html);
        }
        
        // Enhanced success messages for elderly
        function showSuccessMessage(message) {
            const alertHtml = `
                <div class="alert alert-success alert-dismissible loading-message" role="alert">
                    <button type="button" class="close" data-dismiss="alert">
                        <span>&times;</span>
                    </button>
                    <i class="fa fa-check-circle fa-2x"></i><br>
                    <strong>Success!</strong> ${message}
                </div>
            `;
            $('#medication-container').prepend(alertHtml);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                $('.alert-success').fadeOut();
            }, 5000);
        }
    });
});

    function remindMedication(medId) {
        $.ajax({
            url: `/medications/user/${currentUserId}/${medId}/remind`,
            method: 'GET',
            success: function(data) {
                alert(`Reminder set for medication: ${data.medication_name}`);
            },
            error: function(error) {
                console.error('Error setting reminder:', error);
                alert('Failed to set reminder. Please try again.');
            }
        });
    }