// Данные о местах для голосования
const places = [
    { id: 1, name: "Лагерный Сад", description: "", votes: 0, x: 26.8, y: 85.7 },
    { id: 2, name: "Городской сад", description: "", votes: 0, x: 43.5, y: 52.5 },
    { id: 3, name: "Белое озеро", description: "", votes: 0, x: 48.5, y: 15 },
    { id: 4, name: "Михайловская роща", description: "", votes: 0, x: 82.05, y: 23 },
    { id: 5, name: "Сибирский ботанический сад ТГУ", description: "", votes: 0, x: 13.3, y: 66.5 },
    { id: 6, name: "Воскресенская гора", description: "", votes: 0, x: 31, y: 26 },
    { id: 7, name: "Ново-Соборная площадь", description: "", votes: 0, x: 30.7, y: 52.5 },
    { id: 8, name: "Татарская Слобода", description: "", votes: 0, x: 13.4, y: 42.5 },
    { id: 9, name: "Парк Буревестник", description: "", votes: 0, x: 64.8, y: 93.5 },
    { id: 10, name: "Томский государственный университет", description: "", votes: 0, x: 21, y: 66.3 },
    { id: 11, name: "Томский государственный университет систем управления и радиоэлектроники", description: "", votes: 0, x: 20.5, y: 49.6 },
    { id: 12, name: "Томский государственный политехнический университет", description: "", votes: 0, x: 21, y: 72.8 },
    { id: 13, name: "Томский государственный архитектурно-строительный университет", description: "", votes: 0, x: 43.6, y: 7.8 },
    { id: 14, name: "Томский государственный педагогический университет", description: "", votes: 0, x: 70.5, y: 60 },
    { id: 15, name: "Сибирский государственный медицинский университет", description: "", votes: 0, x: 21, y: 57.5 },
    { id: 16, name: "Томский областной театр Драмы", description: "", votes: 0, x: 17.1, y: 29 },
    { id: 17, name: "Томская филармония", description: "", votes: 0, x: 27.5, y: 33 },
    { id: 18, name: "Стендап-клуб Томедия", description: "", votes: 0, x: 28, y: 40.6 },
    { id: 19, name: "Памятник А. П. Чехову", description: "", votes: 0, x: 17, y: 34.5 },
    { id: 20, name: "Дом архитектора С. В. Хомича", description: "", votes: 0, x: 40, y: 59 },
    { id: 21, name: "Дом с драконами", description: "", votes: 0, x: 51.8, y: 54 },
    { id: 22, name: "Дом с жар-птицами", description: "", votes: 0, x: 46.5, y: 59 },
    { id: 23, name: "Мемorialный музей 'Следственная тюрьма НКВД'", description: "", votes: 0, x: 20.3, y: 43 },
    { id: 24, name: "Томский областной краеведческий музей им. М. Б. Шатилова", description: "", votes: 0, x: 28.7, y: 45.5 },
    { id: 25, name: "Музей деревянного зодчества", description: "", votes: 0, x: 41, y: 66.1 },
    { id: 26, name: "Музей истории Томска", description: "", votes: 0, x: 42.5, y: 28.5  },
    { id: 27, name: "Музей славянской мифологии", description: "", votes: 0, x: 46.6, y: 23.5 },
    { id: 28, name: "ТРК 'Лето' ", description: "", votes: 0, x: 43.3, y: 78.8 },
    { id: 29, name: "Гастрохолл 'Лампочка'", description: "", votes: 0, x: 47.3, y: 69.3 },
    { id: 30, name: "ТЦ 'Изумрудный город'", description: "", votes: 0, x: 70, y: 31.4 }
];

// Элементы DOM
const mapElement = document.getElementById('map');
const placesList = document.getElementById('placesList');
const searchInput = document.getElementById('searchInput');
const voteBtn = document.getElementById('voteBtn');
const selectedPlace = document.getElementById('selectedPlace');
const resultsContainer = document.getElementById('resultsContainer');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const resetBtn = document.getElementById('resetBtn');

let selectedPlaceId = null;

// Firebase инициализация (теперь после загрузки firebase)
let db;
const VOTES_DOC = 'votes';
const PLACES_COLLECTION = 'places';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Firebase уже инициализирован в HTML
        db = firebase.firestore();
        console.log('Firestore initialized');
        
        // Остальная инициализация...
        loadVotes();
        renderPlacesList();
        setupEventListeners();
        setupRealtimeUpdates();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Ошибка подключения к базе данных', true);
        loadFromLocalStorage();
        renderPlacesList();
        setupEventListeners();
    }
});

// Загрузка голосов
async function loadVotes() {
    try {
        console.log('Loading votes from Firestore...');
        const doc = await db.collection(PLACES_COLLECTION).doc(VOTES_DOC).get();
        
        if (doc.exists) {
            const votesData = doc.data();
            console.log('Votes data loaded:', votesData);
            
            places.forEach(place => {
                if (votesData[place.id] !== undefined) {
                    place.votes = votesData[place.id];
                }
            });
            
            updateVoteCounts();
            renderTopThreeResults();
            createMapMarkers();
        } else {
            console.log('Document does not exist, creating...');
            await initializeVotes();
        }
    } catch (error) {
        console.error("Ошибка загрузки:", error);
        loadFromLocalStorage();
    }
}

// Инициализация голосов
async function initializeVotes() {
    const initialVotes = {};
    places.forEach(place => {
        initialVotes[place.id] = 0;
    });
    
    try {
        await db.collection(PLACES_COLLECTION).doc(VOTES_DOC).set(initialVotes);
        console.log('Initial votes created');
    } catch (error) {
        console.error("Ошибка инициализации:", error);
    }
}

// Голосование
async function voteOnServer(placeId) {
    try {
        // Оптимистичное обновление (показываем сразу)
        const place = places.find(p => p.id === placeId);
        const oldVotes = place.votes;
        place.votes = oldVotes + 1;

        updateVoteCounts();
        renderTopThreeResults();
        createMapMarkers();
        
        // Затем обновляем на сервере
        await db.collection(PLACES_COLLECTION).doc(VOTES_DOC).update({
            [placeId]: firebase.firestore.FieldValue.increment(1)
        });
        
        return true;
    } catch (error) {
        console.error("Ошибка голосования:", error);
        
        // Откатываем изменения при ошибке
        const place = places.find(p => p.id === placeId);
        place.votes--;
        
        updateVoteCounts();
        renderTopThreeResults();
        createMapMarkers();
        
        return false;
    }
};



// Real-time обновления
function setupRealtimeUpdates() {
    db.collection(PLACES_COLLECTION).doc(VOTES_DOC)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const votesData = doc.data();
                console.log('Real-time update:', votesData);
                
                // Обновляем только если данные действительно изменились
                let changed = false;
                places.forEach(place => {
                    if (votesData[place.id] !== undefined && place.votes !== votesData[place.id]) {
                        place.votes = votesData[place.id];
                        changed = true;
                    }
                });
                
                if (changed) {
                    updateVoteCounts();
                    renderTopThreeResults();
                    createMapMarkers();
                    saveToLocalStorage();
                }
            }
        }, (error) => {
            console.error("Ошибка real-time:", error);
        });
}

// Fallback: загрузка из localStorage
function loadFromLocalStorage() {
    const savedVotes = localStorage.getItem('placeVotes');
    if (savedVotes) {
        const votes = JSON.parse(savedVotes);
        places.forEach(place => {
            if (votes[place.id] !== undefined) {
                place.votes = votes[place.id];
            }
        });
        updateVoteCounts();
        renderTopThreeResults();
        createMapMarkers();
    }
}

// Fallback: сохранение в localStorage
function saveToLocalStorage() {
    const votes = {};
    places.forEach(place => {
        votes[place.id] = place.votes;
    });
    localStorage.setItem('placeVotes', JSON.stringify(votes));
}

// Создание маркеров на карте
function createMapMarkers() {
    if (!mapElement) return;
    
    mapElement.innerHTML = '';
    
    const sortedPlaces = [...places].sort((a, b) => b.votes - a.votes);
    
    sortedPlaces.forEach((place, index) => {
        const marker = document.createElement('div');
        marker.className = 'location-marker';
        marker.style.left = `${place.x}%`;
        marker.style.top = `${place.y}%`;
        marker.dataset.id = place.id;
        marker.id = `marker-${place.id}`;
        
        if (index === 0 && place.votes > 0) {
            marker.classList.add('winner');
        } else if (index === 1 && place.votes > 0) {
            marker.classList.add('runner-up');
        } else if (index === 2 && place.votes > 0) {
            marker.classList.add('third-place');
        }
        
        marker.addEventListener('click', () => {
            selectPlace(place.id);
        });
        
        mapElement.appendChild(marker);
    });
    
    if (selectedPlaceId) {
        highlightMarker(selectedPlaceId);
    }
}

// Подсветка маркера на карте
function highlightMarker(placeId) {
    const allMarkers = document.querySelectorAll('.location-marker');
    allMarkers.forEach(marker => {
        marker.classList.remove('active');
    });
    
    const selectedMarker = document.getElementById(`marker-${placeId}`);
    if (selectedMarker) {
        selectedMarker.classList.add('active');
    }
}

// Заполнение списка мест
function renderPlacesList() {
    if (!placesList) return;
    
    placesList.innerHTML = '';
    places.forEach(place => {
        const li = document.createElement('li');
        li.className = 'place-item';
        li.dataset.id = place.id;
        
        const placeInfo = document.createElement('div');
        placeInfo.textContent = place.name;
        
        const voteCount = document.createElement('span');
        voteCount.className = 'vote-count';
        voteCount.textContent = place.votes;
        
        li.appendChild(placeInfo);
        li.appendChild(voteCount);
        
        li.addEventListener('click', () => {
            selectPlace(place.id);
        });
        
        placesList.appendChild(li);
    });
}

// Отображение топ-3 результатов
function renderTopThreeResults() {
    if (!resultsContainer) return;
    
    const sortedPlaces = [...places].sort((a, b) => b.votes - a.votes);
    const topPlaces = sortedPlaces.slice(0, 3).filter(place => place.votes > 0);
    
    resultsContainer.innerHTML = '';
    
    if (topPlaces.length === 0) {
        resultsContainer.innerHTML = '<p>Пока нет голосов. Будьте первым!</p>';
        return;
    }
    
    const maxVotes = Math.max(...topPlaces.map(p => p.votes), 1);
    
    topPlaces.forEach((place, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const placeName = document.createElement('div');
        
        let medalClass = '';
        if (index === 0) medalClass = 'medal-gold';
        if (index === 1) medalClass = 'medal-silver';
        if (index === 2) medalClass = 'medal-bronze';
        
        placeName.innerHTML = `
            ${medalClass ? `<span class="medal ${medalClass}">${index + 1}</span>` : ''}
            ${place.name}
        `;
        
        const resultBar = document.createElement('div');
        resultBar.className = 'result-bar';
        
        const resultFill = document.createElement('div');
        resultFill.className = 'result-fill';
        resultFill.style.width = `${(place.votes / maxVotes) * 100}%`;
        
        const resultText = document.createElement('div');
        resultText.className = 'result-text';
        resultText.textContent = `${place.votes} голосов`;
        
        resultBar.appendChild(resultFill);
        resultBar.appendChild(resultText);
        
        resultItem.appendChild(placeName);
        resultItem.appendChild(resultBar);
        
        resultsContainer.appendChild(resultItem);
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Поиск
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            const items = placesList.getElementsByClassName('place-item');
            
            Array.from(items).forEach(item => {
                const placeName = item.firstChild.textContent.toLowerCase();
                if (placeName.includes(searchText)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
    
    // Голосование
    if (voteBtn) {
        voteBtn.addEventListener('click', async function() {
            if (selectedPlaceId !== null) {
                await voteOnServer(selectedPlaceId);
                saveToLocalStorage();
                showNotification('Ваш голос учтен!');
                resetSelection();
            }
        });
    }
    
// Выбор места
function selectPlace(placeId) {
    selectedPlaceId = placeId;
    const place = places.find(p => p.id === placeId);
    
    const items = placesList.getElementsByClassName('place-item');
    Array.from(items).forEach(item => {
        if (parseInt(item.dataset.id) === placeId) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    highlightMarker(placeId);
    
    if (selectedPlace) {
        selectedPlace.innerHTML = `
            <h3>${place.name}</h3>
            <p>${place.description || 'Интересное место Томска'}</p>
            <p><strong>Голосов:</strong> ${place.votes}</p>
        `;
    }
    
    if (voteBtn) {
        voteBtn.disabled = false;
    }
}

// Сброс выбора
function resetSelection() {
    selectedPlaceId = null;
    
    const items = placesList.getElementsByClassName('place-item');
    Array.from(items).forEach(item => {
        item.classList.remove('selected');
    });
    
    const allMarkers = document.querySelectorAll('.location-marker');
    allMarkers.forEach(marker => {
        marker.classList.remove('active');
    });
    
    if (selectedPlace) {
        selectedPlace.innerHTML = '<p>Выберите место из списка или на карте для голосования</p>';
    }
    
    if (voteBtn) {
        voteBtn.disabled = true;
    }
}

// Обновление счетчиков голосов
function updateVoteCounts() {
    const items = placesList.getElementsByClassName('place-item');
    Array.from(items).forEach(item => {
        const placeId = parseInt(item.dataset.id);
        const place = places.find(p => p.id === placeId);
        if (place) {
            item.querySelector('.vote-count').textContent = place.votes;
        }
    });
}

// Показать уведомление
function showNotification(message, isError = false) {
    if (!notification || !notificationText) return;
    
    notificationText.textContent = message;
    
    if (isError) {
        notification.classList.add('error');
    } else {
        notification.classList.remove('error');
    }
    
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
