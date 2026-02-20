# Ezan Vakti - Premium İftar/Sahur Sayacı

Ezan Vakti, Ramazan ayında veya normal günlerde iftara (Akşam ezanı) veya sahura (İmsak vakti) kalan süreyi şık, tam ekran ve minimalist bir tasarımla sunan bir Node.js web uygulamasıdır.

## Özellikler

* **Otomatik Konum Tespiti:** Kullanıcının konumunu algılar ve en yakın şehri otomatik seçer, bulunamazsa varsayılan olarak başkenti gösterir.
* **Tam Ekran Deneyim:** "Deep Twilight" karanlık mod tasarımı, CSS mesh gradient ve noise efekleriyle premium bir görünüm sunar.
* **Mobil Uyumlu:** Telefon ve tabletlerde mükemmel görünecek şekilde responsive tasarlandı.
* **Diyanet API Entegrasyonu:** Gerçek zamanlı ve doğru namaz vakitlerini Diyanet'in sağladığı servis üzerinden (`ezanvakti.emushaf.net`) alır.
* **PM2 ile Sürekli Çalışma:** Sunucuda kesintisiz çalışması için PM2 ekosistem dosyası içerir.

## Kurulum ve Çalıştırma

### Gereksinimler

* Node.js (v14 veya üzeri)
* PM2 (Global olarak yüklü olmalı, `npm install pm2 -g`)

### Adımlar

1. Projeyi klonlayın veya zip olarak indirin.
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Uygulamayı PM2 ile başlatın:
   ```bash
   pm2 start ecosystem.config.js
   ```

### Geliştirme Modu

PM2 yerine doğrudan node ile çalıştırmak isterseniz:
```bash
node index.js
```
Uygulama varsayılan olarak `http://localhost:5555` adresinde çalışacaktır. Değiştirmek için `.env` dosyası veya ortam değişkeni kullanabilirsiniz.

## Teknolojiler

* **Backend:** Node.js, Express.js (CORS ve API Proxy için)
* **Frontend:** Vanilla HTML5, CSS3, JavaScript
* **Fontlar:** Google Fonts (Cinzel ve Outfit)

## Lisans
MIT License
