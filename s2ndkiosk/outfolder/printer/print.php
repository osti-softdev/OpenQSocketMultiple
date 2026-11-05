<?php
error_reporting(E_ALL & ~E_DEPRECATED);
$argument = $argv[1] ?? '';
require_once __DIR__ . '/vendor/autoload.php';

use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

// Read config.ini to dynamically get configured printerName
$printerName = "POS-82"; // Default fallback
$configPath = __DIR__ . '/../config/config.ini';
if (file_exists($configPath)) {
    $ini = @parse_ini_file($configPath, true);
    if (!empty($ini['printer']['printerName'])) {
        $printerName = trim($ini['printer']['printerName']);
    }
}

// Support individual arguments ($argv[1]..$argv[5]) or legacy comma-separated string
if ($argc > 2) {
    $ticket      = $argv[1] ?? '';
    $count       = $argv[2] ?? '';
    $shortSname  = $argv[3] ?? '';
    $subsname    = $argv[4] ?? '';
    $sub_service = $argv[5] ?? '';
} else {
    list($ticket, $count, $shortSname, $subsname, $sub_service) = array_pad(explode(',', (string)$argument), 5, '');
}

date_default_timezone_set('Asia/Manila');
$date = date('Y-m-d');
$time = date('H:i:s');
$timestamp = time();
$formattedDate = date('D, M d, Y', $timestamp);

try {
    $connector = new WindowsPrintConnector($printerName);
    $printer = new Printer($connector);

    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->selectPrintMode(Printer::MODE_EMPHASIZED);
    $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_DOUBLE_WIDTH);
    $printer->setFont(Printer::FONT_B);
    $printer->setTextSize(3, 2);

    $printer->text("SAN PEDRO HOSPITAL\n");
    $printer->text("OF DAVAO CITY INC.\n");

    $printer->setTextSize(1, 1);
    $printer->text($date . " " . $time . "\n");

    $printer->setFont(Printer::MODE_FONT_B);
    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->setTextSize(2, 1);
    $printer->text("____________________\n");
    $printer->feed();

    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->selectPrintMode(Printer::MODE_EMPHASIZED | Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_DOUBLE_WIDTH);
    $printer->setTextSize(5, 3);
    $printer->text($ticket);
    $printer->text($count . "\n\n");

    $printer->setTextSize(2, 1);
    $printer->setFont(Printer::MODE_FONT_B);

    if (!empty(trim((string)$shortSname))) {
        $printer->text(trim((string)$shortSname) . "\n");
    }
    if (!empty(trim((string)$subsname))) {
        $printer->text(trim((string)$subsname) . "\n");
    }
    if (!empty(trim((string)$sub_service))) {
        $printer->text(trim((string)$sub_service) . "\n");
    }

    $printer->text("\n");
    $printer->setTextSize(1, 1);
    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->setFont(Printer::FONT_C);
    $printer->text("This Ticket is valid only on the day it is dispensed.\n");

    $printer->feed(2);
    $printer->cut();
    $printer->close();
} catch (Exception $e) {
    $errorMsg = date('[Y-m-d H:i:s] ') . "Printer [{$printerName}] error: " . $e->getMessage() . "\n";
    echo $errorMsg;
    $logDir = __DIR__ . '/../logs/error';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0777, true);
    }
    @file_put_contents($logDir . '/error.log', $errorMsg, FILE_APPEND);
}
?>
