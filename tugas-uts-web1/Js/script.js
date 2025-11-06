function showAlert(type = 'error', message) {
    let container = document.getElementById('alert-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alert-container';
        container.style = "position: fixed; top: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 10px;";
        document.body.appendChild(container);
    }
    
    // Tentukan tipe alert Bootstrap (danger untuk error)
    const alertType = (type === 'error') ? 'danger' : (type === 'success' ? 'success' : 'info');
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alertType} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    container.appendChild(alertDiv);
    
    setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alertDiv);
        if (bsAlert) {
            bsAlert.close();
        }
    }, 4000);
}

// Menampilkan modal box
function showModal(modalId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

// Menutup modal box 
function closeModal(modalId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }
    }
}

// Format mata uang 
function formatCurrency(value) {
    if (isNaN(value)) value = 0;
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
}

// Mendapatkan sapaan 
function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
}

// Navigasi 
function navigateTo(page) {
    window.location.href = page;
}

// --- AUTHENTICATION & SESSION ---

// Pengecekan otentikasi 
function checkAuth() {
    const user = localStorage.getItem('loggedInUser');
    if (!user && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
}

// 1. Validasi Form 
function handleLogin(event) {
    event.preventDefault(); 
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const user = dataPengguna.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        navigateTo('dashboard.html');
    } else {
        // Panggil Alert
        showAlert('error', 'email/password yang anda masukkan salah');
    }
}

// Logout
function logout() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('cart');
    navigateTo('index.html');
}

// Simulasi Lupa Password & Daftar
function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    closeModal('forgotPasswordModal');
    showAlert('info', `Simulasi: Link reset password telah dikirim ke ${email}`);
}

function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('regEmail').value;
    closeModal('registerModal');
    showAlert('success', `Simulasi: Akun untuk ${email} berhasil dibuat.`);
}

// --- DASHBOARD (

function initializeDashboard() {
    checkAuth();
    // 2. Manipulasi DOM 
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user) {
        document.getElementById('userName').textContent = user.nama.split(' ')[0];
    }
    document.getElementById('greeting').textContent = getGreeting();
}

// --- KATALOG 

// 3. Manipulasi DOM Menggunakan Card Bootstrap
function renderCatalog() {
    checkAuth();
    const catalogGrid = document.getElementById('catalogGrid');
    if (!catalogGrid) return;
    
    catalogGrid.innerHTML = ''; // Kosongkan grid
    
    dataKatalogBuku.forEach(buku => {
        // Membuat elemen HTML baru secara dinamis
        const col = document.createElement('div');
        col.className = 'col'; // Bootstrap column
        col.innerHTML = `
            <div class="card h-100 shadow-sm card-hover">
                <img src="${buku.cover}" class="card-img-top" alt="${buku.namaBarang}" style="height: 300px; object-fit: contain; background: #f8f9fa;" onerror="this.src='img/default_cover.png'">
                <div class="card-body d-flex flex-column">
                    <p class="card-text small text-muted">${buku.jenisBarang.toUpperCase()}</p>
                    <h5 class="card-title text-primary">${buku.namaBarang}</h5>
                    <p class="card-text small text-muted">${buku.kodeBarang} | Edisi: ${buku.edisi}</p>
                    <div class="d-flex justify-content-between align-items-center my-2">
                         <h4 class="card-text text-dark mb-0">${formatCurrency(buku.harga)}</h4>
                         <span class="badge bg-light text-dark border">Stok: ${buku.stok}</span>
                    </div>
                    <button class="btn btn-success mt-auto" onclick="addToCart('${buku.kodeBarang}')">Tambah ke Keranjang</button>
                </div>
            </div>
        `;
        catalogGrid.appendChild(col);
    });
}

// 4. Manipulasi Data Tabel/Grid 
function handleAddBook(event) {
    event.preventDefault(); 
    
    // Ambil data dari form modal
    const newBook = {
        kodeBarang: document.getElementById('kodeBarang').value,
        namaBarang: document.getElementById('namaBarang').value,
        jenisBarang: document.getElementById('jenisBarang').value,
        edisi: document.getElementById('edisi').value,
        stok: parseInt(document.getElementById('stok').value),
        harga: parseInt(document.getElementById('harga').value),
        cover: document.getElementById('cover').value || 'img/default_cover.png'
    };
    
    // 1. Manipulasi Data: Tambahkan buku baru ke array
    dataKatalogBuku.push(newBook);
    
    closeModal('addBookModal');
    document.getElementById('addBookForm').reset();
    
    // 2. Manipulasi DOM: Gambar ulang seluruh katalog
    renderCatalog();
    
    showAlert('success', `${newBook.namaBarang} berhasil ditambahkan ke katalog.`);
}

// --- CHECKOUT 

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(kodeBarang) {
    const book = dataKatalogBuku.find(b => b.kodeBarang === kodeBarang);
    
    const cartItem = cart.find(item => item.kodeBarang === kodeBarang);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...book, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    showAlert('success', `${book.namaBarang} ditambahkan ke keranjang.`);
    
    if(document.getElementById('cartItemsList')) {
        renderCartItems();
        updateCartSummary();
    }
}

function initializeCheckout() {
    checkAuth();
    renderCartItems();
    updateCartSummary();
}

function renderCartItems() {
    const cartItemsList = document.getElementById('cartItemsList');
    if (!cartItemsList) return;
    
    cartItemsList.innerHTML = ''; 
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<li class="list-group-item">Keranjang Anda kosong.</li>';
        return;
    }
    
    cart.forEach(item => {
        cartItemsList.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <img src="${item.cover}" alt="${item.namaBarang}" class="cart-item-image me-2 rounded" onerror="this.src='img/default_cover.png'">
                    <div>
                        <span class="fw-bold">${item.namaBarang}</span>
                        <br>
                        <small class="text-muted">x${item.quantity}</small>
                    </div>
                </div>
                <span>${formatCurrency(item.harga * item.quantity)}</span>
            </li>
        `;
    });
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
    const shipping = 15000;
    const total = subtotal + shipping;
    
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('shipping').textContent = formatCurrency(shipping);
    document.getElementById('total').textContent = formatCurrency(total);
}

function handleCheckout(event) {
    event.preventDefault();
    if (cart.length === 0) {
        showAlert('error', 'Keranjang Anda kosong.');
        return;
    }
    
    cart = [];
    localStorage.removeItem('cart');
    showAlert('success', 'Pemesanan berhasil!');
    renderCartItems();
    updateCartSummary();
    
    setTimeout(() => navigateTo('dashboard.html'), 2000);
}


// --- TRACKING 

function handleTracking(event) {
    event.preventDefault();
    const trackingNumber = document.getElementById('trackingNumber').value;
    const resultDiv = document.getElementById('trackingResult');
    
    const data = dataTracking[trackingNumber]; // Cari di data.js
    
    if (data) {
        // 5. Manipulasi DOM 
        document.getElementById('resultNama').textContent = data.nama;
        document.getElementById('resultStatus').textContent = data.status;
        document.getElementById('resultEkspedisi').textContent = `${data.ekspedisi} (${data.paket})`;
        document.getElementById('resultTanggalKirim').textContent = data.tanggalKirim;
        document.getElementById('resultTotal').textContent = data.total;

        // 6. Inline CSS
        const progressFill = document.getElementById('progressFill');
        let progress = (data.status === "Dikirim") ? 100 : 50;
        progressFill.style.width = `${progress}%`; // Ini adalah Inline CSS
        progressFill.setAttribute('aria-valuenow', progress);
        
        resultDiv.style.display = 'block'; // Ini juga Inline CSS
    } else {
        showAlert('error', 'Nomor Delivery Order tidak ditemukan.');
        resultDiv.style.display = 'none';
    }
}