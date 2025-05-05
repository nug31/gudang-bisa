import XlsxPopulate from "xlsx-populate";

// Create a new workbook
XlsxPopulate.fromBlankAsync()
  .then((workbook) => {
    // Get the first sheet
    const sheet = workbook.sheet(0);
    
    // Set the column headers
    sheet.cell('A1').value('name');
    sheet.cell('B1').value('categoryId');
    sheet.cell('C1').value('quantityAvailable');
    
    // Format the header row
    sheet.range('A1:C1').style({
      bold: true,
      fill: 'D9EAD3', // Light green background
      horizontalAlignment: 'center'
    });
    
    // Add sample data
    const sampleData = [
      ["Office Chair", 1, 10],
      ["Desk Lamp", 1, 15],
      ["Whiteboard", 1, 5]
    ];
    
    // Add the sample data to the sheet
    sampleData.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        sheet.cell(rowIndex + 2, colIndex + 1).value(value);
      });
    });
    
    // Add a note about required fields
    sheet.cell('A6').value('Note: These are the only required fields for import.');
    sheet.cell('A7').value('Use simple numeric IDs for categories (1, 2, 3, etc.)');
    
    // Format the note section
    sheet.range('A6:A7').style({ bold: true });
    
    // Auto-size columns
    for (let col = 1; col <= 3; col++) {
      const maxLength = Math.max(
        sheet.cell(1, col).value().length,
        ...sampleData.map(row => String(row[col - 1] || '').length)
      );
      sheet.column(col).width(maxLength + 2);
    }
    
    // Save the workbook
    return workbook.toFileAsync('./public/simple_inventory_template.xlsx');
  })
  .then(() => {
    console.log('Simple Excel template created successfully!');
  })
  .catch(err => {
    console.error('Error creating Excel template:', err);
  });
