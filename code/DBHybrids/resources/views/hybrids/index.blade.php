<!DOCTYPE html>
<html lang="{{ $lang ?? 'fr' }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $t['hybrids'] }} {{ $t['gallery'] }} - Oracle of Suits</title>

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
</head>

<body>
    <!-- Transparent Backdrop when Dropdown is Open -->
    <div id="dropdown-backdrop" class="dropdown-backdrop"></div>

    <main class="main-container">
        <!-- Header -->
        <header class="index-header">
            <div class="title-wrapper">
                @if(($lang ?? 'fr') === 'en')
                    <img src="{{ asset('img/logos/SF-Hybrids-Gallery.png') }}" alt="Hybrids Gallery" class="header-logo-img">
                @else
                    <img src="{{ asset('img/logos/SF-Hybrids-Galerie.png') }}" alt="Hybrids Galerie" class="header-logo-img">
                @endif
            </div>
            <p class="index-subtitle">{{ $t['explore'] }}</p>
        </header>

        <!-- Top Controls Bar Above Grid -->
        <div class="grid-controls-bar">
            <div class="grid-count-info">
                @if($filterDate)
                    <a href="{{ route('hybrids.index', ['reset_date' => 1]) }}" class="active-filter-tag" title="Effacer le filtre date">
                        <span class="material-symbols-rounded">calendar_today</span>
                        <span>{{ $filterDate }}</span>
                        <span class="material-symbols-rounded tag-close">close</span>
                    </a>
                @endif
            </div>

            <div class="grid-sort-group">
                <span class="sort-label">{{ $t['sort_by'] }} :</span>
                <div class="grid-sort-pills-row">
                    <a href="{{ route('hybrids.index', ['sort' => 'date']) }}"
                        class="sort-chip {{ $sortBy === 'date' ? 'active' : '' }}">
                        {{ $t['most_recent'] }}
                    </a>
                    <a href="{{ route('hybrids.index', ['sort' => 'date_asc']) }}"
                        class="sort-chip {{ $sortBy === 'date_asc' || $sortBy === 'oldest' ? 'active' : '' }}">
                        {{ $t['oldest'] }}
                    </a>
                    <a href="{{ route('hybrids.index', ['sort' => 'likes']) }}"
                        class="sort-chip {{ $sortBy === 'likes' ? 'active' : '' }}">
                        {{ $t['most_liked'] }}
                    </a>
                </div>
            </div>
        </div>

        <!-- Grid of Hybrids -->
        @if ($hybrids->isEmpty())
            <div style="text-align: center; color: var(--color-white-cream); padding: 80px 20px; font-size: 1.1rem; opacity: 0.7;">
                {{ $t['no_hybrids'] }}
            </div>
        @else
            <div class="hybrids-grid">
                @foreach ($hybrids as $hybrid)
                    @php
                        $expandedCards = getExpandedCards($hybrid);
                        $hybridUrl = route('hybrids.show', $hybrid->id);
                    @endphp
                    <div class="hybrid-card-item" onclick="if(!event.target.closest('.index-like-btn')) window.location.href='{{ $hybridUrl }}';">
                        <!-- Top Image Link with Skeleton Loader -->
                        <div class="hybrid-card-img-link skeleton-loader">
                            @if ($hybrid->img_src)
                                <img src="{{ preg_match('/^https?:\/\//', $hybrid->img_src)
                                    ? $hybrid->img_src
                                    : asset('storage/' . ltrim($hybrid->img_src, '/')) }}"
                                    alt="{{ $hybrid->name }}" 
                                    class="hybrid-card-img img-loading"
                                    onload="this.classList.remove('img-loading'); this.classList.add('img-loaded'); if(this.parentElement) this.parentElement.classList.remove('skeleton-loader');"
                                    onerror="if(this.parentElement) this.parentElement.classList.remove('skeleton-loader');">
                            @else
                                <div style="height: 280px; display: flex; align-items: center; justify-content: center; color: #888; font-size: 0.85rem;">
                                    Image indisponible
                                </div>
                            @endif
                        </div>

                        <div class="hybrid-card-content">
                            <!-- Meta Line (Interactive Like & Date) -->
                            <div class="hybrid-card-meta">
                                <button type="button" class="index-like-btn" data-hybrid-id="{{ $hybrid->id }}" aria-label="J'aime">
                                    <span class="material-symbols-rounded">favorite</span>
                                    <span class="like-count">{{ $hybrid->nb_like }}</span>
                                </button>
                                @php
                                    $monthsFr = [
                                        1 => 'Janv.', 2 => 'Févr.', 3 => 'Mars', 4 => 'Avril',
                                        5 => 'Mai', 6 => 'Juin', 7 => 'Juil.', 8 => 'Août',
                                        9 => 'Sept.', 10 => 'Oct.', 11 => 'Nov.', 12 => 'Déc.'
                                    ];
                                    $dateFormatted = ($lang === 'en')
                                        ? $hybrid->created_at->format('M d, Y')
                                        : $hybrid->created_at->format('j') . ' ' . ($monthsFr[(int)$hybrid->created_at->format('n')] ?? $hybrid->created_at->format('F')) . ' ' . $hybrid->created_at->format('Y');
                                @endphp
                                <span class="meta-date">
                                    {{ $dateFormatted }}
                                </span>
                            </div>

                            <hr class="card-inner-divider">

                            <!-- CARDS USED section (Includes all 3 cards even if duplicate) -->
                            @if ($expandedCards->isNotEmpty())
                                <div class="cards-used-section">
                                    <div class="cards-used-title">{{ $t['cards_used'] }}</div>
                                    <ul class="cards-used-list">
                                        @foreach ($expandedCards as $card)
                                            <li class="cards-used-item {{ isset($card->pivot) && $card->pivot->is_base ? 'is-base' : '' }}">
                                                {{ getLocalizedCardName($card, $lang) }}
                                                @if ($card->game)
                                                    @php
                                                        $gName = ($lang === 'en' && !empty($card->game->name_en)) ? $card->game->name_en : $card->game->name;
                                                    @endphp
                                                    <span class="game-name">({{ $gName }})</span>
                                                @endif
                                            </li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </main>

    <!-- Sticky Bottom Controls & Pagination Bar -->
    <div class="sticky-controls-bar">
        <!-- Controls Dropdown Pop-up Panel -->
        <div id="dropdown-panel" class="controls-dropdown-panel">
            <!-- Language Switcher Section -->
            <div>
                <div class="dropdown-section-title">{{ $t['language'] }}</div>
                <div class="lang-switch dropdown-lang-switch">
                    <a href="{{ route('hybrids.index', ['lang' => 'fr']) }}" class="lang-opt {{ $lang === 'fr' ? 'active-lang' : '' }}">FR</a>
                    /
                    <a href="{{ route('hybrids.index', ['lang' => 'en']) }}" class="lang-opt {{ $lang === 'en' ? 'active-lang' : '' }}">EN</a>
                </div>
            </div>

            <!-- Date Filter Section -->
            <div>
                <div class="dropdown-section-title">{{ $t['filter_by_date'] }}</div>
                <form action="{{ route('hybrids.index') }}" method="GET" class="dropdown-date-filter">
                    <input type="date" name="date" class="dropdown-date-input" value="{{ $filterDate }}">
                    <div class="dropdown-filter-actions">
                        <button type="submit" class="btn-filter-submit">{{ $t['apply'] }}</button>
                        @if($filterDate)
                            <a href="{{ route('hybrids.index', ['reset_date' => 1]) }}" class="btn-filter-reset">{{ $t['reset'] }}</a>
                        @endif
                    </div>
                </form>
            </div>
        </div>

        <!-- Top Header Row (Centered counter + Right discover_tune button) -->
        <div class="bar-header-row">
            <span class="bar-counter">
                @if ($hybrids->total() > 0)
                    {{ $hybrids->firstItem() }}-{{ $hybrids->lastItem() }} {{ $t['of'] }} {{ $hybrids->total() }}
                @else
                    0-0 {{ $t['of'] }} 0
                @endif
            </span>

            <button type="button" id="dropdown-toggle-btn" class="bar-tune-btn {{ $filterDate ? 'has-filter' : '' }}" aria-label="Filtres">
                <span class="material-symbols-rounded">discover_tune</span>
            </button>
        </div>

        <!-- Middle Page Numbers Row -->
        <div class="bar-numbers-row">
            @php
                $currentPage = $hybrids->currentPage();
                $lastPage = $hybrids->lastPage();
            @endphp

            <!-- First Page -->
            <a href="{{ $hybrids->url(1) }}" class="page-pill {{ $currentPage == 1 ? 'active' : '' }}">1</a>

            @if ($currentPage > 3)
                <span class="page-dots">...</span>
            @endif

            <!-- Middle Pages -->
            @for ($page = max(2, $currentPage - 1); $page <= min($lastPage - 1, $currentPage + 1); $page++)
                <a href="{{ $hybrids->url($page) }}" class="page-pill {{ $currentPage == $page ? 'active' : '' }}">{{ $page }}</a>
            @endfor

            @if ($currentPage < $lastPage - 2)
                <span class="page-dots">...</span>
            @endif

            <!-- Last Page -->
            @if ($lastPage > 1)
                <a href="{{ $hybrids->url($lastPage) }}" class="page-pill {{ $currentPage == $lastPage ? 'active' : '' }}">{{ $lastPage }}</a>
            @endif
        </div>

        <!-- Bottom Row (< Previous left, Next > pill right - Full Width) -->
        <div class="bar-bottom-row">
            @if ($hybrids->onFirstPage())
                <span class="nav-bottom-btn disabled">{{ $t['previous'] }}</span>
            @else
                <a href="{{ $hybrids->previousPageUrl() }}" class="nav-bottom-btn">{{ $t['previous'] }}</a>
            @endif

            @if ($hybrids->hasMorePages())
                <a href="{{ $hybrids->nextPageUrl() }}" class="nav-bottom-btn">{{ $t['next'] }}</a>
            @else
                <span class="nav-bottom-btn disabled">{{ $t['next'] }}</span>
            @endif
        </div>
    </div>

    <!-- Scripts -->
    <script>
        // Dropdown toggle & Backdrop logic to prevent unintended card clicks
        const dropdownToggleBtn = document.getElementById('dropdown-toggle-btn');
        const dropdownPanel = document.getElementById('dropdown-panel');
        const dropdownBackdrop = document.getElementById('dropdown-backdrop');

        function openDropdown() {
            dropdownPanel.classList.add('active');
            dropdownBackdrop.classList.add('active');
        }

        function closeDropdown() {
            dropdownPanel.classList.remove('active');
            dropdownBackdrop.classList.remove('active');
        }

        if (dropdownToggleBtn && dropdownPanel) {
            dropdownToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dropdownPanel.classList.contains('active')) {
                    closeDropdown();
                } else {
                    openDropdown();
                }
            });

            if (dropdownBackdrop) {
                dropdownBackdrop.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeDropdown();
                });
            }
        }

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

        // Like button functionality on index page with expanded hitbox & event isolation
        document.querySelectorAll('.index-like-btn').forEach(btn => {
            const id = btn.dataset.hybridId;
            const likedKey = `hybrid_liked_${id}`;

            if (localStorage.getItem(likedKey) === 'true') {
                btn.classList.add('liked');
            }

            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (this.disabled) return;
                this.disabled = true;

                const isLiked = this.classList.contains('liked');
                const action = isLiked ? 'unlike' : 'like';

                try {
                    const response = await fetch(`/api/hybrids/${id}/like`, {
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
                        const countSpan = this.querySelector('.like-count');
                        if (countSpan) countSpan.textContent = data.nb_like;

                        if (data.liked) {
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
                        }, 180);
                    } else {
                        this.disabled = false;
                    }
                } catch (err) {
                    console.error('Error liking hybrid:', err);
                    this.disabled = false;
                }
            });
        });


        // Instant check for cached images
        document.querySelectorAll('.hybrid-card-img').forEach(img => {
            if (img.complete && img.naturalHeight !== 0) {
                img.classList.remove('img-loading');
                img.classList.add('img-loaded');
                if (img.parentElement) img.parentElement.classList.remove('skeleton-loader');
            }
        });
    </script>
</body>

</html>
