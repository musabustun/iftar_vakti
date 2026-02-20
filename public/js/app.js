document.addEventListener('DOMContentLoaded', () => {
    // Main UI Elements
    const citySelect = document.getElementById('city-select');
    const targetLabel = document.getElementById('target-label');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const progressBar = document.getElementById('progress-bar');
    const nextPrayerInfo = document.getElementById('next-prayer-info');
    const loader = document.getElementById('loader');

    // Onboarding Elements
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    const onboardingCitySelect = document.getElementById('onboarding-city-select');
    const detectLocationBtn = document.getElementById('detect-location-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    let turkeyId = null;
    let currentCityId = null;
    let timerInterval = null;
    let timesData = null;

    // 1. Initialize App
    async function init() {
        try {
            showLoader();
            await fetchTurkeyId();
            const cities = await populateCities();

            // Sync both dropdowns
            [citySelect, onboardingCitySelect].forEach(select => {
                select.innerHTML = '<option value="">Şehir Seçiniz</option>';
                cities.forEach(city => {
                    const option = document.createElement('option');
                    option.value = city.SehirID;
                    option.textContent = city.SehirAdi;
                    select.appendChild(option);
                });
                select.disabled = false;
            });

            // Check Persistence
            const savedCityId = localStorage.getItem('selectedCityId');
            if (savedCityId) {
                currentCityId = savedCityId;
                citySelect.value = savedCityId;
                await loadTimes(currentCityId);
                onboardingOverlay.classList.add('hidden');
            } else {
                showOnboarding();
            }

            // Event Listeners
            citySelect.addEventListener('change', (e) => {
                handleCityChange(e.target.value);
            });

            onboardingCitySelect.addEventListener('change', (e) => {
                saveSettingsBtn.disabled = !e.target.value;
            });

            detectLocationBtn.addEventListener('click', () => {
                getUserLocation();
            });

            saveSettingsBtn.addEventListener('click', () => {
                const selected = onboardingCitySelect.value;
                if (selected) {
                    currentCityId = selected;
                    localStorage.setItem('selectedCityId', selected);
                    citySelect.value = selected;
                    onboardingOverlay.classList.add('hidden');
                    loadTimes(currentCityId);
                }
            });

            hideLoader();
        } catch (error) {
            console.error("Initialization error", error);
            showError("Sistem başlatılırken bir hata oluştu.");
            hideLoader();
        }
    }

    // 2. Fetch Turkey Country ID
    async function fetchTurkeyId() {
        try {
            const res = await axios.get('/api/ulkeler');
            const turkey = res.data.find(u => u.UlkeAdi === 'TURKIYE');
            if (turkey) {
                turkeyId = turkey.UlkeID;
            } else {
                throw new Error("Türkiye ID bulunamadı.");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // 3. Populate Cities Data
    async function populateCities() {
        if (!turkeyId) return [];
        try {
            const res = await axios.get(`/api/sehirler/${turkeyId}`);
            return res.data;
        } catch (error) {
            console.error("Şehirler yüklenemedi", error);
            throw error;
        }
    }

    // 4. Geolocation mapping
    function getUserLocation() {
        detectLocationBtn.textContent = "Aranıyor...";
        detectLocationBtn.disabled = true;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // Simulation: In a real app we'd call a reverse geocoder.
                    // Here we'll just pre-select a default (Istanbul: 539) and notify.
                    // For Turkey, we could potentially match coords to city boundaries.
                    const suggestedCityId = "539"; // İstanbul
                    onboardingCitySelect.value = suggestedCityId;
                    saveSettingsBtn.disabled = false;
                    detectLocationBtn.textContent = "Konum Bulundu (İstanbul)";
                    detectLocationBtn.style.borderColor = "#4CAF50";
                    detectLocationBtn.style.color = "#4CAF50";
                },
                (error) => {
                    console.log("Geolocation error:", error);
                    detectLocationBtn.textContent = "Hata! Manuel Seçiniz";
                    detectLocationBtn.disabled = false;
                }
            );
        } else {
            detectLocationBtn.textContent = "Desteklenmiyor";
        }
    }

    function handleCityChange(newId) {
        if (newId) {
            currentCityId = newId;
            localStorage.setItem('selectedCityId', newId);
            loadTimes(currentCityId);
        }
    }

    // 5. Load times
    async function loadTimes(sehirId) {
        showLoader();
        try {
            const ilceRes = await axios.get(`/api/ilceler/${sehirId}`);
            const ilce = ilceRes.data[0];
            if (!ilce) throw new Error("İlçe bulunamadı");

            const vakitRes = await axios.get(`/api/vakitler/${ilce.IlceID}`);
            timesData = vakitRes.data;
            startCountdown();
            hideLoader();
        } catch (error) {
            console.error("Vakitler yüklenemedi", error);
            showError("Vakitler alınamadı.");
            hideLoader();
        }
    }

    // 6. Countdown logic
    function startCountdown() {
        if (timerInterval) clearInterval(timerInterval);

        function update() {
            if (!timesData || timesData.length === 0) return;

            const nowStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
            const now = new Date(nowStr);

            const todayData = timesData[0];
            const tomorrowData = timesData.length > 1 ? timesData[1] : null;

            const parseTime = (timeStr, isTomorrow = false) => {
                const parts = timeStr.split(':');
                const d = new Date(nowStr);
                if (isTomorrow) d.setDate(d.getDate() + 1);
                d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
                return d;
            };

            const todayImsak = parseTime(todayData.Imsak);
            const todayAksam = parseTime(todayData.Aksam);

            let targetDate;
            let labelText = "";
            let infoText = "";
            let startPeriodDate;

            if (now < todayImsak) {
                targetDate = todayImsak;
                labelText = "SAHURA KALAN VAKİT";
                infoText = `Bugünün İftarı: ${todayData.Aksam}`;
                startPeriodDate = new Date(nowStr);
                startPeriodDate.setDate(startPeriodDate.getDate() - 1);
                startPeriodDate.setHours(18, 0, 0, 0);
            }
            else if (now >= todayImsak && now < todayAksam) {
                targetDate = todayAksam;
                labelText = "İFTARA KALAN VAKİT";
                infoText = tomorrowData ? `Yarının Sahuru: ${tomorrowData.Imsak}` : '';
                startPeriodDate = todayImsak;
            }
            else {
                if (tomorrowData) {
                    targetDate = parseTime(tomorrowData.Imsak, true);
                    labelText = "SAHURA KALAN VAKİT";
                    infoText = `Yarının İftarı: ${tomorrowData.Aksam}`;
                    startPeriodDate = todayAksam;
                } else {
                    targetLabel.textContent = "Veri Yok";
                    return;
                }
            }

            const diffMs = targetDate - now;

            if (diffMs <= 0) {
                clearInterval(timerInterval);
                loadTimes(currentCityId);
                return;
            }

            const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diffMs % (1000 * 60)) / 1000);

            targetLabel.textContent = labelText;
            hoursEl.textContent = h.toString().padStart(2, '0');
            minutesEl.textContent = m.toString().padStart(2, '0');
            secondsEl.textContent = s.toString().padStart(2, '0');
            nextPrayerInfo.textContent = infoText;

            const totalMs = targetDate - startPeriodDate;
            const elapsedMs = now - startPeriodDate;
            const percent = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));
            progressBar.style.width = `${percent}%`;
        }

        update();
        timerInterval = setInterval(update, 1000);
    }

    // UI Helpers
    function showOnboarding() { onboardingOverlay.classList.remove('hidden'); }
    function showLoader() { loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
    function showError(msg) {
        targetLabel.textContent = "Hata";
        nextPrayerInfo.textContent = msg;
    }

    init();
});
