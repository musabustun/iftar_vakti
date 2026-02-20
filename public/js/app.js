document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city-select');
    const targetLabel = document.getElementById('target-label');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const progressBar = document.getElementById('progress-bar');
    const nextPrayerInfo = document.getElementById('next-prayer-info');
    const loader = document.getElementById('loader');

    let turkeyId = null;
    let currentCityId = null;
    let timerInterval = null;
    let timesData = null; // Store today's and tomorrow's times if needed

    // 1. Initialize App
    async function init() {
        try {
            await fetchTurkeyId();
            await populateCities();
            await getUserLocation();

            citySelect.addEventListener('change', (e) => {
                const selectedCity = e.target.value;
                if (selectedCity) {
                    currentCityId = selectedCity;
                    loadTimes(currentCityId);
                }
            });
        } catch (error) {
            console.error("Initialization error", error);
            showError("Sistem başlatılırken bir hata oluştu.");
        }
    }

    // 2. Fetch Turkey Country ID
    async function fetchTurkeyId() {
        try {
            const res = await axios.get('/api/ulkeler');
            const turkey = res.data.find(u => u.UlkeAdi === 'TÜRKİYE');
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

    // 3. Populate Cities Dropdown
    async function populateCities() {
        if (!turkeyId) return;
        try {
            const res = await axios.get(`/api/sehirler/${turkeyId}`);
            const cities = res.data;

            citySelect.innerHTML = '<option value="">Şehir Seçiniz</option>';
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.SehirID;
                option.textContent = city.SehirAdi;
                citySelect.appendChild(option);
            });
            citySelect.disabled = false;
            return cities;
        } catch (error) {
            console.error("Şehirler yüklenemedi", error);
            throw error;
        }
    }

    // 4. Geolocation mapping (simplified mapping)
    // For a real app, we'd need a lat/lng to nearest city mapper, 
    // but the API expects SehirID, so we'll default to Ankara if geo fails.
    // Diyanet API "Ankara" ID is typically 538.
    async function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // Ideally use a reverse geocoder, here we fallback to Default/Ankara
                    const defaultCityId = "538"; // Ankara ID
                    citySelect.value = defaultCityId;
                    currentCityId = defaultCityId;
                    await loadTimes(currentCityId);
                },
                async (error) => {
                    console.log("Geolocation denied or failed, defaulting to Ankara.");
                    const defaultCityId = "538"; // Ankara
                    citySelect.value = defaultCityId;
                    currentCityId = defaultCityId;
                    await loadTimes(currentCityId);
                }
            );
        } else {
            const defaultCityId = "538";
            citySelect.value = defaultCityId;
            currentCityId = defaultCityId;
            await loadTimes(currentCityId);
        }
    }

    // 5. Load times using İlce (Defaulting to center which is same as city name usually)
    async function loadTimes(sehirId) {
        showLoader();
        try {
            const ilceRes = await axios.get(`/api/ilceler/${sehirId}`);
            // Find roughly center district or just pick first
            const ilce = ilceRes.data[0];

            if (!ilce) throw new Error("İlçe bulunamadı");
            const vakitRes = await axios.get(`/api/vakitler/${ilce.IlceID}`);

            // API returns a month of times. First element is today.
            timesData = vakitRes.data;
            startCountdown();
            hideLoader();
        } catch (error) {
            console.error("Vakitler yüklenemedi", error);
            showError("Vakitler alınamadı.");
            hideLoader();
        }
    }

    // 6. Calculate countdown state and start timer
    function startCountdown() {
        if (timerInterval) clearInterval(timerInterval);

        function update() {
            if (!timesData || timesData.length === 0) return;

            const nowStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
            const now = new Date(nowStr);

            const todayData = timesData[0];
            const tomorrowData = timesData.length > 1 ? timesData[1] : null;

            // Parse today's Aksam and Imsak
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
                // Before Sahur today
                targetDate = todayImsak;
                labelText = "SAHURA KALAN VAKİT";
                infoText = `Bugünün İftarı: ${todayData.Aksam}`;

                // For progress bar: Assume previous day's Aksam to today's Imsak
                startPeriodDate = new Date(nowStr);
                startPeriodDate.setDate(startPeriodDate.getDate() - 1);
                startPeriodDate.setHours(18, 0, 0, 0); // Rough estimate
            }
            else if (now >= todayImsak && now < todayAksam) {
                // After Sahur, Before Iftar -> Counting down to Iftar
                targetDate = todayAksam;
                labelText = "İFTARA KALAN VAKİT";
                infoText = tomorrowData ? `Yarının Sahuru: ${tomorrowData.Imsak}` : '';
                startPeriodDate = todayImsak;
            }
            else {
                // After Iftar -> Counting down to Tomorrow's Sahur
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
                // Recalculate (next day shifted in local memory or reload)
                // For simplicity, reload or re-fetch Data
                clearInterval(timerInterval);
                loadTimes(currentCityId); // Re-fetch to normalize arrays
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

            // Progress bar calc
            const totalMs = targetDate - startPeriodDate;
            const elapsedMs = now - startPeriodDate;
            const percent = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));
            progressBar.style.width = `${percent}%`;
        }

        update();
        timerInterval = setInterval(update, 1000);
    }

    // UI Helpers
    function showLoader() { loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
    function showError(msg) {
        targetLabel.textContent = "Hata";
        nextPrayerInfo.textContent = msg;
    }

    init();
});
