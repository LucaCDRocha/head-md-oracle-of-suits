<!DOCTYPE html>
<html lang="{{ $lang ?? 'fr' }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ 'Hybrid #' . $hybrid->id }} — {{ $t['project_name'] }}</title>

    @php
        $hybridImgUrl = preg_match('/^https?:\/\//', $hybrid->img_src)
            ? $hybrid->img_src
            : asset('storage/' . ltrim($hybrid->img_src, '/'));
        $shareText = $t['share_message_prefix'] . ' ' . request()->url();
    @endphp

    <!-- SEO & Open Graph Meta Tags for WhatsApp, Instagram, Telegram, Twitter -->
    <meta name="description" content="{!! str_replace('&#039;', "'", e($t['exhibition_context_text'])) !!}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Hybrid #{{ $hybrid->id }} — {{ $t['project_name'] }}">
    <meta property="og:description" content="{!! str_replace('&#039;', "'", e($t['exhibition_context_text'])) !!}">
    <meta property="og:image" content="{{ $hybridImgUrl }}">
    <meta property="og:url" content="{{ request()->url() }}">
    <meta property="og:site_name" content="Hybrids Galerie — Musée suisse du jeu × HEAD – Genève">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Hybrid #{{ $hybrid->id }} — {{ $t['project_name'] }}">
    <meta name="twitter:description" content="{!! str_replace('&#039;', "'", e($t['exhibition_context_text'])) !!}">
    <meta name="twitter:image" content="{{ $hybridImgUrl }}">

    <!-- Favicon -->
    @if(($lang ?? 'fr') === 'en')
        <link rel="icon" type="image/png" href="{{ asset('img/logos/favicon-en.png') }}">
    @else
        <link rel="icon" type="image/png" href="{{ asset('img/logos/favicon-fr.png') }}">
    @endif

    <!-- Font loading FOUT detection -->
    <script>
        if ('fonts' in document) {
            document.fonts.ready.then(() => document.documentElement.classList.add('fonts-loaded'));
        } else {
            document.documentElement.classList.add('fonts-loaded');
        }
    </script>

    <!-- Hybrids Stylesheet -->
    <link rel="stylesheet" href="{{ asset('css/hybrids.css') }}">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>

<body>
    <!-- Navigation Header -->
    <header class="top-navbar">
        <a href="{{ route('hybrids.index') }}" class="back-link" id="back-link">
            <span class="material-symbols-rounded">arrow_back</span>
            <span class="back-text">{{ $t['back_link'] }}</span>
        </a>
        <div class="lang-switch">
            <a href="{{ request()->fullUrlWithQuery(['lang' => 'fr']) }}" class="lang-opt {{ $lang === 'fr' ? 'active-lang' : '' }}">FR</a>
            /
            <a href="{{ request()->fullUrlWithQuery(['lang' => 'en']) }}" class="lang-opt {{ $lang === 'en' ? 'active-lang' : '' }}">EN</a>
        </div>
    </header>

    <main class="main-container">
        <div class="hybrid-show-card">
            <!-- Title -->
            <h1 class="hybrid-title">Hybrid #{{ $hybrid->id }}</h1>

            <!-- Hybrid Main Showcase (Image directly on background with Skeleton Loader) -->
            <div class="hybrid-main-box">
                <div class="hybrid-img-wrapper skeleton-loader">
                    @if ($hybrid->img_src)
                        <img src="{{ preg_match('/^https?:\/\//', $hybrid->img_src)
                            ? $hybrid->img_src
                            : asset('storage/' . ltrim($hybrid->img_src, '/')) }}"
                            alt="{{ $hybrid->name }}" 
                            class="hybrid-image img-loading"
                            onload="this.classList.remove('img-loading'); this.classList.add('img-loaded'); if(this.parentElement) this.parentElement.classList.remove('skeleton-loader');"
                            onerror="if(this.parentElement) this.parentElement.classList.remove('skeleton-loader');">
                    @else
                        <p style="color: #666; padding: 60px;">Aucune image disponible</p>
                    @endif
                </div>
            </div>

            <!-- Metadata Row -->
            @php
                if ($lang === 'en') {
                    $dateFormatted = $hybrid->created_at->format('M d, Y');
                } else {
                    $monthsFr = [
                        1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
                        5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
                        9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
                    ];
                    $dateFormatted = $hybrid->created_at->format('j') . ' ' . ($monthsFr[(int)$hybrid->created_at->format('n')] ?? $hybrid->created_at->format('F')) . ' ' . $hybrid->created_at->format('Y');
                }
                $expandedCards = getExpandedCards($hybrid);
            @endphp

            <div class="hybrid-meta-row">
                <button id="like-button" class="like-meta-btn" data-hybrid-id="{{ $hybrid->id }}" aria-label="J'aime">
                    <span class="material-symbols-rounded" id="heart-icon">favorite</span>
                    <span><span id="like-count">{{ $hybrid->nb_like }}</span> {{ Str::plural('like', $hybrid->nb_like) }}</span>
                </button>

                <div class="date-meta">
                    <span class="material-symbols-rounded">calendar_today</span>
                    <span>{{ $dateFormatted }}</span>
                </div>
            </div>

            <!-- Action Buttons Group -->
            <div class="action-buttons-group">
                <button id="share-btn" class="btn-action btn-share">
                    <span class="material-symbols-rounded">share</span>
                    <span>{{ $t['share'] }}</span>
                </button>

                <a href="{{ route('hybrids.download', $hybrid->id) }}" class="btn-action btn-download">
                    <span class="material-symbols-rounded">download</span>
                    <span>{{ $t['download'] }}</span>
                </a>
            </div>

            <hr class="section-divider">

            <!-- Cartes Sources Section (Renders all 3 cards even if duplicate) -->
            @if ($expandedCards->isNotEmpty())
                <div class="source-cards-section">
                    <h2 class="section-title">{{ $t['source_cards'] }}</h2>
                    <div class="source-cards-grid">
                        @foreach ($expandedCards as $card)
                            @php
                                $isBase = isset($card->pivot) && $card->pivot->is_base;
                            @endphp
                            <div class="source-card-item {{ $isBase ? 'is-base-card' : '' }}">
                                @if ($isBase)
                                    <div class="base-card-badge">{{ $t['base_card'] }}</div>
                                @endif

                                @if ($card->img_src)
                                    <div class="source-card-img-wrapper skeleton-loader" style="width:100%; border-radius: 8px; margin-bottom: 14px;">
                                        <img src="{{ preg_match('/^https?:\/\//', $card->img_src)
                                            ? $card->img_src
                                            : asset('storage/' . ltrim($card->img_src, '/')) }}"
                                            alt="{{ $card->name }}" 
                                            class="source-card-img img-loading"
                                            onload="this.classList.remove('img-loading'); this.classList.add('img-loaded'); if(this.parentElement) this.parentElement.classList.remove('skeleton-loader');"
                                            onerror="if(this.parentElement) this.parentElement.classList.remove('skeleton-loader');">
                                    </div>
                                @endif

                                <div class="source-card-title">{{ getLocalizedCardName($card, $lang) }}</div>

                                @if ($card->game)
                                    @php
                                        $gameName = ($lang === 'en' && !empty($card->game->name_en)) 
                                            ? $card->game->name_en 
                                            : $card->game->name;
                                        $gameDesc = ($lang === 'en' && !empty($card->game->description_eng)) 
                                            ? $card->game->description_eng 
                                            : $card->game->description;
                                    @endphp
                                    <div class="source-card-deck">
                                        <span>{{ $gameName }}</span>
                                        @if ($gameDesc)
                                            <span class="info-icon-badge">
                                                i
                                                <span class="tooltip-box">{{ $gameDesc }}</span>
                                            </span>
                                        @endif
                                    </div>
                                @endif
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif

            <!-- Exhibition Context Card -->
            <div class="exhibition-context-card">
                <div class="exhibition-context-title">
                    <span>{{ $t['exhibition_context_title'] }}</span>
                </div>
                <p class="exhibition-context-text">
                    @if(($lang ?? 'fr') === 'en')
                        Generated during the exhibition « <a href="{{ $t['exhibition_url'] }}" target="_blank" rel="noopener noreferrer">Cartes à jouer — Des origines aux cartes à collectionner</a> » at the <a href="{{ $t['museum_url'] }}" target="_blank" rel="noopener noreferrer">Swiss Museum of Games in La Tour-de-Peilz</a> in collaboration with the <a href="{{ $t['head_url'] }}" target="_blank" rel="noopener noreferrer">Master Media Design program at HEAD – Genève</a>.
                    @else
                        Généré lors de l'exposition « <a href="{{ $t['exhibition_url'] }}" target="_blank" rel="noopener noreferrer">Cartes à jouer — Des origines aux cartes à collectionner</a> » au <a href="{{ $t['museum_url'] }}" target="_blank" rel="noopener noreferrer">Musée suisse du jeu à La Tour-de-Peilz</a> en collaboration avec le <a href="{{ $t['head_url'] }}" target="_blank" rel="noopener noreferrer">Master Media Design de la HEAD – Genève</a>.
                    @endif
                </p>
            </div>
        </div>
    </main>

    <!-- Custom Share Modal -->
    <div id="share-modal" class="modal-overlay" aria-hidden="true">
        <div class="modal-container">
            <div class="modal-card">
                <div class="modal-header">
                    <h3 class="modal-title">{{ $t['share_title'] }}</h3>
                </div>
                <div class="modal-subtext">
                    {{ $t['share_subtext'] }}
                </div>

                <!-- 1. URL Bar & Copier le lien button -->
                <div class="copy-url-group">
                    <input type="text" id="share-url-input" class="copy-url-input" readonly>
                    <button id="copy-url-btn" class="copy-url-btn">
                        <span class="material-symbols-rounded" id="copy-icon">content_copy</span>
                        <span id="copy-btn-text">{{ $t['copy'] }}</span>
                    </button>
                </div>

                <!-- 2. QR Code -->
                <div class="modal-qr-wrapper">
                    <div id="modal-qrcode"></div>
                </div>

                <!-- 3. Partager sur les réseaux button -->
                <button type="button" id="share-socials-btn" class="btn-share-socials">
                    <span class="material-symbols-rounded">share</span>
                    <span>{{ $t['share_socials'] }}</span>
                </button>
            </div>
            <button id="close-modal-btn" class="modal-close-btn" aria-label="Fermer">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
    </div>

    <!-- Info / About Modal -->
    <div id="info-modal" class="modal-overlay" aria-hidden="true">
        <div class="modal-container">
            <div class="modal-card info-modal-card">
                <div class="modal-header">
                    <h3 class="modal-title">{{ $t['about_title'] }}</h3>
                </div>
                <div class="modal-subtext" style="margin-bottom: 14px; font-weight: 600; color: var(--color-pearl-ruby);">
                    {{ $t['about_subtitle'] }}
                </div>

                <div class="info-modal-section">
                    <p class="info-section-content">
                        {{ $t['about_description'] }}
                    </p>
                </div>

                <div class="info-modal-section">
                    <div class="info-section-label">{{ $t['exhibition_section_title'] }}</div>
                    <a href="{{ $t['exhibition_url'] }}" target="_blank" rel="noopener noreferrer" class="info-exhibition-block">
                        <div class="info-exhibition-title">
                            <span>{{ $t['exhibition_title'] }}</span>
                            <span class="material-symbols-rounded icon-inline">open_in_new</span>
                        </div>
                        <div class="info-exhibition-subtitle">{{ $t['exhibition_subtitle'] }}</div>
                    </a>
                </div>

                <div class="info-modal-section">
                    <div class="info-section-label">{{ $t['partners_section_title'] }}</div>
                    <div class="info-partners-stacked">
                        <div class="partner-item">
                            <a href="{{ $t['museum_url'] }}" target="_blank" rel="noopener noreferrer" class="info-inline-link">
                                <span>{{ $t['museum_name'] }}</span>
                                <span class="material-symbols-rounded icon-inline">open_in_new</span>
                            </a>
                            <div class="partner-subtext">{{ $t['museum_location'] }}</div>
                        </div>
                        <div class="partner-item">
                            <a href="{{ $t['head_url'] }}" target="_blank" rel="noopener noreferrer" class="info-inline-link">
                                <span>{{ $t['head_name'] }}</span>
                                <span class="material-symbols-rounded icon-inline">open_in_new</span>
                            </a>
                            <div class="partner-subtext">{{ $t['head_subtext'] }}</div>
                        </div>
                    </div>
                </div>

                <div class="info-modal-section">
                    <div class="info-section-label">{{ $t['authors_title'] }}</div>
                    <div class="info-authors-list">
                        @foreach ($t['authors'] as $author)
                            <a href="{{ $author['url'] }}" target="_blank" rel="noopener noreferrer" class="info-author-chip">
                                <span>{{ $author['name'] }}</span>
                                <span class="material-symbols-rounded icon-inline">open_in_new</span>
                            </a>
                        @endforeach
                    </div>
                </div>
            </div>
            <button id="close-info-modal-btn" class="modal-close-btn" aria-label="Fermer">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
    </div>

    <!-- Floating Info Button (Sticky Bottom Right) -->
    <button type="button" id="info-btn" class="floating-info-btn" aria-label="{{ $t['about'] }}" title="{{ $t['about'] }}">
        <span class="material-symbols-rounded">info</span>
    </button>

    <!-- Site Footer -->
    <footer class="site-footer">
        <div class="footer-project-name">{{ $t['project_name'] }}</div>
        <div class="footer-partners-row">
            <a href="{{ $t['museum_url'] }}" target="_blank" rel="noopener noreferrer">{{ $t['museum_short_name'] }}</a>
            <span class="footer-cross">×</span>
            <a href="{{ $t['head_url'] }}" target="_blank" rel="noopener noreferrer">{{ $t['head_short_name'] }}</a>
        </div>
        <div class="footer-by">by</div>
        <div class="footer-authors-row">
            @foreach ($t['authors'] as $index => $author)
                @if ($index > 0)
                    <span class="footer-amp">&amp;</span>
                @endif
                <a href="{{ $author['url'] }}" target="_blank" rel="noopener noreferrer">{{ $author['name'] }}</a>
            @endforeach
        </div>
    </footer>

    <!-- Scripts -->
    <script>
        // Instant check for cached images
        document.querySelectorAll('.hybrid-image, .source-card-img').forEach(img => {
            if (img.complete && img.naturalHeight !== 0) {
                img.classList.remove('img-loading');
                img.classList.add('img-loaded');
                if (img.parentElement) img.parentElement.classList.remove('skeleton-loader');
            }
        });

        // Helper to get or generate an anonymous device UUID
        function getDeviceId() {
            let deviceId = localStorage.getItem('hybrids_device_id');
            if (!deviceId) {
                if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                    deviceId = crypto.randomUUID();
                } else {
                    deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
                }
                localStorage.setItem('hybrids_device_id', deviceId);
            }
            return deviceId;
        }

        // Like Button Functionality
        const likeButton = document.getElementById('like-button');
        const likeCount = document.getElementById('like-count');
        const hybridId = likeButton ? likeButton.dataset.hybridId : null;
        const likedKey = `hybrid_liked_${hybridId}`;

        let isLiked = localStorage.getItem(likedKey) === 'true';

        if (likeButton && isLiked) {
            likeButton.classList.add('liked');
        }

        if (likeButton) {
            likeButton.addEventListener('click', async function() {
                if (this.disabled) return;
                this.disabled = true;

                try {
                    const action = isLiked ? 'unlike' : 'like';
                    const endpoint = `/api/hybrids/${hybridId}/like`;

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        },
                        body: JSON.stringify({
                            action: action,
                            device_id: getDeviceId()
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (likeCount) likeCount.textContent = data.nb_like;
                        isLiked = data.liked;

                        if (isLiked) {
                            this.classList.add('liked');
                            localStorage.setItem(likedKey, 'true');
                        } else {
                            this.classList.remove('liked');
                            localStorage.removeItem(likedKey);
                        }

                        this.style.transform = 'scale(1.15)';
                        setTimeout(() => {
                            this.style.transform = '';
                            this.disabled = false;
                        }, 200);
                    } else {
                        this.disabled = false;
                    }
                } catch (error) {
                    console.error('Error liking hybrid:', error);
                    this.disabled = false;
                }
            });
        }


        // Custom Share Modal Functionality
        const shareBtn = document.getElementById('share-btn');
        const shareModal = document.getElementById('share-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const copyUrlBtn = document.getElementById('copy-url-btn');
        const shareUrlInput = document.getElementById('share-url-input');
        let qrGenerated = false;

        if (shareBtn && shareModal) {
            shareBtn.addEventListener('click', () => {
                shareModal.classList.add('active');
                shareModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';

                shareUrlInput.value = window.location.href;

                if (!qrGenerated) {
                    new QRCode(document.getElementById("modal-qrcode"), {
                        text: window.location.href,
                        width: 180,
                        height: 180,
                        colorDark: "#000000",
                        colorLight: "#FEFBF5",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    qrGenerated = true;
                }
            });

            const closeModal = () => {
                shareModal.classList.remove('active');
                shareModal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            };

            closeModalBtn.addEventListener('click', closeModal);
            shareModal.addEventListener('click', (e) => {
                if (!e.target.closest('.modal-card')) {
                    closeModal();
                }
            });

            copyUrlBtn.addEventListener('click', function() {
                const textToCopy = shareUrlInput.value || window.location.href;
                const copiedLabel = "{{ $t['copied'] }}";
                const copyLabel = "{{ $t['copy'] }}";

                const setCopiedUI = () => {
                    const copyIcon = document.getElementById('copy-icon');
                    const copyText = document.getElementById('copy-btn-text');
                    if (copyIcon) copyIcon.textContent = 'check';
                    if (copyText) copyText.textContent = copiedLabel;
                    copyUrlBtn.classList.add('copied');

                    setTimeout(() => {
                        if (copyIcon) copyIcon.textContent = 'content_copy';
                        if (copyText) copyText.textContent = copyLabel;
                        copyUrlBtn.classList.remove('copied');
                    }, 2000);
                };

                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(textToCopy).then(setCopiedUI).catch(err => {
                        console.error('Clipboard API error:', err);
                        shareUrlInput.select();
                        document.execCommand('copy');
                        setCopiedUI();
                    });
                } else {
                    shareUrlInput.select();
                    shareUrlInput.setSelectionRange(0, 99999);
                    try {
                        document.execCommand('copy');
                    } catch (e) {
                        console.error('execCommand error:', e);
                    }
                    setCopiedUI();
                }
            });
        }

        // Single Share on Socials Button (Native Phone Share Dialog)
        const shareSocialsBtn = document.getElementById('share-socials-btn');
        if (shareSocialsBtn) {
            shareSocialsBtn.addEventListener('click', function() {
                const currentUrl = window.location.href;
                const shareMessageText = {!! json_encode($t['share_message_prefix']) !!};
                const shareData = {
                    title: "Hybrid #{{ $hybrid->id }} — {{ $t['project_name'] }}",
                    text: shareMessageText,
                    url: currentUrl
                };

                if (navigator.share) {
                    navigator.share(shareData).catch(err => {
                        if (err.name !== 'AbortError') {
                            console.warn('Native share failed with full data, retrying url only:', err);
                            // Retry with url only (fixes some iOS Safari / Android HTTP edge cases)
                            navigator.share({ url: currentUrl }).catch(e => {
                                console.error('Native share failed:', e);
                                if (copyUrlBtn) copyUrlBtn.click();
                            });
                        }
                    });
                } else {
                    // Fallback for desktop / insecure HTTP contexts where Web Share API is unavailable
                    if (copyUrlBtn) copyUrlBtn.click();
                }
            });
        }

        // Info Modal Functionality
        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');
        const closeInfoModalBtn = document.getElementById('close-info-modal-btn');

        if (infoBtn && infoModal) {
            const openInfoModal = () => {
                infoModal.classList.add('active');
                infoModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            };

            const closeInfoModal = () => {
                infoModal.classList.remove('active');
                infoModal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            };

            infoBtn.addEventListener('click', openInfoModal);
            if (closeInfoModalBtn) closeInfoModalBtn.addEventListener('click', closeInfoModal);
            infoModal.addEventListener('click', (e) => {
                if (!e.target.closest('.modal-card')) {
                    closeInfoModal();
                }
            });
        }
    </script>
</body>

</html>
