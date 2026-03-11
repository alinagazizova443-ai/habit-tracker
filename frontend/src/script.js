// ============ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ============
let currentListType = 'none';
let editingNoteId = null;
let habits = [
    { id: 1, name: 'Вода', target: '2 литра', unit: 'л', current: 0.5, step: 0.1 },
    { id: 2, name: 'Спорт', target: '30 минут', unit: 'мин', current: 15, step: 1 },
    { id: 3, name: 'Чтение', target: '20 минут', unit: 'мин', current: 10, step: 1 },
    { id: 4, name: 'Сон', target: '8 часов', unit: 'ч', current: 7, step: 1 },
    { id: 5, name: 'Прогулка', target: '30 минут', unit: 'мин', current: 15, step: 1 }
];

// История значений привычек по дням
let habitsHistory = {};

let notes = [
    {
        id: 1,
        title: 'Мои цели',
        content: '• Выучить JavaScript\n• Создать приложение\n• Начать бегать',
        listType: 'bulleted',
        date: '2024-01-15'
    },
    {
        id: 2,
        title: 'План на неделю',
        content: '1. Закончить проект\n2. Сходить в спортзал\n3. Прочитать книгу',
        listType: 'numbered',
        date: '2024-01-16'
    }
];

let stats = {
    streak: 7,
    totalHabits: 5,
    totalNotes: 0
};

// ============ УПРАВЛЕНИЕ ВКЛАДКАМИ ============
function switchTab(tabName, event) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Показываем выбранную вкладку
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Обновляем активный пункт навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Обновляем данные при переключении
    if (tabName === 'habits') {
        updateHabitsDisplay();
    } else if (tabName === 'stats') {
        updateStats();
        loadDayStats();
    } else if (tabName === 'notes') {
        displayNotes();
    }
}

// ============ ПРОФИЛЬ ============
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 1024 * 1024) {
            alert('Файл слишком большой. Максимальный размер - 1MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarPreview = document.getElementById('avatar-preview');
            avatarPreview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
            
            try {
                localStorage.setItem('userAvatar', e.target.result);
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    alert('Не удалось сохранить изображение. Превышен лимит хранилища.');
                }
            }
        };
        reader.readAsDataURL(file);
    }
}

function saveProfile() {
    const profileData = {
        username: document.getElementById('username').value,
        bio: document.getElementById('bio').value,
        birthdate: document.getElementById('birthdate').value
    };
    
    try {
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        alert('Профиль сохранен!');
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('Не удалось сохранить профиль. Превышен лимит хранилища.');
        }
    }
}

// ============ ЗАМЕТКИ ============
function toggleListType(type) {
    const textarea = document.getElementById('note-content');
    
    if (currentListType === type) {
        // Если нажали на ту же кнопку - сбрасываем форматирование
        currentListType = 'none';
        document.getElementById('bulleted-btn').classList.remove('active');
        document.getElementById('numbered-btn').classList.remove('active');
        
        if (textarea.value) {
            const lines = textarea.value.split('\n');
            const cleanedLines = lines.map(line => {
                line = line.replace(/^•\s*/, '');
                line = line.replace(/^\d+\.\s*/, '');
                return line;
            });
            textarea.value = cleanedLines.join('\n');
        }
    } else {
        // Если нажали на другую кнопку - сначала сбрасываем старое форматирование
        if (textarea.value) {
            const lines = textarea.value.split('\n');
            const cleanedLines = lines.map(line => {
                line = line.replace(/^•\s*/, '');
                line = line.replace(/^\d+\.\s*/, '');
                return line;
            });
            textarea.value = cleanedLines.join('\n');
        }
        
        // Устанавливаем новый тип форматирования
        currentListType = type;
        
        document.getElementById('bulleted-btn').classList.remove('active');
        document.getElementById('numbered-btn').classList.remove('active');
        document.getElementById(type === 'bulleted' ? 'bulleted-btn' : 'numbered-btn').classList.add('active');
        
        if (textarea.value) {
            formatExistingText(textarea);
        } else {
            if (type === 'bulleted') {
                textarea.value = '• ';
            } else if (type === 'numbered') {
                textarea.value = '1. ';
            }
        }
    }
}

function formatExistingText(textarea) {
    let text = textarea.value;
    const lines = text.split('\n');
    
    if (currentListType === 'bulleted') {
        const formattedLines = lines.map(line => {
            line = line.replace(/^[•\d]+\.\s*/, '');
            return line.trim() ? `• ${line}` : '';
        });
        textarea.value = formattedLines.join('\n');
    } else if (currentListType === 'numbered') {
        let number = 1;
        const formattedLines = lines.map(line => {
            line = line.replace(/^[•\d]+\.\s*/, '');
            if (line.trim()) {
                return `${number++}. ${line}`;
            }
            return '';
        });
        textarea.value = formattedLines.join('\n');
    }
}

function handleTextareaKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        const lines = text.substring(0, start).split('\n');
        const currentLine = lines[lines.length - 1];
        
        let newText = '';
        
        if (currentListType === 'bulleted') {
            newText = text.substring(0, start) + '\n• ' + text.substring(end);
        } else if (currentListType === 'numbered') {
            const match = currentLine.match(/^(\d+)\.\s/);
            if (match) {
                const nextNumber = parseInt(match[1]) + 1;
                newText = text.substring(0, start) + `\n${nextNumber}. ` + text.substring(end);
            } else {
                newText = text.substring(0, start) + '\n1. ' + text.substring(end);
            }
        } else {
            newText = text.substring(0, start) + '\n' + text.substring(end);
        }
        
        textarea.value = newText;
        
        if (currentListType !== 'none') {
            const newPosition = start + (currentListType === 'bulleted' ? 3 : 4);
            textarea.setSelectionRange(newPosition, newPosition);
        }
    }
}

function addNote() {
    const title = document.getElementById('note-title').value;
    let content = document.getElementById('note-content').value;

    if (!title && !content) {
        alert('Заполните хотя бы одно поле');
        return;
    }

    let noteDate;
    if (editingNoteId) {
        const existingNote = notes.find(n => n.id === editingNoteId);
        noteDate = existingNote ? existingNote.date : new Date().toISOString().split('T')[0];
    } else {
        noteDate = new Date().toISOString().split('T')[0];
    }

    const newNote = {
        id: editingNoteId || Date.now(),
        title: title || 'Без заголовка',
        content: content,
        listType: currentListType,
        date: noteDate
    };

    if (editingNoteId) {
        const index = notes.findIndex(n => n.id === editingNoteId);
        if (index !== -1) {
            notes[index] = newNote;
        }
        editingNoteId = null;
        document.getElementById('add-note-btn').textContent = 'Добавить заметку';
    } else {
        notes.unshift(newNote);
    }

    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    
    currentListType = 'none';
    document.getElementById('bulleted-btn').classList.remove('active');
    document.getElementById('numbered-btn').classList.remove('active');
    
    displayNotes();
    updateStats();
}

function displayNotes() {
    const notesList = document.getElementById('notes-list');
    
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-state">Нет заметок</div>';
        return;
    }

    notesList.innerHTML = notes.map(note => {
        let listIcon = note.listType === 'bulleted' ? '•' : note.listType === 'numbered' ? '1.' : '';
        
        return `
            <div class="note-card">
                <div class="note-header">
                    <span class="note-title">${note.title}</span>
                    <div class="note-actions">
                        <button class="edit-btn" onclick="editNote(${note.id})">✏️</button>
                        <button class="delete-btn" onclick="deleteNote(${note.id})">🗑️</button>
                    </div>
                </div>
                <div class="note-content">${note.content.replace(/\n/g, '<br>')}</div>
                <div class="note-meta">
                    <span class="list-type-badge">
                        <span>${listIcon}</span>
                        ${note.listType === 'bulleted' ? 'Маркированный' : note.listType === 'numbered' ? 'Нумерованный' : 'Обычный'}
                    </span>
                    <span>${note.date}</span>
                </div>
            </div>
        `;
    }).join('');
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        document.getElementById('note-title').value = note.title === 'Без заголовка' ? '' : note.title;
        document.getElementById('note-content').value = note.content;
        
        currentListType = note.listType;
        if (note.listType === 'bulleted') {
            document.getElementById('bulleted-btn').classList.add('active');
            document.getElementById('numbered-btn').classList.remove('active');
        } else if (note.listType === 'numbered') {
            document.getElementById('numbered-btn').classList.add('active');
            document.getElementById('bulleted-btn').classList.remove('active');
        } else {
            document.getElementById('bulleted-btn').classList.remove('active');
            document.getElementById('numbered-btn').classList.remove('active');
        }
        
        editingNoteId = id;
        document.getElementById('add-note-btn').textContent = 'Обновить заметку';
    }
}

function deleteNote(id) {
    if (confirm('Удалить заметку?')) {
        notes = notes.filter(n => n.id !== id);
        displayNotes();
        updateStats();
        
        if (document.getElementById('stats-tab').classList.contains('active')) {
            loadDayStats();
        }
    }
}

// ============ ПРИВЫЧКИ ============
function updateHabitsDisplay() {
    const habitsList = document.getElementById('habits-list');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Загружаем значения для сегодняшнего дня
    if (!habitsHistory[today]) {
        habitsHistory[today] = habits.map(h => ({ ...h }));
    }

    const todayHabits = habitsHistory[today];

    habitsList.innerHTML = todayHabits.map(habit => `
        <div class="habit-card">
            <div class="habit-header">
                <span class="habit-name">${habit.name}</span>
                <span class="habit-target">Цель: ${habit.target}</span>
            </div>
            <div class="habit-progress">
                <input type="number" id="habit-${habit.id}" value="${habit.current}" step="${habit.step}" min="0">
                <div class="habit-controls">
                    <button class="habit-btn decrement-btn" onclick="adjustHabit(${habit.id}, -${habit.step})">−</button>
                    <button class="habit-btn increment-btn" onclick="adjustHabit(${habit.id}, ${habit.step})">+</button>
                </div>
            </div>
            <div class="habit-total">
                Всего сегодня: <span>${habit.current} ${habit.unit}</span>
            </div>
        </div>
    `).join('');
}

function adjustHabit(habitId, change) {
    const today = new Date().toISOString().split('T')[0];
    if (!habitsHistory[today]) {
        habitsHistory[today] = habits.map(h => ({ ...h }));
    }
    
    const habit = habitsHistory[today].find(h => h.id === habitId);
    if (habit) {
        const input = document.getElementById(`habit-${habitId}`);
        let newValue = (parseFloat(input.value) || 0) + change;
        newValue = Math.max(0, newValue);
        
        if (habit.unit === 'л') {
            newValue = Math.round(newValue * 10) / 10;
        } else {
            newValue = Math.round(newValue);
        }
        
        habit.current = newValue;
        input.value = newValue;
        
        const totalSpan = input.closest('.habit-card').querySelector('.habit-total span');
        totalSpan.textContent = `${habit.current} ${habit.unit}`;
    }
}

function saveHabits() {
    const today = new Date().toISOString().split('T')[0];
    if (!habitsHistory[today]) {
        habitsHistory[today] = habits.map(h => ({ ...h }));
    }
    
    habitsHistory[today].forEach(habit => {
        const input = document.getElementById(`habit-${habit.id}`);
        if (input) {
            habit.current = parseFloat(input.value) || 0;
        }
    });
    
    alert('Прогресс сохранен!');
    updateStats();
}

// ============ СТАТИСТИКА ============
function updateStats() {
    stats.totalNotes = notes.length;
    stats.totalHabits = habits.length;
    
    // Проверяем существование элемента перед установкой textContent
    const streakElement = document.getElementById('streak-value');
    if (streakElement) {
        streakElement.textContent = stats.streak || 7; // Значение по умолчанию 7
    }
    
    const totalHabitsElement = document.getElementById('total-habits-value');
    if (totalHabitsElement) {
        totalHabitsElement.textContent = stats.totalHabits;
    }
}

function loadDayStats() {
    const selectedDate = document.getElementById('stats-date').value;
    if (!selectedDate) return;

    document.getElementById('selected-day-title').textContent = 
        `Заметки за ${new Date(selectedDate).toLocaleDateString('ru-RU')}`;

    // Загружаем привычки за выбранный день
    const dayHabits = habitsHistory[selectedDate] || habits.map(h => ({ ...h, current: 0 }));
    
    const dailyStatsContainer = document.getElementById('daily-habits-stats');
    dailyStatsContainer.innerHTML = `
        <h4 style="margin-bottom: 10px;font-size: clamp(12px, 3.8vw, 14vw);">Привычки за день</h4>
        ${dayHabits.map(habit => `
            <div class="daily-habit-item">
                <span class="daily-habit-name">${habit.name}</span>
                <div class="daily-habit-value">
                    <input type="number" 
                           id="daily-habit-${habit.id}" 
                           value="${habit.current}" 
                           step="${habit.step}" 
                           min="0"
                           onchange="updateDailyHabit('${selectedDate}', ${habit.id}, this.value)">
                    <span class="daily-habit-unit">${habit.unit}</span>
                </div>
            </div>
        `).join('')}
    `;

    // Загружаем заметки за выбранный день
    const dayNotes = notes.filter(note => note.date === selectedDate);
    const dayNotesList = document.getElementById('day-notes-list');

    if (dayNotes.length === 0) {
        dayNotesList.innerHTML = '<div class="empty-state">Нет заметок за этот день</div>';
    } else {
        dayNotesList.innerHTML = dayNotes.map(note => `
            <div class="day-note-item">
                <div class="day-note-content">
                    <div class="day-note-title">${note.title}</div>
                    <div class="day-note-preview">${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</div>
                </div>
                <button class="delete-day-note" onclick="deleteNote(${note.id})">🗑️</button>
            </div>
        `).join('');
    }
}

function updateDailyHabit(date, habitId, value) {
    if (!habitsHistory[date]) {
        habitsHistory[date] = habits.map(h => ({ ...h, current: 0 }));
    }
    
    const habit = habitsHistory[date].find(h => h.id === habitId);
    if (habit) {
        habit.current = parseFloat(value) || 0;
    }
}

function addDayNote() {
    const selectedDate = document.getElementById('stats-date').value;
    const noteText = document.getElementById('new-day-note').value;

    if (!selectedDate) {
        alert('Выберите дату');
        return;
    }

    if (!noteText) {
        alert('Введите текст заметки');
        return;
    }

    const newNote = {
        id: Date.now(),
        title: noteText,
        content: '',
        listType: 'none',
        date: selectedDate
    };

    notes.unshift(newNote);
    document.getElementById('new-day-note').value = '';
    loadDayStats();
    updateStats();
}

// ============ НАСТРОЙКИ ============
function changeTheme(theme) {
    const body = document.body;
    const lightBtn = document.querySelector('.theme-btn.light-theme-btn');
    const darkBtn = document.querySelector('.theme-btn.dark-theme-btn');
    
    // Удаляем старые классы темы
    body.classList.remove('light-theme', 'dark-theme');
    
    // Добавляем новую тему
    body.classList.add(`${theme}-theme`);
    
    // Обновляем активное состояние кнопок
    if (lightBtn && darkBtn) {
        if (theme === 'light') {
            lightBtn.classList.add('active');
            darkBtn.classList.remove('active');
        } else {
            darkBtn.classList.add('active');
            lightBtn.classList.remove('active');
        }
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
    
    // Принудительно обновляем цвета элементов, которые могли быть переопределены
    document.querySelectorAll('h2, h3, p, span, div').forEach(el => {
        // Просто триггерим ререндер
        el.style.transition = 'color 0.3s ease';
    });
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    changeTheme(savedTheme);
    
    // Устанавливаем сегодняшнюю дату в календарь статистики
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('stats-date').value = today;
    
    // Загружаем сохраненный аватар
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        const avatarPreview = document.getElementById('avatar-preview');
        avatarPreview.innerHTML = `<img src="${savedAvatar}" style="width:100%;height:100%;object-fit:cover;">`;
    }
    
    // Загружаем сохраненный профиль
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        try {
            const profile = JSON.parse(savedProfile);
            document.getElementById('username').value = profile.username || ''; 
            document.getElementById('bio').value = profile.bio || '';
            document.getElementById('birthdate').value = profile.birthdate || '1995-05-15';
        } catch (e) {
            console.error('Ошибка загрузки профиля:', e);
        }
    }
    
    // Загружаем начальные данные
    displayNotes();
    updateHabitsDisplay();
    updateStats();
    loadDayStats();
});