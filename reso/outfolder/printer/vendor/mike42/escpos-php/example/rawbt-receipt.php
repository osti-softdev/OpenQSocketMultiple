<?php
require __DIR__ . '/../autoload.php';

use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

class item
{
    private $name;
    private $price;
    private $dollarSign;

    public function __construct($name = '', $price = '', $dollarSign = false)
    {
        $this->name = $name;
        $this->price = $price;
        $this->dollarSign = $dollarSign;
    }

    public function getAsString($width = 48)
    {
        $rightCols = 10;
        $leftCols = $width - $rightCols;
        if ($this->dollarSign) {
            $leftCols = $leftCols / 2 - $rightCols / 2;
        }
        $left = str_pad($this->name, $leftCols);

        $sign = ($this->dollarSign ? '$ ' : '');
        $right = str_pad($sign . $this->price, $rightCols, ' ', STR_PAD_LEFT);
        return "$left$right\n";
    }

    public function __toString()
    {
        return $this->getAsString();
    }
}

try {
    /* Fill in your own connector here */
    $connector = new WindowsPrintConnector("POS-80");

    /* Information for the receipt */
    $items = array(
        new item("Example item #1", "4.00"),
        new item("Another thing", "3.50"),
        new item("Something else", "1.00"),
        new item("A final item", "4.45"),
    );
    $subtotal = new item('Subtotal', '12.95');
    $tax = new item('A local tax', '1.30');
    $total = new item('Total', '14.25', true);
    $date = "Monday 6th of April 2015 02:56:25 PM";

    /* Start the printer */
    $logo = EscposImage::load("resources/rawbtlogo.png", false);
    $printer = new Printer($connector);

    /* Print top logo */
    $printer->graphics($logo);

    /* Name of shop */
    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
    $printer->text("ExampleMart Ltd.\n");
    $printer->selectPrintMode();
    $printer->text("Shop No. 42.\n");
    $printer->feed();

    /* Title of receipt */
    $printer->setEmphasis(true);
    $printer->text("SALES INVOICE\n");
    $printer->setEmphasis(false);

    /* Items */
    $printer->setJustification(Printer::JUSTIFY_LEFT);
    $printer->setEmphasis(true);
    $printer->text(new item('', '$'));
    $printer->setEmphasis(false);
    foreach ($items as $item) {
        $printer->text($item->getAsString(32));
    }
    $printer->setEmphasis(true);
    $printer->text($subtotal->getAsString(32));
    $printer->setEmphasis(false);
    $printer->feed();

    /* Tax and total */
    $printer->text($tax->getAsString(32));
    $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
    $printer->text($total->getAsString(32));
    $printer->selectPrintMode();

    /* Footer */
    $printer->feed(2);
    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->text("Thank you for shopping\n");
    $printer->text("at ExampleMart\n");
    $printer->text("For trading hours,\n");
    $printer->text("please visit example.com\n");
    $printer->feed(2);
    $printer->text($date . "\n");

    /* Barcode Default look */
    $printer->barcode("ABC", Printer::BARCODE_CODE39);
    $printer->feed();

    /* Cut the receipt and open the cash drawer */
    $printer->cut();
    $printer->pulse();
} catch (Exception $e) {
    echo $e->getMessage();
} finally {
    $printer->close();
}
