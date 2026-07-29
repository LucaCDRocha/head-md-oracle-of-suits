<?php

use Illuminate\Support\Facades\Route;
use App\Models\Hybrid;

function getAppLocale() {
    if (request()->has('lang')) {
        $lang = in_array(request('lang'), ['fr', 'en']) ? request('lang') : 'fr';
        session(['locale' => $lang]);
        return $lang;
    }
    return session('locale', 'fr');
}

function getTranslations($lang) {
    if ($lang === 'en') {
        return [
            'hybrids' => 'Hybrids',
            'gallery' => 'Gallery',
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
            'share_subtext' => 'Scan the QR Code or copy the link below to share this hybrid.',
            'copy' => 'Copy',
            'copied' => 'Copied !',
        ];
    }

    return [
        'hybrids' => 'Hybrids',
        'gallery' => 'Galerie',
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
        'share_title' => 'Partager ce Hybrid',
        'share_subtext' => 'Scannez le QR Code ou copiez le lien ci-dessous pour partager cet hybrid.',
        'copy' => 'Copier',
        'copied' => 'Copié !',
    ];
}

Route::get('/', function () {
    // 1. Language session persistence
    if (request()->has('lang')) {
        $lang = in_array(request('lang'), ['fr', 'en']) ? request('lang') : 'fr';
        session(['locale' => $lang]);
    } else {
        $lang = session('locale', 'fr');
    }

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

    if (!$hybrid) {
        abort(404, 'Hybrid not found');
    }

    if (!$hybrid->img_src) {
        abort(404, 'Image not found');
    }

    // Check if the image is an external URL
    if (preg_match('/^https?:\/\//', $hybrid->img_src)) {
        // For external URLs, redirect to the image
        return redirect($hybrid->img_src);
    }

    // For local images stored in storage
    // Remove leading slash to ensure proper path construction
    $relativePath = ltrim($hybrid->img_src, '/');
    
    // Try multiple possible locations
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
        abort(404, 'Image file not found. Checked paths: ' . implode(', ', $possiblePaths));
    }

    // Generate a clean filename
    $filename = preg_replace('/[^a-zA-Z0-9-_]/', '-', $hybrid->name) . '-' . $hybrid->id . '.' . pathinfo($imagePath, PATHINFO_EXTENSION);

    return response()->download($imagePath, $filename);
})->name('hybrids.download');

Route::post('/{id}/like', function ($id) {
    $hybrid = Hybrid::find($id);

    if (!$hybrid) {
        return response()->json(['error' => 'Hybrid not found'], 404);
    }

    // Get the action (like or unlike) from request
    $action = request()->input('action', 'like');

    if ($action === 'unlike') {
        // Decrement the like count (but don't go below 0)
        $hybrid->nb_like = max(0, $hybrid->nb_like - 1);
        $liked = false;
    } else {
        // Increment the like count
        $hybrid->nb_like = $hybrid->nb_like + 1;
        $liked = true;
    }

    $hybrid->save();

    return response()->json([
        'success' => true,
        'nb_like' => $hybrid->nb_like,
        'liked' => $liked
    ]);
})->name('hybrids.like');
