<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Hybrids - Oracle of Suits</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #f5e6d3;
            padding: 20px;
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
            color: #2c2c2c;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.2rem;
            color: #666;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 20px 0;
            font-size: 1.1rem;
            color: #555;
        }

        .stat {
            background: white;
            padding: 10px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .stat strong {
            color: #2c2c2c;
            font-size: 1.3rem;
        }

        .hybrids-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }

        .hybrid-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
        }

        .hybrid-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .hybrid-image {
            width: 100%;
            height: 300px;
            object-fit: cover;
            background: #f0f0f0;
        }

        .hybrid-info {
            padding: 20px;
        }

        .hybrid-name {
            font-size: 1.3rem;
            font-weight: 700;
            color: #2c2c2c;
            margin-bottom: 10px;
        }

        .hybrid-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            font-size: 0.9rem;
            color: #666;
        }

        .likes {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .likes span {
            font-weight: 600;
            color: #e74c3c;
        }

        .cards-used {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }

        .cards-used-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: #888;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .card-list {
            list-style: none;
        }

        .card-item {
            font-size: 0.9rem;
            color: #555;
            padding: 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .card-item.base {
            font-weight: 700;
            color: #2c2c2c;
        }

        .card-item.base::before {
            content: "★";
            color: #f39c12;
        }

        .no-hybrids {
            text-align: center;
            padding: 60px 20px;
            color: #999;
            font-size: 1.2rem;
        }

        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            padding: 10px 20px;
            background: white;
            color: #2c2c2c;
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
        }

        .back-link:hover {
            background: #2c2c2c;
            color: white;
        }

        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
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
            box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
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
            box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
        }

        .modal-source-card p {
            color: white;
            text-align: center;
            margin-top: 10px;
            font-size: 0.9em;
        }

        .modal-close {
            position: fixed;
            top: 20px;
            right: 20px;
            color: white;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.5);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }

        .modal-close:hover {
            background: rgba(0, 0, 0, 0.8);
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
    </style>
</head>

<body>
    <div class="container">
        <a href="/" class="back-link">← Back to Home</a>

        <header>
            <h1>🃏 Oracle of Suits - Hybrids Gallery</h1>
            <p class="subtitle">Explore all generated hybrid cards</p>

            <div class="stats">
                <div class="stat">
                    <strong>{{ $hybrids->count() }}</strong> Hybrids
                </div>
                <div class="stat">
                    <strong>{{ $hybrids->sum('nb_like') }}</strong> Total Likes
                </div>
            </div>
        </header>

        @if ($hybrids->isEmpty())
            <div class="no-hybrids">
                <p>No hybrids generated yet. Start creating some!</p>
            </div>
        @else
            <div class="hybrids-grid">
                @foreach ($hybrids as $hybrid)
                    <div class="hybrid-card" data-hybrid-id="{{ $hybrid->id }}" data-hybrid-name="{{ $hybrid->name }}"
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
                        ) }}"
                        onclick="openModal(this)">
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
                @endforeach
            </div>
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
