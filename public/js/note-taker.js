let selectedNoteId = null;
let selectedNoteIds = [];
let isCreatingNewNote = false;
let lastSelectedIndex = null;
let isNoteDirty = false;
let lastEditedNoteId = null;

document.addEventListener('DOMContentLoaded', () => {

    // Toast notification function
    function showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 24px';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = 1000;
        toast.style.fontSize = '14px';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    const noteListContainer = document.getElementById('noteList');

    // Note title and content fields
    const noteTitleField = document.getElementById('NoteTitle');
    const noteContentField = document.getElementById('NoteContent');

    noteTitleField.addEventListener('input', () => {
        isNoteDirty = true;
    });
    noteContentField.addEventListener('input', () => {
        isNoteDirty = true;
    });

    const searchBtn = document.getElementById('searchBtn');
    // Add event listener for Enter key in search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
    });

    // debounce utility function
    function debounce(fn, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    const debouncedSave = debounce(async () => {
        if (lastEditedNoteId) {
            await saveCurrentNote(lastEditedNoteId);
            // Remove fetchNotes here to avoid list refresh on every input change
        }
    }, 500);

    noteTitleField.addEventListener('input', () => {
        isNoteDirty = true;
        debouncedSave();
    });
    noteContentField.addEventListener('input', () => {
        isNoteDirty = true;
        debouncedSave();
    });

    // save current note on input change
    async function saveCurrentNote(noteId) {
        const noteTitle = noteTitleField.value;
        const noteContent = noteContentField.value;
        // Allow saving empty strings
        if (noteTitle === undefined || noteContent === undefined) return;
        try {
            const newNote = {
                NoteTitle: noteTitle,
                NoteContent: noteContent
            };
            const res = await fetch(`/notes-api/${Number(noteId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newNote)
            });
            if (res.ok) {
                isNoteDirty = false;
                showToast('Note updated');
            }
        } catch (err) {
            console.error('Auto-save failed:', err);
        }
    }

    // Get all notes to display in the list, and auto-select first note
    async function fetchNotes() {
        try {
            const res = await fetch('/notes-api');
            const notes = await res.json();

            // Only auto-select first note if none currently selected
            if ((!selectedNoteId || !selectedNoteIds.length) && notes.length) {
                selectedNoteId = notes[0].NoteID;
                selectedNoteIds = [selectedNoteId];
            }

            renderNoteList(notes);

            if (selectedNoteId) {
                await loadNoteById(selectedNoteId);
            }

            setTimeout(() => {
                const firstNoteElement = document.querySelector(`.note-item[data-id="${selectedNoteId}"]`);
                if (firstNoteElement) {
                    firstNoteElement.classList.add('selected');
                }
            }, 0);

        } catch (err) {
            console.error('Error fetching notes:', err.message);
            noteListContainer.innerHTML = '<p class="text-danger">Failed to load notes.</p>';
        }
    }
    async function fetchNoteById(noteId) {
        try {
            const res = await fetch(`/notes-api/${noteId}`);
            if (!res.ok) {
                throw new Error(`Error fetching note with ID ${noteId}: ${res.statusText}`);
            }
            const note = await res.json();
            return note;
        } catch (err) {
            console.error(`Error fetching note with ID ${noteId}:`, err);
            noteListContainer.innerHTML = `<p class="text-danger">Failed to load note with ID ${noteId}.</p>`;
            return null;
        }
    }

    // Render notes in the list
    function renderNoteList(notes) {
        noteListContainer.innerHTML = '';

        if (!notes || notes.length === 0) {
            noteListContainer.innerHTML = '<p class="text-muted fade-in-message">No notes found.</p>';
            return;
        }

        notes.forEach((note, index) => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-item';
            noteDiv.dataset.id = note.NoteID;
            noteDiv.innerHTML = `
        <strong>${note.NoteTitle}</strong><br>
        <small>${note.NoteContent}...</small>
    `;

            // Highlight if selected
            if (selectedNoteIds.includes(note.NoteID)) {
                noteDiv.classList.add('selected');
            }

            noteDiv.addEventListener('click', async (e) => {
                if (isNoteDirty && lastEditedNoteId && !selectedNoteIds.includes(note.NoteID)) {
                    await saveCurrentNote(lastEditedNoteId);
                    await fetchNotes(); // Refresh the note list after saving
                    return; // Prevent further processing until refreshed list is displayed
                }

                if (e.shiftKey && lastSelectedIndex !== null) {
                    // Shift-click selection logic remains the same
                    const start = Math.min(lastSelectedIndex, index);
                    const end = Math.max(lastSelectedIndex, index);
                    const rangeIds = notes.slice(start, end + 1).map(n => n.NoteID);

                    const allSelected = rangeIds.every(id => selectedNoteIds.includes(id));
                    if (allSelected) {
                        if (selectedNoteIds.length !== rangeIds.length) {
                            selectedNoteIds = selectedNoteIds.filter(id => !rangeIds.includes(id));
                        }
                    } else {
                        selectedNoteIds = Array.from(new Set([...selectedNoteIds, ...rangeIds]));
                    }
                    lastSelectedIndex = index;
                } else if (e.ctrlKey || e.metaKey) {
                    // Ctrl/Cmd toggle selection logic remains the same
                    if (selectedNoteIds.includes(note.NoteID)) {
                        if (selectedNoteIds.length > 1) {
                            selectedNoteIds = selectedNoteIds.filter(id => id !== note.NoteID);
                        }
                    } else {
                        selectedNoteIds.push(note.NoteID);
                    }
                    lastSelectedIndex = index;
                } else {
                    // Single click: select only this note
                    if (!(selectedNoteIds.length === 1 && selectedNoteIds[0] === note.NoteID)) {
                        if (isNoteDirty && lastEditedNoteId && lastEditedNoteId !== note.NoteID) {
                            await saveCurrentNote(lastEditedNoteId);
                            await fetchNotes();
                            return;
                        }
                        selectedNoteId = note.NoteID;
                        selectedNoteIds = [note.NoteID];
                        lastSelectedIndex = index;
                    }
                }

                renderNoteList(notes);
                updateDeleteButtonState();

                if (selectedNoteIds.length === 1) {
                    await loadNoteById(selectedNoteId);
                } else {
                    noteTitleField.value = '';
                    noteContentField.value = '';
                }

                console.log("Selected note IDs:", selectedNoteIds);
            });

            noteListContainer.appendChild(noteDiv);
        });
    }

    // Animate note list items
    function animateNoteList() {
        const noteItems = document.querySelectorAll('.note-item');
        noteItems.forEach((item, index) => {
            item.style.opacity = 0;
            setTimeout(() => {
                item.style.transition = "opacity 0.3s";
                item.style.opacity = 1;
            }, index * 50);
        });
    }

    // Load note by ID
    async function loadNoteById(id) {
        try {
            const res = await fetch(`/notes-api/${id}`);
            const note = await res.json();

            const noteTitleField = document.getElementById('NoteTitle');
            const noteContentField = document.getElementById('NoteContent');

            console.log(`Loading note with ID ${id}:`, note);
            noteTitleField.value = note.NoteTitle || 'untitled';
            noteContentField.value = note.NoteContent || '';
            // Make fields editable when a note is selected
            noteTitleField.readOnly = false;
            noteContentField.readOnly = false;

            lastEditedNoteId = id;
            isNoteDirty = false;

        } catch (err) {
            console.error(`Failed to load note ${id}:`, err);
        }
    }

    // Search notes by title or content, clear selection on search
    searchBtn.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) {
            selectedNoteId = null;
            return fetchNotes();
        }
        try {
            const res = await fetch(`/notes-api/search?search=${encodeURIComponent(query)}`);
            const notes = await res.json();

            // 1. Select first note if available
            if (notes.length > 0) {
                selectedNoteId = notes[0].NoteID || notes[0].noteId;
                selectedNoteIds = [selectedNoteId]; // <-- update the selected note IDs too
            } else {
                selectedNoteId = null;
                selectedNoteIds = [];
            }

            // 2. Render list with selection
            renderNoteList(notes);

            // 3. Animate after rendering
            animateNoteList();

            // 4. Load first note if available
            if (selectedNoteId) {
                await loadNoteById(selectedNoteId);
            }

            console.log(selectedNoteId);
        } catch (err) {
            console.error('Search failed:', err);
            noteListContainer.innerHTML = '<p class="text-danger">Couldn\'t find any notes.</p>';
        }
    });

    // Create or update a note
    const saveBtn = document.querySelector('#noteArea button[type="submit"]');

    saveBtn.addEventListener('click', async () => {
        const noteTitle = noteTitleField.value;
        const noteContent = noteContentField.value;

        if (noteTitle === null || noteContent === null) {
            alert('Note title and content must have a value.');
            return;
        }

        try {
            if (selectedNoteId !== null) {
                // Update existing note
                const newNote = {
                    NoteTitle: noteTitle,
                    NoteContent: noteContent
                };
                console.log("Updating note ID:", selectedNoteId, newNote);
                const res = await fetch(`/notes-api/${Number(selectedNoteId)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newNote)
                });
                console.log(newNote);
                console.log("Response from /notes-api (update):", res.status);

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.error || 'Failed to update note');
                }

                showToast('Note updated!');

                // Refresh notes and re-select updated note
                const refreshedRes = await fetch('/notes-api');
                const refreshedNotes = await refreshedRes.json();
                renderNoteList(refreshedNotes);
                await loadNoteById(selectedNoteId);

            } else {
                // Create new note
                const newNote = {
                    NoteTitle: noteTitle,
                    NoteContent: noteContent
                };
                const res = await fetch('/notes-api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newNote)
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.error || 'Failed to create note');
                }

                // Set selected note to the new one
                selectedNoteId = result.note.NoteID;
                selectedNoteIds = [selectedNoteId];

                // Fetch notes list but do NOT overwrite selection with first note
                const refreshedRes = await fetch('/notes-api');
                const refreshedNotes = await refreshedRes.json();

                // Render list with correct selection
                renderNoteList(refreshedNotes);

                // Load new note's content
                await loadNoteById(selectedNoteId);

                // Enable editing & focus
                noteTitleField.readOnly = false;
                noteContentField.readOnly = false;
                noteTitleField.focus();

                showToast('Note created and selected');
            }
        } catch (err) {
            console.error(selectedNoteId !== null ? 'Error updating note:' : 'Error creating note:', err);
            alert(selectedNoteId !== null ? 'Error updating note.' : 'Error creating note.');
        }
        await fetchNotes();
        setTimeout(() => {
            const updatedNoteElement = document.querySelector(`.note-item[data-id="${selectedNoteId}"]`);
            if (updatedNoteElement) updatedNoteElement.classList.add('selected');
        }, 0);
    });

    // Delete button: Delete selected note
    const deleteBtn = document.getElementById('toolbarDeleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!selectedNoteIds.length) {
                alert('No notes selected for deletion.');
                return;
            }
            if (!confirm(selectedNoteIds.length > 1 ? `Are you sure you want to delete ${selectedNoteIds.length} notes?` : `Are you sure you want to delete ${selectedNoteIds.length} note?`)) {
                return;
            }
            try {
                const res = await fetch(`/notes-api/bulk`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ noteIds: selectedNoteIds })
                });

                if (!res.ok) {
                    throw new Error('Failed to delete notes');
                }

                showToast(selectedNoteIds.length > 1 ? `${selectedNoteIds.length} notes deleted successfully!` : 'Note deleted succussfully!');
                selectedNoteIds = [];
                fetchNotes(); // Refresh note list
                noteTitleField.value = '';
                noteContentField.value = '';
                noteTitleField.readOnly = true;
                noteContentField.readOnly = true;
                updateDeleteButtonState();
            } catch (err) {
                console.error('Error deleting notes:', err);
                alert('Error deleting notes.');
            }
        });
    }

    // Edit button: Clear fields and set to editable, and disable delete button if no note selected
    const editBtn = document.getElementById('toolbarCreateBtn');

    editBtn.addEventListener('click', async () => {
        const noteTitleField = document.getElementById('NoteTitle');
        const noteContentField = document.getElementById('NoteContent');

        try {
            const res = await fetch('/notes-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    NoteTitle: '',     // empty string explicitly
                    NoteContent: ''    // empty string explicitly
                })
            });

            const result = await res.json();
            console.log("Response from /notes-api (create):", res.status, result);

            if (!res.ok) {
                throw new Error(result.error || 'Failed to create note');
            }

            selectedNoteId = result.note.NoteID;
            selectedNoteIds = [selectedNoteId];

            await fetchNotes();
            await loadNoteById(selectedNoteId);

            noteTitleField.readOnly = false;
            noteContentField.readOnly = false;
            noteTitleField.focus();

            showToast('New note created, ready to edit');

        } catch (err) {
            console.error('Error creating new note on Edit button click:', err);
            alert('Failed to create new note nooo');
        }
    });

    const downloadBtn = document.getElementById('downloadMarkdownBtn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!selectedNoteId) {
                alert("Please select a note to download.");
                return;
            }

            const downloadUrl = `/notes-api/export-md/${selectedNoteId}`;

            const tempLink = document.createElement('a');
            tempLink.href = downloadUrl;
            tempLink.download = ''; // Let server set filename
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
        });
    }


    // Delete selected note

    fetchNotes();
});

// Utility function to update Delete button state based on selectedNoteId
function updateDeleteButtonState() {
    const deleteBtn = document.getElementById('toolbarDeleteBtn');
    if (!deleteBtn) return;

    if (!selectedNoteIds.length) {
        deleteBtn.disabled = true;
        deleteBtn.classList.add('disabled');
    } else {
        deleteBtn.disabled = false;
        deleteBtn.classList.remove('disabled');
    }
}
