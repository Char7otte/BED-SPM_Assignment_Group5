$(document).ready(function() {
    // Global variables
    const currentUserId = 4; // Using user 8 since that's your test user
    let currentView = 'daily';
    let medications = [];

    // Initialize the page
    loadMedications();

    // Event Listeners
    $('.view-toggle').click(function(e) {
        e.preventDefault();
        $('.view-toggle').removeClass('active');
        $(this).addClass('active');
        currentView = $(this).data('view');
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

    // Handle Enter key in search
    $('#search-input').keypress(function(e) {
        if (e.which === 13) {
            $('#search-btn').click();
        }
    });

    // Functions
    function loadMedications() {
        let endpoint = currentView === 'daily' 
            ? `/medications/user/${currentUserId}/daily`
            : `/medications/user/${currentUserId}/weekly`;

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
            date: med.medication_date
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

    function renderMedications() {
        const $container = $('#medication-container');
        $container.empty();

        if (medications.length === 0) {
            $container.html('<div class="alert alert-info" id="no-meds-message">No medications found. Click "Add Medication" to get started.</div>');
            return;
        }

        medications.forEach(med => {
            const medCard = $(`
                <div class="medication-card" data-med-id="${med.id}">
                    <div class="row">
                        <div class="col-sm-8">
                            <h3>${med.name}</h3>
                            <p><strong>Dosage:</strong> ${med.dosage}</p>
                            <p><strong>Time:</strong> ${med.time}</p>
                            ${med.notes ? `<p><strong>Notes:</strong> ${med.notes}</p>` : ''}
                            ${med.date ? `<p><strong>Date:</strong> ${med.date}</p>` : ''}
                        </div>
                        <div class="col-sm-4 text-right">
                            <div class="taken-checkbox">
                                <label>
                                    <input type="checkbox" class="taken-status" ${med.isTaken ? 'checked' : ''}>
                                    Taken
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
            medication_dosage: $('#dosage').val(),
            medication_time: $('#time').val(),
            medication_date: new Date().toISOString().split('T')[0], // Current date
            medication_notes: '',
            medication_reminders: true,
            prescription_startdate: new Date().toISOString().split('T')[0],
            prescription_enddate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
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
        $('#edit-time').val(medication.time);
        $('#editMedModal').modal('show');
    }

    function updateMedication() {
        const medicationId = $('#edit-medication-id').val();
        const medication = {
            userId: parseInt(currentUserId),
            medicationName: $('#edit-name').val(),
            medicationDosage: $('#edit-dosage').val(),
            medicationTime: $('#edit-time').val(),
            medicationDate: new Date().toISOString().split('T')[0],
            medicationNotes: '',
            medicationReminders: true,
            prescriptionStartDate: new Date().toISOString().split('T')[0],
            prescriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isTaken: false
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