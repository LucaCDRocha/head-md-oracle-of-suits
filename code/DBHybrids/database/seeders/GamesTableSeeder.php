<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;
use ZipArchive;
use SimpleXMLElement;

class GamesTableSeeder extends Seeder
{
    public function run()
    {
        $filePath = storage_path('app/public/Oracle of Suits_base de données.xlsx');
        
        if (!file_exists($filePath)) {
            $this->command->error("Excel file not found at: {$filePath}");
            return;
        }

        $data = $this->parseXlsx($filePath);
        $jeuxRows = $data['Jeux'] ?? [];

        if (empty($jeuxRows)) {
            $this->command->error("No games found in the 'Jeux' sheet.");
            return;
        }

        $count = 0;
        foreach ($jeuxRows as $row) {
            $id = trim($row['A'] ?? '');
            if (!is_numeric($id)) {
                // Skip header or empty row
                continue;
            }

            $name = trim($row['C'] ?? '');
            $period = trim($row['B'] ?? '');
            $description = trim($row['D'] ?? '');
            $descriptionEng = trim($row['E'] ?? '');
            $nbCards = trim($row['F'] ?? '');
            $type = trim($row['G'] ?? '');
            $suitsType = trim($row['H'] ?? '');

            if (empty($name)) {
                continue;
            }

            $year = $this->mapPeriodToYears($period);

            Game::updateOrCreate(
                ['id' => (int) $id],
                [
                    'name' => $name,
                    'year' => $year,
                    'description' => $description ?: null,
                    'description_eng' => $descriptionEng ?: null,
                    'nb_cards' => is_numeric($nbCards) ? (int) $nbCards : null,
                    'type' => $type ?: null,
                    'suits_type' => $suitsType ?: null,
                ]
            );
            $count++;
        }

        $this->command->info("Seeded {$count} games from Excel.");
    }

    private function mapPeriodToYears($period)
    {
        $period = trim($period);
        switch ($period) {
            case 'avant le 18e siècle':
                return 'avant 1700';
            case '18e siècle':
                return '1700-1800';
            case '1ère moitié du 19e':
                return '1800-1850';
            case '2ème moitié du 19e':
                return '1850-1900';
            case '1ère moitié du 20e':
                return '1900-1950';
            case '2ème moitié du 20e':
                return '1950-2000';
            case '21e siècle':
                return '2000-present';
            default:
                return $period;
        }
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
