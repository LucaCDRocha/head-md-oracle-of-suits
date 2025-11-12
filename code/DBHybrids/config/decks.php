<?php

return [
    // Individual deck information with historical years and descriptions
    'decks' => [
        'bicycle' => [
            'year' => '1885',
            'description' => 'The Bicycle brand was first produced in 1885 by the United States Playing Card Company in Cincinnati, Ohio. Named after the popularity of bicycles at the end of the 19th century, it became one of the most recognizable and widely-used playing card brands worldwide, known for its iconic "Rider Back" design.',
        ],
        'copag-texas-holdem' => [
            'year' => '1908',
            'description' => 'COPAG (Companhia Paulista de Papéis e Artes Gráficas) is a Brazilian playing card manufacturer founded in 1908. Their 100% plastic cards, particularly the Texas Hold\'em line, became popular in professional poker tournaments for their durability and resistance to marking.',
        ],
        'piquet' => [
            'year' => '1535',
            'description' => 'Piquet is an early 16th-century French card game for two players, first mentioned in 1535 in Gargantua and Pantagruel by Rabelais. Played with a 32-card deck (7s through Aces), it was France\'s national game for centuries and is considered a classic game of great antiquity requiring significant skill.',
        ],
        'tarot-de-marseille' => [
            'year' => '1639',
            'description' => 'The Tarot de Marseille is a standard pattern of Italian-suited tarot pack with 78 cards. The earliest surviving cards were produced by Philippe Vachier of Marseilles in 1639. It was very popular in France in the 17th and 18th centuries and became the basis for most modern tarot decks, both for gaming and divination.',
        ],
        'waite-tarot' => [
            'year' => '1909',
            'description' => 'The Rider-Waite Tarot (also known as Waite-Smith) was first published in December 1909 by William Rider & Son of London. Conceived by mystic A.E. Waite and illustrated by Pamela Colman Smith, it became the most popular tarot deck for divination in the English-speaking world, with over 100 million copies circulated.',
        ],
        'tarot-ducale' => [
            'year' => '1499',
            'description' => 'Tarot Ducale refers to tarot decks from the ducal courts of northern Italy. The tarot pack was invented in northern Italy in the early 15th century and introduced into southern France when the French conquered Milan and Piedmont in 1499, giving rise to various Italian-French hybrid patterns.',
        ],
        'jass' => [
            'year' => '1796',
            'description' => 'Jass is Switzerland\'s national card game, first mentioned in 1796. Played with 36 Swiss-suited cards featuring Roses (hearts), Bells (diamonds), Shields (spades), and Acorns (clubs), it is popular throughout Alemannic German-speaking areas of Europe. An estimated 3 million Swiss play Jass regularly.',
        ],
        'piatnik' => [
            'year' => '1824',
            'description' => 'Piatnik is an Austrian playing card manufacturer founded in Vienna in 1824 by Ferdinand Piatnik. Originally a card painting workshop, it became one of Europe\'s oldest and most prestigious playing card companies, producing Italian-suited, German-suited, and French-suited decks for various traditional European card games.',
        ],
        'ducale' => [
            'year' => '1499',
            'description' => 'Ducale playing cards originated in the ducal courts of northern Italian city-states during the Renaissance. These cards often featured elaborate court designs and were associated with nobility. The term "ducale" refers to cards from or influenced by these aristocratic traditions.',
        ],
    ],

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
