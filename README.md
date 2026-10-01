# TikTok Scraper By Keyword

Actor Apify untuk scrape video TikTok berdasarkan keyword pencarian.

## Input

- `keyword` (string, required): kata kunci pencarian.
- `maxItems` (number, optional, default `50`): jumlah maksimum video yang diambil.

## Cara kerja

Actor membuka halaman pencarian TikTok (`https://www.tiktok.com/search/video?q=<keyword>`), lalu men-scroll halaman sambil menyadap response JSON dari endpoint `/api/search/*` untuk mengumpulkan data video hingga `maxItems` tercapai atau tidak ada konten baru setelah beberapa kali percobaan scroll.

## Output

Setiap item dataset berisi id video, deskripsi, info author, statistik (like/comment/share/view), info video (cover, play/download address), info musik, dan URL video.
