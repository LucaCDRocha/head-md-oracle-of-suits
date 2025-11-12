<?php

return [
    // Preset deck definitions. Keys are identifiers; each preset can include aliases,
    // a suits map and a values map. These are used by the CardsTableSeeder to
    // infer suit initials and value tokens when seeding from image filenames.
    'presets' => [
        'standard' => [
            'aliases' => ['bicycle', 'copag-texas-holdem', 'piquet'],
            'suits' => [
                'S' => 'Spades',
                'H' => 'Hearts',
                'D' => 'Diamonds',
                'C' => 'Clubs',
            ],
            'values' => [
                'A' => 'Ace',
                'K' => 'King',
                'Q' => 'Queen',
                'J' => 'Jack',
            ],
        ],

        'tarot' => [
            'aliases' => ['tarot-de-marseille', 'waite-tarot'],
            'suits' => [
                'P' => 'Pentacles',
                'C' => 'Cups',
                'S' => 'Swords',
                'W' => 'Wands',
                'M' => 'Major Arcana',
            ],
            'values' => [
                // tarot court examples: Page (P), Cavalier (C), Queen (Q), King (K)
                'P' => 'Page',
                'C' => 'Cavalier',
                'Q' => 'Queen',
                'K' => 'King',
                // keep standard faces too
                'A' => 'Ace',
                'J' => 'Jack',
            ],
        ],

        'tarot-ducale' => [
            'aliases' => ['tarot-ducale'],
            'suits' => [
                'S' => 'Spades',
                'H' => 'Hearts',
                'D' => 'Diamonds',
                'C' => 'Clubs',
                'M' => 'Major Arcana',
            ],
            'values' => [
                'A' => 'Ace',
                'R' => 'Roi',
                'D' => 'Dame',
                'V' => 'Valet',
                'C' => 'Cavalier',
            ],
        ],

        'jass' => [
            'aliases' => ['jass'],
            'suits' => [
                'B' => 'Bells',
                'C' => 'Clubs',
                'R' => 'Roses',
                'S' => 'Shields',
            ],
            'values' => [
                'A' => 'Ace',
                'K' => 'König',
                'O' => 'Ober',
                'U' => 'Unter',
            ],
        ],

        'piatnik' => [
            'aliases' => ['piatnik', 'ducale'],
            'suits' => [
                'B' => 'Baton',
                'C' => 'Cups',
                'P' => 'Coins',
                'S' => 'Swords',
            ],
            'values' => [
                'K' => 'King',
                'V' => 'Valet',
                'C' => 'Cavalier',
            ],
        ]
    ],
    // Equivalences: grouped mappings you can use to say "all these tokens make this"
    // This is separate from presets and used as a global helper for French equivalences
    // You can list groups where multiple tokens map to the same readable name.
    'equivalences' => [
        'values_groups' => [
            // Example: both 'K' and 'R' should be considered 'Roi'
            [
                'to' => 'King',
                'tokens' => ['K', 'R'],
            ],
            [
                'to' => 'Queen',
                'tokens' => ['Q', 'D'],
            ],
            [
                'to' => 'Jack',
                'tokens' => ['J', 'V', 'U', 'O', 'C'],
            ],
            [
                'to' => 'Ace',
                'tokens' => ['A', '1'],
            ],
            [
                'to' => 'JOKER',
                'tokens' => ['JK', 'JOKER'],
            ]
        ],
        'suits_groups' => [
            [
                'to' => 'Spades',
                'tokens' => ['Spades', 'Shields', 'Swords'],
            ],
            [
                'to' => 'Hearts',
                'tokens' => ['Cups', 'Hearts', 'Roses'],
            ],
            [
                'to' => 'Diamonds',
                'tokens' => ['Pentacles', 'Diamonds', 'Bells', 'Coins'],
            ],
            [
                'to' => 'Clubs',
                'tokens' => ['Clubs', 'Baton', 'Wands', 'Batons'],
            ],
            [
                'to' => 'Special',
                'tokens' => ['Major Arcana', 'Special'],
            ]
        ],
    ],
];
