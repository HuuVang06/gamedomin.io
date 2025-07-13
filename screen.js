document.addEventListener('DOMContentLoaded', () => {
    // Lấy các phần tử DOM cần thiết
    const mainMenu = document.getElementById('main-menu');
    const difficultyContainer = document.getElementById('difficulty-container');
    const optionsContainer = document.getElementById('options-container');
    const gameScreenContainer = document.getElementById('game-screen-container'); // Vùng chứa màn hình game

    const playWithNameButton = document.getElementById('playWithNameButton');
    const nameInputOverlay = document.getElementById('nameInputOverlay');
    const nameInputPopup = document.getElementById('nameInputPopup');
    const playerNameInput = document.getElementById('playerNameInput');
    const startGameButton = document.getElementById('startGameButton');
    const cancelNameInputButton = document.getElementById('cancelNameInputButton');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    const optionsButton = document.getElementById('optionsButton');
    
    const backgroundMusic = document.getElementById('backgroundMusic');
    const toggleMusicButton = document.getElementById('toggleMusicButton');
    const volumeSlider = document.getElementById('volumeSlider');

    // THÊM: Lấy nút Bảng xếp hạng
    const leaderboardLink = document.getElementById('leaderboardButton'); // Giả định ID của nút/link bảng xếp hạng là 'leaderboardButton'
                                                                           // Hoặc tìm nó dựa trên href nếu là thẻ <a>:
                                                                           // const leaderboardLink = document.querySelector('a[href="../html/leaderboard.html"]');

    let selectedDifficultyLevel = ''; 
    let currentPlayerName = ''; // Lưu tên người chơi hiện tại

    // --- Hàm quản lý hiển thị các màn hình chính ---

    function hideAllContentSections() {
        mainMenu.style.display = 'none';
        difficultyContainer.style.display = 'none';
        optionsContainer.style.display = 'none';
        gameScreenContainer.style.display = 'none'; // Ẩn màn hình game
        hideNameInputPopup(0);
    }

    window.showMainMenu = function() {
        hideAllContentSections();
        mainMenu.style.display = 'flex';
    };

    window.showDifficulty = function() {
        hideAllContentSections();
        difficultyContainer.style.display = 'flex';
    };

    window.showOptions = function() {
        hideAllContentSections();
        optionsContainer.style.display = 'flex';
        updateMusicToggleState(); // Cập nhật trạng thái nút âm nhạc
        loadVolumeSetting();     // Tải thiết lập âm lượng
    };

    window.showGameScreen = function() { // Hàm mới để hiển thị màn hình game
        hideAllContentSections();
        gameScreenContainer.style.display = 'flex';
    };

    window.goBack = function() { // Quay lại menu chính từ độ khó
        showMainMenu();
    };

    window.goBackFromOptions = function() { // Quay lại menu chính từ tùy chọn
        showMainMenu();
    };

    // --- Hàm quản lý Popup nhập tên người chơi ---
    function showNameInputPopup() {
        nameInputOverlay.style.display = 'flex';
        setTimeout(() => {
            nameInputPopup.classList.add('active');
            playerNameInput.focus();
            const lastPlayerName = localStorage.getItem('lastPlayerName');
            if (lastPlayerName) {
                playerNameInput.value = lastPlayerName;
            }
        }, 10);
    }

    function hideNameInputPopup(delay = 300) {
        nameInputPopup.classList.remove('active');
        setTimeout(() => {
            nameInputOverlay.style.display = 'none';
            playerNameInput.value = '';
        }, delay);
    }

    // --- Logic Âm thanh và Âm lượng ---
    function updateMusicToggleState() {
        const isMuted = localStorage.getItem('isMusicMuted') === 'true'; 

        if (isMuted) {
            backgroundMusic.muted = true; 
            toggleMusicButton.textContent = 'TẮT';
            toggleMusicButton.classList.add('off');
        } else {
            backgroundMusic.muted = false; 
            // Cố gắng phát nhạc. Trình duyệt có thể chặn nếu không có tương tác người dùng.
            // SẼ ĐƯỢC CHỈNH SỬA Ở DƯỚI, CHÚNG TA CHỈ GỌI backgroundMusic.play() MỘT CÁCH CẨN THẬN
            toggleMusicButton.textContent = 'BẬT';
            toggleMusicButton.classList.remove('off');
        }
    }

    function loadVolumeSetting() {
        const savedVolume = parseFloat(localStorage.getItem('musicVolume'));
        if (!isNaN(savedVolume)) { 
            backgroundMusic.volume = savedVolume;
            volumeSlider.value = savedVolume;
        } else {
            backgroundMusic.volume = 0.5; // Mặc định 50%
            volumeSlider.value = 0.5;
            localStorage.setItem('musicVolume', 0.5);
        }
        
        // Nếu âm lượng = 0, coi như đang tắt tiếng
        if (backgroundMusic.volume === 0) {
            localStorage.setItem('isMusicMuted', 'true');
        } else {
            localStorage.setItem('isMusicMuted', 'false'); // Đảm bảo trạng thái mute được đồng bộ
        }
        updateMusicToggleState(); // Cập nhật trạng thái nút sau khi tải âm lượng
    }

    // THÊM: Hàm lưu trạng thái nhạc (dùng chung cho cả index và leaderboard)
    window.saveMusicState = function() {
        if (backgroundMusic) {
            localStorage.setItem('lastMusicTime', backgroundMusic.currentTime);
            localStorage.setItem('wasMusicPlaying', !backgroundMusic.paused); // Lưu trữ xem nhạc có đang phát không
            localStorage.setItem('isMusicMuted', backgroundMusic.muted);     // Lưu trạng thái mute
            localStorage.setItem('musicVolume', backgroundMusic.volume);       // Lưu âm lượng
        }
    };

    // THÊM: Hàm tải và phát nhạc khi trang được tải
    function loadAndPlayMusicOnLoad() {
        const lastMusicTime = parseFloat(localStorage.getItem('lastMusicTime'));
        const wasMusicPlaying = localStorage.getItem('wasMusicPlaying') === 'true';
        const isMuted = localStorage.getItem('isMusicMuted') === 'true';

        // Tải âm lượng và trạng thái mute trước
        loadVolumeSetting(); // Hàm này đã set backgroundMusic.volume và backgroundMusic.muted

        if (!isNaN(lastMusicTime)) {
            backgroundMusic.currentTime = lastMusicTime;
        }

        // Chỉ phát nhạc nếu nó trước đó đang phát VÀ không bị tắt tiếng
        if (wasMusicPlaying && !isMuted) {
            backgroundMusic.play().catch(error => {
                console.warn("Autoplay blocked on initial load of index.html or user interaction needed:", error);
            });
        }
    }

    // --- Xử lý sự kiện các nút và input ---

    playWithNameButton.addEventListener('click', (e) => {
        e.preventDefault();
        showNameInputPopup();
    });

    startGameButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();

        if (playerName.length === 0) {
            alert('Vui lòng nhập tên người chơi!');
            playerNameInput.focus();
            return;
        }

        localStorage.setItem('lastPlayerName', playerName);
        currentPlayerName = playerName; // Lưu tên người chơi hiện tại
        hideNameInputPopup();
        showDifficulty();
    });

    cancelNameInputButton.addEventListener('click', hideNameInputPopup);

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGameButton.click();
        }
    });

    // Xử lý khi click vào các nút "Chơi ngay" trong menu độ khó
    difficultyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            selectedDifficultyLevel = event.target.dataset.level;

            if (!currentPlayerName) { // Kiểm tra currentPlayerName thay vì localStorage
                alert('Vui lòng nhập tên người chơi trước khi chọn độ khó!');
                showNameInputPopup();
                return;
            }
            
            // Tải nội dung game.html và khởi tạo game
            loadGameContent(selectedDifficultyLevel, currentPlayerName);
        });
    });

    optionsButton.addEventListener('click', (e) => {
        e.preventDefault();
        showOptions();
    });

    toggleMusicButton.addEventListener('click', () => {
        backgroundMusic.muted = !backgroundMusic.muted;
        localStorage.setItem('isMusicMuted', backgroundMusic.muted);
        updateMusicToggleState(); 
        
        // Nếu bật nhạc trở lại và âm lượng đang 0, đặt về 0.5 (hoặc âm lượng đã lưu)
        if (!backgroundMusic.muted && backgroundMusic.volume === 0) {
            const savedVolume = parseFloat(localStorage.getItem('musicVolume'));
            backgroundMusic.volume = isNaN(savedVolume) ? 0.5 : savedVolume;
            volumeSlider.value = backgroundMusic.volume;
            localStorage.setItem('musicVolume', backgroundMusic.volume);
        }

        // Sau khi thay đổi trạng thái mute, cố gắng play lại nếu không bị mute
        if (!backgroundMusic.muted) {
            backgroundMusic.play().catch(error => {
                console.warn("Autoplay blocked when toggling music ON:", error);
            });
        }
    });

    volumeSlider.addEventListener('input', () => {
        backgroundMusic.volume = volumeSlider.value;
        localStorage.setItem('musicVolume', volumeSlider.value);

        // Nếu kéo về 0, coi như tắt tiếng
        if (backgroundMusic.volume == 0) { // Dùng == để so sánh số và chuỗi
            localStorage.setItem('isMusicMuted', 'true');
        } else {
            localStorage.setItem('isMusicMuted', 'false');
        }
        updateMusicToggleState(); // Cập nhật trạng thái nút BẬT/TẮT
        
        // Cố gắng phát nhạc nếu không bị mute và âm lượng > 0
        if (backgroundMusic.volume > 0 && !backgroundMusic.muted) {
            backgroundMusic.play().catch(error => {
                console.warn("Autoplay blocked when adjusting volume:", error);
            });
        }
    });

    // THÊM: Xử lý sự kiện click cho nút/link Bảng Xếp Hạng
    if (leaderboardLink) {
        leaderboardLink.addEventListener('click', saveMusicState);
    } else {
        console.warn("Element with ID 'leaderboardButton' not found. Please ensure your leaderboard link/button has this ID or update the selector.");
        // Nếu bạn dùng thẻ <a>, hãy đảm bảo nó có id="leaderboardButton"
        // <a href="../html/leaderboard.html" id="leaderboardButton" class="menu-button">Bảng Xếp Hạng</a>
    }

    // --- Hàm tải và khởi tạo Game ---
    async function loadGameContent(level, player) {
        try {
            const response = await fetch('../html/game.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const gameHtml = await response.text();
            gameScreenContainer.innerHTML = gameHtml; // Chèn nội dung game vào container

            showGameScreen(); // Hiển thị màn hình game

            // Sau khi nội dung game được chèn, tìm các nút và gán sự kiện
            const backToMenuButton = document.getElementById('back-to-menu-button');
            if (backToMenuButton) {
                backToMenuButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Gọi hàm reset game trong game.js (nếu có)
                    if (typeof resetGameAndUI === 'function') {
                        resetGameAndUI(); 
                    }
                    showMainMenu(); // Quay về menu chính
                });
            }

            // Khởi tạo game sau khi DOM của game đã sẵn sàng
            // Đảm bảo hàm initGame tồn tại trong game.js và được gọi đúng cách
            if (typeof initGame === 'function') {
                initGame(level, player); // Gọi hàm khởi tạo game từ game.js
            } else {
                console.error("initGame function not found in game.js. Make sure game.js is loaded and defines initGame globally.");
            }

        } catch (error) {
            console.error('Error loading game content:', error);
            alert('Không thể tải màn hình game. Vui lòng thử lại.');
            showMainMenu(); // Quay về menu chính nếu có lỗi
        }
    }

    // --- Khởi tạo khi trang tải ---
    loadAndPlayMusicOnLoad(); // THAY THẾ loadVolumeSetting(); bằng hàm này
    showMainMenu(); // Mở màn hình menu chính mặc định khi tải trang
});