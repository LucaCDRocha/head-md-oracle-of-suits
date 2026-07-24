<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $hybrid->name }} - Oracle of Suits</title>
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
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
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

        .download-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background: var(--color-accent-green);
            color: var(--color-dark);
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(131, 246, 189, 0.3);
            transition: all 0.3s ease;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            border: none;
        }

        .download-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(131, 246, 189, 0.4);
            background: var(--color-accent-green-hover);
        }

        .download-button:active {
            transform: translateY(0);
        }

        .like-button {
            display: inline-block;
            margin-top: 20px;
            margin-left: 15px;
            padding: 12px 30px;
            background: var(--color-accent-pink);
            color: var(--color-white);
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(255, 99, 152, 0.3);
            transition: all 0.3s ease;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            border: none;
        }

        .like-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(255, 99, 152, 0.4);
            background: var(--color-accent-pink-hover);
        }

        .like-button:active {
            transform: scale(0.95);
        }

        .like-button.liked {
            background: var(--color-accent-green);
            color: var(--color-dark);
            box-shadow: 0 4px 12px rgba(131, 246, 189, 0.3);
        }

        .like-button.liked:hover {
            box-shadow: 0 6px 16px rgba(131, 246, 189, 0.4);
            background: var(--color-accent-green-hover);
        }

        .button-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .hybrid-detail {
            background: var(--color-bg);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(255, 237, 204, 0.2);
        }

        .hybrid-header {
            border-radius: 12px 12px 0 0;
            padding: 30px;
            background: var(--color-dark);
            color: var(--color-bg);
            border: 3px solid var(--color-bg);
            border-bottom: none;
        }

        .hybrid-title {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .hybrid-meta {
            display: flex;
            gap: 30px;
            font-size: 1.1rem;
            opacity: 0.95;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .hybrid-content {
            padding: 40px;
        }

        .hybrid-image-container {
            text-align: center;
            margin-bottom: 40px;
        }

        .hybrid-image {
            max-width: 100%;
            max-height: 600px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(6, 6, 6, 0.15);
        }

        .source-cards-section {
            margin-top: 40px;
            padding-top: 40px;
            border-top: 2px solid var(--color-dark);
        }

        .section-title {
            font-size: 1.8rem;
            color: var(--color-dark);
            margin-bottom: 25px;
            text-align: center;
        }

        .source-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin-top: 20px;
        }

        .source-card {
            background: var(--color-white);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 2px 8px rgba(6, 6, 6, 0.05);
        }

        .source-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 16px rgba(6, 6, 6, 0.1);
        }

        .source-card.base {
            background: var(--color-accent-green);
            border: 3px solid var(--color-accent-green-hover);
            position: relative;
        }

        .source-card.base::before {
            content: "★ BASE CARD";
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-dark);
            color: var(--color-accent-green);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        .source-card-image {
            width: 100%;
            max-width: 200px;
            height: auto;
            border-radius: 8px;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(6, 6, 6, 0.1);
        }

        .source-card-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--color-dark);
            margin-bottom: 8px;
        }

        .source-card-game {
            font-size: 0.95rem;
            color: var(--color-dark);
            opacity: 1;
            font-style: italic;
        }

        .source-card-suits {
            font-size: 0.9rem;
            color: var(--color-dark);
            opacity: 1;
            margin-top: 5px;
        }

        .info-icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            background: var(--color-accent-pink);
            color: var(--color-white);
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            font-size: 14px;
            font-weight: bold;
            cursor: help;
            margin-left: 5px;
            position: relative;
            transition: all 0.2s ease;
        }

        .info-icon:hover {
            background: var(--color-accent-pink-hover);
            transform: scale(1.1);
        }

        .info-icon .tooltip {
            visibility: hidden;
            opacity: 0;
            width: 250px;
            background-color: var(--color-dark);
            color: var(--color-bg);
            text-align: left;
            border-radius: 8px;
            padding: 12px;
            position: absolute;
            z-index: 1000;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.85rem;
            line-height: 1.4;
            font-weight: normal;
            box-shadow: 0 4px 12px rgba(6, 6, 6, 0.3);
            transition: opacity 0.3s, visibility 0.3s;
        }

        .info-icon .tooltip::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: var(--color-dark) transparent transparent transparent;
        }

        .info-icon:hover .tooltip {
            visibility: visible;
            opacity: 1;
        }

        .game-name-with-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }

        .qr-section {
            margin-top: 40px;
            padding: 30px;
            background: var(--color-white);
            border-radius: 12px;
            text-align: center;
        }

        .qr-section h3 {
            font-size: 1.3rem;
            color: var(--color-dark);
            margin-bottom: 15px;
        }

        .qr-code-display {
            display: inline-block;
            padding: 20px;
            background: var(--color-white);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(6, 6, 6, 0.1);
        }

        @media (max-width: 768px) {
            .hybrid-title {
                font-size: 1.8rem;
            }

            .hybrid-meta {
                flex-direction: column;
                gap: 10px;
            }

            .source-cards {
                grid-template-columns: 1fr;
            }

            .hybrid-content {
                padding: 20px;
            }
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>

<body>
    <div class="container">
        <a href="{{ route('hybrids.index') }}" class="back-link">← Back to All Hybrids</a>

        <div class="hybrid-detail">
            <div class="hybrid-header">
                <h1 class="hybrid-title">{{ $hybrid->name }}</h1>
                <div class="hybrid-meta">
                    <div class="meta-item">
                        <span>❤️</span>
                        <span>{{ $hybrid->nb_like }} {{ Str::plural('like', $hybrid->nb_like) }}</span>
                    </div>
                    <div class="meta-item">
                        <span>📅</span>
                        <span>{{ $hybrid->created_at->format('F d, Y') }}</span>
                    </div>
                    <div class="meta-item">
                        <span>🆔</span>
                        <span>Hybrid #{{ $hybrid->id }}</span>
                    </div>
                </div>
            </div>

            <div class="hybrid-content">
                <div class="hybrid-image-container">
                    @if ($hybrid->img_src)
                        <img src="{{ preg_match('/^https?:\/\//', $hybrid->img_src)
                            ? $hybrid->img_src
                            : asset('storage/' . ltrim($hybrid->img_src, '/')) }}"
                            alt="{{ $hybrid->name }}" class="hybrid-image">
                        <div class="button-group">
                            <a href="{{ route('hybrids.download', $hybrid->id) }}" class="download-button">
                                📥 Download Image
                            </a>
                            <button id="like-button" class="like-button" data-hybrid-id="{{ $hybrid->id }}">
                                ❤️ Like (<span id="like-count">{{ $hybrid->nb_like }}</span>)
                            </button>
                        </div>
                    @else
                        <p style="color: #999; padding: 60px;">No image available</p>
                    @endif
                </div>

                @if ($hybrid->cards->isNotEmpty())
                    <div class="source-cards-section">
                        <h2 class="section-title">Source Cards</h2>
                        <div class="source-cards">
                            @foreach ($hybrid->cards as $card)
                                <div class="source-card {{ $card->pivot->is_base ? 'base' : '' }}">
                                    @if ($card->img_src)
                                        <img src="{{ preg_match('/^https?:\/\//', $card->img_src)
                                            ? $card->img_src
                                            : asset('storage/' . ltrim($card->img_src, '/')) }}"
                                            alt="{{ $card->name }}" class="source-card-image">
                                    @endif
                                    <div class="source-card-name">{{ $card->name }}</div>
                                    @if ($card->game)
                                        <div class="source-card-game">
                                            <div class="game-name-with-info">
                                                <span>{{ $card->game->name }}</span>
                                                @if ($card->game->description)
                                                    <span class="info-icon">
                                                        i
                                                        <span class="tooltip">{{ $card->game->description }}</span>
                                                    </span>
                                                @endif
                                            </div>
                                        </div>
                                    @endif
                                    @if ($card->suits)
                                        <div class="source-card-suits">{{ $card->suits }}</div>
                                    @endif
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif

                <div class="qr-section">
                    <h3>🔗 Share this Hybrid</h3>
                    <p style="color: #666; margin-bottom: 20px;">Scan to view this hybrid</p>
                    <div class="qr-code-display">
                        <div id="qrcode"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Generate QR code for current page URL
        new QRCode(document.getElementById("qrcode"), {
            text: window.location.href,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Like button functionality
        const likeButton = document.getElementById('like-button');
        const likeCount = document.getElementById('like-count');

        // Check if user has already liked this hybrid
        const hybridId = likeButton.dataset.hybridId;
        const likedKey = `hybrid_liked_${hybridId}`;

        let isLiked = localStorage.getItem(likedKey) === 'true';

        // Set initial button state
        if (isLiked) {
            likeButton.classList.add('liked');
            likeButton.innerHTML = '✓ Liked (<span id="like-count">' + likeCount.textContent + '</span>)';
        }

        likeButton.addEventListener('click', async function() {
            // Prevent multiple clicks while processing
            if (this.disabled) return;
            this.disabled = true;

            try {
                const action = isLiked ? 'unlike' : 'like';

                const response = await fetch(`/hybrids/${hybridId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify({
                        action: action
                    })
                });

                if (response.ok) {
                    const data = await response.json();

                    // Update the like count
                    document.getElementById('like-count').textContent = data.nb_like;

                    // Toggle liked state
                    isLiked = data.liked;

                    if (isLiked) {
                        // Mark as liked
                        this.classList.add('liked');
                        this.innerHTML = '✓ Liked (<span id="like-count">' + data.nb_like + '</span>)';
                        localStorage.setItem(likedKey, 'true');
                    } else {
                        // Mark as unliked
                        this.classList.remove('liked');
                        this.innerHTML = '❤️ Like (<span id="like-count">' + data.nb_like + '</span>)';
                        localStorage.removeItem(likedKey);
                    }

                    // Add animation
                    this.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        this.style.transform = '';
                        this.disabled = false;
                    }, 200);
                } else {
                    console.error('Failed to like/unlike');
                    this.disabled = false;
                }
            } catch (error) {
                console.error('Error:', error);
                this.disabled = false;
            }
        });
    </script>
</body>

</html>
