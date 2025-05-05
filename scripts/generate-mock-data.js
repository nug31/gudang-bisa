import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { format } from "date-fns";

// Function to generate a random date within the last n days
function randomDate(daysAgo = 30) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

// Function to hash a password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function generateMockData() {
  console.log("Generating mock data...");

  // Generate users
  const adminId = uuidv4();
  const managerId = uuidv4();
  const userId1 = uuidv4();
  const userId2 = uuidv4();
  const userId3 = uuidv4();

  const hashedPassword = await hashPassword("password123");

  const users = [
    {
      id: adminId,
      name: "Admin User",
      email: "admin@gudangmitra.com",
      password: hashedPassword,
      role: "admin",
      avatar_url: "https://i.pravatar.cc/150?img=1",
      department: "IT",
      created_at: randomDate(60),
    },
    {
      id: managerId,
      name: "Manager User",
      email: "manager@gudangmitra.com",
      password: hashedPassword,
      role: "manager",
      avatar_url: "https://i.pravatar.cc/150?img=2",
      department: "Operations",
      created_at: randomDate(60),
    },
    {
      id: userId1,
      name: "John Doe",
      email: "john@gudangmitra.com",
      password: hashedPassword,
      role: "user",
      avatar_url: "https://i.pravatar.cc/150?img=3",
      department: "Marketing",
      created_at: randomDate(45),
    },
    {
      id: userId2,
      name: "Jane Smith",
      email: "jane@gudangmitra.com",
      password: hashedPassword,
      role: "user",
      avatar_url: "https://i.pravatar.cc/150?img=4",
      department: "Sales",
      created_at: randomDate(30),
    },
    {
      id: userId3,
      name: "Bob Johnson",
      email: "bob@gudangmitra.com",
      password: hashedPassword,
      role: "user",
      avatar_url: "https://i.pravatar.cc/150?img=5",
      department: "Finance",
      created_at: randomDate(20),
    },
  ];

  // Generate categories
  const categoryIds = Array(8)
    .fill()
    .map(() => uuidv4());

  const categories = [
    {
      id: categoryIds[0],
      name: "Office Supplies",
      description: "General office supplies and stationery",
      created_at: randomDate(90),
    },
    {
      id: categoryIds[1],
      name: "Cleaning Materials",
      description: "Cleaning supplies and janitorial equipment",
      created_at: randomDate(90),
    },
    {
      id: categoryIds[2],
      name: "Hardware",
      description: "Computer hardware, peripherals, and accessories",
      created_at: randomDate(90),
    },
    {
      id: categoryIds[3],
      name: "Software",
      description: "Software licenses, applications, and services",
      created_at: randomDate(90),
    },
    {
      id: categoryIds[4],
      name: "Furniture",
      description: "Office furniture and fixtures",
      created_at: randomDate(90),
    },
    {
      id: categoryIds[5],
      name: "Kitchen Supplies",
      description: "Kitchen equipment and pantry items",
      created_at: randomDate(90),
    },
    {
      id: categoryIds[6],
      name: "Safety Equipment",
      description: "Safety gear, first aid supplies, and emergency equipment",
      created_at: randomDate(90),
    },
    {
      id: categoryIds[7],
      name: "Other",
      description: "Miscellaneous items that do not fit other categories",
      created_at: randomDate(90),
    },
  ];

  // Generate item requests
  const requestIds = Array(10)
    .fill()
    .map(() => uuidv4());

  const itemRequests = [
    {
      id: requestIds[0],
      title: "New Laptop",
      description: "Need a new MacBook Pro for development work",
      category_id: categoryIds[0],
      priority: "high",
      status: "approved",
      user_id: userId1,
      created_at: randomDate(30),
      updated_at: randomDate(25),
      approved_at: randomDate(20),
      approved_by: adminId,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: randomDate(10),
      quantity: 1,
    },
    {
      id: requestIds[1],
      title: "Adobe Creative Cloud License",
      description: "Annual subscription for the design team",
      category_id: categoryIds[1],
      priority: "medium",
      status: "pending",
      user_id: userId2,
      created_at: randomDate(20),
      updated_at: randomDate(20),
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: null,
      quantity: 5,
    },
    {
      id: requestIds[2],
      title: "Office Desk Chair",
      description: "Ergonomic chair for back support",
      category_id: categoryIds[3],
      priority: "low",
      status: "rejected",
      user_id: userId3,
      created_at: randomDate(45),
      updated_at: randomDate(40),
      approved_at: null,
      approved_by: null,
      rejected_at: randomDate(35),
      rejected_by: managerId,
      rejection_reason: "Budget constraints. Please resubmit in Q3.",
      fulfillment_date: null,
      quantity: 1,
    },
    {
      id: requestIds[3],
      title: "Conference Room Projector",
      description: "Need a new 4K projector for the main conference room",
      category_id: categoryIds[0],
      priority: "critical",
      status: "pending",
      user_id: userId2,
      created_at: randomDate(10),
      updated_at: randomDate(10),
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: null,
      quantity: 1,
    },
    {
      id: requestIds[4],
      title: "React Advanced Training Course",
      description: "Online course for the frontend development team",
      category_id: categoryIds[4],
      priority: "medium",
      status: "draft",
      user_id: userId1,
      created_at: randomDate(5),
      updated_at: randomDate(5),
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: null,
      quantity: 3,
    },
    {
      id: requestIds[5],
      title: "Office Stationery",
      description: "Pens, notebooks, and other office supplies",
      category_id: categoryIds[2],
      priority: "low",
      status: "approved",
      user_id: userId3,
      created_at: randomDate(40),
      updated_at: randomDate(35),
      approved_at: randomDate(30),
      approved_by: managerId,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: randomDate(25),
      quantity: 20,
    },
    {
      id: requestIds[6],
      title: "Wireless Keyboard and Mouse",
      description: "Logitech MX Master combo for design team",
      category_id: categoryIds[0],
      priority: "medium",
      status: "fulfilled",
      user_id: userId2,
      created_at: randomDate(60),
      updated_at: randomDate(50),
      approved_at: randomDate(45),
      approved_by: adminId,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: randomDate(40),
      quantity: 3,
    },
    {
      id: requestIds[7],
      title: "Microsoft Office 365 Licenses",
      description: "Annual subscription renewal for the company",
      category_id: categoryIds[1],
      priority: "high",
      status: "approved",
      user_id: userId1,
      created_at: randomDate(25),
      updated_at: randomDate(20),
      approved_at: randomDate(15),
      approved_by: adminId,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: null,
      quantity: 50,
    },
    {
      id: requestIds[8],
      title: "Meeting Room Whiteboard",
      description: "Large magnetic whiteboard for brainstorming sessions",
      category_id: categoryIds[3],
      priority: "low",
      status: "pending",
      user_id: userId3,
      created_at: randomDate(15),
      updated_at: randomDate(15),
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: null,
      quantity: 2,
    },
    {
      id: requestIds[9],
      title: "UX Design Workshop",
      description: "Two-day workshop for the product team",
      category_id: categoryIds[4],
      priority: "medium",
      status: "draft",
      user_id: userId2,
      created_at: randomDate(3),
      updated_at: randomDate(3),
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: null,
      quantity: 8,
    },
  ];

  // Generate comments
  const commentIds = Array(15)
    .fill()
    .map(() => uuidv4());

  const comments = [
    {
      id: commentIds[0],
      request_id: requestIds[0],
      user_id: adminId,
      content:
        "This request has been approved. We will procure the laptop within the next 2 business days.",
      created_at: randomDate(20),
    },
    {
      id: commentIds[1],
      request_id: requestIds[0],
      user_id: userId1,
      content: "Thank you for the quick approval!",
      created_at: randomDate(19),
    },
    {
      id: commentIds[2],
      request_id: requestIds[2],
      user_id: managerId,
      content:
        "Unfortunately, we need to reject this request due to budget constraints. Please resubmit in Q3.",
      created_at: randomDate(35),
    },
    {
      id: commentIds[3],
      request_id: requestIds[2],
      user_id: userId3,
      content: "Understood. I will resubmit in Q3.",
      created_at: randomDate(34),
    },
    {
      id: commentIds[4],
      request_id: requestIds[1],
      user_id: adminId,
      content:
        "Can you provide more details about which specific Adobe products are needed?",
      created_at: randomDate(18),
    },
    {
      id: commentIds[5],
      request_id: requestIds[1],
      user_id: userId2,
      content:
        "We need the complete Creative Cloud suite including Photoshop, Illustrator, and InDesign.",
      created_at: randomDate(17),
    },
    {
      id: commentIds[6],
      request_id: requestIds[3],
      user_id: managerId,
      content:
        "Is this for the main conference room or the smaller meeting room?",
      created_at: randomDate(9),
    },
    {
      id: commentIds[7],
      request_id: requestIds[3],
      user_id: userId2,
      content:
        "This is for the main conference room. The current projector is showing signs of failure.",
      created_at: randomDate(8),
    },
    {
      id: commentIds[8],
      request_id: requestIds[5],
      user_id: managerId,
      content:
        "Approved. Please coordinate with the office manager for fulfillment.",
      created_at: randomDate(30),
    },
    {
      id: commentIds[9],
      request_id: requestIds[6],
      user_id: adminId,
      content: "Approved. These will be ordered today.",
      created_at: randomDate(45),
    },
    {
      id: commentIds[10],
      request_id: requestIds[6],
      user_id: userId2,
      content: "Great, thank you!",
      created_at: randomDate(44),
    },
    {
      id: commentIds[11],
      request_id: requestIds[7],
      user_id: adminId,
      content: "This is a critical renewal. Approved.",
      created_at: randomDate(15),
    },
    {
      id: commentIds[12],
      request_id: requestIds[8],
      user_id: managerId,
      content:
        "We need to check if there is wall space available in the meeting room.",
      created_at: randomDate(14),
    },
    {
      id: commentIds[13],
      request_id: requestIds[8],
      user_id: userId3,
      content: "I have checked and there is sufficient space on the east wall.",
      created_at: randomDate(13),
    },
    {
      id: commentIds[14],
      request_id: requestIds[9],
      user_id: managerId,
      content:
        "Please provide more details about the workshop provider and cost.",
      created_at: randomDate(2),
    },
  ];

  // Generate notifications
  const notificationIds = Array(15)
    .fill()
    .map(() => uuidv4());

  const notifications = [
    {
      id: notificationIds[0],
      user_id: userId1,
      type: "request_approved",
      message: 'Your request for "New Laptop" has been approved',
      is_read: 1,
      created_at: randomDate(20),
      related_item_id: requestIds[0],
    },
    {
      id: notificationIds[1],
      user_id: userId3,
      type: "request_rejected",
      message: 'Your request for "Office Desk Chair" has been rejected',
      is_read: 0,
      created_at: randomDate(35),
      related_item_id: requestIds[2],
    },
    {
      id: notificationIds[2],
      user_id: userId2,
      type: "request_submitted",
      message:
        'Your request for "Adobe Creative Cloud License" has been submitted',
      is_read: 1,
      created_at: randomDate(20),
      related_item_id: requestIds[1],
    },
    {
      id: notificationIds[3],
      user_id: adminId,
      type: "request_submitted",
      message: 'New request: "Conference Room Projector" requires your review',
      is_read: 0,
      created_at: randomDate(10),
      related_item_id: requestIds[3],
    },
    {
      id: notificationIds[4],
      user_id: userId2,
      type: "comment_added",
      message:
        'Admin User commented on your request "Adobe Creative Cloud License"',
      is_read: 1,
      created_at: randomDate(18),
      related_item_id: requestIds[1],
    },
    {
      id: notificationIds[5],
      user_id: adminId,
      type: "comment_added",
      message:
        'Jane Smith replied to your comment on "Adobe Creative Cloud License"',
      is_read: 0,
      created_at: randomDate(17),
      related_item_id: requestIds[1],
    },
    {
      id: notificationIds[6],
      user_id: userId3,
      type: "request_approved",
      message: 'Your request for "Office Stationery" has been approved',
      is_read: 1,
      created_at: randomDate(30),
      related_item_id: requestIds[5],
    },
    {
      id: notificationIds[7],
      user_id: userId2,
      type: "request_fulfilled",
      message:
        'Your request for "Wireless Keyboard and Mouse" has been fulfilled',
      is_read: 1,
      created_at: randomDate(40),
      related_item_id: requestIds[6],
    },
    {
      id: notificationIds[8],
      user_id: userId1,
      type: "request_approved",
      message:
        'Your request for "Microsoft Office 365 Licenses" has been approved',
      is_read: 0,
      created_at: randomDate(15),
      related_item_id: requestIds[7],
    },
    {
      id: notificationIds[9],
      user_id: managerId,
      type: "request_submitted",
      message: 'New request: "Meeting Room Whiteboard" requires your review',
      is_read: 1,
      created_at: randomDate(15),
      related_item_id: requestIds[8],
    },
    {
      id: notificationIds[10],
      user_id: userId3,
      type: "comment_added",
      message:
        'Manager User commented on your request "Meeting Room Whiteboard"',
      is_read: 0,
      created_at: randomDate(14),
      related_item_id: requestIds[8],
    },
    {
      id: notificationIds[11],
      user_id: managerId,
      type: "comment_added",
      message:
        'Bob Johnson replied to your comment on "Meeting Room Whiteboard"',
      is_read: 0,
      created_at: randomDate(13),
      related_item_id: requestIds[8],
    },
    {
      id: notificationIds[12],
      user_id: userId2,
      type: "request_submitted",
      message: 'Your request for "UX Design Workshop" has been saved as draft',
      is_read: 1,
      created_at: randomDate(3),
      related_item_id: requestIds[9],
    },
    {
      id: notificationIds[13],
      user_id: userId2,
      type: "comment_added",
      message: 'Manager User commented on your request "UX Design Workshop"',
      is_read: 0,
      created_at: randomDate(2),
      related_item_id: requestIds[9],
    },
    {
      id: notificationIds[14],
      user_id: adminId,
      type: "request_submitted",
      message:
        'New request: "React Advanced Training Course" requires your review',
      is_read: 0,
      created_at: randomDate(5),
      related_item_id: requestIds[4],
    },
  ];

  // Generate inventory items
  const inventoryItemIds = Array(20)
    .fill()
    .map(() => uuidv4());

  const inventoryItems = [
    {
      id: inventoryItemIds[0],
      name: "Dell XPS 15 Laptop",
      description:
        "High-performance laptop with 16GB RAM, 512GB SSD, and Intel Core i7",
      category_id: categoryIds[0], // Hardware
      sku: "DELL-XPS15-001",
      quantity_available: 10,
      quantity_reserved: 2,
      unit_price: 1799.99,
      location: "IT Storage Room",
      image_url:
        "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9520/media-gallery/black/laptop-xps-9520-t-black-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=402&qlt=100,1&resMode=sharp2&size=402,402",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[1],
      name: "HP LaserJet Pro Printer",
      description:
        "Color laser printer with wireless connectivity and duplex printing",
      category_id: categoryIds[0], // Hardware
      sku: "HP-LJ-001",
      quantity_available: 5,
      quantity_reserved: 1,
      unit_price: 399.99,
      location: "IT Storage Room",
      image_url:
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06721299.png",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[2],
      name: "Adobe Creative Cloud License",
      description:
        "Annual subscription for Adobe Creative Cloud including Photoshop, Illustrator, and more",
      category_id: categoryIds[1], // Software
      sku: "ADOBE-CC-001",
      quantity_available: 25,
      quantity_reserved: 0,
      unit_price: 599.99,
      location: "Digital Inventory",
      image_url:
        "https://www.adobe.com/content/dam/cc/icons/Adobe_Corporate_Horizontal_Red_HEX.svg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[3],
      name: "Microsoft Office 365 License",
      description:
        "Annual subscription for Microsoft Office 365 including Word, Excel, PowerPoint, and more",
      category_id: categoryIds[1], // Software
      sku: "MS-O365-001",
      quantity_available: 50,
      quantity_reserved: 5,
      unit_price: 99.99,
      location: "Digital Inventory",
      image_url:
        "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[4],
      name: "Whiteboard Markers",
      description: "Pack of 12 assorted color whiteboard markers",
      category_id: categoryIds[2], // Office Supplies
      sku: "MARKER-001",
      quantity_available: 50,
      quantity_reserved: 0,
      unit_price: 12.99,
      location: "Supply Closet",
      image_url:
        "https://m.media-amazon.com/images/I/71R9vliJbaL._AC_UF894,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[5],
      name: "Sticky Notes",
      description: "Pack of 12 sticky note pads, assorted colors",
      category_id: categoryIds[2], // Office Supplies
      sku: "STICKY-001",
      quantity_available: 100,
      quantity_reserved: 0,
      unit_price: 9.99,
      location: "Supply Closet",
      image_url:
        "https://m.media-amazon.com/images/I/71Jen5vgNvL._AC_UF894,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[6],
      name: "Ergonomic Office Chair",
      description: "Adjustable ergonomic office chair with lumbar support",
      category_id: categoryIds[3], // Furniture
      sku: "CHAIR-001",
      quantity_available: 15,
      quantity_reserved: 3,
      unit_price: 249.99,
      location: "Warehouse B",
      image_url:
        "https://m.media-amazon.com/images/I/71+Y3+Vj3RL._AC_UF1000,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[7],
      name: "Adjustable Standing Desk",
      description:
        "Electric height-adjustable standing desk with memory settings",
      category_id: categoryIds[3], // Furniture
      sku: "DESK-001",
      quantity_available: 8,
      quantity_reserved: 2,
      unit_price: 499.99,
      location: "Warehouse B",
      image_url:
        "https://m.media-amazon.com/images/I/71Vg1stgOML._AC_UF894,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[8],
      name: "UX Design Workshop",
      description:
        "Two-day workshop for the product team on UX design principles",
      category_id: categoryIds[4], // Training
      sku: "TRAIN-UX-001",
      quantity_available: 10,
      quantity_reserved: 0,
      unit_price: 1200.0,
      location: "Training Center",
      image_url:
        "https://img.freepik.com/free-vector/gradient-ui-ux-background_23-2149052117.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[9],
      name: "Project Management Certification",
      description: "PMP certification training and exam voucher",
      category_id: categoryIds[4], // Training
      sku: "TRAIN-PMP-001",
      quantity_available: 5,
      quantity_reserved: 1,
      unit_price: 1500.0,
      location: "Training Center",
      image_url:
        "https://www.pmi.org/-/media/pmi/other-images/certifications/pmp/pmp-cert-500px.png",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[10],
      name: "Wireless Keyboard and Mouse Combo",
      description: "Logitech MX Master wireless keyboard and mouse combo",
      category_id: categoryIds[0], // Hardware
      sku: "LOG-MX-001",
      quantity_available: 20,
      quantity_reserved: 0,
      unit_price: 149.99,
      location: "IT Storage Room",
      image_url:
        "https://resource.logitech.com/content/dam/logitech/en/products/combos/mx-keys-combo/gallery/mx-keys-combo-gallery-1.png",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[11],
      name: "27-inch 4K Monitor",
      description: "Dell UltraSharp 27-inch 4K monitor with USB-C connectivity",
      category_id: categoryIds[0], // Hardware
      sku: "DELL-MON-001",
      quantity_available: 12,
      quantity_reserved: 2,
      unit_price: 499.99,
      location: "IT Storage Room",
      image_url:
        "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/u-series/u2720q/global-spi/monitor-u2720q-campaign-hero-504x350-ng.psd?fmt=jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[12],
      name: "Windows 11 Pro License",
      description: "Windows 11 Professional edition license key",
      category_id: categoryIds[1], // Software
      sku: "MS-WIN11-001",
      quantity_available: 30,
      quantity_reserved: 0,
      unit_price: 199.99,
      location: "Digital Inventory",
      image_url:
        "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWBrzy?ver=85d4",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[13],
      name: "Premium Ballpoint Pens",
      description: "Box of 12 premium ballpoint pens, black ink",
      category_id: categoryIds[2], // Office Supplies
      sku: "PEN-001",
      quantity_available: 200,
      quantity_reserved: 0,
      unit_price: 24.99,
      location: "Supply Closet",
      image_url:
        "https://m.media-amazon.com/images/I/71nJxZ9AUrL._AC_UF894,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[14],
      name: "Conference Table",
      description: "10-person oval conference table with cable management",
      category_id: categoryIds[3], // Furniture
      sku: "TABLE-001",
      quantity_available: 3,
      quantity_reserved: 0,
      unit_price: 1299.99,
      location: "Warehouse B",
      image_url:
        "https://m.media-amazon.com/images/I/61sMkiPsErL._AC_UF894,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[15],
      name: "Leadership Training Course",
      description: "Three-day leadership development program for managers",
      category_id: categoryIds[4], // Training
      sku: "TRAIN-LEAD-001",
      quantity_available: 8,
      quantity_reserved: 2,
      unit_price: 2000.0,
      location: "Training Center",
      image_url:
        "https://img.freepik.com/free-vector/gradient-leadership-concept_23-2149166905.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[16],
      name: "External SSD Drive",
      description: "1TB portable SSD drive with USB-C connection",
      category_id: categoryIds[0], // Hardware
      sku: "SSD-001",
      quantity_available: 15,
      quantity_reserved: 0,
      unit_price: 149.99,
      location: "IT Storage Room",
      image_url:
        "https://m.media-amazon.com/images/I/81WFOh4QRcL._AC_UF894,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[17],
      name: "Antivirus Software License",
      description: "Enterprise antivirus software license, 1-year subscription",
      category_id: categoryIds[1], // Software
      sku: "AV-001",
      quantity_available: 100,
      quantity_reserved: 0,
      unit_price: 49.99,
      location: "Digital Inventory",
      image_url:
        "https://img.freepik.com/free-vector/cyber-security-concept_23-2148532223.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[18],
      name: "Premium Notebooks",
      description: "Pack of 5 hardcover notebooks, lined pages",
      category_id: categoryIds[2], // Office Supplies
      sku: "NOTE-001",
      quantity_available: 75,
      quantity_reserved: 0,
      unit_price: 29.99,
      location: "Supply Closet",
      image_url:
        "https://m.media-amazon.com/images/I/71JDAPnlCSL._AC_UF894,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
    {
      id: inventoryItemIds[19],
      name: "Bookshelf",
      description: "5-shelf bookcase for office or meeting room",
      category_id: categoryIds[3], // Furniture
      sku: "SHELF-001",
      quantity_available: 6,
      quantity_reserved: 0,
      unit_price: 199.99,
      location: "Warehouse B",
      image_url:
        "https://m.media-amazon.com/images/I/71LKH-IDmYL._AC_UF894,1000_QL80_.jpg",
      created_at: randomDate(90),
      updated_at: randomDate(30),
    },
  ];

  // Create the mock data object
  const mockData = {
    users,
    categories,
    item_requests: itemRequests,
    comments,
    notifications,
    inventory_items: inventoryItems,
  };

  // Create directory if it doesn't exist
  await fs.mkdir(path.join(process.cwd(), "src", "data"), { recursive: true });

  // Save as JSON
  await fs.writeFile(
    path.join(process.cwd(), "src", "data", "mockData.json"),
    JSON.stringify(mockData, null, 2)
  );

  // Generate SQL insert statements
  let sqlOutput = "";

  // Add drop table statements (in reverse order to handle foreign keys)
  sqlOutput += "SET FOREIGN_KEY_CHECKS=0;\n\n";
  sqlOutput += "TRUNCATE TABLE notifications;\n";
  sqlOutput += "TRUNCATE TABLE comments;\n";
  sqlOutput += "TRUNCATE TABLE item_requests;\n";
  sqlOutput += "TRUNCATE TABLE inventory_items;\n";
  sqlOutput += "TRUNCATE TABLE categories;\n";
  sqlOutput += "TRUNCATE TABLE users;\n\n";
  sqlOutput += "SET FOREIGN_KEY_CHECKS=1;\n\n";

  // Users insert
  sqlOutput += "-- Insert users\n";
  sqlOutput +=
    "INSERT INTO users (id, name, email, password, role, avatar_url, department, created_at) VALUES\n";
  sqlOutput += users
    .map(
      (user) =>
        `('${user.id}', '${user.name}', '${user.email}', '${user.password}', '${user.role}', '${user.avatar_url}', '${user.department}', '${user.created_at}')`
    )
    .join(",\n");
  sqlOutput += ";\n\n";

  // Categories insert
  sqlOutput += "-- Insert categories\n";
  sqlOutput +=
    "INSERT INTO categories (id, name, description, created_at) VALUES\n";
  sqlOutput += categories
    .map(
      (category) =>
        `('${category.id}', '${category.name}', '${category.description}', '${category.created_at}')`
    )
    .join(",\n");
  sqlOutput += ";\n\n";

  // Item requests insert
  sqlOutput += "-- Insert item requests\n";
  sqlOutput +=
    "INSERT INTO item_requests (id, title, description, category_id, priority, status, user_id, created_at, updated_at, approved_at, approved_by, rejected_at, rejected_by, rejection_reason, fulfillment_date, quantity) VALUES\n";
  sqlOutput += itemRequests
    .map((req) => {
      const approvedAt = req.approved_at ? `'${req.approved_at}'` : "NULL";
      const approvedBy = req.approved_by ? `'${req.approved_by}'` : "NULL";
      const rejectedAt = req.rejected_at ? `'${req.rejected_at}'` : "NULL";
      const rejectedBy = req.rejected_by ? `'${req.rejected_by}'` : "NULL";
      const rejectionReason = req.rejection_reason
        ? `'${req.rejection_reason}'`
        : "NULL";
      const fulfillmentDate = req.fulfillment_date
        ? `'${req.fulfillment_date}'`
        : "NULL";

      return `('${req.id}', '${req.title}', '${req.description}', '${req.category_id}', '${req.priority}', '${req.status}', '${req.user_id}', '${req.created_at}', '${req.updated_at}', ${approvedAt}, ${approvedBy}, ${rejectedAt}, ${rejectedBy}, ${rejectionReason}, ${fulfillmentDate}, ${req.quantity})`;
    })
    .join(",\n");
  sqlOutput += ";\n\n";

  // Comments insert
  sqlOutput += "-- Insert comments\n";
  sqlOutput +=
    "INSERT INTO comments (id, request_id, user_id, content, created_at) VALUES\n";
  sqlOutput += comments
    .map(
      (comment) =>
        `('${comment.id}', '${comment.request_id}', '${
          comment.user_id
        }', '${comment.content.replace(/'/g, "''")}', '${comment.created_at}')`
    )
    .join(",\n");
  sqlOutput += ";\n\n";

  // Notifications insert
  sqlOutput += "-- Insert notifications\n";
  sqlOutput +=
    "INSERT INTO notifications (id, user_id, type, message, is_read, created_at, related_item_id) VALUES\n";
  sqlOutput += notifications
    .map(
      (notification) =>
        `('${notification.id}', '${notification.user_id}', '${
          notification.type
        }', '${notification.message.replace(/'/g, "''")}', ${
          notification.is_read
        }, '${notification.created_at}', '${notification.related_item_id}')`
    )
    .join(",\n");
  sqlOutput += ";\n\n";

  // Inventory items insert
  sqlOutput += "-- Insert inventory items\n";
  sqlOutput +=
    "INSERT INTO inventory_items (id, name, description, category_id, sku, quantity_available, quantity_reserved, unit_price, location, image_url, created_at, updated_at) VALUES\n";
  sqlOutput += inventoryItems
    .map((item) => {
      return `('${item.id}', '${item.name}', '${item.description.replace(
        /'/g,
        "''"
      )}', '${item.category_id}', '${item.sku}', ${item.quantity_available}, ${
        item.quantity_reserved
      }, ${item.unit_price}, '${item.location}', '${item.image_url}', '${
        item.created_at
      }', '${item.updated_at}')`;
    })
    .join(",\n");
  sqlOutput += ";\n\n";

  // Save SQL file
  await fs.writeFile(
    path.join(process.cwd(), "src", "data", "mockData.sql"),
    sqlOutput
  );

  console.log("✅ Mock data generated successfully!");
  console.log(
    `- JSON data saved to: ${path.join("src", "data", "mockData.json")}`
  );
  console.log(
    `- SQL insert statements saved to: ${path.join(
      "src",
      "data",
      "mockData.sql"
    )}`
  );
}

generateMockData().catch((err) => {
  console.error("Error generating mock data:", err);
  process.exit(1);
});
