// js/leaderboard.js

document.addEventListener('DOMContentLoaded', () => {
    const leaderboardTableBody = document.getElementById('leaderboardBody');
    const clearLeaderboardButton = document.getElementById('clearLeaderboardButton');
    const backToMenuFromLeaderboardButton = document.getElementById('backToMenuFromLeaderboard');

    // Lấy phần tử audio trên trang leaderboard
    const backgroundMusicLeaderboard = document.getElementById('backgroundMusicLeaderboard');

    // Hàm tải và hiển thị điểm
    function loadAndDisplayScores() {
        const scores = JSON.parse(localStorage.getItem('minesweeperScores')) || [];
        leaderboardTableBody.innerHTML = ''; // Xóa nội dung cũ

        // Sắp xếp theo:
        // 1. Độ khó (Easy, Medium, Hard)
        // 2. Trạng thái (Thắng trước, Thua sau)
        // 3. Thời gian (tăng dần, chỉ cho người thắng)
        // 4. Ngày chơi (mới nhất trước)
        scores.sort((a, b) => {
            const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 }; 
            
            // 1. Sắp xếp theo độ khó
            const diffA = difficultyOrder[a.difficulty.toLowerCase()] || 99; 
            const diffB = difficultyOrder[b.difficulty.toLowerCase()] || 99;
            if (diffA !== diffB) {
                return diffA - diffB;
            }

            // 2. Sắp xếp theo trạng thái (thắng trước, thua sau)
            if (a.status === 'win' && b.status === 'lose') return -1;
            if (a.status === 'lose' && b.status === 'win') return 1;

            // 3. Nếu cùng trạng thái (và cùng độ khó), sắp xếp theo thời gian (chỉ áp dụng cho người thắng)
            if (a.status === 'win' && b.status === 'win') {
                if (a.time !== null && b.time !== null) {
                    return a.time - b.time;
                }
                if (a.time === null) return 1;
                if (b.time === null) return -1;
            }
            
            // 4. Nếu mọi thứ giống nhau, sắp xếp theo ngày chơi (mới nhất trước)
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });


        scores.forEach((score, index) => {
            const row = leaderboardTableBody.insertRow();
            row.insertCell(0).textContent = index + 1; // Rank
            
            const iconCell = row.insertCell(1); // Icon
            if (score.status === 'win') {
                iconCell.innerHTML = '<i class="fas fa-trophy leaderboard-icon win-icon"></i>';
            } else {
                iconCell.innerHTML = '<i class="fas fa-skull-crossbones leaderboard-icon lose-icon"></i>';
            }

            row.insertCell(2).textContent = score.time !== null ? score.time.toFixed(2) + 's' : 'N/A'; // Time, thêm 's' và N/A cho thua
            row.insertCell(3).textContent = score.playerName || 'Ẩn danh'; // Player Name
            row.insertCell(4).textContent = score.difficulty ? score.difficulty.charAt(0).toUpperCase() + score.difficulty.slice(1) : 'Không xác định'; // Độ khó (viết hoa chữ cái đầu)
            row.insertCell(5).textContent = score.status === 'win' ? 'Thắng' : 'Thua'; // Trạng thái
            row.insertCell(6).textContent = new Date(score.date).toLocaleDateString('vi-VN'); // Ngày chơi
        });
    }

    // Hàm để tải và tiếp tục trạng thái nhạc (giữ nguyên từ trước)
    function loadAndPlayMusic() {
        const lastMusicTime = parseFloat(localStorage.getItem('lastMusicTime'));
        const wasMusicPlaying = localStorage.getItem('wasMusicPlaying') === 'true';
        const isMuted = localStorage.getItem('isMusicMuted') === 'true';
        const savedVolume = parseFloat(localStorage.getItem('musicVolume'));

        if (!isNaN(savedVolume)) {
            backgroundMusicLeaderboard.volume = savedVolume;
        } else {
            backgroundMusicLeaderboard.volume = 0.5; 
        }
        
        backgroundMusicLeaderboard.muted = isMuted;

        if (!isNaN(lastMusicTime)) {
            backgroundMusicLeaderboard.currentTime = lastMusicTime;
        }

        if (wasMusicPlaying && !isMuted) {
            backgroundMusicLeaderboard.play().catch(error => {
                console.warn("Autoplay blocked on leaderboard page or user interaction needed:", error);
            });
        }
    }   

    // Hàm lưu trạng thái nhạc khi rời khỏi trang leaderboard (giữ nguyên từ trước)
    function saveMusicStateLeaderboard() {
        if (backgroundMusicLeaderboard) {
            localStorage.setItem('lastMusicTime', backgroundMusicLeaderboard.currentTime);
            localStorage.setItem('wasMusicPlaying', !backgroundMusicLeaderboard.paused);
            localStorage.setItem('isMusicMuted', backgroundMusicLeaderboard.muted); 
            localStorage.setItem('musicVolume', backgroundMusicLeaderboard.volume); 
        }
    }

    loadAndDisplayScores();
    loadAndPlayMusic(); 

    clearLeaderboardButton.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng xếp hạng không?')) {
            localStorage.removeItem('minesweeperScores');
            loadAndDisplayScores();
        }
    });

    if (backToMenuFromLeaderboardButton) {
        backToMenuFromLeaderboardButton.addEventListener('click', saveMusicStateLeaderboard);
    }
});