// ===== PARTICLE BACKGROUND =====
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

let particles = [];
const PARTICLE_COUNT = 80;
const CONNECTION_DIST = 120;
let mouse = { x: null, y: null };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Mouse interaction
        if (mouse.x !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.x += dx / dist * 0.5;
                this.y += dy / dist * 0.5;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.fill();
    }
}

for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONNECTION_DIST) {
                const opacity = 1 - dist / CONNECTION_DIST;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(168, 85, 247, ${opacity * 0.3})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}

animate();

canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// ===== TAB SWITCHING =====
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));

        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById(target + 'Form').classList.add('active');

        // Clear results
        document.querySelectorAll('.result-box').forEach(b => {
            b.className = 'result-box';
            b.innerHTML = '';
        });
    });
});

// ===== REGISTER =====
async function registerUser() {
    const nama = document.getElementById('regNama').value.trim();
    const umur = document.getElementById('regUmur').value;
    const tahunLahir = document.getElementById('regTahun').value;
    const resultBox = document.getElementById('registerResult');

    if (!nama || !umur || !tahunLahir) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = '⚠️ Harap isi semua field!';
        return;
    }

    resultBox.className = 'result-box';
    resultBox.innerHTML = '⏳ Mendaftarkan...';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama, umur, tahun_lahir: tahunLahir })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registrasi gagal');
        }

        resultBox.className = 'result-box success';
        resultBox.innerHTML = `
            ✅ REGISTRASI BERHASIL<br>
            <span style="font-size:0.75rem;color:#a855f7;">SIMPAN ID INI UNTUK LOGIN:</span>
            <span class="user-id-display">${data.user.user_id}</span>
            <span style="font-size:0.8rem;">Halo, <b>${data.user.nama}</b>! Umur: ${data.user.umur} tahun</span>
        `;

        // Update stats
        fetchStats();
    } catch (err) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = '❌ ' + err.message;
    }
}

// ===== LOGIN =====
async function loginUser() {
    const userId = document.getElementById('loginId').value.trim();
    const resultBox = document.getElementById('loginResult');

    if (!userId) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = '⚠️ Masukkan User ID!';
        return;
    }

    resultBox.className = 'result-box';
    resultBox.innerHTML = '⏳ Memverifikasi...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login gagal');
        }

        resultBox.className = 'result-box success';
        resultBox.innerHTML = `
            ✅ LOGIN BERHASIL<br>
            <span style="font-size:0.8rem;">Selamat datang kembali, <b>${data.user.nama}</b>!</span><br>
            <span style="font-size:0.75rem;color:#a855f7;">ID: ${data.user.user_id} • Umur: ${data.user.umur} tahun • Lahir: ${data.user.tahun_lahir}</span>
        `;
    } catch (err) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = '❌ ' + err.message;
    }
}

// ===== REAL-TIME STATS =====
async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        document.getElementById('totalUsers').textContent = data.total_users;
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// Poll stats every 5 seconds (real-time feel)
fetchStats();
setInterval(fetchStats, 5000);

// Enter key support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const activeForm = document.querySelector('.form-container.active');
        if (activeForm && activeForm.id === 'registerForm') {
            registerUser();
        } else if (activeForm && activeForm.id === 'loginForm') {
            loginUser();
        }
    }
});
