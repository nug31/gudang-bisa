import XlsxPopulate from "xlsx-populate";

// Create a new workbook
XlsxPopulate.fromBlankAsync()
  .then((workbook) => {
    // Get the first sheet
    const sheet = workbook.sheet(0);

    // Set the column headers
    sheet.cell("A1").value("name");
    sheet.cell("B1").value("description");
    sheet.cell("C1").value("categoryId");
    sheet.cell("D1").value("sku");
    sheet.cell("E1").value("quantityAvailable");
    sheet.cell("F1").value("quantityReserved");
    sheet.cell("G1").value("location");
    sheet.cell("H1").value("imageUrl");

    // Format the header row
    sheet.range("A1:H1").style({
      bold: true,
      fill: "D9EAD3", // Light green background
      horizontalAlignment: "center",
    });

    // Add sample data
    const sampleData = [
      [
        "Adobe Creative Cloud",
        "Annual subscription for Adobe Creative Cloud including Photoshop, Illustrator, and more",
        "58043a89-b0f8-4235-93af-3cc1b83fb4f9",
        "ADOBE-CC-001",
        25,
        0,
        "Digital Inventory",
        "https://example.com/images/adobe-cc.jpg",
      ],
      [
        "Dell XPS 15 Laptop",
        "High-performance laptop with 16GB RAM, 512GB SSD, and Intel Core i7",
        "1f34fae5-830b-4c6c-9092-7ea7c1f11433",
        "DELL-XPS15-001",
        10,
        0,
        "IT Storage Room",
        "https://example.com/images/dell-xps15.jpg",
      ],
      [
        "HP LaserJet Pro Printer",
        "Color laser printer with wireless connectivity and duplex printing",
        "1f34fae5-830b-4c6c-9092-7ea7c1f11433",
        "HP-LJ-001",
        5,
        0,
        "IT Storage Room",
        "https://example.com/images/hp-printer.jpg",
      ],
      [
        "Office Chair",
        "Ergonomic office chair with adjustable height and lumbar support",
        "4",
        "CHAIR-001",
        15,
        0,
        "Warehouse B",
        "https://example.com/images/office-chair.jpg",
      ],
      [
        "Whiteboard Markers",
        "Pack of 12 assorted color whiteboard markers",
        "3",
        "MARKER-001",
        50,
        0,
        "Supply Closet",
        "https://example.com/images/markers.jpg",
      ],
    ];

    // Add the sample data to the sheet
    sampleData.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        sheet.cell(rowIndex + 2, colIndex + 1).value(value);
      });
    });

    // Add a note about required fields
    sheet.cell("A8").value("Note: The following fields are required:");
    sheet.cell("A9").value("- name");
    sheet.cell("A10").value("- categoryId");
    sheet.cell("A11").value("- quantityAvailable");

    // Add category reference
    sheet.cell("A13").value("Category Reference:");
    sheet.cell("A14").value("Hardware: 1f34fae5-830b-4c6c-9092-7ea7c1f11433");
    sheet.cell("A15").value("Software: 58043a89-b0f8-4235-93af-3cc1b83fb4f9");
    sheet.cell("A16").value("Office Supplies: 3");
    sheet.cell("A17").value("Furniture: 4");
    sheet.cell("A18").value("Training: 5");

    // Format the note and reference sections
    sheet.range("A8:A11").style({ bold: true });
    sheet.range("A13:A18").style({ bold: true });

    // Auto-size columns
    for (let col = 1; col <= 8; col++) {
      const maxLength = Math.max(
        sheet.cell(1, col).value().length,
        ...sampleData.map((row) => String(row[col - 1] || "").length)
      );
      sheet.column(col).width(maxLength + 2);
    }

    // Save the workbook
    return workbook.toFileAsync("./public/inventory_import_template.xlsx");
  })
  .then(() => {
    console.log("Excel template created successfully!");
  })
  .catch((err) => {
    console.error("Error creating Excel template:", err);
  });
