# Kayıt/Giriş ve Kamera Düzeltmesi

## 1. Kayıt sonrası giriş sorunu

Şu anda kayıt olunca ekranda "Kayıt başarılı! Giriş yapabilirsin." yazıyor, ama e-posta onayı açık olduğu için hesap onaylanmadan giriş yapılamıyor. Bu yüzden giriş denemesi hata veriyor.

Yapılacaklar:
- Kayıttan sonra doğru mesaj gösterilecek: "E-postana bir onay bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin." (e-posta onayı istediğin gibi açık kalıyor)
- Onay yapılmadan giriş denenirse anlaşılır Türkçe uyarı: "E-postan henüz onaylanmadı. Gelen kutunu kontrol et."
- Yanlış şifre / kayıtlı olmayan e-posta gibi diğer hatalar da İngilizce yerine Türkçe gösterilecek.
- "Onay e-postasını yeniden gönder" bağlantısı eklenecek.
- Onay bağlantısına tıklandıktan sonra kullanıcı ana sayfaya dönüp otomatik giriş yapmış olacak.

## 2. "Fotoğraf Çek" kamera yerine galeri açıyor

Şu anda cihazın dosya seçicisi kullanıldığı için bilgisayarda ve önizlemede galeri açılıyor.

Yapılacaklar:
- Uygulama içinde kamera ekranı: "Fotoğraf Çek" butonu canlı kamera görüntüsü açan bir pencere açacak.
- Arka kamera tercih edilecek, ön/arka kamera değiştirme düğmesi olacak.
- "Çek" düğmesiyle kare yakalanıp doğrudan bitki analizine gönderilecek; "İptal" ile kapanacak.
- Kamera izni yoksa veya cihazda kamera yoksa net Türkçe uyarı gösterilip galeriden yükleme önerilecek.
- "Galeriden Yükle" butonu aynı şekilde çalışmaya devam edecek.

## Teknik notlar

- `src/routes/auth.tsx`: signUp sonrası `session === null` durumunda onay bekleme ekranı; `error.code` / mesaj eşlemesiyle Türkçe hata metinleri (`email_not_confirmed`, `invalid_credentials`, `user_already_exists`); `supabase.auth.resend({ type: "signup" })` ile yeniden gönderme; `emailRedirectTo: window.location.origin` korunur.
- Yeni `src/components/CameraCapture.tsx`: `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`, `<video>` önizleme, `<canvas>` ile JPEG data URL üretimi, unmount'ta track'lerin kapatılması, sadece istemci tarafında render.
- `src/routes/index.tsx`: `capture="environment"` gizli input yerine kamera bileşenini açan durum; yakalanan data URL mevcut `mutation.mutate` akışına verilir. Galeri input'u değişmez.
- Sunucu tarafı, veritabanı ve kayıt akışı değişmiyor.
