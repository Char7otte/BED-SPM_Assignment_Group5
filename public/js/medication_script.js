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