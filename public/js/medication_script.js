// Global variables
let currentUserId = '8'; // Changed to user 8 since that's your test user
let currentView = 'daily';
let medications = [];

// DOM Elements
const medicationListEl = document.getElementById('medication-list');
const dailyViewBtn = document.getElementById('daily-view');
const weeklyViewBtn = document.getElementById('weekly-view');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const addMedicationBtn = document.getElementById('add-medication-btn');
const modal = document.getElementById('medication-modal');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const medicationForm = document.getElementById('medication-form');
const modalTitle = document.getElementById('modal-title');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadMedications();
    
    dailyViewBtn.addEventListener('click', () => {
        currentView = 'daily';
        dailyViewBtn.classList.add('active');
        weeklyViewBtn.classList.remove('active');
        loadMedications();
    });
    
    weeklyViewBtn.addEventListener('click', () => {
        currentView = 'weekly';
        weeklyViewBtn.classList.add('active');
        dailyViewBtn.classList.remove('active');
        loadMedications();
    });
    
    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            searchMedications(searchTerm);
        } else {
            loadMedications();
        }
    });
    
    addMedicationBtn.addEventListener('click', () => {
        openModal('add');
    });
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    medicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveMedication();
    });
    
    deleteBtn.addEventListener('click', deleteMedication);
});

// Functions
async function loadMedications() {
    try {
        let endpoint = '';
        if (currentView === 'daily') {
            endpoint = `/medications/user/${currentUserId}/daily`;
        } else {
            endpoint = `/medications/user/${currentUserId}/weekly`;
        }
        
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle different response formats
        if (currentView === 'daily' && data.medications) {
            medications = data.medications.map(med => ({
                id: med.medication_id,
                name: med.medication_name,
                dosage: med.medication_dosage,
                time: med.medication_time,
                notes: med.medication_notes,
                isTaken: med.is_taken
            }));
        } else if (Array.isArray(data)) {
            medications = data.map(med => ({
                id: med.medication_id,
                name: med.medication_name,
                dosage: med.medication_dosage,
                time: med.medication_time,
                notes: med.medication_notes,
                isTaken: med.is_taken,
                date: med.medication_date
            }));
        } else {
            medications = [];
        }
        
        renderMedications();
    } catch (error) {
        console.error('Error loading medications:', error);
        medicationListEl.innerHTML = '<p>Failed to load medications. Please try again.</p>';
    }
}

async function searchMedications(searchTerm) {
    try {
        const response = await fetch(`/medications/user/${currentUserId}/search?name=${searchTerm}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        medications = data.map(med => ({
            id: med.medication_id,
            name: med.medication_name,
            dosage: med.medication_dosage,
            time: med.medication_time,
            notes: med.medication_notes,
            isTaken: med.is_taken
        }));
        
        renderMedications();
    } catch (error) {
        console.error('Error searching medications:', error);
        medicationListEl.innerHTML = '<p>Failed to search medications. Please try again.</p>';
    }
}

function renderMedications() {
    medicationListEl.innerHTML = '';
    
    if (medications.length === 0) {
        medicationListEl.innerHTML = '<p>No medications found. Add your first medication!</p>';
        return;
    }
    
    medications.forEach(med => {
        const medCard = document.createElement('div');
        medCard.className = 'medication-card';
        medCard.innerHTML = `
            <h3>${med.name}</h3>
            <p><strong>Dosage:</strong> ${med.dosage}</p>
            <p><strong>Time:</strong> ${med.time}</p>
            ${med.notes ? `<p><strong>Notes:</strong> ${med.notes}</p>` : ''}
            ${med.date ? `<p><strong>Date:</strong> ${med.date}</p>` : ''}
            <div class="taken-checkbox">
                <label>
                    <input type="checkbox" class="taken-status" data-id="${med.id}" ${med.isTaken ? 'checked' : ''}>
                    Taken
                </label>
            </div>
            <div class="medication-actions">
                <button class="edit-btn" data-id="${med.id}">Edit</button>
                <button class="delete-btn" data-id="${med.id}">Delete</button>
            </div>
        `;
        medicationListEl.appendChild(medCard);
    });
    
    // Add event listeners to dynamically created elements
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const medId = e.target.getAttribute('data-id');
            openModal('edit', medId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const medId = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this medication?')) {
                deleteMedication(medId);
            }
        });
    });
    
    document.querySelectorAll('.taken-status').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const medId = e.target.getAttribute('data-id');
            updateTakenStatus(medId);
        });
    });
}

async function openModal(mode, medId = null) {
    if (mode === 'edit' && medId) {
        modalTitle.textContent = 'Edit Medication';
        deleteBtn.style.display = 'block';
        
        try {
            const response = await fetch(`/medications/${currentUserId}/${medId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const medication = await response.json();
            
            document.getElementById('medication-id').value = medication.medication_id;
            document.getElementById('name').value = medication.medication_name;
            document.getElementById('dosage').value = medication.medication_dosage;
            document.getElementById('time').value = medication.medication_time;
        } catch (error) {
            console.error('Error fetching medication:', error);
            alert('Failed to load medication details. Please try again.');
        }
    } else {
        modalTitle.textContent = 'Add New Medication';
        deleteBtn.style.display = 'none';
        medicationForm.reset();
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

async function saveMedication() {
    const medicationId = document.getElementById('medication-id').value;
    const medication = {
        user_id: parseInt(currentUserId),
        medication_name: document.getElementById('name').value,
        medication_dosage: document.getElementById('dosage').value,
        medication_time: document.getElementById('time').value,
        medication_date: new Date().toISOString().split('T')[0], // Current date
        medication_notes: '',
        medication_reminders: true,
        prescription_startdate: new Date().toISOString().split('T')[0],
        prescription_enddate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        is_taken: false
    };
    
    try {
        let response;
        if (medicationId) {
            // Update existing medication - map to expected format
            const updateData = {
                userId: parseInt(currentUserId),
                medicationName: medication.medication_name,
                medicationDate: medication.medication_date,
                medicationTime: medication.medication_time,
                medicationDosage: medication.medication_dosage,
                medicationNotes: medication.medication_notes,
                medicationReminders: medication.medication_reminders,
                prescriptionStartDate: medication.prescription_startdate,
                prescriptionEndDate: medication.prescription_enddate,
                isTaken: medication.is_taken
            };
            
            response = await fetch(`/medications/${currentUserId}/${medicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });
        } else {
            // Create new medication
            response = await fetch('/medications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(medication)
            });
        }
        
        if (response.ok) {
            closeModal();
            loadMedications();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save medication');
        }
    } catch (error) {
        console.error('Error saving medication:', error);
        alert('Failed to save medication: ' + error.message);
    }
}

async function deleteMedication(medId = null) {
    if (!medId) {
        medId = document.getElementById('medication-id').value;
    }
    
    try {
        const response = await fetch(`/medications/${currentUserId}/${medId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            closeModal();
            loadMedications();
        } else {
            throw new Error('Failed to delete medication');
        }
    } catch (error) {
        console.error('Error deleting medication:', error);
        alert('Failed to delete medication. Please try again.');
    }
}

async function updateTakenStatus(medId) {
    try {
        const response = await fetch(`/medications/${currentUserId}/${medId}/is-taken`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to update medication status');
        }
        
        // Reload medications to reflect the change
        loadMedications();
    } catch (error) {
        console.error('Error updating medication status:', error);
        alert('Failed to update medication status. Please try again.');
    }
}
