<?php

use Illuminate\Support\Facades\Route;
use App\Models\Hybrid;

if (!function_exists('getAppLocale')) {
    function getAppLocale() {
        if (request()->has('lang')) {
            $lang = in_array(request('lang'), ['fr', 'en']) ? request('lang') : 'fr';
            session(['locale' => $lang]);
            return $lang;
        }
        return session('locale', 'fr');
    }
}

if (!function_exists('getTranslations')) {
    function getTranslations($lang) {
        $authors = [
            [
                'name' => 'Luca Correia da Rocha',
                'url'  => 'https://links.luca-cdrocha.ch/', // Modify link here
            ],
            [
                'name' => 'Vincent Paley',
                'url'  => 'https://www.instagram.com/noctoplasma/', // Modify link here
            ],
        ];

        $exhibitionUrl = 'https://museedujeu.ch/exposition/cartes-a-jouer/';
        $museumUrl = 'https://museedujeu.ch/';
        $headUrl = 'https://www.hesge.ch/head/';

        if ($lang === 'en') {
            return [
                'hybrids' => 'Hybrids',
                'gallery' => 'Gallery',
                'project_name' => 'Hybrids Gallery',
                'explore' => 'Explore all generated hybrid cards',
                'cards_used' => 'CARDS USED:',
                'of' => 'of',
                'previous' => '‹ Previous',
                'next' => 'Next ›',
                'language' => 'Language',
                'sort_by' => 'Sort by',
                'most_recent' => 'Most recent',
                'oldest' => 'Oldest',
                'most_liked' => 'Most liked',
                'filter_by_date' => 'Filter by date',
                'apply' => 'Apply',
                'reset' => 'Reset',
                'no_hybrids' => 'No hybrids found matching your criteria.',
                'back_link' => 'Back to all Hybrids',
                'share' => 'Share',
                'download' => 'Download image',
                'source_cards' => 'Source cards',
                'base_card' => '★ BASE CARD',
                'share_title' => 'Share this Hybrid',
                'share_subtext' => 'Scan the QR Code or choose a share option below.',
                'copy' => 'Copy link',
                'copied' => 'Copied !',
                'about' => 'About',
                'about_title' => 'Hybrids Gallery',
                'about_subtitle' => 'Exhibition Project at the Swiss Museum of Games',
                'about_description' => 'Hybrids is an interactive installation and digital gallery allowing visitors to generate and explore unique playing cards by combining their visual elements.',
                'authors_title' => 'Project Authors',
                'authors' => $authors,
                'exhibition_section_title' => 'Exhibition',
                'exhibition_name' => 'Cartes à jouer — Des origines aux cartes à collectionner',
                'exhibition_title' => 'Cartes à jouer',
                'exhibition_subtitle' => 'Des origines aux cartes à collectionner',
                'exhibition_url' => $exhibitionUrl,
                'partners_section_title' => 'Partners',
                'museum_name' => 'Musée suisse du jeu',
                'museum_short_name' => 'Musée suisse du jeu',
                'museum_location' => '(Tour-de-Peilz)',
                'museum_url' => $museumUrl,
                'head_name' => 'HEAD – Genève',
                'head_short_name' => 'HEAD – Genève',
                'head_subtext' => '(Master Media Design, HES-SO)',
                'head_url' => $headUrl,
                'share_socials' => 'Share on Socials',
                'share_via_app' => 'Share via app...',
                'share_whatsapp' => 'Share on WhatsApp',
                'share_telegram' => 'Share on Telegram',
                'share_message_prefix' => 'Check out this hybrid playing card created at the Swiss Museum of Games exhibition (Hybrids x HEAD Genève):',
                'exhibition_context_title' => 'Exhibition Context',
                'exhibition_context_text' => 'Generated during the exhibition « Cartes à jouer — Des origines aux cartes à collectionner » at the Swiss Museum of Games (Tour-de-Peilz) in collaboration with the Master Media Design program at HEAD – Genève.',
            ];
        }

        return [
            'hybrids' => 'Hybrids',
            'gallery' => 'Galerie',
            'project_name' => 'Hybrids Galerie',
            'explore' => 'Explorez toutes les cartes hybrides générées',
            'cards_used' => 'CARTES UTILISÉES :',
            'of' => 'sur',
            'previous' => '‹ Précédent',
            'next' => 'Suivant ›',
            'language' => 'Langue',
            'sort_by' => 'Trier par',
            'most_recent' => 'Plus récents',
            'oldest' => 'Plus anciens',
            'most_liked' => 'Plus aimés',
            'filter_by_date' => 'Filtrer par date',
            'apply' => 'Appliquer',
            'reset' => 'Réinitialiser',
            'no_hybrids' => 'Aucun hybrid trouvé pour vos critères.',
            'back_link' => 'Retour à tous les Hybrids',
            'share' => 'Partager',
            'download' => 'Télécharger l\'image',
            'source_cards' => 'Cartes sources',
            'base_card' => '★ CARTE DE BASE',
            'share_title' => 'Partager cet Hybrid',
            'share_subtext' => 'Scannez le QR Code ou choisissez une option de partage ci-dessous.',
            'copy' => 'Copier le lien',
            'copied' => 'Copié !',
            'about' => 'À propos',
            'about_title' => 'Hybrids Galerie',
            'about_subtitle' => 'Projet d\'exposition au Musée suisse du jeu',
            'about_description' => 'Hybrids est une installation et galerie interactive permettant aux visiteurs de générer et d\'explorer des cartes à jouer uniques en combinant leurs éléments visuels.',
            'authors_title' => 'Auteurs du projet',
            'authors' => $authors,
            'exhibition_section_title' => 'Exposition',
            'exhibition_name' => 'Cartes à jouer — Des origines aux cartes à collectionner',
            'exhibition_title' => 'Cartes à jouer',
            'exhibition_subtitle' => 'Des origines aux cartes à collectionner',
            'exhibition_url' => $exhibitionUrl,
            'partners_section_title' => 'Partenaires',
            'museum_name' => 'Musée suisse du jeu',
            'museum_short_name' => 'Musée suisse du jeu',
            'museum_location' => '(Tour-de-Peilz)',
            'museum_url' => $museumUrl,
            'head_name' => 'HEAD – Genève',
            'head_short_name' => 'HEAD – Genève',
            'head_subtext' => '(Master Media Design, HES-SO)',
            'head_url' => $headUrl,
            'share_socials' => 'Partager sur les réseaux',
            'share_via_app' => 'Partager via une application...',
            'share_whatsapp' => 'Partager sur WhatsApp',
            'share_telegram' => 'Partager sur Telegram',
            'share_message_prefix' => 'Regarde cette carte hybride créée lors de l\'exposition au Musée suisse du jeu (Hybrids x HEAD Genève) :',
            'exhibition_context_title' => 'Contexte d\'exposition',
            'exhibition_context_text' => 'Généré lors de l\'exposition « Cartes à jouer — Des origines aux cartes à collectionner » au Musée suisse du jeu (Tour-de-Peilz) en collaboration avec le Master Media Design de la HEAD – Genève.',
        ];
    }
}

if (!function_exists('getLocalizedCardName')) {
    function getLocalizedCardName($card, $lang = 'fr') {
        if ($lang !== 'en') {
            return is_object($card) ? $card->name : $card;
        }

        if (is_object($card)) {
            if (!empty($card->name_en)) {
                return $card->name_en;
            }
            $card = $card->name;
        }

        if (!$card) return '';

        $translations = [
            'Roi' => 'King',
            'Dame' => 'Queen',
            'Valet' => 'Jack',
            'Cavalier' => 'Knight',
            'As' => 'Ace',
            'Liberté' => 'Liberty',
            'Génie' => 'Genius',
            'Égalité' => 'Equality',
            'Fou' => 'Fool',
            'Bâton' => 'Batons',
            'Coupe' => 'Cups',
            'Denier' => 'Coins',
            'Épée' => 'Swords',
            'Atout' => 'Trumps',
            'Carreau' => 'Diamonds',
            'Cœur' => 'Hearts',
            'Pique' => 'Spades',
            'Trèfle' => 'Clubs',
            'Feuille' => 'Leaves',
            'Gland' => 'Acorns',
            'Grelot' => 'Bells',
            'Bouclier' => 'Shields',
        ];

        $translated = preg_replace('/\b(de|du|des)\b/u', 'of', $card);
        $translated = preg_replace('/\bd\'/u', 'of ', $translated);

        foreach ($translations as $fr => $en) {
            $translated = preg_replace('/\b' . preg_quote($fr, '/') . '\b/u', $en, $translated);
        }

        return $translated;
    }
}

if (!function_exists('getExpandedCards')) {
    function getExpandedCards($hybrid) {
        if (!$hybrid || !$hybrid->cards) return collect([]);
        
        $cardNames = explode(' + ', $hybrid->name);
        if (count($cardNames) < 2) {
            $result = $hybrid->cards;
        } else {
            $cardMap = [];
            foreach ($hybrid->cards as $c) {
                $cardMap[trim($c->name)] = $c;
            }

            $expanded = collect([]);
            $baseCardSeen = false;

            foreach ($cardNames as $name) {
                $trimmed = trim($name);
                if (isset($cardMap[$trimmed])) {
                    $cloned = clone $cardMap[$trimmed];
                    
                    if (isset($cloned->pivot)) {
                        if ($cloned->pivot->is_base) {
                            if ($baseCardSeen) {
                                $pivotClone = clone $cloned->pivot;
                                $pivotClone->is_base = 0;
                                $cloned->pivot = $pivotClone;
                            } else {
                                $baseCardSeen = true;
                            }
                        }
                    }

                    $expanded->push($cloned);
                }
            }
            $result = $expanded->isNotEmpty() ? $expanded : $hybrid->cards;
        }

        // Always position the Base Card in the CENTER (index 1) if there are 3 cards
        if ($result->count() === 3) {
            $baseIndex = null;
            foreach ($result->values() as $idx => $card) {
                if (isset($card->pivot) && $card->pivot->is_base) {
                    $baseIndex = $idx;
                    break;
                }
            }

            if ($baseIndex !== null && $baseIndex !== 1) {
                $items = $result->values()->all();
                $baseCard = array_splice($items, $baseIndex, 1)[0];
                array_splice($items, 1, 0, [$baseCard]);
                $result = collect($items);
            }
        }

        return $result;
    }
}


Route::get('/', function () {
    // 1. Language session persistence
    if (request()->has('lang')) {
        $lang = in_array(request('lang'), ['fr', 'en']) ? request('lang') : 'fr';
        session(['locale' => $lang]);
    } else {
        $lang = session('locale', 'fr');
    }

    // Handle reset_all
    if (request()->has('reset_all')) {
        session()->forget('sort');
        session()->forget('date');
        $sortBy = 'date';
        $filterDate = null;
    } else {
        // 2. Sort session persistence
        if (request()->has('sort')) {
            $sortBy = request('sort');
            session(['sort' => $sortBy]);
        } else {
            $sortBy = session('sort', 'date');
        }

        // 3. Date filter session persistence
        if (request()->has('reset_date')) {
            session()->forget('date');
            $filterDate = null;
        } elseif (request()->has('date')) {
            $filterDate = request('date');
            if ($filterDate) {
                session(['date' => $filterDate]);
            } else {
                session()->forget('date');
            }
        } else {
            $filterDate = session('date', null);
        }
    }

    $t = getTranslations($lang);

    $query = Hybrid::with('cards.game');

    if ($filterDate) {
        $query->whereDate('created_at', $filterDate);
    }

    switch ($sortBy) {
        case 'likes':
            $query->orderBy('nb_like', 'desc')->orderBy('created_at', 'desc');
            break;
        case 'date_asc':
        case 'oldest':
            $query->orderBy('created_at', 'asc');
            break;
        case 'date':
        case 'date_desc':
        default:
            $query->orderBy('created_at', 'desc');
            break;
    }

    $hybrids = $query->paginate(16)->onEachSide(1)->withQueryString();
    $totalHybrids = Hybrid::count();
    $totalLikes = Hybrid::sum('nb_like');

    return view('hybrids.index', compact('hybrids', 'sortBy', 'filterDate', 'totalHybrids', 'totalLikes', 'lang', 't'));
})->name('hybrids.index');

Route::get('/{id}', function ($id) {
    if (request()->has('lang')) {
        $lang = in_array(request('lang'), ['fr', 'en']) ? request('lang') : 'fr';
        session(['locale' => $lang]);
    } else {
        $lang = session('locale', 'fr');
    }

    $t = getTranslations($lang);
    $hybrid = Hybrid::with('cards.game')->find($id);

    if (!$hybrid) {
        abort(404, 'Hybrid not found');
    }

    return view('hybrids.show', compact('hybrid', 'lang', 't'));
})->name('hybrids.show');

Route::get('/{id}/download', function ($id) {
    $hybrid = Hybrid::find($id);

    if (!$hybrid || !$hybrid->img_src) {
        abort(404, 'Hybrid or image not found');
    }

    $dateStr = $hybrid->created_at ? $hybrid->created_at->format('Y-m-d') : now()->format('Y-m-d');

    // Check if the image is an external URL
    if (preg_match('/^https?:\/\//', $hybrid->img_src)) {
        $extension = pathinfo(parse_url($hybrid->img_src, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'png';
        $filename = $dateStr . '-hybrid-' . $hybrid->id . '.' . $extension;

        return response()->streamDownload(function () use ($hybrid) {
            echo file_get_contents($hybrid->img_src);
        }, $filename);
    }

    // For local images stored in storage
    $relativePath = ltrim($hybrid->img_src, '/');
    
    $possiblePaths = [
        storage_path('app/public/' . $relativePath),
        public_path('storage/' . $relativePath),
        base_path($relativePath),
    ];

    $imagePath = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path) && is_file($path)) {
            $imagePath = $path;
            break;
        }
    }

    if (!$imagePath) {
        abort(404, 'Image file not found.');
    }

    $extension = pathinfo($imagePath, PATHINFO_EXTENSION) ?: 'png';
    $filename = $dateStr . '-hybrid-' . $hybrid->id . '.' . $extension;

    return response()->download($imagePath, $filename);
})->name('hybrids.download');

Route::post('/{id}/like', [\App\Http\Controllers\Api\HybridController::class, 'like'])
    ->middleware('throttle:150,1')
    ->name('hybrids.like');

