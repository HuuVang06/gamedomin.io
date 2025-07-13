// Biến toàn cục để quản lý trạng thái game
let board = [];
let rows = 0;
let cols = 0;
let mines = 0;
let revealedCount = 0;
let flaggedCount = 0;
let gameOver = false;
let startTime = 0;
let timerInterval;
let isFlagMode = false;
let playerName = ''; // Tên người chơi

// Lấy các phần tử DOM của game (sẽ được tìm sau khi nội dung game được chèn)
let gameBoardElement;
let minesLeftElement;
let timerElement;
let gameStatusElement;
let displayPlayerNameElement; // Để hiển thị tên người chơi
let flagModeButton;
let resetButton;
// backToMenuButton được quản lý và gán sự kiện trong screen.js

// Hàm khởi tạo game chính, được gọi từ screen.js
function initGame(level, player) {
    playerName = player; // Lưu tên người chơi

    // Lấy lại các phần tử DOM sau khi chúng đã được chèn vào index.html
    // Đảm bảo các phần tử này nằm trong game.html (đã được inject)
    gameBoardElement = document.getElementById('game-board');
    minesLeftElement = document.getElementById('mines-left');
    timerElement = document.getElementById('timer');
    gameStatusElement = document.getElementById('game-status');
    displayPlayerNameElement = document.getElementById('displayPlayerName');
    flagModeButton = document.getElementById('flag-mode-button');
    resetButton = document.getElementById('reset-button');
    // backToMenuButton không cần lấy ở đây vì screen.js đã xử lý nó

    // Hiển thị tên người chơi
    if (displayPlayerNameElement) {
        displayPlayerNameElement.textContent = playerName;
    }

    // Gán lại sự kiện cho các nút điều khiển game
    if (flagModeButton) {
        flagModeButton.onclick = toggleFlagMode;
    }
    if (resetButton) {
        resetButton.onclick = () => initGame(level, playerName); // Chơi lại với cùng độ khó
    }

    // Reset game board và trạng thái
    resetGameAndUI();

    // Thiết lập độ khó
    switch (level) {
        case 'easy':
            rows = 8;
            cols = 8;
            mines = 10;
            break;
        case 'medium':
            rows = 12;
            cols = 12;
            mines = 20;
            break;
        case 'hard':
            rows = 16;
            cols = 16;
            mines = 40;
            break;
        default: // Mặc định dễ
            rows = 8;
            cols = 8;
            mines = 10;
    }

    // Thiết lập kích thước bảng trong CSS Grid
    if (gameBoardElement) {
        gameBoardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
        gameBoardElement.style.gridTemplateRows = `repeat(${rows}, 30px)`;
    }

    // Khởi tạo lại các biến trạng thái
    board = [];
    revealedCount = 0;
    flaggedCount = 0;
    gameOver = false;
    isFlagMode = false;
    
    if (gameStatusElement) {
        gameStatusElement.textContent = '';
        gameStatusElement.className = 'game-status'; // Reset class
    }
    if (flagModeButton) {
        flagModeButton.classList.remove('active'); // Đảm bảo nút cờ không active
        flagModeButton.innerHTML = '<i class="fas fa-flag"></i> Chế độ cắm cờ';
    }

    // Tạo bảng game và đặt mìn
    createBoard();
    placeMines();
    calculateNeighborMines();

    // Cập nhật số mìn còn lại ban đầu
    if (minesLeftElement) {
        minesLeftElement.textContent = mines;
    }

    // Reset và bắt đầu timer
    clearInterval(timerInterval);
    startTime = 0;
    if (timerElement) {
        timerElement.textContent = '0';
    }
    timerInterval = setInterval(updateTimer, 1000);
}

// Hàm reset UI và các biến liên quan đến game, hữu ích khi chuyển màn hình
function resetGameAndUI() {
    clearInterval(timerInterval);
    if (gameBoardElement) {
        gameBoardElement.innerHTML = ''; // Xóa bảng cũ
    }
    if (minesLeftElement) minesLeftElement.textContent = '0';
    if (timerElement) timerElement.textContent = '0';
    if (gameStatusElement) {
        gameStatusElement.textContent = '';
        gameStatusElement.className = 'game-status';
    }
    if (flagModeButton) flagModeButton.classList.remove('active');
    if (displayPlayerNameElement) displayPlayerNameElement.textContent = 'Người chơi'; // Reset tên người chơi

    board = [];
    revealedCount = 0;
    flaggedCount = 0;
    gameOver = false;
    startTime = 0;
    isFlagMode = false;
    // Không reset playerName ở đây vì nó được quản lý bởi screen.js
}


// Hàm tạo bảng game (tạo các ô HTML)
function createBoard() {
    if (!gameBoardElement) return; // Đảm bảo phần tử tồn tại
    gameBoardElement.innerHTML = ''; // Đảm bảo bảng trống trước khi tạo mới
    for (let r = 0; r < rows; r++) {
        board[r] = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleCellRightClick); // Chuột phải để cắm cờ
            gameBoardElement.appendChild(cell);
            board[r][c] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }
}

// Hàm đặt mìn ngẫu nhiên
function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!board[r][c].isMine) {
            board[r][c].isMine = true;
            minesPlaced++;
        }
    }
}

// Hàm tính số mìn xung quanh mỗi ô
function calculateNeighborMines() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!board[r][c].isMine) {
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue; // Bỏ qua ô hiện tại
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                board[r][c].neighborMines = count;
            }
        }
    }
}

// Xử lý click chuột trái vào ô
function handleCellClick(event) {
    if (gameOver) return;

    const r = parseInt(event.target.dataset.row);
    const c = parseInt(event.target.dataset.col);
    const cell = board[r][c];

    if (cell.isRevealed || cell.isFlagged) return;

    if (isFlagMode) {
        // Nếu đang ở chế độ cờ, thì click trái cũng cắm cờ
        toggleFlag(event.target, r, c);
        return;
    }

    revealCell(event.target, r, c);
}

// Xử lý click chuột phải vào ô (cắm cờ)
function handleCellRightClick(event) {
    event.preventDefault(); // Ngăn chặn menu ngữ cảnh mặc định
    if (gameOver) return;

    const r = parseInt(event.target.dataset.row);
    const c = parseInt(event.target.dataset.col);
    const cell = board[r][c];

    if (cell.isRevealed) return;

    toggleFlag(event.target, r, c);
}

// Hàm bật/tắt chế độ cắm cờ
function toggleFlagMode() {
    isFlagMode = !isFlagMode;
    if (isFlagMode) {
        flagModeButton.classList.add('active');
        flagModeButton.innerHTML = '<i class="fas fa-flag"></i> Chế độ cắm cờ (ĐANG BẬT)';
    } else {
        flagModeButton.classList.remove('active');
        flagModeButton.innerHTML = '<i class="fas fa-flag"></i> Chế độ cắm cờ';
    }
}

// Hàm cắm/gỡ cờ
function toggleFlag(cellElement, r, c) {
    const cell = board[r][c];
    if (cell.isFlagged) {
        cell.isFlagged = false;
        cellElement.classList.remove('flagged');
        cellElement.innerHTML = '';
        flaggedCount--;
    } else if (flaggedCount < mines) { // Chỉ cho phép cắm cờ nếu số cờ chưa vượt quá số mìn
        cell.isFlagged = true;
        cellElement.classList.add('flagged');
        cellElement.innerHTML = '<i class="fas fa-flag"></i>'; // Biểu tượng cờ
        flaggedCount++;
    }
    if (minesLeftElement) {
        minesLeftElement.textContent = mines - flaggedCount; // Cập nhật số mìn còn lại
    }
}

// Hàm tiết lộ ô
function revealCell(cellElement, r, c) {
    const cell = board[r][c];

    if (cell.isRevealed || cell.isFlagged || gameOver) return;

    cell.isRevealed = true;
    cellElement.classList.add('revealed');
    revealedCount++;

    if (cell.isMine) {
        cellElement.classList.add('mine');
        cellElement.innerHTML = '<i class="fas fa-bomb"></i>'; // Biểu tượng mìn
        endGame(false); // Thua cuộc
        return;
    }

    if (cell.neighborMines > 0) {
        cellElement.textContent = cell.neighborMines;
        cellElement.classList.add(`number-${cell.neighborMines}`);
    } else {
        // Nếu không có mìn xung quanh, tiết lộ các ô lân cận (đệ quy)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const neighborCellElement = gameBoardElement.children[nr * cols + nc];
                    revealCell(neighborCellElement, nr, nc);
                }
            }
        }
    }

    // Kiểm tra chiến thắng
    if (revealedCount === (rows * cols) - mines) {
        endGame(true); // Thắng cuộc
    }
}

// Hàm kết thúc game
function endGame(isWin) {
    gameOver = true;
    clearInterval(timerInterval); // Dừng timer

    if (isWin) {
        if (gameStatusElement) {
            gameStatusElement.textContent = 'BẠN THẮNG!';
            gameStatusElement.classList.add('win');
        }
        revealAllMines(true); // Tiết lộ tất cả mìn (đánh dấu cờ đúng)
        saveScore(playerName, startTime, rows, cols, mines); // Lưu điểm
    } else {
        if (gameStatusElement) {
            gameStatusElement.textContent = 'BẠN THUA!';
            gameStatusElement.classList.add('lose');
        }
        revealAllMines(false); // Tiết lộ tất cả mìn (hiện mìn)
    }

    // Vô hiệu hóa click trên bảng
    if (gameBoardElement) {
        Array.from(gameBoardElement.children).forEach(cellElement => {
            cellElement.removeEventListener('click', handleCellClick);
            cellElement.removeEventListener('contextmenu', handleCellRightClick);
        });
    }
}

// Hàm tiết lộ tất cả mìn khi game kết thúc
function revealAllMines(isWin) {
    if (!gameBoardElement) return;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = board[r][c];
            const cellElement = gameBoardElement.children[r * cols + c];

            if (cell.isMine) {
                if (isWin) {
                    // Nếu thắng, cắm cờ vào các ô mìn chưa được cắm cờ
                    if (!cell.isFlagged) {
                        cellElement.classList.add('flagged');
                        cellElement.innerHTML = '<i class="fas fa-flag"></i>';
                    }
                } else {
                    // Nếu thua, hiện mìn nếu chưa cắm cờ
                    if (!cell.isFlagged) {
                        cellElement.classList.add('mine');
                        cellElement.innerHTML = '<i class="fas fa-bomb"></i>';
                    }
                }
            } else if (cell.isFlagged && !isWin) {
                // Nếu thua và cắm cờ sai, hiển thị X
                cellElement.classList.add('wrong-flag');
                cellElement.innerHTML = '<i class="fas fa-times"></i>'; // Biểu tượng X
            }
        }
    }
}

// Hàm cập nhật timer
function updateTimer() {
    startTime++;
    if (timerElement) {
        timerElement.textContent = startTime;
    }
}

// Hàm lưu điểm vào Local Storage
function saveScore(player, time, r, c, m) {
    const scores = JSON.parse(localStorage.getItem('minesweeperScores')) || [];
    const difficultyMap = {
        '8x8_10': 'Dễ',
        '12x12_20': 'Trung bình',
        '16x16_40': 'Khó'
    };
    const difficultyKey = `${r}x${c}_${m}`;
    const difficultyDisplay = difficultyMap[difficultyKey] || 'Tùy chỉnh';

    const newScore = {
        player: player,
        score: time,
        difficulty: difficultyDisplay,
        date: new Date().toLocaleDateString('vi-VN'), // Định dạng ngày tháng tiếng Việt
        dateTime: new Date().toISOString() // Lưu cả thời gian để sắp xếp chính xác hơn
    };

    scores.push(newScore);
    // Sắp xếp theo điểm (thời gian) tăng dần
    scores.sort((a, b) => a.score - b.score);

    // Chỉ giữ lại 10 điểm tốt nhất
    const top10Scores = scores.slice(0, 10);

    localStorage.setItem('minesweeperScores', JSON.stringify(top10Scores));
}

// Đảm bảo các hàm này có thể được truy cập từ screen.js
// Có thể thêm vào window object nếu không dùng module
window.initGame = initGame;
window.resetGameAndUI = resetGameAndUI;