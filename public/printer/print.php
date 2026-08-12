<?php
require_once __DIR__ . '../vendor/autoload.php';

use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\EscposImage;

// --- PRINT LOGO ---
// try {
//     $logo = EscposImage::load(__DIR__ . "/../images/dbp.png", false);
//     $printer->setJustification(Printer::JUSTIFY_CENTER);
//     $printer->bitImage($logo, Printer::IMG_DEFAULT);
//     $printer->feed();
// } catch (Exception $e) {
//     // if logo missing
// }

$connector = new WindowsPrintConnector("POS-80");
$printer = new Printer($connector);
// Receive arguments individually
$ticket      = $argv[1] ?? '';
$count       = $argv[2] ?? '';
$shortSname  = $argv[3] ?? '';
$subsname  = $argv[4] ?? '';
$sub_service = $argv[5] ?? '';

date_default_timezone_set('Asia/Manila');
$now = time();
$date = date('Y-m-d');
$time = date('H:i:s');
$today = date('Y-m-d', time());
$service = '';
$initial = '';
// $ticket = 1;
$modes = array(
    Printer::MODE_FONT_B,
    Printer::MODE_EMPHASIZED,
    Printer::MODE_DOUBLE_HEIGHT,
    Printer::MODE_DOUBLE_WIDTH,
    Printer::MODE_UNDERLINE
);

$printer->setJustification(Printer::JUSTIFY_CENTER);
$printer->selectPrintMode(Printer::MODE_EMPHASIZED);
$printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_DOUBLE_WIDTH);
$printer->setFont(Printer::FONT_B);
$printer->setTextSize(3, 2);

$printer->text("CEBU CITY\n");
$printer->text("TRANSPORTATION OFFICE.\n");

$printer->setTextSize(1, 1);
$printer->text($date ." ". $time."\n");

$printer->setFont(Printer::MODE_FONT_B);
$printer->setJustification(Printer::JUSTIFY_CENTER);
$printer->setTextSize(2, 1);
$printer->text("____________________");
$printer->feed();

$printer->setJustification(Printer::JUSTIFY_CENTER);
$printer->selectPrintMode(Printer::MODE_EMPHASIZED | Printer::MODE_DOUBLE_HEIGHT | Printer::MODE_DOUBLE_WIDTH);
$printer->setTextSize(5, 3);
$printer->text($ticket);
$printer->text($count . "\n\n");

$printer->setTextSize(2, 1);
$printer->setFont(Printer::MODE_FONT_B);

$printer->text($shortSname . "\n");
$printer->text($subsname . "\n");
if (!empty(trim($sub_service))) {
    $printer->text(trim($sub_service) . "\n");
}

$printer->text("\n");
$printer->setTextSize(1, 1);
$printer->setJustification(Printer::JUSTIFY_CENTER);
$printer->setFont(Printer::FONT_C);
$printer->text("This Ticket is valid only on the day it is dispensed.");


$printer->feed(2);
$printer->cut();
try {
    $printer->close();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
