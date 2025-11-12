<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $hybrid->name }} - Oracle of Suits</title>
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
            max-width: 1200px;
            margin: 0 auto;
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

        .hybrid-detail {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .hybrid-header {
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
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
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .source-cards-section {
            margin-top: 40px;
            padding-top: 40px;
            border-top: 2px solid #eee;
        }

        .section-title {
            font-size: 1.8rem;
            color: #2c2c2c;
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
            background: #f9f9f9;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .source-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }

        .source-card.base {
            background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
            border: 3px solid #f39c12;
            position: relative;
        }

        .source-card.base::before {
            content: "★ BASE CARD";
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: #f39c12;
            color: white;
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
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .source-card-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: #2c2c2c;
            margin-bottom: 8px;
        }

        .source-card-game {
            font-size: 0.95rem;
            color: #666;
            font-style: italic;
        }

        .source-card-suits {
            font-size: 0.9rem;
            color: #888;
            margin-top: 5px;
        }

        .qr-section {
            margin-top: 40px;
            padding: 30px;
            background: #f9f9f9;
            border-radius: 12px;
            text-align: center;
        }

        .qr-section h3 {
            font-size: 1.3rem;
            color: #2c2c2c;
            margin-bottom: 15px;
        }

        .qr-code-display {
            display: inline-block;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
                                        <div class="source-card-game">{{ $card->game->name }}</div>
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
    </script>
</body>

</html>
