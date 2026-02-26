 // ============ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ============
        let currentListType = 'none';
        let editingNoteId = null;
        let habits = [
            { id: 1, name: 'Вода', target: '2 литра', unit: 'л', current: 0.5, step: 0.1 },
            { id: 2, name: 'Спорт', target: '30 минут', unit: 'мин', current: 15, step: 1 },
            { id: 3, name: 'Чтение', target: '20 минут', unit: 'мин', current: 10, step: 1 },
        ];
        
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
            totalWater: 0,
            totalNotes: 0,
            totalSport: 0,
            totalReading: 0,
            totalActions: 0
        };

        // ============ УПРАВЛЕНИЕ ВКЛАДКАМИ ============
        function switchTab(tabName, event) {
            // Обновляем заголовок
            // const header = document.getElementById('app-header');
            const titles = {
                'profile': 'Профиль',
                'notes': 'Заметки',
                'habits': 'Привычки',
                'stats': 'Статистика'
            };
            // header.textContent = titles[tabName];

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
                loadDayNotes();
            } else if (tabName === 'notes') {
                displayNotes();
            }
        }

        // ============ ПРОФИЛЬ ============
        function handleAvatarUpload(event) {
            const file = event.target.files[0];
            if (file) {
                // Проверяем размер файла (не больше 1MB)
                if (file.size > 1024 * 1024) {
                    alert('Файл слишком большой. Максимальный размер - 1MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    const avatarPreview = document.getElementById('avatar-preview');
                    avatarPreview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
                    
                    // Сохраняем аватар в localStorage с обработкой ошибки квоты
                    try {
                        localStorage.setItem('userAvatar', e.target.result);
                    } catch (error) {
                        if (error.name === 'QuotaExceededError') {
                            alert('Не удалось сохранить изображение. Превышен лимит хранилища. Используйте изображение меньшего размера.');
                        } else {
                            console.error('Ошибка сохранения:', error);
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
                if (error.username === 'QuotaExceededError') {
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
                
                // Убираем форматирование из текста
                if (textarea.value) {
                    // Удаляем маркеры списка из начала каждой строки
                    const lines = textarea.value.split('\n');
                    const cleanedLines = lines.map(line => {
                        // Удаляем "• " в начале строки
                        line = line.replace(/^•\s*/, '');
                        // Удаляем номера (1., 2., 3. и т.д.) в начале строки
                        line = line.replace(/^\d+\.\s*/, '');
                        return line;
                    });
                    textarea.value = cleanedLines.join('\n');
                }
            } else {
                // Устанавливаем новый тип форматирования
                currentListType = type;
                
                // Обновляем стили кнопок
                document.getElementById('bulleted-btn').classList.remove('active');
                document.getElementById('numbered-btn').classList.remove('active');
                document.getElementById(type === 'bulleted' ? 'bulleted-btn' : 'numbered-btn').classList.add('active');
                
                // Форматируем существующий текст
                if (textarea.value) {
                    formatExistingText(textarea);
                } else {
                    // Если текст пустой, добавляем маркер для первой строки
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
                // Форматируем как маркированный список
                const formattedLines = lines.map(line => {
                    // Сначала убираем существующие маркеры
                    line = line.replace(/^[•\d]+\.\s*/, '');
                    // Затем добавляем новый маркер, если строка не пустая
                    return line.trim() ? `• ${line}` : '';
                });
                textarea.value = formattedLines.join('\n');
            } else if (currentListType === 'numbered') {
                // Форматируем как нумерованный список
                let number = 1;
                const formattedLines = lines.map(line => {
                    // Убираем существующие маркеры
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
                
                // Получаем текущую строку
                const lines = text.substring(0, start).split('\n');
                const currentLine = lines[lines.length - 1];
                
                let newText = '';
                
                if (currentListType === 'bulleted') {
                    // Добавляем маркер списка
                    newText = text.substring(0, start) + '\n• ' + text.substring(end);
                } else if (currentListType === 'numbered') {
                    // Ищем последний номер в списке
                    const match = currentLine.match(/^(\d+)\.\s/);
                    if (match) {
                        const nextNumber = parseInt(match[1]) + 1;
                        newText = text.substring(0, start) + `\n${nextNumber}. ` + text.substring(end);
                    } else {
                        newText = text.substring(0, start) + '\n1. ' + text.substring(end);
                    }
                } else {
                    // Обычный перенос строки
                    newText = text.substring(0, start) + '\n' + text.substring(end);
                }
                
                textarea.value = newText;
                
                // Устанавливаем курсор в нужное место
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

            // Важно: при редактировании сохраняем оригинальную дату!
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
                date: noteDate  // Сохраняем оригинальную дату при редактировании
            };

            if (editingNoteId) {
                // Обновляем существующую заметку
                const index = notes.findIndex(n => n.id === editingNoteId);
                if (index !== -1) {
                    notes[index] = newNote;
                }
                editingNoteId = null;
                document.getElementById('add-note-btn').textContent = 'Добавить заметку';
            } else {
                // Добавляем новую заметку
                notes.unshift(newNote);
            }

            // Очищаем форму
            document.getElementById('note-title').value = '';
            document.getElementById('note-content').value = '';
            
            // Сбрасываем тип списка
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
                
                // Устанавливаем тип списка
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
                
                // Если мы на вкладке статистики, обновляем список заметок за день
                if (document.getElementById('stats-tab').classList.contains('active')) {
                    loadDayNotes();
                }
            }
        }

        // ============ ПРИВЫЧКИ ============
        function updateHabitsDisplay() {
            const habitsList = document.getElementById('habits-list');
            const today = new Date();
            document.getElementById('current-date').textContent = today.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            habitsList.innerHTML = habits.map(habit => `
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
            const habit = habits.find(h => h.id === habitId);
            if (habit) {
                const input = document.getElementById(`habit-${habitId}`);
                let newValue = (parseFloat(input.value) || 0) + change;
                // Не даем уйти в минус
                newValue = Math.max(0, newValue);
                // Округляем до 1 знака после запятой для литров
                if (habit.unit === 'л') {
                    newValue = Math.round(newValue * 10) / 10;
                } else {
                    newValue = Math.round(newValue);
                }
                habit.current = newValue;
                input.value = newValue;
                
                // Обновляем отображение
                const totalSpan = input.closest('.habit-card').querySelector('.habit-total span');
                totalSpan.textContent = `${habit.current} ${habit.unit}`;
            }
        }

        function saveHabits() {
            // Обновляем значения из полей ввода
            habits.forEach(habit => {
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
            // Обновляем статистику на основе данных
            stats.totalNotes = notes.length;
            
            // Находим привычки и обновляем их значения
            const waterHabit = habits.find(h => h.name === 'Вода');
            const sportHabit = habits.find(h => h.name === 'Спорт');
            const readingHabit = habits.find(h => h.name === 'Чтение');
            
            stats.totalWater = waterHabit ? waterHabit.current : 0;
            stats.totalSport = sportHabit ? sportHabit.current : 0;
            stats.totalReading = readingHabit ? readingHabit.current : 0;
            
            // Количество привычек (всегда 3 в нашем случае)
            stats.totalActions = habits.length;

            const statsGrid = document.getElementById('stats-grid');
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${stats.streak}</div>
                    <div class="stat-label">дней подряд</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalWater.toFixed(1)}</div>
                    <div class="stat-label">л всего воды</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalNotes}</div>
                    <div class="stat-label">заметок</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalSport}</div>
                    <div class="stat-label">мин спорта</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalReading}</div>
                    <div class="stat-label">мин чтения</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalActions}</div>
                    <div class="stat-label">привычек</div>
                </div>
            `;
        }

        function loadDayNotes() {
            const selectedDate = document.getElementById('stats-date').value;
            if (!selectedDate) return;

            document.getElementById('selected-day-title').textContent = 
                `Заметки за ${new Date(selectedDate).toLocaleDateString('ru-RU')}`;

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
                title: noteText, // Текст становится заголовком!
                content: '',      // Контент оставляем пустым
                listType: 'none',
                date: selectedDate
            };

            notes.unshift(newNote);
            document.getElementById('new-day-note').value = '';
            loadDayNotes();
            updateStats();
        }

        // ============ ИНИЦИАЛИЗАЦИЯ ============
        document.addEventListener('DOMContentLoaded', function() {
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
                    document.getElementById('name').value = profile.name || '';
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
        });