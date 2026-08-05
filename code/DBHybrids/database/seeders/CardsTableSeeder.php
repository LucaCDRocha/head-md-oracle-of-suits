<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\Game;
use Illuminate\Database\Seeder;
use ZipArchive;

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

        $excelCards = [];
        foreach ($cardsRows as $row) {
            $ref = trim($row['A'] ?? '');
            if (empty($ref) || $ref === 'Réf.') continue;
            
            $parts = explode('.', $ref);
            $gameId = (int) $parts[0];

            $excelCards[] = [
                'ref' => $ref,
                'game_id' => $gameId,
                'suit' => trim($row['D'] ?? ''),
                'value' => trim($row['E'] ?? ''),
            ];
        }

        $existingCards = Card::orderBy('id', 'asc')->get();
        $usedExcelIndices = [];
        $cardsPath = storage_path('app/public/img/cards');
        $updatedCount = 0;

        // Update existing cards (preserve IDs 1..N)
        foreach ($existingCards as $dbc) {
            $matchedIndex = null;

            // 1. Match by Ref from img_src
            if (!empty($dbc->img_src)) {
                $refFromImg = strtolower(pathinfo($dbc->img_src, PATHINFO_FILENAME));
                foreach ($excelCards as $idx => $ec) {
                    if (strtolower($ec['ref']) === $refFromImg) {
                        $matchedIndex = $idx;
                        break;
                    }
                }
            }

            // 2. Match by DB Card ID index alignment
            if ($matchedIndex === null) {
                $idx = $dbc->id - 1;
                if (isset($excelCards[$idx])) {
                    $ec = $excelCards[$idx];
                    if ($ec['game_id'] == $dbc->game_id && strtolower($ec['value']) == strtolower($dbc->value)) {
                        $matchedIndex = $idx;
                    }
                }
            }

            // 3. Fallback: match by game_id + value
            if ($matchedIndex === null) {
                foreach ($excelCards as $idx => $ec) {
                    if (!isset($usedExcelIndices[$idx])) {
                        if ($ec['game_id'] == $dbc->game_id && strtolower($ec['value']) == strtolower($dbc->value)) {
                            $matchedIndex = $idx;
                            break;
                        }
                    }
                }
            }

            if ($matchedIndex !== null) {
                $usedExcelIndices[$matchedIndex] = true;
                $ec = $excelCards[$matchedIndex];

                $name = $this->generateCardName($ec['suit'], $ec['value']);
                $imgSrc = $this->findCardImage($ec['game_id'], $ec['ref'], $cardsPath);

                $dbc->update([
                    'name' => $name,
                    'game_id' => $ec['game_id'],
                    'suits' => $ec['suit'] ?: null,
                    'value' => $ec['value'] ?: null,
                    'img_src' => $imgSrc ?: $dbc->img_src,
                    'french_suits' => $ec['suit'] ?: null,
                    'french_value' => $ec['value'] ?: null,
                    'french_equivalence' => $name,
                ]);
                $updatedCount++;
            }
        }

        // Insert new cards
        $newCardsCount = 0;
        foreach ($excelCards as $idx => $ec) {
            if (!isset($usedExcelIndices[$idx])) {
                $name = $this->generateCardName($ec['suit'], $ec['value']);
                $imgSrc = $this->findCardImage($ec['game_id'], $ec['ref'], $cardsPath);

                Card::create([
                    'name' => $name,
                    'game_id' => $ec['game_id'],
                    'suits' => $ec['suit'] ?: null,
                    'value' => $ec['value'] ?: null,
                    'img_src' => $imgSrc,
                    'french_suits' => $ec['suit'] ?: null,
                    'french_value' => $ec['value'] ?: null,
                    'french_equivalence' => $name,
                ]);
                $newCardsCount++;
            }
        }

        $this->command->info("Cards synchronization completed. Total cards: " . Card::count() . " ({$updatedCount} cards updated, {$newCardsCount} new cards added).");
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
            if (in_array(mb_strtolower($suit), ['épée', 'epée', 'epee', 'épées', 'epées'])) {
                return "Carte d'Épée";
            }
            return "Carte de " . $suit;
        }

        if (empty($suit)) {
            return ucfirst($value);
        }

        if (in_array(mb_strtolower($suit), ['épée', 'epée', 'epee', 'épées', 'epées'])) {
            return ucfirst($value) . " d'Épée";
        }

        return ucfirst($value) . ' de ' . $suit;
    }

    private function findCardImage($gameId, $ref, $cardsPath)
    {
        if (!is_dir($cardsPath)) {
            return null;
        }

        $prefix = sprintf("%02d.", $gameId);
        $prefixSingle = sprintf("%d.", $gameId);

        $dirs = scandir($cardsPath);
        $matchedDir = null;
        foreach ($dirs as $dir) {
            if ($dir === '.' || $dir === '..') continue;
            if ((strpos($dir, $prefix) === 0 || strpos($dir, $prefixSingle) === 0) && is_dir($cardsPath . '/' . $dir)) {
                $matchedDir = $dir;
                break;
            }
        }

        if (!$matchedDir) {
            return null;
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
