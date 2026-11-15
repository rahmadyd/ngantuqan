import type { Dictionary } from "./en";

/**
 * The Indonesian dictionary.
 *
 * Same shape as the English one, so a missing key is a build error rather
 * than an English sentence in the middle of an Indonesian page.
 *
 * Word order is Indonesian, not translated English: the eyebrow labels are
 * short, the sentences lead with the subject, and the tone stays warm and
 * plain the way the English copy is.
 */
export const id: Dictionary = {
  nav: {
    primary: "Utama",
    mobile: "Seluler",
    work: "Karya",
    services: "Layanan",
    shop: "Toko",
    about: "Tentang",
    contact: "Kontak",
    search: "Cari produk",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
    siteMenu: "Menu situs",
    skipToContent: "Lompat ke konten",
    language: "Bahasa",
    switchTo: "Ganti ke {language}",
    startProject: "Mulai Proyek",
    home: "ngantuqan, beranda",
  },
  cart: {
    label: "Keranjang",
    count: "Keranjang, {count} item",
    countPlural: "Keranjang, {count} item",
  },
  common: {
    from: "Mulai",
    save: "Hemat {percent}%",
    view: "Lihat",
    details: "Detail",
    viewProject: "Lihat proyek",
    dayTurnaround: "Selesai {count} hari",
    typicalTurnaround: "Waktu pengerjaan",
    revisionPolicy: "Kebijakan revisi",
    days: "{count} hari",
    range: "{from} sampai {to}",
    fileFormat: "Format berkas",
    demoContent: "Konten demo",
    coverArtwork: "Ilustrasi sampul untuk {title}",
    previewArtwork: "Ilustrasi pratinjau untuk {title}",
    lastUpdated: "Terakhir diperbarui {date}",
    clearSearch: "Hapus pencarian",
    updatingResults: "Memperbarui hasil",
    loading: "Memuat halaman",
    previous: "Sebelumnya",
    next: "Berikutnya",
    page: "Halaman {number}",
    notTranslated:
      "Dokumen ini diterbitkan dalam bahasa Inggris. Terjemahannya sedang disiapkan.",
  },
  hero: {
    eyebrow: "Studio desain kreatif independen",
    title: "Selamat Datang",
    lede: "Kami membangun identitas merek, sistem konten, dan antarmuka produk untuk studio dan tim kecil, lalu menyerahkan perangkatnya agar tim Anda bisa terus menjalankannya tanpa kami.",
    ctaWork: "Lihat karyanya",
    ctaDiscover: "JELAJAHI",
    ctaContact: "Mulai Proyek",
    statServices: "Layanan",
    statDelivery: "Pengerjaan khas",
    statRevisions: "Putaran revisi",
    artworkCaption: "Ilustrasi placeholder. Ganti sebelum rilis.",
  },
  works: {
    eyebrow: "Karya Pilihan",
    title: "Proyek yang kami banggakan",
    lede: "Contoh identitas, konten, dan produk terbaru, semuanya dibuat untuk dipakai, bukan hanya dipuji.",
    button: "Lihat Semua Karya",
    link: "Telusuri portofolio lengkap",
    emptyTitle: "Belum ada karya pilihan",
    emptyDescription:
      "Proyek yang sudah diterbitkan akan tampil di sini. Telusuri portofolio untuk melihat karya terbaru.",
  },
  servicesOverview: {
    eyebrow: "Layanan Kami",
    title: "Lima cara kami bisa membantu",
    lede: "Setiap kerja sama berakhir dengan sesuatu yang bisa dijalankan tim Anda: template, panduan, dan berkas sumber yang benar-benar Anda miliki.",
    emptyTitle: "Belum ada layanan yang tersedia",
    emptyDescription:
      "Layanan studio kami akan tampil di sini setelah dipublikasikan.",
  },
  studio: {
    eyebrow: "Studio",
    title: "Kami merancang sistemnya, lalu menyerahkan kuncinya.",
    body1: "Kebanyakan studio menyerahkan sebuah berkas. Kami menyerahkan hal yang tetap bekerja setelah invoice dibayar: grid, template, panduan, dan pustaka komponen.",
    body2: "Artinya, kami bertanya lebih tajam di awal, mendokumentasikan alasan di balik setiap keputusan, dan membangun bersama orang-orang yang akan benar-benar memelihara karyanya.",
    button: "Tentang Studio",
    quote:
      "Tujuannya bukan kiriman yang cantik. Tujuannya sistem yang bisa dipakai tim Anda pada hari Selasa tanpa perlu menghubungi kami.",
    quoteAttribution: "Prinsip kerja kami",
    link: "Mulai percakapan",
  },
  products: {
    eyebrow: "Produk Digital",
    title: "Template yang bisa langsung dipakai",
    lede: "Aset desain yang bisa diedit, dibangun dari sistem yang sama dengan yang kami pakai untuk kerja klien. Beli sekali, sunting selamanya.",
    button: "Lihat Toko",
    emptyTitle: "Belum ada produk yang tersedia",
    emptyDescription:
      "Template dan aset desain baru akan tampil di sini setelah siap diunduh.",
  },
  why: {
    eyebrow: "Mengapa Bekerja Sama",
    title: "Empat hal yang tidak kami kompromikan",
    reasons: [
      {
        title: "Pendekatan kreatif",
        body: "Kami mencari ide di balik brief. Hasilnya biasanya lebih jelas daripada yang diminta.",
      },
      {
        title: "Perhatian pada detail",
        body: "Jarak setelap piksel, garis dasar yang konsisten, dan skala tipografi yang sungguhan. Hal kecil itulah yang dirasakan orang.",
      },
      {
        title: "Komunikasi yang jelas",
        body: "Satu titik kontak, pembaruan status yang jujur, dan tidak menghilang di tengah putaran umpan balik.",
      },
      {
        title: "Solusi yang fleksibel",
        body: "Sistem yang sesuai cara kerja tim Anda, dengan ukuran yang benar-benar bisa dijaga.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Testimoni",
    title: "Kata klien setelah selesai",
    emptyTitle: "Belum ada catatan klien",
    emptyDescription:
      "Masukan terverifikasi dari proyek yang telah selesai akan tampil di sini.",
  },
  cta: {
    eyebrow: "Mari bekerja sama",
    title1: "Ceritakan apa yang sedang Anda buat.",
    title2: "Kami akan tunjukkan cara membangunnya.",
    lede: "Kirim brief, ide yang masih setengah jadi, atau deck yang belum jalan. Anda akan mendapat balasan berisi pertanyaan sungguhan dan penilaian jujur soal lingkup dan biayanya.",
    button: "Mulai Proyek",
    secondary: "Lihat layanan kami",
  },
  footer: {
    navigate: "Navigasi",
    elsewhere: "Di tempat lain",
    legal: "Legal",
    rights: "© {year} ngantuqan. Seluruh hak cipta dilindungi.",
    email: "Surel",
  },
  work: {
    eyebrow: "Portofolio",
    metaDescription:
      "Proyek identitas merek, sistem konten, presentasi, dan desain UI/UX pilihan dari ngantuqan.",
    title: "Karya yang kami senang tunjukkan.",
    lede: "Sistem identitas, template konten, deck, dan antarmuka produk. Saring menurut disiplin atau cari judul proyek.",
    filterAll: "Semua karya",
    searchPlaceholder: "Cari proyek berdasarkan judul",
    searchLabel: "Cari proyek berdasarkan judul",
    emptyTitle: "Tidak ada proyek yang cocok",
    emptyDescription:
      "Coba kategori lain, atau hapus pencarian untuk melihat semua yang sudah kami terbitkan.",
    clearFilters: "Hapus filter",
    discipline: "Disiplin",
    year: "Tahun",
    client: "Klien",
    inProgress: "Sedang berjalan",
    projectFallback: "Proyek",
    designFallback: "Desain",
    galleryEyebrow: "Desain Akhir",
    galleryTitle: "Galeri",
    galleryAlt: "desain {title}",
    ctaEyebrow: "Punya yang mirip?",
    ctaTitle: "Mulai proyek serupa",
    relatedEyebrow: "Proyek Terkait",
    relatedTitle: "Lain yang serupa",
    related: "Karya terkait",
    next: "Proyek berikutnya",
    previous: "Proyek sebelumnya",
    servicesTitle: "Layanan",
    contactTitle: "Butuh yang seperti ini?",
    contactLede:
      "Ceritakan apa yang sedang Anda kerjakan dan kami akan kembali dengan pertanyaan, lingkup kerja, dan jadwal yang masuk akal.",
    contactButton: "Mulai Proyek",
    deliverables: "Yang Anda dapatkan",
    gallery: "Galeri",
  },
  shop: {
    eyebrow: "Toko Digital",
    metaDescription:
      "Template media sosial, presentasi, poster, dan Canva yang bisa diunduh, beserta aset desain dari ngantuqan.",
    title: "Perangkat desain, siap pakai.",
    lede: "Template yang bisa diedit, dibangun dari sistem yang sama dengan yang kami pakai untuk kerja klien. Beli sekali, unduh berkas sumbernya, jadikan milik Anda.",
    filterAll: "Semua produk",
    searchPlaceholder: "Cari produk berdasarkan judul...",
    searchLabel: "Cari produk berdasarkan judul",
    sort: "Urutkan",
    sortNewest: "Terbaru",
    sortPriceAsc: "Harga, terendah ke tertinggi",
    sortPriceDesc: "Harga, tertinggi ke terendah",
    emptyTitle: "Belum ada apa-apa di sini",
    emptyDescription:
      "Tidak ada produk yang cocok dengan filter ini. Coba kategori lain, atau hapus filter untuk menelusuri semuanya.",
    clearFilters: "Hapus filter",
    addToCart: "Tambah ke keranjang",
    addedToCart: "Masuk keranjang",
    buyNow: "Beli sekarang",
    downloadNote: "Unduh seketika setelah pembayaran dikonfirmasi",
    download: "Unduh",
    readyToSave: "{file}: siap, klik untuk menyimpan",
    license: "Lisensi",
    compatibility: "Cocok dengan",
    includes: "Isinya",
    customTitle: "Butuh sesuatu yang khusus?",
    customLede:
      "Kami membuat template yang benar-benar orang inginkan, dibangun untuk merek Anda, bukan grid generik.",
    customButton: "Minta Desain Kustom",
    description: "Deskripsi",
    backToShop: "Kembali ke toko",
    previewAlt: "pratinjau {title}",
    deliveryLabel: "Pengiriman",
    instantDownload: "Unduh seketika",
    licenseTitle: "Cara Anda memakainya",
    licenseFallback:
      "Penggunaan pribadi dan komersial untuk satu merek. Distribusi ulang berkas sumber tidak diperbolehkan.",
    licenseLink: "Baca Lisensi Produk Digital lengkapnya",
  },
  services: {
    eyebrow: "Layanan",
    metaDescription:
      "Jasa identitas merek, desain media sosial, desain banner, desain presentasi, dan desain UI/UX dari ngantuqan, setiap layanan disertai perkakas untuk menjaganya.",
    title: "Lima cara untuk bekerja bersama.",
    lede: "Setiap layanan punya harga, daftar hasil kerja, dan waktu pengerjaan yang jelas, jadi Anda tahu apa yang dipesan sebelum memesan.",
    allServices: "Semua layanan",
    serviceFallback: "Layanan",
    turnaround: "Waktu pengerjaan",
    daysValue: "{count} hari",
    roundsFallback: "2 putaran",
    includedEyebrow: "Yang termasuk",
    includedTitle: "Semua isi paketnya",
    includedLede:
      "Setiap paket untuk layanan ini mencakup hasil kerja berikut.",
    packages: "Paket",
    packagesTitle: "Pilih paket Anda",
    packagesLede:
      "Harga tetap, lingkup tetap. Pilih yang paling pas, atau kirim brief dan kami hitungkan khusus.",
    mostPopular: "Paling populer",
    fixedPrice: "Harga tetap, belum termasuk pajak yang berlaku",
    orderPackage: "Pesan paket ini",
    orderThis: "Pesan Layanan Ini",
    orderTitle: "Ceritakan proyek {title} Anda.",
    orderLede:
      "Semakin banyak yang Anda bagikan, semakin akurat penawaran kami. Tidak ada yang di sini mengikat. Kami membalas dengan pertanyaan, jadwal, dan harga tetap.",
    price: "Harga",
    delivery: "Pengerjaan",
    revisions: "Revisi",
    round: "putaran",
    rounds: "putaran",
    features: "Yang termasuk",
    faq: "FAQ",
    faqTitle: "Pertanyaan yang sering muncul",
    faqItems: [
      {
        question: "Apa yang perlu saya siapkan?",
        answer:
          "Brief membantu, tapi tidak harus rapi. Konten, tautan, dan ide mentah sudah cukup untuk memulai. Sisanya akan kami tanyakan di putaran pertama.",
      },
      {
        question: "Bisakah saya memakai karyanya di kanal saya sendiri?",
        answer:
          "Bisa. Anda menerima berkas sumber yang bisa diedit, jadi semua yang kita buat bersama milik Anda untuk dipakai di kanal merek Anda sendiri.",
      },
      {
        question: "Apa yang terjadi jika saya butuh perubahan setelah serah terima?",
        answer:
          "Putaran revisi yang tertulis di paket Anda sudah mencakup tahap serah terima. Pekerjaan tambahan dihitung terpisah dan tidak pernah dimulai tanpa persetujuan Anda.",
      },
      {
        question: "Bagaimana cara pembayarannya?",
        answer:
          "Kami memberi harga tetap per paket. Setelah lingkup kerja disetujui, kami mengirim instruksi pembayaran, dan pekerjaan dimulai setelah pembayaran terkonfirmasi.",
      },
    ],
    contactTitle: "Siap mulai?",
    contactLede:
      "Kirimkan brief Anda. Kami akan membalas dengan pertanyaan, jadwal, dan harga tetap.",
  },
  about: {
    eyebrow: "Tentang Studio",
    metaDescription:
      "ngantuqan adalah studio desain kreatif independen. Cerita kami, filosofi, kapabilitas, perkakas, dan cara kami bekerja.",
    title: "Kami merancang sistemnya, lalu menyerahkan kuncinya.",
    lede1: "ngantuqan adalah studio desain independen yang bekerja bersama studio, pendiri, dan tim internal kecil.",
    lede2:
      "Kebanyakan studio menyerahkan sebuah berkas. Kami menyerahkan sistem yang berjalan: grid, template, panduan, pustaka komponen, sehingga karyanya terus berjalan setelah invoice dibayar.",
    visionEyebrow: "Visi",
    vision: "Studio yang karyanya masih berguna dua tahun kemudian.",
    missionEyebrow: "Misi",
    mission:
      "Bangun sistem terkecil yang benar-benar menyelesaikan masalahnya, dan pastikan tim bisa menjalankannya.",
    philosophyEyebrow: "Filosofi",
    philosophyTitle: "Empat keyakinan",
    philosophy: [
      {
        title: "Sistem, bukan barang",
        body: "Logo adalah barang. Grid, palet, dan seperangkat aturan adalah sistem. Yang kami bangun adalah yang kedua.",
      },
      {
        title: "Batasan adalah brief",
        body: "Format, anggaran, dan tenggat bukan hambatan yang harus diputar. Justru itulah yang membuat desainnya bagus.",
      },
      {
        title: "Jelaskan alasannya",
        body: "Keputusan yang tidak Anda pahami adalah keputusan yang tidak bisa Anda pertahankan. Kami menunjukkan cara berpikir kami.",
      },
      {
        title: "Tinggalkan yang bisa dirawat",
        body: "Serah terima lebih penting daripada peresmian. Template, catatan, dan penjelasan adalah bagian dari pekerjaan ini.",
      },
    ],
    capabilitiesEyebrow: "Kemampuan",
    capabilitiesTitle: "Yang kami kerjakan dengan baik",
    capabilities: [
      {
        title: "Identitas merek",
        body: "Logo, logotype, palet, sistem tipografi, dan aturan tertulis yang menjaga semuanya tetap serasi.",
      },
      {
        title: "Sistem konten",
        body: "Grid modular dan template yang bisa diedit agar penerbitan tetap sesuai merek tanpa butuh desainer di setiap unggahan.",
      },
      {
        title: "Art direction",
        body: "Arah fotografi, arah ilustrasi, dan aturan yang menjaga satu set terasa seperti satu karya.",
      },
      {
        title: "Desain presentasi",
        body: "Sistem deck dan bahasa grafik yang tetap terbaca di proyektor, bukan hanya di laptop.",
      },
      {
        title: "Kemitraan desain",
        body: "Dukungan berkelanjutan untuk tim yang butuh desainer on-call tanpa retainer penuh.",
      },
    ],
    toolsEyebrow: "Perangkat",
    toolsTitle: "Yang kami pakai",
    toolsLede:
      "Perangkat mengikuti masalahnya. Kami merekomendasikan yang cocok untuk tim Anda, bukan yang sesuai kebiasaan kami.",
    workflowEyebrow: "Alur Kerja",
    workflowTitle: "Cara sebuah proyek berjalan",
    workflow: [
      {
        title: "Mendengar",
        body: "Panggilan singkat dan brief tertulis. Kami bertanya soal masalah bisnisnya, bukan hanya soal visualnya.",
      },
      {
        title: "Menentukan lingkup",
        body: "Anda mendapat harga tetap, daftar hasil kerja, dan tanggal serah terima sebelum ada yang digambar.",
      },
      {
        title: "Merancang",
        body: "Satu arah yang dikembangkan dengan benar. Kami menampilkan karyanya dalam konteks, bukan berdiri sendiri.",
      },
      {
        title: "Menyempurnakan",
        body: "Putaran revisi terstruktur terhadap brief, dengan alasan diuraikan setiap kali.",
      },
      {
        title: "Menyerahkan",
        body: "Berkas sumber, dokumen panduan, dan penjelasan agar tim Anda bisa merawatnya sendiri.",
      },
    ],
    closingTitle: "Sudah ada proyek di pikiran?",
    closingLede:
      "Kirim brief atau ide mentah. Anda akan mendapat pertanyaan, lingkup kerja, dan harga.",
    closingButton: "Mulai Proyek",
    closingAlt: "Komposisi abstrak dalam palet merek ngantuqan",
  },
  contact: {
    eyebrow: "Kontak",
    metaDescription:
      "Hubungi ngantuqan soal identitas merek, sistem konten, presentasi, UI/UX, atau produk digital.",
    title: "Ceritakan apa yang sedang Anda buat.",
    lede:
      "Brief, ide yang masih setengah jadi, atau deck yang belum jalan: semuanya baik. Anda akan mendapat balasan berisi pertanyaan sungguhan dan penilaian jujur soal lingkup dan biaya.",
    email: "Surel",
    responseTime: "Waktu balas",
    responseValue: "Dua hari kerja",
    goodToInclude: "Baik untuk disertakan",
    goodToIncludeBody:
      "Apa yang sedang Anda buat, untuk siapa, jadwalnya, dan perkiraan anggaran.",
    packageTitle: "Lebih suka mulai dari paket?",
    packageBody:
      "Setiap layanan punya harga tetap dan waktu pengerjaan yang jelas. Pilih satu dan lewati obrolan penentuan lingkup.",
    packageLink: "Lihat layanan",
    templateTitle: "Belum siap menulis brief?",
    templateBody:
      "Unduh salah satu template kami dan lihat cara kami membangun sistem. Biasanya itu memulai percakapan lebih cepat.",
    templateLink: "Kunjungi toko",
    receivedTitle: "Pesan Anda diterima",
    reference: "Nomor referensi Anda {reference}",
    couldNotSend: "Pesan itu belum bisa dikirim",
    fullName: "Nama lengkap",
    emailAddress: "Alamat surel",
    companyBrand: "Nama perusahaan / merek",
    inquiryType: "Jenis pertanyaan",
    subject: "Perihal",
    message: "Pesan",
    messageMax: "Maksimal {count}",
    messageHint:
      "Ceritakan proyeknya, jadwalnya, dan seperti apa hasilnya menurut Anda.",
    send: "Kirim pesan",
    sending: "Mengirim...",
    replyWithin: "Kami membalas dalam dua hari kerja.",
    inquiryTypeLabels: {
      GENERAL: "Pertanyaan umum",
      DESIGN_SERVICE: "Jasa desain",
      COLLABORATION: "Kolaborasi",
      PARTNERSHIP: "Kemitraan",
      OTHER: "Lainnya",
    },
    validation: {
      nameRequired: "Mohon isi nama lengkap Anda.",
      nameTooLong: "Nama itu terlalu panjang.",
      emailRequired: "Mohon isi alamat surel Anda.",
      emailInvalid: "Mohon isi alamat surel yang valid.",
      companyTooLong: "Nama perusahaan itu terlalu panjang.",
      inquiryTypeRequired: "Mohon pilih jenis pertanyaan.",
      subjectRequired: "Mohon isi subjek singkat.",
      subjectTooLong: "Perihal itu terlalu panjang.",      messageRequired:
        "Mohon ceritakan sedikit lebih banyak. Minimal 20 karakter.",
      messageTooLong: "Pesan itu terlalu panjang.",
    },
  },
  order: {
    briefReceived: "Brief diterima",
    thanks: "Terima kasih. Brief Anda sudah ada di studio.",
    lede:
      "Setiap brief kami baca sendiri. Anda akan mendengar kembali dalam dua hari kerja, lengkap dengan pertanyaan, jadwal, dan harga tetap.",
    reference: "Nomor referensi",
    submitted: "Brief terkirim",
    backToHome: "Kembali ke beranda",
    couldNotSend: "Brief itu belum bisa dikirim",
    websiteLabel: "Situs web",
    aboutYou: "Tentang Anda",
    theProject: "Proyeknya",
    serviceLabel: "Layanan",
    requiredDeliverables: "Hasil kerja yang dibutuhkan",
    projectDescriptionHint:
      "Apa yang sedang dibuat, dan seperti apa kalau sudah selesai?",
    targetAudienceLabel: "Target audiens",
    targetAudiencePlaceholder: "Ini untuk siapa?",
    designReferences: "Referensi desain",
    designReferencesHint:
      "Tautan, merek, atau situs yang nuansanya Anda sukai.",
    preferredColours: "Warna yang disukai",
    preferredColoursHint: "Palet, suasana, atau warna yang sebaiknya dihindari.",
    budget: "Anggaran (IDR)",
    optional: "Opsional",
    deadline: "Tenggat",
    referenceFile: "Berkas referensi",
    removeFile: "Hapus berkas yang dilampirkan",
    backToService: "Kembali ke {service}",
    pageTitle: "Pesanan {service}",
    notFound: "Pesanan tidak ditemukan",
    projectBrief: "Brief proyek",
    noPaymentYet: "Belum ada pembayaran",
    differentService: "Butuh layanan lain?",
    packagePriceNote:
      "Memilih paket akan mengunci harganya. Kalau dibiarkan terbuka, kami mengirim penawaran lebih dulu.",
    fileSizeNote:
      "Maksimal {size}. Disimpan di penyimpanan privat dan hanya terlihat oleh studio.",
    form: {
      name: "Nama Anda",
      email: "Surel",
      company: "Perusahaan",
      companyHint: "Opsional. Membantu kami memahami konteksnya.",
      package: "Paket",
      packageUnsure: "Belum yakin, tolong hitungkan",
      projectDescription: "Apa yang sedang Anda buat?",
      projectDescriptionHint:
        "Apa itu, untuk siapa, dan apa gunanya. Naskah mentah pun tidak masalah.",
      targetAudience: "Untuk siapa?",
      targetAudienceHint:
        "Siapa yang akan memakainya, dan apa yang perlu mereka lakukan.",
      deliverables: "Ada lagi?",
      deliverablesHint:
        "Apa pun di luar lingkup paket: format tambahan, ukuran tambahan, halaman tambahan.",
      attachments: "Lampiran",
      attachmentsHint: "Opsional: mood board, logo, atau dokumen brief.",
      noPayment: "Belum ada pembayaran. Kami membalas dengan penawaran dulu.",
      send: "Kirim brief",
      sending: "Mengirim...",
    },
  },
  checkout: {
    title: "Checkout",
    metaDescription: "Tinjau keranjang Anda dan buat pesanan.",
    eyebrow: "Checkout",
    heading: "Hampir milik Anda.",
    lede: "Tanpa akun, tanpa formulir kartu. Kami menerima pesanan Anda, Anda menerima detail pembayaran lewat surel, dan berkasnya terbuka begitu pembayaran terkonfirmasi.",
    emptyTitle: "Keranjang Anda kosong",
    emptyBody: "Telusuri toko dan tambahkan template untuk memulai.",
    browseShop: "Lihat toko",
    orderSummary: "Ringkasan pesanan",
    yourDetails: "Data Anda",
    detailsLede:
      "Kami mengirim tautan unduhan ke alamat ini. Tidak perlu akun.",
    couldNotPlace: "Pesanan itu belum bisa dibuat",
    removeOne: "Kurangi satu {title}",
    addOne: "Tambah satu {title}",
    removeItem: "Hapus {title} dari keranjang",
    subtotal: "Subtotal",
    total: "Total",
    remove: "Hapus",
    checkout: "Bayar",
    transferNote:
      "Total akhir dikonfirmasi dari database saat pesanan dibuat, dan pembayaran dilakukan lewat transfer. Kami mengonfirmasi secara manual.",
    name: "Nama Anda",
    email: "Surel",
    submit: "Buat pesanan",
    placing: "Membuat pesanan...",
    errors: "Terjadi kesalahan",
  },
  orderConfirmation: {
    ready: "Berkas Anda siap.",
    waiting: "Kami menunggu pembayaran.",
    readyLede:
      "Unduh di bawah. Setiap tautan ditandatangani dan berlaku dua menit, jadi mintalah tautan baru kapan pun Anda membutuhkannya.",
    waitingLede:
      "Pesanan Anda sudah kami terima. Detail pembayaran ada di bawah, dan kami mengonfirmasi pembayaran secara manual, biasanya dalam satu hari kerja.",
    orderNumber: "Nomor pesanan",
    reference: "Referensi",
    download: "Unduh",
    nextSteps: "Apa selanjutnya",
  },
  orderAccess: {
    title: "Cari pesanan Anda",
    body: "Masukkan nomor pesanan dan alamat surel yang Anda pakai. Tidak ada akun untuk masuk. Pasangan itulah yang membuktikan pesanan itu milik Anda.",
    orderNumber: "Nomor pesanan",
    email: "Surel",
    submit: "Cari pesanan saya",
    finding: "Mencari...",
  },
  actions: {
    checkFields: "Periksa kolom yang ditandai lalu coba lagi.",
    checkFieldsRetry: "Periksa kolom yang ditandai lalu coba lagi.",
    contactNoDatabase:
      "Formulir kontak belum terhubung ke basis data. Silakan kirim surel langsung dan kami akan membalas.",
    contactSaveFailed:
      "Terjadi masalah di sisi kami dan pesan Anda belum tersimpan. Silakan kirim surel langsung dan kami akan membalas.",
    contactReceived:
      "Terima kasih. Pesan Anda sudah masuk. Kami membalas dalam dua hari kerja.",
    contactSavedNoEmail:
      "Terima kasih. Pesan Anda sudah tersimpan. Notifikasi surel belum dikonfigurasi, tapi pesan Anda sudah kami terima.",
    orderNoDatabase:
      "Formulir brief belum terhubung ke basis data. Silakan kirim surel langsung dan kami akan membalas.",
    orderBriefReceived:
      "Terima kasih. Brief Anda sudah kami terima. Kami membalas dalam dua hari kerja.",
    orderSaveFailed:
      "Terjadi masalah di sisi kami dan brief Anda belum tersimpan. Silakan kirim surel langsung dan kami akan membalas.",
    serviceUnavailable:
      "Layanan itu sudah tidak tersedia. Silakan pilih yang lain.",
    packageUnavailable:
      "Paket itu sudah tidak tersedia. Silakan pilih yang lain.",
    checkoutNoDatabase:
      "Checkout belum terhubung ke basis data. Silakan kirim surel dan kami akan mengirim berkas bersama invoice Anda.",
    cartUnreadable:
      "Keranjang Anda tidak bisa dibaca. Silakan tambahkan produknya lagi.",
    orderNotFound: "Pesanan itu tidak ditemukan.",
    orderNotPlaced:
      "Pesanan itu belum bisa dibuat. Silakan kirim surel dan kami akan menanganinya untuk Anda.",
    orderCannotBePaid:
      "Pesanan ini tidak bisa dibayar secara online. Silakan kirim surel dan kami akan mengirimi cara pembayaran.",
    orderPairNotFound:
      "Kami tidak menemukan pesanan dengan nomor dan alamat surel itu. Periksa keduanya, atau kirim surel dan kami akan mencarinya.",
    requestUnreadable: "Permintaan itu tidak bisa dibaca.",
    accessExpired:
      "Akses Anda ke pesanan ini sudah kedaluwarsa. Masukkan lagi nomor pesanan dan alamat surel Anda.",
    notPaid: "Pesanan ini belum dibayar.",
    downloadUnavailable: "Unduhan itu tidak tersedia.",
  },
  rateLimit: {
    contact:
      "Anda sudah mengirim beberapa pesan. Mohon tunggu sebentar sebelum mengirim lagi",
    orderBrief:
      "Anda sudah mengirim beberapa brief. Mohon tunggu sebentar sebelum mengirim lagi",
    checkout:
      "Anda sudah membuat beberapa pesanan dari koneksi ini. Mohon tunggu sebentar sebelum membuat pesanan lagi",
    orderLookup:
      "Percobaan sudah terlalu banyak. Mohon tunggu sebentar sebelum mencoba lagi",
    download:
      "Permintaan unduhan sudah terlalu banyak. Mohon tunggu sebentar sebelum mencoba lagi",
    retryInOne:
      "Silakan coba lagi dalam sekitar {minutes} menit, atau kirim surel dan kami akan langsung menindaklanjuti.",
    retryInMany:
      "Silakan coba lagi dalam sekitar {minutes} menit, atau kirim surel dan kami akan langsungindaklanjuti.",
  },
  legal: {
    eyebrow: "Legal",
    privacyTitle: "Kebijakan Privasi",
    termsTitle: "Syarat dan Ketentuan",
    refundTitle: "Kebijakan Pengembalian Dana",
    licenseTitle: "Lisensi Produk Digital",
    privacyMetaDescription:
      "Cara ngantuqan mengumpulkan, memakai, dan melindungi informasi yang Anda bagikan lewat situs ini.",
    termsMetaDescription:
      "Ketentuan yang berlaku saat Anda memakai situs ngantuqan, memesan jasa desain, atau membeli produk digital.",
    refundMetaDescription:
      "Kebijakan pengembalian dana untuk produk digital dari ngantuqan, dan cara pengembalian dana pada jasa desain yang dipesan.",
    licenseMetaDescription:
      "Lisensi yang berlaku untuk setiap produk digital yang dibeli dari ngantuqan.",
  },
  errors: {
    oops: "Ups",
    digest: "Referensi: {digest}",
    notFoundTitle: "Halaman itu tidak ditemukan",
    notFoundBody:
      "Tautannya mungkin sudah kedaluwarsa, atau halamannya sudah pindah. Ini beberapa tempat yang layak dibuka.",
    notFoundHome: "Kembali ke beranda",
    notFoundWork: "Lihat karya kami",
    notFoundHeading: "Ada yang salah di sisi kami",
    notFoundBodyLong:
      "Halaman gagal dimuat. Mencoba lagi biasanya menyelesaikannya. Kalau terus terjadi, kirim surel ke kami dan kami perbaiki.",
    tryAgain: "Coba lagi",
    goHome: "Ke beranda",
    suggestedPages: "Halaman yang mungkin Anda cari",
  },
};
