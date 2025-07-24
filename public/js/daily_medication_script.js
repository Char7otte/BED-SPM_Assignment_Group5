$(document).ready(function() {
    // Global variables
    const currentUserId = 8; // Using user 8 since that's your test user
    let dailyMedications = [];
    let reminderInterval;
    let snoozedReminders = new Set(); // Track snoozed reminders

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

    function loadDailyMedications() {
        $.ajax({
            url: `/medications/user/${currentUserId}/daily`,
            method: 'GET',
            success: function(data) {
                if (data && data.medications) {
                    dailyMedications = data.medications.map(mapMedicationData);
                    renderDailyMedications();
                } else {
                    dailyMedications = [];
                    renderDailyMedications();
                }
            },
            error: function(error) {
                console.error('Error loading daily medications:', error);
                $('#medication-container').html('<div class="alert alert-danger">Failed to load today\'s medications. Please try again.</div>');
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

    function renderDailyMedications() {
        const $container = $('#medication-container');
        $container.empty();

        if (dailyMedications.length === 0) {
            $container.html(`
                <div class="alert alert-info">
                    <h4><i class="fa fa-info-circle"></i> No medications scheduled for today</h4>
                    <p>You don't have any medications scheduled for today. Have a great day!</p>
                </div>
            `);
            return;
        }

        // Sort medications by time for better display
        const sortedMedications = dailyMedications.sort((a, b) => {
            return a.time.localeCompare(b.time);
        });

        // Group medications by status
        const takenMedications = sortedMedications.filter(med => med.isTaken);
        const pendingMedications = sortedMedications.filter(med => !med.isTaken);

        // Display pending medications first
        if (pendingMedications.length > 0) {
            $container.append('<h3><i class="fa fa-clock-o text-warning"></i> Pending Medications</h3>');
            pendingMedications.forEach(med => {
                $container.append(createMedicationCard(med, 'pending'));
            });
        }

        // Display taken medications
        if (takenMedications.length > 0) {
            $container.append('<h3 style="margin-top: 30px;"><i class="fa fa-check-circle text-success"></i> Completed Medications</h3>');
            takenMedications.forEach(med => {
                $container.append(createMedicationCard(med, 'taken'));
            });
        }

        // Display progress summary
        const completionRate = Math.round((takenMedications.length / dailyMedications.length) * 100);
        const progressHtml = `
            <div class="panel panel-default" style="margin-top: 30px;">
                <div class="panel-heading">
                    <h4><i class="fa fa-chart-pie"></i> Today's Progress</h4>
                </div>
                <div class="panel-body">
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar progress-bar-${completionRate === 100 ? 'success' : 'info'}" 
                             role="progressbar" 
                             style="width: ${completionRate}%;">
                            ${completionRate}% Complete (${takenMedications.length}/${dailyMedications.length})
                        </div>
                    </div>
                    <p class="text-muted" style="margin-top: 10px;">
                        ${completionRate === 100 ? 
                            '<i class="fa fa-star text-warning"></i> Congratulations! You\'ve taken all your medications for today!' : 
                            `You have ${pendingMedications.length} medication${pendingMedications.length !== 1 ? 's' : ''} remaining for today.`
                        }
                    </p>
                </div>
            </div>
        `;
        $container.append(progressHtml);
    }

    function createMedicationCard(med, status) {
        const reminderIcon = med.reminders ? '<i class="fa fa-bell text-success" title="Reminders enabled"></i>' : '<i class="fa fa-bell-slash text-muted" title="No reminders"></i>';
        const cardClass = status === 'taken' ? 'medication-card taken-card' : 'medication-card';
        const timeDisplay = formatTime(med.time);
        
        const medCard = $(`
            <div class="${cardClass}" data-med-id="${med.id}" style="margin-bottom: 15px;">
                <div class="row">
                    <div class="col-sm-8">
                        <h4>${med.name} ${reminderIcon}</h4>
                        <p><strong>Dosage:</strong> ${med.dosage}</p>
                        <p><strong>Scheduled Time:</strong> ${timeDisplay}</p>
                        ${med.notes ? `<p><strong>Notes:</strong> ${med.notes}</p>` : ''}
                        ${status === 'taken' ? '<p><span class="label label-success"><i class="fa fa-check"></i> Completed</span></p>' : ''}
                    </div>
                    <div class="col-sm-4 text-right">
                        <div class="medication-actions" style="margin-top: 10px;">
                            ${status === 'pending' ? `
                                <button class="btn btn-success btn-lg take-med-btn" style="margin-bottom: 10px; width: 100%;">
                                    <i class="fa fa-check"></i> Mark as Taken
                                </button>
                            ` : ''}
                            <button class="btn btn-warning btn-sm edit-med-btn" style="width: 100%;">
                                <i class="fa fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Add event listeners to dynamic elements
        medCard.find('.take-med-btn').click(function() {
            updateTakenStatus(med.id);
        });

        medCard.find('.edit-med-btn').click(function() {
            openEditModal(med);
        });

        return medCard;
    }

    function formatTime(timeString) {
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    function updateTakenStatus(medicationId) {
        $.ajax({
            url: `/medications/${currentUserId}/${medicationId}/is-taken`,
            method: 'PUT',
            success: function() {
                loadDailyMedications(); // Reload to update the display
                showSuccessMessage('Medication marked as taken!');
            },
            error: function(error) {
                console.error('Error updating medication status:', error);
                alert('Failed to update medication status. Please try again.');
            }
        });
    }

    function showSuccessMessage(message) {
        const alertHtml = `
            <div class="alert alert-success alert-dismissible" style="position: fixed; top: 70px; right: 20px; z-index: 9999; min-width: 300px;">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                <i class="fa fa-check-circle"></i> ${message}
            </div>
        `;
        $('body').append(alertHtml);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            $('.alert-success').fadeOut();
        }, 3000);
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
});
