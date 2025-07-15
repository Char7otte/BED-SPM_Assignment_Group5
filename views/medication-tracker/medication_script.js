// Global variables
let currentUserId = '1'; // You can modify this based on your auth system
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
            endpoint = `/api/medications/user/${currentUserId}/daily`;
        } else {
            endpoint = `/api/medications/user/${currentUserId}/weekly`;
        }
        
        const response = await fetch(endpoint);
        medications = await response.json();
        renderMedications();
    } catch (error) {
        console.error('Error loading medications:', error);
        alert('Failed to load medications. Please try again.');
    }
}

async function searchMedications(searchTerm) {
    try {
        const response = await fetch(`/api/medications/user/${currentUserId}/search?name=${searchTerm}`);
        medications = await response.json();
        renderMedications();
    } catch (error) {
        console.error('Error searching medications:', error);
        alert('Failed to search medications. Please try again.');
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
            <p><strong>Frequency:</strong> ${med.frequency}</p>
            <p><strong>Time:</strong> ${med.time}</p>
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
            const isTaken = e.target.checked;
            updateTakenStatus(medId, isTaken);
        });
    });
}

async function openModal(mode, medId = null) {
    if (mode === 'edit' && medId) {
        modalTitle.textContent = 'Edit Medication';
        deleteBtn.style.display = 'block';
        
        try {
            const response = await fetch(`/api/medications/${currentUserId}/${medId}`);
            const medication = await response.json();
            
            document.getElementById('medication-id').value = medication.id;
            document.getElementById('name').value = medication.name;
            document.getElementById('dosage').value = medication.dosage;
            document.getElementById('frequency').value = medication.frequency;
            document.getElementById('time').value = medication.time;
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
        name: document.getElementById('name').value,
        dosage: document.getElementById('dosage').value,
        frequency: document.getElementById('frequency').value,
        time: document.getElementById('time').value,
        userId: currentUserId
    };
    
    try {
        let response;
        if (medicationId) {
            // Update existing medication
            response = await fetch(`/api/medications/${currentUserId}/${medicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(medication)
            });
        } else {
            // Create new medication
            response = await fetch('/api/medications', {
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
            throw new Error('Failed to save medication');
        }
    } catch (error) {
        console.error('Error saving medication:', error);
        alert('Failed to save medication. Please try again.');
    }
}

async function deleteMedication(medId = null) {
    if (!medId) {
        medId = document.getElementById('medication-id').value;
    }
    
    try {
        const response = await fetch(`/api/medications/${currentUserId}/${medId}`, {
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

async function updateTakenStatus(medId, isTaken) {
    try {
        const response = await fetch(`/api/medications/${currentUserId}/${medId}/is-taken`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isTaken })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update medication status');
        }
    } catch (error) {
        console.error('Error updating medication status:', error);
        alert('Failed to update medication status. Please try again.');
    }
}