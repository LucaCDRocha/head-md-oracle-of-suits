<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Hybrids - Oracle of Suits</title>
    <style>
        :root {
            --color-bg: #FFEDCC;
            --color-accent-green: #83F6BD;
            --color-accent-pink: #FF6398;
            --color-dark: #060606;
            --color-white: #ffffff;
            --color-accent-green-hover: #70e0aa;
            --color-accent-pink-hover: #ff4d8a;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: var(--color-dark);
            padding: 20px;
            padding-bottom: 100px; /* Space for fixed pagination */
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 40px;
        }

        h1 {
            font-size: 3rem;
            color: var(--color-bg);
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.2rem;
            color: var(--color-bg);
            opacity: 0.7;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 20px 0;
            font-size: 1.1rem;
            color: var(--color-bg);
        }

        .stat {
            background: var(--color-dark);
            padding: 10px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(6, 6, 6, 0.1);
            border: 2px solid var(--color-bg);
        }

        .stat strong {
            color: var(--color-accent-pink);
            font-size: 1.3rem;
        }

        .hybrids-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }

        .hybrid-card {
            background: var(--color-bg);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(255, 237, 204, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
        }

        .hybrid-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(255, 237, 204, 0.2);
        }

        .hybrid-image {
            width: 100%;
            height: 300px;
            object-fit: cover;
            background: var(--color-dark);
        }

        .hybrid-info {
            padding: 20px;
        }

        .hybrid-name {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--color-dark);
            margin-bottom: 10px;
        }

        .hybrid-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            font-size: 0.9rem;
            color: var(--color-dark);
            opacity: 0.7;
        }

        .likes {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .likes span {
            font-weight: 600;
            color: var(--color-accent-pink);
        }

        .cards-used {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }

        .cards-used-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--color-dark);
            opacity: 0.6;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .card-list {
            list-style: none;
        }

        .card-item {
            font-size: 0.9rem;
            color: var(--color-dark);
            opacity: 0.8;
            padding: 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .card-item.base {
            font-weight: 700;
            color: var(--color-dark);
            opacity: 1;
        }

        .card-item.base::before {
            content: "★";
            color: var(--color-accent-green);
        }

        .no-hybrids {
            text-align: center;
            padding: 60px 20px;
            color: var(--color-dark);
            opacity: 0.5;
            font-size: 1.2rem;
        }

        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            padding: 10px 20px;
            background: var(--color-bg);
            color: var(--color-dark);
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(255, 237, 204, 0.3);
            transition: all 0.2s ease;
        }

        .back-link:hover {
            background: var(--color-white);
            color: var(--color-dark);
        }

        .sort-controls {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 30px 0;
        }

        .sort-button {
            padding: 10px 25px;
            background: var(--color-bg);
            color: var(--color-dark);
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(255, 237, 204, 0.3);
            transition: all 0.2s ease;
            cursor: pointer;
            border: 2px solid transparent;
            font-weight: 500;
            font-size: 1rem;
        }

        .sort-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(255, 237, 204, 0.4);
        }

        .sort-button.active {
            background: var(--color-accent-green);
            color: var(--color-dark);
            border-color: var(--color-accent-green);
            box-shadow: 0 4px 12px rgba(131, 246, 189, 0.3);
        }

        .sort-label {
            display: block;
            text-align: center;
            color: var(--color-bg);
            opacity: 0.7;
            font-size: 0.9rem;
            margin-bottom: 10px;
            font-weight: 600;
        }

        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(6, 6, 6, 0.95);
            z-index: 9999;
            overflow: auto;
        }

        .modal.active {
            display: block;
        }

        .modal-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px 20px;
            min-height: 100vh;
            gap: 30px;
        }

        .modal-hybrid-image {
            max-width: 90%;
            max-height: 60vh;
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(255, 237, 204, 0.1);
        }

        .modal-source-cards {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 90%;
        }

        .modal-source-card {
            flex: 1;
            min-width: 200px;
            max-width: 300px;
        }

        .modal-source-card img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(255, 237, 204, 0.1);
        }

        .modal-source-card p {
            color: var(--color-bg);
            text-align: center;
            margin-top: 10px;
            font-size: 0.9em;
        }

        .modal-close {
            position: fixed;
            top: 20px;
            right: 20px;
            color: var(--color-bg);
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            background: rgba(255, 237, 204, 0.1);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }

        .modal-close:hover {
            background: rgba(255, 237, 204, 0.2);
        }

        @media (max-width: 768px) {
            .modal-source-cards {
                flex-direction: column;
                align-items: center;
            }

            .modal-source-card {
                max-width: 80%;
            }
        }

        /* Pagination Styles */
        .pagination-wrapper {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 15px 20px;
            background: linear-gradient(to top, 
                        var(--color-dark) 80%, 
                        transparent);
            z-index: 1000;
        }

        .pagination-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            background: var(--color-bg);
            padding: 15px 25px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
                        0 4px 16px rgba(0, 0, 0, 0.3);
            border: 2px solid var(--color-dark);
            width: 100%;
        }

        .pagination-info {
            font-size: 0.8rem;
            color: var(--color-dark);
            white-space: nowrap;
            font-weight: 600;
            opacity: 0.7;
            text-align: center;
        }

        .pagination-wrapper nav {
            display: flex;
            align-items: center;
            flex-direction: column;
            width: 100%;
            gap: 4px;
        }

        .pagination-wrapper ul {
            display: flex;
            flex-direction: row;
            gap: 4px;
            list-style: none;
            align-items: center;
            margin: 0;
            padding: 0;
        }

        .pagination-wrapper li {
            display: inline-block;
        }

        .pagination-wrapper a,
        .pagination-wrapper span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 50%;
            text-decoration: none;
            color: var(--color-dark);
            font-weight: 600;
            transition: all 0.2s ease;
            width: 36px;
            height: 36px;
            font-size: 0.9rem;
            background: transparent;
        }

        .pagination-wrapper a:hover {
            background: var(--color-accent-green);
            color: var(--color-dark);
            transform: scale(1.1);
        }

        .pagination-wrapper .active span {
            background: var(--color-accent-pink);
            color: var(--color-white);
            font-weight: 700;
            transform: scale(1.05);
        }

        .pagination-wrapper .disabled span {
            color: #bbb;
            cursor: not-allowed;
            opacity: 0.3;
        }

        .pagination-wrapper .disabled a {
            pointer-events: none;
        }

        /* Previous/Next buttons */
        .pagination-nav-buttons {
            display: flex;
            flex-direction: row;
            gap: 12px;
            margin-top: 5px;
            width: 100%;
        }

        .pagination-nav-buttons a,
        .pagination-nav-buttons span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 20px;
            border-radius: 20px;
            text-decoration: none;
            color: var(--color-dark);
            font-weight: 600;
            font-size: 0.85rem;
            background: rgba(6, 6, 6, 0.08);
            transition: all 0.2s ease;
            flex-grow: 1;
        }

        .pagination-nav-buttons a:hover {
            background: var(--color-accent-green);
            color: var(--color-dark);
            transform: scale(1.05);
        }

        .pagination-nav-buttons span.disabled {
            opacity: 0.3;
            cursor: not-allowed;
            background: transparent;
        }

        /* Dots */
        .pagination-wrapper .dots {
            width: 30px;
            text-align: center;
            opacity: 0.4;
            font-weight: bold;
        }

        /* Page numbers container */
        .pagination-pages {
            display: flex;
            flex-direction: row;
            gap: 3px;
            align-items: center;
        }
    </style>
</head>

<body>
    <div class="container">
        <header>
            <h1>🃏 Oracle of Suits - Hybrids Gallery</h1>
            <p class="subtitle">Explore all generated hybrid cards</p>

            <div class="stats">
                <div class="stat">
                    <strong>{{ $totalHybrids }}</strong> Hybrids
                </div>
                <div class="stat">
                    <strong>{{ $totalLikes }}</strong> Total Likes
                </div>
            </div>

            <div class="sort-controls">
                <span class="sort-label">Sort by:</span>
                <a href="{{ route('hybrids.index', ['sort' => 'date']) }}"
                    class="sort-button {{ !isset($sortBy) || $sortBy === 'date' ? 'active' : '' }}">
                    📅 Newest First
                </a>
                <a href="{{ route('hybrids.index', ['sort' => 'likes']) }}"
                    class="sort-button {{ isset($sortBy) && $sortBy === 'likes' ? 'active' : '' }}">
                    ❤️ Most Liked
                </a>
            </div>
        </header>

        @if ($hybrids->isEmpty())
            <div class="no-hybrids">
                <p>No hybrids generated yet. Start creating some!</p>
            </div>
        @else
            <div class="hybrids-grid">
                @foreach ($hybrids as $hybrid)
                    <a href="{{ route('hybrids.show', $hybrid->id) }}" style="text-decoration: none; color: inherit;">
                        <div class="hybrid-card" data-hybrid-id="{{ $hybrid->id }}"
                            data-hybrid-name="{{ $hybrid->name }}"
                            data-hybrid-image="{{ $hybrid->img_src
                                ? (preg_match('/^https?:\/\//', $hybrid->img_src)
                                    ? $hybrid->img_src
                                    : asset('storage/' . ltrim($hybrid->img_src, '/')))
                                : '' }}"
                            data-cards="{{ json_encode(
                                $hybrid->cards->map(function ($card) {
                                    return [
                                        'name' => $card->name,
                                        'game' => $card->game ? $card->game->name : null,
                                        'img_src' => $card->img_src
                                            ? (preg_match('/^https?:\/\//', $card->img_src)
                                                ? $card->img_src
                                                : asset('storage/' . ltrim($card->img_src, '/')))
                                            : null,
                                        'is_base' => $card->pivot->is_base,
                                    ];
                                }),
                            ) }}">
                            <img src="{{ $hybrid->img_src
                                ? (preg_match('/^https?:\/\//', $hybrid->img_src)
                                    ? $hybrid->img_src
                                    : asset('storage/' . ltrim($hybrid->img_src, '/')))
                                : null }}"
                                alt="{{ $hybrid->name }}" class="hybrid-image">

                            <div class="hybrid-info">
                                <h2 class="hybrid-name">{{ $hybrid->name }}</h2>

                                <div class="hybrid-meta">
                                    <div class="likes">
                                        ❤️ <span>{{ $hybrid->nb_like }}</span>
                                    </div>
                                    <div class="date">
                                        {{ $hybrid->created_at->format('M d, Y') }}
                                    </div>
                                </div>

                                @if ($hybrid->cards->isNotEmpty())
                                    <div class="cards-used">
                                        <div class="cards-used-title">Cards Used:</div>
                                        <ul class="card-list">
                                            @foreach ($hybrid->cards as $card)
                                                <li class="card-item {{ $card->pivot->is_base ? 'base' : '' }}">
                                                    {{ $card->name }}
                                                    @if ($card->game)
                                                        <span style="color: #999; font-size: 0.85em;">
                                                            ({{ $card->game->name }})
                                                        </span>
                                                    @endif
                                                </li>
                                            @endforeach
                                        </ul>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </a>
                @endforeach
            </div>

            <!-- Pagination -->
            @if ($hybrids->hasPages())
                <div class="pagination-wrapper">
                    <div class="pagination-container">
                        {{ $hybrids->links('vendor.pagination.custom') }}
                    </div>
                </div>
            @endif
        @endif
    </div>

    <!-- Modal -->
    <div id="hybridModal" class="modal" onclick="closeModal()">
        <span class="modal-close">&times;</span>
        <div class="modal-content" onclick="event.stopPropagation()">
            <img id="modalHybridImage" class="modal-hybrid-image" src="" alt="">
            <div class="modal-source-cards" id="modalSourceCards"></div>
        </div>
    </div>

    <script>
        function openModal(element) {
            const hybridImage = element.dataset.hybridImage;
            const hybridName = element.dataset.hybridName;
            const cards = JSON.parse(element.dataset.cards);

            // Set hybrid image
            document.getElementById('modalHybridImage').src = hybridImage;
            document.getElementById('modalHybridImage').alt = hybridName;

            // Set source cards
            const sourceCardsContainer = document.getElementById('modalSourceCards');
            sourceCardsContainer.innerHTML = '';

            cards.forEach(card => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'modal-source-card';

                const img = document.createElement('img');
                img.src = card.img_src || '';
                img.alt = card.name;

                const p = document.createElement('p');
                p.textContent = card.name;
                if (card.game) {
                    p.textContent += ` (${card.game})`;
                }
                if (card.is_base) {
                    p.innerHTML = '★ ' + p.textContent;
                    p.style.fontWeight = 'bold';
                }

                cardDiv.appendChild(img);
                cardDiv.appendChild(p);
                sourceCardsContainer.appendChild(cardDiv);
            });

            // Show modal
            document.getElementById('hybridModal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('hybridModal').classList.remove('active');
        }

        // Close modal on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    </script>
</body>

</html>
