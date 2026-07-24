<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\Game;
use Illuminate\Database\Seeder;
use ZipArchive;
use SimpleXMLElement;

class CardsTableSeeder extends Seeder
{
    public function run()
    {
        $filePath = storage_path('app/public/Oracle of Suits_base de données.xlsx');
        
        if (!file_exists($filePath)) {
            $this->command->error("Excel file not found at: {$filePath}");
            return;
        }

        $data = $this->parseXlsx($filePath);
        $cardsRows = $data['Cartes'] ?? [];

        if (empty($cardsRows)) {
            $this->command->error("No cards found in the 'Cartes' sheet.");
            return;
        }

        $count = 0;
        foreach ($cardsRows as $row) {
            $ref = trim($row['A'] ?? '');
            if (empty($ref) || $ref === 'Réf.') {
                // Skip header or empty row
                continue;
            }

            // Extract game ID
            $parts = explode('.', $ref);
            $gameId = (int) $parts[0];

            // Verify if the game exists
            $game = Game::find($gameId);
            if (!$game) {
                $this->command->warn("Game ID {$gameId} (from reference {$ref}) not found. Skipping card.");
                continue;
            }

            $suit = trim($row['D'] ?? '');
            $value = trim($row['E'] ?? '');

            $name = $this->generateCardName($suit, $value);
            $imgSrc = $this->findCardImage($gameId, $ref);

            Card::create([
                'name' => $name,
                'game_id' => $gameId,
                'suits' => $suit ?: null,
                'value' => $value ?: null,
                'img_src' => $imgSrc,
                'french_suits' => $suit ?: null,
                'french_value' => $value ?: null,
                'french_equivalence' => $name,
            ]);

            $count++;
        }

        $this->command->info("Seeded {$count} cards from Excel.");
    }

    private function generateCardName($suit, $value)
    {
        $suit = trim($suit);
        $value = trim($value);

        if (strtolower($suit) === 'atout') {
            return "Atout " . $value;
        }

        if (in_array(strtolower($suit), ['joker', 'excuse', 'fou', 'mat'])) {
            return ucfirst($suit);
        }

        if (in_array(strtolower($value), ['excuse', 'fou', 'mat'])) {
            return ucfirst($value);
        }

        if (empty($value) && empty($suit)) {
            return "Carte Inconnue";
        }

        if (empty($value)) {
            return "Carte de " . $suit;
        }

        if (empty($suit)) {
            return ucfirst($value);
        }

        return ucfirst($value) . ' de ' . $suit;
    }

    private function findCardImage($gameId, $ref)
    {
        $prefix = sprintf("%02d.", $gameId);
        $cardsPath = storage_path('app/public/img/cards');
        
        if (!is_dir($cardsPath)) {
            return null;
        }

        $dirs = scandir($cardsPath);
        $matchedDir = null;
        foreach ($dirs as $dir) {
            if ($dir === '.' || $dir === '..') continue;
            if (strpos($dir, $prefix) === 0 && is_dir($cardsPath . '/' . $dir)) {
                $matchedDir = $dir;
                break;
            }
        }

        if (!$matchedDir) {
            // Also try a single digit format like "1." just in case
            $prefixSingle = sprintf("%d.", $gameId);
            foreach ($dirs as $dir) {
                if ($dir === '.' || $dir === '..') continue;
                if (strpos($dir, $prefixSingle) === 0 && is_dir($cardsPath . '/' . $dir)) {
                    $matchedDir = $dir;
                    break;
                }
            }
            if (!$matchedDir) {
                return null;
            }
        }

        $dirPath = $cardsPath . '/' . $matchedDir;
        $files = scandir($dirPath);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            $filename = pathinfo($file, PATHINFO_FILENAME);
            if (strtolower($filename) === strtolower($ref)) {
                return 'img/cards/' . $matchedDir . '/' . $file;
            }
        }

        return null;
    }

    private function parseXlsx($filePath)
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== TRUE) {
            return [];
        }

        // Load shared strings
        $sharedStrings = [];
        $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedStringsXml) {
            $xml = @simplexml_load_string($sharedStringsXml);
            if ($xml) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string)$si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string)$r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // Load sheets info
        $sheetMap = [];
        $workbookXml = $zip->getFromName('xl/workbook.xml');
        if ($workbookXml) {
            $xml = @simplexml_load_string($workbookXml);
            if ($xml) {
                $xml->registerXPathNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');
                foreach ($xml->sheets->sheet as $sheet) {
                    $name = (string)$sheet['name'];
                    $sheetId = (string)$sheet['sheetId'];
                    $sheetMap[$name] = "xl/worksheets/sheet{$sheetId}.xml";
                }
            }
        }

        if (empty($sheetMap)) {
            for ($i = 1; $i <= 10; $i++) {
                $name = "xl/worksheets/sheet{$i}.xml";
                if ($zip->locateName($name) !== false) {
                    $sheetMap["Sheet $i"] = $name;
                }
            }
        }

        $result = [];

        foreach ($sheetMap as $sheetName => $zipPath) {
            $sheetXml = $zip->getFromName($zipPath);
            if (!$sheetXml) {
                $fallbackPath = "xl/worksheets/sheet" . (count($result) + 1) . ".xml";
                $sheetXml = $zip->getFromName($fallbackPath);
                if (!$sheetXml) {
                    continue;
                }
            }

            $xml = @simplexml_load_string($sheetXml);
            if (!$xml) continue;

            $rows = [];
            foreach ($xml->sheetData->row as $row) {
                $rowNum = (int)$row['r'];
                $rowData = [];
                foreach ($row->c as $cell) {
                    $cellRef = (string)$cell['r'];
                    preg_match('/^[A-Z]+/', $cellRef, $matches);
                    $colLetter = $matches[0];
                    
                    $val = '';
                    if (isset($cell->v)) {
                        $val = (string)$cell->v;
                        $type = (string)$cell['t'];
                        if ($type === 's') {
                            $val = $sharedStrings[(int)$val] ?? $val;
                        }
                    }
                    $rowData[$colLetter] = $val;
                }
                $rows[$rowNum] = $rowData;
            }

            $sheetData = [];
            if (!empty($rows)) {
                $maxRow = max(array_keys($rows));
                for ($r = 1; $r <= $maxRow; $r++) {
                    if (isset($rows[$r])) {
                        $sheetData[] = $rows[$r];
                    } else {
                        $sheetData[] = [];
                    }
                }
            }

            $result[$sheetName] = $sheetData;
        }

        $zip->close();
        return $result;
    }
}
