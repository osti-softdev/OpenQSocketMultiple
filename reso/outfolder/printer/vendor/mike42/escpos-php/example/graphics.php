<?php
/* Print-outs using the newer graphics print command */
/* Print-outs using the newer graphics print command */

require __DIR__ . '/../autoload.php';

use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

$connector = new WindowsPrintConnector("POS-58a");
$printer = new Printer($connector);

try {
    $imagePath = __DIR__ . '/tux.png'; // Adjust the filename if necessary

    if (!file_exists($imagePath)) {
        throw new Exception("Image file not found: tux.png");
    }

    $tux = EscposImage::load($imagePath, true);

    $printer->graphics($tux);
    $printer->text("Regular Tux.\n");
    $printer->feed();

    $printer->graphics($tux, Printer::IMG_DOUBLE_WIDTH);
    $printer->text("Wide Tux.\n");
    $printer->feed();

    $printer->graphics($tux, Printer::IMG_DOUBLE_HEIGHT);
    $printer->text("Tall Tux.\n");
    $printer->feed();

    $printer->graphics($tux, Printer::IMG_DOUBLE_WIDTH | Printer::IMG_DOUBLE_HEIGHT);
    $printer->text("Large Tux in correct proportion.\n");

    $printer->cut();
} catch (Exception $e) {
    /* Images not supported on your PHP, or image file not found */
    $printer->text($e->getMessage() . "\n");
    $printer->text("\n");
    $printer->text("\n");
    $printer->text("\n");
    $printer->text("\n");
    $printer->text("\n");
    $printer->text("\n");
}

$printer->close();
