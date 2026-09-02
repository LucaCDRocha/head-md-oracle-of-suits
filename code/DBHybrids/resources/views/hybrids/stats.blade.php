<!DOCTYPE html>
<html lang="{{ $lang ?? 'fr' }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ ($lang === 'en') ? 'Stats - Hybrids Gallery' : 'Statistiques - Hybrids Galerie' }}</title>

    <!-- SEO Meta Tags -->
    <meta name="description" content="{{ $t['stats_subtitle'] }}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $t['stats_title'] }} — {{ $t['project_name'] }}">
    <meta property="og:description" content="{{ $t['stats_subtitle'] }}">
    <meta property="og:image" content="{{ asset('img/logos/SF-Hybrids-Galerie.png') }}">

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

    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

    <!-- Hybrids Stylesheet -->
    <link rel="stylesheet" href="{{ asset('css/hybrids.css') }}">

    <style>
        .stats-subtitle-text {
            font-family: var(--font-body);
            font-size: 0.95rem;
            color: var(--color-grey-black);
            text-align: center;
            margin-top: -18px;
            margin-bottom: 36px;
        }

        /* KPI Grid (Matching show view source card light boxes) */
        .stats-kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .stats-kpi-box {
            background-color: var(--color-white-cream);
            border-radius: 16px;
            padding: 20px 22px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.06);
            cursor: default;
        }

        .kpi-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .kpi-label {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: var(--color-grey-black);
        }

        .kpi-icon {
            color: var(--color-pearl-ruby);
            background: rgba(114, 20, 34, 0.08);
            padding: 7px;
            border-radius: 8px;
            font-size: 20px;
        }

        .kpi-value {
            font-family: var(--font-title);
            font-size: 2.3rem;
            font-weight: 700;
            color: var(--color-pearl-ruby);
            line-height: 1.1;
        }

        .kpi-subtext {
            font-size: 0.8rem;
            color: var(--color-grey-black);
            margin-top: 6px;
            font-weight: 500;
        }

        /* Chart Section */
        .stats-chart-section {
            margin-bottom: 20px;
        }

        .chart-controls-row {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }

        .control-group-pills {
            display: flex;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 30px;
            padding: 3px;
            border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .chart-pill-btn {
            background: transparent;
            border: none;
            color: var(--color-grey-black);
            padding: 6px 16px;
            font-size: 0.82rem;
            font-weight: 600;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: var(--font-body);
        }

        .chart-pill-btn.active {
            background: var(--color-pearl-ruby);
            color: var(--color-white-cream);
            box-shadow: 0 2px 8px rgba(114, 20, 34, 0.25);
        }

        .chart-pill-btn:hover:not(.active) {
            color: var(--color-black);
            background: rgba(0, 0, 0, 0.08);
        }

        /* Custom Mini-Calendar Component Styles */
        .custom-cal-title {
            font-family: var(--font-title);
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--color-black);
        }

        .custom-cal-nav-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--color-grey-black);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 50%;
            transition: background 0.2s ease;
        }

        .custom-cal-nav-btn:hover {
            background: rgba(0, 0, 0, 0.08);
            color: var(--color-pearl-ruby);
        }

        .custom-cal-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            text-align: center;
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--color-grey-black);
            margin-bottom: 6px;
        }

        .custom-cal-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }

        .custom-cal-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 500;
            border-radius: 8px;
            cursor: pointer;
            user-select: none;
            transition: all 0.15s ease;
            color: var(--color-black);
            background-color: rgba(0, 0, 0, 0.03);
        }

        .custom-cal-day.disabled {
            color: #ccc;
            background-color: transparent;
            cursor: default;
            pointer-events: none;
        }

        .custom-cal-day:hover:not(.disabled) {
            background-color: rgba(114, 20, 34, 0.15);
            color: var(--color-pearl-ruby);
        }

        .custom-cal-day.selected-start, .custom-cal-day.selected-end {
            background-color: var(--color-pearl-ruby) !important;
            color: var(--color-white-cream) !important;
            font-weight: 700;
            border-radius: 8px;
        }

        .custom-cal-day.in-range {
            background-color: rgba(114, 20, 34, 0.18);
            color: var(--color-pearl-ruby);
            border-radius: 4px;
        }

        .custom-select-date {
            background-color: var(--color-white-cream);
            color: var(--color-black);
            border: 1px solid rgba(0, 0, 0, 0.15);
            border-radius: 12px;
            padding: 5px 10px;
            font-family: var(--font-body);
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease;
        }

        .custom-select-date:hover, .custom-select-date:focus {
            border-color: var(--color-pearl-ruby);
            box-shadow: 0 0 0 3px rgba(114, 20, 34, 0.12);
        }

        /* Persistent Inline Custom Date Range Bar */
        .custom-date-bar {
            position: relative;
            margin-top: 14px;
            padding: 12px 20px;
            background-color: var(--color-white-cream);
            border-radius: 20px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }

        .custom-date-title-desktop {
            font-weight: 700;
            font-size: 0.88rem;
            color: var(--color-black);
            white-space: nowrap;
        }

        .custom-date-mobile-header {
            display: none;
        }

        .custom-date-bar-inputs {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .date-input-field {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .date-field-prefix {
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--color-grey-black);
        }

        .date-picker-trigger-btn {
            background-color: #ffffff;
            color: var(--color-black);
            border: 1px solid rgba(0, 0, 0, 0.15);
            border-radius: 20px;
            padding: 6px 14px;
            font-family: var(--font-body);
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        }

        .date-picker-trigger-btn:hover, .date-picker-trigger-btn.active {
            border-color: var(--color-pearl-ruby);
            box-shadow: 0 0 0 3px rgba(114, 20, 34, 0.12);
        }

        .date-trigger-icon {
            font-size: 18px;
            color: var(--color-pearl-ruby);
        }

        .custom-date-close-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            color: var(--color-grey-black);
            cursor: pointer;
            display: flex;
            align-items: center;
            padding: 4px;
            border-radius: 50%;
            transition: background 0.2s ease;
        }

        .custom-date-close-btn:hover {
            background: rgba(0, 0, 0, 0.06);
            color: var(--color-pearl-ruby);
        }

        .cal-modal-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            background-color: var(--color-white-cream);
            border-radius: 20px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
            padding: 18px;
            width: 320px;
            box-sizing: border-box;
        }

        .cal-modal-overlay {
            display: none;
        }

        .date-picker-trigger-btn {
            background-color: #ffffff;
            color: var(--color-black);
            border: 1px solid rgba(0, 0, 0, 0.15);
            border-radius: 20px;
            padding: 6px 14px;
            font-family: var(--font-body);
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        }

        .date-picker-trigger-btn:hover, .date-picker-trigger-btn.active {
            border-color: var(--color-pearl-ruby);
            box-shadow: 0 0 0 3px rgba(114, 20, 34, 0.12);
        }

        .date-trigger-icon {
            font-size: 18px;
            color: var(--color-pearl-ruby);
        }

        .cal-modal-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
            z-index: 200;
            background-color: var(--color-white-cream);
            border-radius: 20px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
            padding: 18px;
            width: 320px;
            box-sizing: border-box;
        }

        #chart-scroll-wrapper {
            transition: opacity 0.3s ease, filter 0.3s ease;
        }

        #chart-scroll-wrapper.dimmed {
            opacity: 0.25;
            filter: blur(1px);
            pointer-events: none;
        }

        .chart-wrapper {
            position: relative;
            width: 100%;
            height: 360px;
            background-color: var(--color-white-cream);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.06);
            box-sizing: border-box;
        }

        /* Insights Grid */
        .stats-insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 24px;
            margin-bottom: 20px;
        }

        .stats-insight-column {
            background-color: var(--color-white-cream);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.06);
        }

        /* Ranked List Items */
        .rank-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .rank-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 10px 12px;
            background: var(--color-cream);
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.06);
            cursor: default;
        }

        .rank-badge {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.08);
            color: var(--color-black);
            font-family: var(--font-title);
            font-size: 0.85rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .rank-badge.top-1 {
            background: var(--color-pearl-ruby);
            color: var(--color-white-cream);
        }

        .rank-badge.top-2 {
            background: rgba(114, 20, 34, 0.7);
            color: var(--color-white-cream);
        }

        .rank-badge.top-3 {
            background: rgba(114, 20, 34, 0.45);
            color: var(--color-white-cream);
        }

        .rank-card-img {
            width: 38px;
            height: 52px;
            object-fit: contain;
            border-radius: 6px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            flex-shrink: 0;
            background: #fff;
        }

        .rank-info {
            flex: 1;
            min-width: 0;
        }

        .rank-name {
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--color-black);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .rank-subtext {
            font-size: 0.78rem;
            color: var(--color-grey-black);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .rank-count {
            font-family: var(--font-title);
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--color-pearl-ruby);
            flex-shrink: 0;
        }

        /* Progress Bar Item for Decks */
        .progress-rank-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 8px 0;
            cursor: default;
        }

        .progress-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.88rem;
        }

        .progress-item-name {
            color: var(--color-black);
            font-weight: 600;
        }

        .progress-item-val {
            font-weight: 700;
            color: var(--color-pearl-ruby);
            font-size: 0.82rem;
        }

        .progress-track {
            width: 100%;
            height: 8px;
            background: rgba(0, 0, 0, 0.08);
            border-radius: 4px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--color-pearl-ruby) 0%, #a42337 100%);
            border-radius: 4px;
            transition: width 0.6s ease-out;
        }

        /* Top Liked Hybrids Grid & Card Enhancements */
        .stats-spotlight-section .hybrid-card-item {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(0, 0, 0, 0.06);
            height: auto;
        }

        .stats-spotlight-section .hybrid-card-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18), 0 6px 14px rgba(0, 0, 0, 0.1);
        }

        .stats-spotlight-section .hybrid-card-img-link {
            height: auto;
            overflow: hidden;
        }

        .stats-spotlight-section .hybrid-card-img {
            height: auto;
            max-height: none;
            width: 100%;
            object-fit: contain;
        }

        @media (max-width: 960px) {
            .spotlight-grid-override {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }

        @media (max-width: 640px) {
            .stats-kpi-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }

            .stats-kpi-box {
                padding: 14px 14px;
                border-radius: 14px;
            }

            .kpi-value {
                font-size: 1.65rem;
            }

            .kpi-label {
                font-size: 0.7rem;
                letter-spacing: 0.5px;
            }

            .kpi-icon {
                padding: 5px;
                font-size: 18px;
            }

            .chart-controls-row {
                gap: 8px;
                margin-bottom: 16px;
            }

            .control-group-pills {
                max-width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
                flex-wrap: nowrap;
            }

            .control-group-pills::-webkit-scrollbar {
                display: none;
            }

            .chart-pill-btn {
                padding: 7px 13px;
                font-size: 0.78rem;
                white-space: nowrap;
            }

            .chart-pill-btn:active, .date-picker-trigger-btn:active {
                transform: scale(0.96);
            }

            .custom-date-bar {
                flex-direction: column !important;
                align-items: stretch !important;
                padding: 14px 16px !important;
                border-radius: 18px !important;
                gap: 12px !important;
            }

            .custom-date-title-desktop, .custom-date-close-desktop {
                display: none !important;
            }

            .custom-date-mobile-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                width: 100% !important;
            }

            .custom-date-bar-inputs {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 10px !important;
                width: 100% !important;
            }

            .date-input-field {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                width: 100% !important;
            }

            .date-field-prefix {
                width: 28px !important;
                font-size: 0.85rem !important;
                font-weight: 600 !important;
            }

            .date-picker-trigger-btn {
                flex: 1 !important;
                width: 100% !important;
                justify-content: space-between !important;
                padding: 8px 14px !important;
                font-size: 0.84rem !important;
                box-sizing: border-box !important;
            }

            .cal-modal-dropdown {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                z-index: 9999 !important;
                width: min(340px, 92vw) !important;
                padding: 20px !important;
                border-radius: 24px !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45) !important;
                border: 1px solid rgba(0, 0, 0, 0.15) !important;
            }

            .cal-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(0, 0, 0, 0.55);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 9998;
                transition: opacity 0.25s ease;
            }

            .custom-cal-days {
                gap: 3px;
            }

            .custom-cal-day {
                min-height: 38px;
                font-size: 0.88rem;
                font-weight: 600;
            }

            .custom-cal-nav-btn {
                padding: 8px;
            }

            .hybrid-show-card {
                padding: 20px 14px;
                border-radius: 18px;
            }

            .hybrid-title {
                font-size: 1.6rem;
            }

            .spotlight-grid-override {
                grid-template-columns: 1fr !important;
            }

            .stats-insights-grid {
                grid-template-columns: 1fr;
            }

            .chart-wrapper {
                height: 280px;
                padding: 12px;
            }
        }
    </style>
</head>

<body>
    <!-- Top Navigation Header (Matching show.blade.php) -->
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
        <!-- Main Cream Container Card (Matching .hybrid-show-card from show.blade.php) -->
        <div class="hybrid-show-card">
            <!-- Page Title -->
            <h1 class="hybrid-title">{{ $t['stats_title'] }}</h1>
            <p class="stats-subtitle-text">{{ $t['stats_subtitle'] }}</p>

            <!-- 1. KPI Metrics Grid -->
            <div class="stats-kpi-grid">
                <!-- Total Hybrids -->
                <div class="stats-kpi-box">
                    <div class="kpi-header">
                        <span class="kpi-label">{{ $t['total_hybrids'] }}</span>
                        <span class="material-symbols-rounded kpi-icon">layers</span>
                    </div>
                    <div class="kpi-value">{{ number_format($totalHybrids, 0, '.', ' ') }}</div>
                    <div class="kpi-subtext">{{ $activeDays }} {{ ($lang === 'en') ? 'active days recorded' : 'jours d\'activité enregistrés' }}</div>
                </div>

                <!-- Daily Average -->
                <div class="stats-kpi-box">
                    <div class="kpi-header">
                        <span class="kpi-label">{{ $t['daily_avg'] }}</span>
                        <span class="material-symbols-rounded kpi-icon">analytics</span>
                    </div>
                    <div class="kpi-value">{{ $dailyAvg }}</div>
                    <div class="kpi-subtext">{{ ($lang === 'en') ? 'Hybrids per active day' : 'Hybrides par jour d\'exposition' }}</div>
                </div>

                <!-- Peak Day -->
                <div class="stats-kpi-box">
                    <div class="kpi-header">
                        <span class="kpi-label">{{ $t['daily_max'] }}</span>
                        <span class="material-symbols-rounded kpi-icon">trending_up</span>
                    </div>
                    <div class="kpi-value">{{ $maxDailyCount }}</div>
                    <div class="kpi-subtext">
                        @if($maxDailyDate)
                            @php
                                $maxDateObj = \Carbon\Carbon::parse($maxDailyDate);
                                $formattedMaxDate = ($lang === 'en') ? $maxDateObj->format('M d, Y') : $maxDateObj->format('d/m/Y');
                            @endphp
                            {{ ($lang === 'en') ? 'Record set on' : 'Record du' }} {{ $formattedMaxDate }}
                        @else
                            —
                        @endif
                    </div>
                </div>

                <!-- Total Likes -->
                <div class="stats-kpi-box">
                    <div class="kpi-header">
                        <span class="kpi-label">{{ $t['total_likes'] }}</span>
                        <span class="material-symbols-rounded kpi-icon">favorite</span>
                    </div>
                    <div class="kpi-value">{{ number_format($totalLikes, 0, '.', ' ') }}</div>
                    <div class="kpi-subtext">{{ ($lang === 'en') ? 'Community favorites' : 'Mentions J\'aime attribuées' }}</div>
                </div>
            </div>

            <hr class="section-divider">

            <!-- 2. Interactive Chart Section -->
            <div class="stats-chart-section">
                <h2 class="section-title">{{ $t['chart_title'] }}</h2>

                <div class="chart-controls-row">
                    <!-- Grouping Mode (Day vs Week vs Month) -->
                    <div class="control-group-pills">
                        <button type="button" id="btn-mode-day" class="chart-pill-btn active">{{ $t['by_day'] }}</button>
                        <button type="button" id="btn-mode-week" class="chart-pill-btn">{{ $t['by_week'] }}</button>
                        <button type="button" id="btn-mode-month" class="chart-pill-btn">{{ $t['by_month'] }}</button>
                    </div>

                    <!-- Chart Type Selector (Line vs Bar) -->
                    <div class="control-group-pills">
                        <button type="button" id="btn-type-line" class="chart-pill-btn active" title="{{ $t['line_chart'] }}">
                            <span class="material-symbols-rounded" style="font-size: 18px; vertical-align: middle;">show_chart</span>
                            <span>{{ $t['line_chart'] }}</span>
                        </button>
                        <button type="button" id="btn-type-bar" class="chart-pill-btn" title="{{ $t['bar_chart'] }}">
                            <span class="material-symbols-rounded" style="font-size: 18px; vertical-align: middle;">bar_chart</span>
                            <span>{{ $t['bar_chart'] }}</span>
                        </button>
                    </div>

                    <!-- Range Filter (All, 90d, 30d, 7d, Custom) -->
                    <div class="control-group-pills">
                        <button type="button" id="btn-range-all" class="chart-pill-btn active">{{ $t['all_time'] }}</button>
                        <button type="button" id="btn-range-90" class="chart-pill-btn">90d</button>
                        <button type="button" id="btn-range-30" class="chart-pill-btn">30d</button>
                        <button type="button" id="btn-range-7" class="chart-pill-btn">7d</button>
                        <button type="button" id="btn-range-custom" class="chart-pill-btn" title="{{ $t['custom_range'] }}">
                            <span class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle;">calendar_month</span>
                            <span>{{ $t['custom_range'] }}</span>
                        </button>
                    </div>
                </div>

                <!-- Persistent Custom Date Range Bar with Embedded Trigger Buttons & Dropdown Calendar -->
                <div id="custom-date-popover" class="custom-date-bar" style="display: none;">
                    <!-- Mobile Top Header Row -->
                    <div class="custom-date-mobile-header">
                        <span class="custom-date-bar-title">{{ $t['custom_range'] }} :</span>
                        <button type="button" class="btn-close-custom-date custom-date-close-btn" title="Fermer">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>

                    <!-- Desktop Title (Far Left) -->
                    <span class="custom-date-title-desktop">{{ $t['custom_range'] }} :</span>

                    <!-- Inputs Group (Middle) -->
                    <div class="custom-date-bar-inputs">
                        <div class="date-input-field">
                            <span class="date-field-prefix">{{ $t['from'] }}</span>
                            <button type="button" id="btn-pick-start-date" class="date-picker-trigger-btn">
                                <span id="label-start-date">--</span>
                                <span class="material-symbols-rounded date-trigger-icon">calendar_month</span>
                            </button>
                        </div>

                        <div class="date-input-field">
                            <span class="date-field-prefix">{{ $t['to'] }}</span>
                            <button type="button" id="btn-pick-end-date" class="date-picker-trigger-btn">
                                <span id="label-end-date">--</span>
                                <span class="material-symbols-rounded date-trigger-icon">calendar_month</span>
                            </button>
                        </div>
                    </div>

                    <!-- Desktop Close Button (Far Right End) -->
                    <button type="button" class="btn-close-custom-date custom-date-close-btn custom-date-close-desktop" title="Fermer">
                        <span class="material-symbols-rounded">close</span>
                    </button>

                    <!-- Dropdown / Modal Mini-Calendar Grid -->
                    <div id="cal-modal-dropdown" class="cal-modal-dropdown" style="display: none;">
                        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 8px; margin-bottom: 10px;">
                            <button type="button" id="cal-prev-month" class="custom-cal-nav-btn" title="Mois précédent">
                                <span class="material-symbols-rounded">chevron_left</span>
                            </button>
                            <span id="cal-month-year-label" class="custom-cal-title"></span>
                            <button type="button" id="cal-next-month" class="custom-cal-nav-btn" title="Mois suivant">
                                <span class="material-symbols-rounded">chevron_right</span>
                            </button>
                        </div>

                        <div class="custom-cal-weekdays">
                            <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                        </div>

                        <div id="custom-cal-days-grid" class="custom-cal-days"></div>
                    </div>
                </div>

                <!-- Full-Screen Mobile Modal Dark Blur Overlay -->
                <div id="cal-modal-overlay" class="cal-modal-overlay" style="display: none;"></div>

                <!-- Chart Canvas Container with Touch-Friendly Horizontal Scroll for 100+ Days -->
                <div id="chart-scroll-wrapper" style="overflow-x: auto; width: 100%; border-radius: 16px; -webkit-overflow-scrolling: touch; scroll-behavior: smooth;">
                    <div id="chart-canvas-container" style="position: relative; width: 100%; height: 360px; min-width: 100%; background-color: var(--color-white-cream); border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04); border: 1px solid rgba(0, 0, 0, 0.06); box-sizing: border-box;">
                        <canvas id="hybridsChart"></canvas>
                    </div>
                </div>
            </div>

            <hr class="section-divider">

            <!-- 3. Insights Grid (Top Base Cards & Decks) -->
            <div class="stats-insights-grid">
                <!-- Top 5 Base Cards -->
                <div class="stats-insight-column">
                    <h2 class="section-title" style="font-size: 1.3rem; text-align: left; margin-bottom: 20px;">{{ $t['top_base_cards'] }}</h2>
                    <ul class="rank-list">
                        @forelse($topBaseCards as $index => $card)
                            @php
                                $cardImg = $card->img_src 
                                    ? (preg_match('/^https?:\/\//', $card->img_src) ? $card->img_src : asset('storage/' . ltrim($card->img_src, '/'))) 
                                    : null;
                                $cardName = getLocalizedCardName($card, $lang);
                                $gameName = ($lang === 'en' && !empty($card->game->name_en)) ? $card->game->name_en : ($card->game->name ?? '');
                            @endphp
                            <li class="rank-item">
                                <span class="rank-badge top-{{ $index + 1 }}">{{ $index + 1 }}</span>
                                @if($cardImg)
                                    <img src="{{ $cardImg }}" alt="{{ $cardName }}" class="rank-card-img" onerror="this.style.display='none';">
                                @endif
                                <div class="rank-info">
                                    <div class="rank-name">{{ $cardName }}</div>
                                    <div class="rank-subtext">{{ $gameName }}</div>
                                </div>
                                <div class="rank-count">{{ $card->base_count }}×</div>
                            </li>
                        @empty
                            <li style="color: var(--color-grey-black); font-size: 0.85rem;">Aucune donnée</li>
                        @endforelse
                    </ul>
                </div>

                <!-- Top 5 Historical Decks / Games -->
                <div class="stats-insight-column">
                    <h2 class="section-title" style="font-size: 1.3rem; text-align: left; margin-bottom: 20px;">{{ $t['top_games'] }}</h2>
                    @php
                        $maxDeckUsage = $topGames->max('usage_count') ?: 1;
                    @endphp
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        @forelse($topGames as $index => $game)
                            @php
                                $gameTitle = ($lang === 'en' && !empty($game->name_en)) ? $game->name_en : $game->name;
                                $percent = round(($game->usage_count / $maxDeckUsage) * 100);
                            @endphp
                            <div class="progress-rank-item">
                                <div class="progress-item-header">
                                    <span class="progress-item-name">#{{ $index + 1 }} {{ $gameTitle }}</span>
                                    <span class="progress-item-val">{{ $game->usage_count }} {{ $t['times_used'] }}</span>
                                </div>
                                <div class="progress-track">
                                    <div class="progress-fill" style="--w: {{ $percent }}%; width: var(--w);"></div>
                                </div>
                            </div>
                        @empty
                            <div style="color: var(--color-grey-black); font-size: 0.85rem;">Aucune donnée</div>
                        @endforelse
                    </div>
                </div>
            </div>

            <!-- 4. Top Liked Hybrids Spotlight (EXACT Index Card Items Grid) -->
            @if($topLikedHybrids->isNotEmpty())
                <hr class="section-divider">

                <div class="stats-spotlight-section">
                    <h2 class="section-title">{{ $t['top_liked_hybrids'] }}</h2>

                    <div class="hybrids-grid spotlight-grid-override" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 0;">
                        @foreach ($topLikedHybrids as $hybrid)
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
                </div>
            @endif
        </div>
    </main>

    <!-- Server-rendered JSON Data for Charts and Filters -->
    <script id="stats-data" type="application/json">
    {
        "dailyRawData": @json($dailyChartData),
        "weeklyRawData": @json($weeklyChartData),
        "monthlyRawData": @json($monthlyChartData),
        "minDateStr": @json($minDate),
        "maxDateStr": @json($maxDate),
        "appLang": @json($lang)
    }
    </script>

    <!-- Interactive Logic & Chart Script -->
    <script>
        const statsData = JSON.parse(document.getElementById('stats-data').textContent);
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

        // Like button functionality on spotlight hybrids (matching index view)
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

        // Chart Logic
        const dailyRawData = statsData.dailyRawData;
        const weeklyRawData = statsData.weeklyRawData;
        const monthlyRawData = statsData.monthlyRawData;

        let currentMode = 'day'; // 'day', 'week', or 'month'
        let currentRange = 'all'; // 'all', '90', '30', '7'
        let userSelectedType = null; // null (auto mode: line for day, bar for week/month) or 'line'/'bar'
        let chartInstance = null;

        const ctx = document.getElementById('hybridsChart').getContext('2d');
        const canvasContainer = document.getElementById('chart-canvas-container');
        const scrollWrapper = document.getElementById('chart-scroll-wrapper');

        function getActiveChartType() {
            if (userSelectedType) {
                return userSelectedType;
            }
            // Smart default: Line chart for Daily view, Bar chart for Weekly and Monthly views
            return (currentMode === 'day') ? 'line' : 'bar';
        }

        function syncChartTypePills(activeType) {
            document.getElementById('btn-type-line').classList.toggle('active', activeType === 'line');
            document.getElementById('btn-type-bar').classList.toggle('active', activeType === 'bar');
        }

        // Custom Mini-Calendar Component State & Logic
        const minDateStr = statsData.minDateStr;
        const maxDateStr = statsData.maxDateStr;
        const appLang = statsData.appLang;

        let calViewDate = new Date(minDateStr);
        let selectedStartDate = minDateStr;
        let selectedEndDate = maxDateStr;
        let pickingTarget = 'start'; // 'start' or 'end'

        const monthNamesFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthsFrShort = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
        const monthsEnShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        function formatShortDateDisplay(isoStr) {
            if (!isoStr) return '--';
            const dateObj = new Date(isoStr + 'T00:00:00');
            const day = dateObj.getDate();
            const month = dateObj.getMonth();
            const year = dateObj.getFullYear();

            if (appLang === 'en') {
                return `${monthsEnShort[month]} ${day}, ${year}`;
            }
            return `${day} ${monthsFrShort[month]} ${year}`;
        }

        function syncDateTriggerLabels() {
            const startLabelElem = document.getElementById('label-start-date');
            const endLabelElem = document.getElementById('label-end-date');
            if (startLabelElem) startLabelElem.textContent = formatShortDateDisplay(selectedStartDate);
            if (endLabelElem) endLabelElem.textContent = formatShortDateDisplay(selectedEndDate);
        }

        function renderCalendarGrid() {
            const year = calViewDate.getFullYear();
            const month = calViewDate.getMonth();

            const monthLabel = (appLang === 'en') ? monthNamesEn[month] + ' ' + year : monthNamesFr[month] + ' ' + year;
            const labelElem = document.getElementById('cal-month-year-label');
            if (labelElem) labelElem.textContent = monthLabel;

            const daysGrid = document.getElementById('custom-cal-days-grid');
            if (!daysGrid) return;
            daysGrid.innerHTML = '';

            const firstDayObj = new Date(year, month, 1);
            const firstDayIndex = firstDayObj.getDay(); // 0 is Sunday
            const startOffset = (firstDayIndex === 0) ? 6 : firstDayIndex - 1; // Monday first

            const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

            // Blank offset cells
            for (let i = 0; i < startOffset; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'custom-cal-day disabled';
                daysGrid.appendChild(emptyCell);
            }

            // Day cells
            for (let d = 1; d <= totalDaysInMonth; d++) {
                const dayCell = document.createElement('div');
                const dayStr = String(d).padStart(2, '0');
                const monthStr = String(month + 1).padStart(2, '0');
                const fullDateStr = `${year}-${monthStr}-${dayStr}`;

                dayCell.textContent = d;
                dayCell.className = 'custom-cal-day';

                if (fullDateStr < minDateStr || fullDateStr > maxDateStr) {
                    dayCell.classList.add('disabled');
                } else {
                    if (fullDateStr === selectedStartDate) {
                        dayCell.classList.add('selected-start');
                    }
                    if (fullDateStr === selectedEndDate) {
                        dayCell.classList.add('selected-end');
                    }
                    if (selectedStartDate && selectedEndDate && fullDateStr > selectedStartDate && fullDateStr < selectedEndDate) {
                        dayCell.classList.add('in-range');
                    }

                    dayCell.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (pickingTarget === 'start') {
                            selectedStartDate = fullDateStr;
                            if (selectedStartDate > selectedEndDate) {
                                selectedEndDate = selectedStartDate;
                            }
                        } else {
                            selectedEndDate = fullDateStr;
                            if (selectedEndDate < selectedStartDate) {
                                selectedStartDate = selectedEndDate;
                            }
                        }
                        syncDateTriggerLabels();
                        renderCalendarGrid();
                        closeCalDropdown();
                        updateChart();
                    });
                }

                daysGrid.appendChild(dayCell);
            }
            syncDateTriggerLabels();
        }

        document.getElementById('cal-prev-month').addEventListener('click', (e) => {
            e.stopPropagation();
            calViewDate.setMonth(calViewDate.getMonth() - 1);
            renderCalendarGrid();
        });

        document.getElementById('cal-next-month').addEventListener('click', (e) => {
            e.stopPropagation();
            calViewDate.setMonth(calViewDate.getMonth() + 1);
            renderCalendarGrid();
        });

        function getFilteredData() {
            let source = [];
            if (currentMode === 'day') {
                source = [...dailyRawData];
            } else if (currentMode === 'week') {
                source = [...weeklyRawData];
            } else {
                source = [...monthlyRawData];
            }

            if (currentRange === 'custom') {
                const startVal = selectedStartDate || minDateStr;
                const endVal = selectedEndDate || selectedStartDate || maxDateStr;
                if (startVal && endVal) {
                    source = source.filter(item => {
                        const itemStart = item.start_date || item.date;
                        const itemEnd = item.end_date || item.date;
                        return (itemStart <= endVal && itemEnd >= startVal);
                    });
                }
                return source;
            }
            
            if (currentRange === '7') {
                source = source.slice(-7);
            } else if (currentRange === '30') {
                source = source.slice(-30);
            } else if (currentRange === '90') {
                source = source.slice(-90);
            }
            return source;
        }

        function updateChart() {
            const dataItems = getFilteredData();
            const labels = dataItems.map(item => item.label);
            const values = dataItems.map(item => item.count);

            const activeType = getActiveChartType();
            syncChartTypePills(activeType);

            // Dynamic width scaling when data items > 20 to ensure points/bars stay wide and readable
            if (dataItems.length > 20) {
                const calculatedWidth = dataItems.length * 36;
                canvasContainer.style.width = calculatedWidth + 'px';
            } else {
                canvasContainer.style.width = '100%';
            }

            if (chartInstance) {
                chartInstance.destroy();
            }

            const isLine = (activeType === 'line');

            chartInstance = new Chart(ctx, {
                type: isLine ? 'line' : 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: "{{ $t['hybrids_generated'] }}",
                        data: values,
                        _rawItems: dataItems,
                        backgroundColor: isLine ? 'rgba(114, 20, 34, 0.12)' : '#721422',
                        borderColor: '#721422',
                        borderWidth: isLine ? 3 : 1,
                        pointBackgroundColor: '#721422',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: isLine ? 2 : 0,
                        pointRadius: isLine ? 4.5 : 0,
                        pointHoverRadius: isLine ? 7.5 : 0,
                        pointHoverBackgroundColor: '#a42337',
                        tension: 0.35,
                        fill: isLine ? true : false,
                        borderRadius: isLine ? 0 : 6,
                        hoverBackgroundColor: isLine ? undefined : '#a42337',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    hover: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#000000',
                            titleColor: '#fefbf5',
                            bodyColor: '#fefbf5',
                            titleFont: { family: 'Libre Franklin', size: 13, weight: 'bold' },
                            bodyFont: { family: 'Libre Franklin', size: 12 },
                            padding: 10,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                title: function(tooltipItems) {
                                    const item = dataItems[tooltipItems[0].dataIndex];
                                    return item ? (item.range || item.label) : '';
                                },
                                label: function(context) {
                                    return context.parsed.y + " " + "{{ $t['hybrids_generated'] }}";
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { color: 'var(--color-grey-black)', font: { family: 'Libre Franklin', size: 11 } }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.06)' },
                            ticks: { color: 'var(--color-grey-black)', font: { family: 'Libre Franklin', size: 11 }, precision: 0 }
                        }
                    }
                }
            });

            setTimeout(() => {
                scrollWrapper.scrollLeft = scrollWrapper.scrollWidth;
            }, 50);
        }

        // Mode Pill Buttons
        document.getElementById('btn-mode-day').addEventListener('click', function() {
            currentMode = 'day';
            userSelectedType = null;
            setActiveModeBtn(this);
            updateChart();
        });

        document.getElementById('btn-mode-week').addEventListener('click', function() {
            currentMode = 'week';
            userSelectedType = null;
            setActiveModeBtn(this);
            updateChart();
        });

        document.getElementById('btn-mode-month').addEventListener('click', function() {
            currentMode = 'month';
            userSelectedType = null;
            setActiveModeBtn(this);
            updateChart();
        });

        function setActiveModeBtn(btn) {
            document.getElementById('btn-mode-day').classList.remove('active');
            document.getElementById('btn-mode-week').classList.remove('active');
            document.getElementById('btn-mode-month').classList.remove('active');
            btn.classList.add('active');
        }

        // Chart Type Pill Buttons
        document.getElementById('btn-type-line').addEventListener('click', function() {
            userSelectedType = 'line';
            updateChart();
        });

        document.getElementById('btn-type-bar').addEventListener('click', function() {
            userSelectedType = 'bar';
            updateChart();
        });

        // Custom Date Range Popover & Modal Navigation Helpers
        function openCalDropdown(target) {
            pickingTarget = target;
            const btnPickStartDate = document.getElementById('btn-pick-start-date');
            const btnPickEndDate = document.getElementById('btn-pick-end-date');
            const calModalDropdown = document.getElementById('cal-modal-dropdown');
            const calModalOverlay = document.getElementById('cal-modal-overlay');

            if (target === 'start') {
                btnPickStartDate.classList.add('active');
                btnPickEndDate.classList.remove('active');
                if (selectedStartDate) calViewDate = new Date(selectedStartDate + 'T00:00:00');
            } else {
                btnPickEndDate.classList.add('active');
                btnPickStartDate.classList.remove('active');
                if (selectedEndDate) calViewDate = new Date(selectedEndDate + 'T00:00:00');
            }
            renderCalendarGrid();
            if (calModalDropdown) calModalDropdown.style.display = 'block';
            if (calModalOverlay) calModalOverlay.style.display = 'block';
            if (scrollWrapper) scrollWrapper.classList.add('dimmed');

            if (window.innerWidth <= 640) {
                document.body.style.overflow = 'hidden';
            }
        }

        function closeCalDropdown() {
            const btnPickStartDate = document.getElementById('btn-pick-start-date');
            const btnPickEndDate = document.getElementById('btn-pick-end-date');
            const calModalDropdown = document.getElementById('cal-modal-dropdown');
            const calModalOverlay = document.getElementById('cal-modal-overlay');

            if (calModalDropdown) calModalDropdown.style.display = 'none';
            if (calModalOverlay) calModalOverlay.style.display = 'none';
            if (btnPickStartDate) btnPickStartDate.classList.remove('active');
            if (btnPickEndDate) btnPickEndDate.classList.remove('active');
            if (scrollWrapper) scrollWrapper.classList.remove('dimmed');
            document.body.style.overflow = '';
        }

        const customDatePopover = document.getElementById('custom-date-popover');
        const customRangePill = document.getElementById('btn-range-custom');
        const btnPickStartDate = document.getElementById('btn-pick-start-date');
        const btnPickEndDate = document.getElementById('btn-pick-end-date');
        const calModalDropdown = document.getElementById('cal-modal-dropdown');
        const calModalOverlay = document.getElementById('cal-modal-overlay');

        btnPickStartDate.addEventListener('click', function(e) {
            e.stopPropagation();
            if (calModalDropdown.style.display !== 'none' && pickingTarget === 'start') {
                closeCalDropdown();
            } else {
                openCalDropdown('start');
            }
        });

        btnPickEndDate.addEventListener('click', function(e) {
            e.stopPropagation();
            if (calModalDropdown.style.display !== 'none' && pickingTarget === 'end') {
                closeCalDropdown();
            } else {
                openCalDropdown('end');
            }
        });

        if (calModalOverlay) {
            calModalOverlay.addEventListener('click', function() {
                closeCalDropdown();
            });
        }

        document.addEventListener('click', function(e) {
            if (calModalDropdown && !calModalDropdown.contains(e.target) && e.target !== btnPickStartDate && e.target !== btnPickEndDate) {
                closeCalDropdown();
            }
        });

        customRangePill.addEventListener('click', function() {
            const isVisible = customDatePopover.style.display !== 'none';
            if (isVisible && currentRange === 'custom') {
                customDatePopover.style.display = 'none';
                closeCalDropdown();
                currentRange = 'all';
                setActiveRangeBtn(document.getElementById('btn-range-all'));
            } else {
                customDatePopover.style.display = 'flex';
                currentRange = 'custom';
                setActiveRangeBtn(customRangePill);
                syncDateTriggerLabels();
            }
            updateChart();
        });

        document.querySelectorAll('.btn-close-custom-date').forEach(btn => {
            btn.addEventListener('click', function() {
                customDatePopover.style.display = 'none';
                closeCalDropdown();
                currentRange = 'all';
                setActiveRangeBtn(document.getElementById('btn-range-all'));
                updateChart();
            });
        });

        // Range Pill Buttons
        document.getElementById('btn-range-all').addEventListener('click', function() {
            currentRange = 'all';
            setActiveRangeBtn(this);
            updateChart();
        });

        document.getElementById('btn-range-90').addEventListener('click', function() {
            currentRange = '90';
            setActiveRangeBtn(this);
            updateChart();
        });

        document.getElementById('btn-range-30').addEventListener('click', function() {
            currentRange = '30';
            setActiveRangeBtn(this);
            updateChart();
        });

        document.getElementById('btn-range-7').addEventListener('click', function() {
            currentRange = '7';
            setActiveRangeBtn(this);
            updateChart();
        });

        function clearRangePills() {
            document.getElementById('btn-range-all').classList.remove('active');
            document.getElementById('btn-range-90').classList.remove('active');
            document.getElementById('btn-range-30').classList.remove('active');
            document.getElementById('btn-range-7').classList.remove('active');
            customRangePill.classList.remove('active');
        }

        function setActiveRangeBtn(btn) {
            clearRangePills();
            btn.classList.add('active');
            if (btn !== customRangePill) {
                customDatePopover.style.display = 'none';
            }
        }

        // Initialize Chart
        document.addEventListener('DOMContentLoaded', () => {
            updateChart();
        });
    </script>
</body>

</html>
