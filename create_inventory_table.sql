-- Create inventory_items table
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` varchar(36) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `quantity_available` int(11) NOT NULL DEFAULT 0,
  `quantity_reserved` int(11) NOT NULL DEFAULT 0,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Insert sample inventory items
INSERT INTO `inventory_items` (`id`, `name`, `description`, `category_id`, `sku`, `quantity_available`, `quantity_reserved`, `unit_price`, `location`, `created_at`)
SELECT 
  UUID(), 
  'Dell XPS 13', 
  '13-inch laptop with Intel Core i7', 
  id, 
  'DELL-XPS-13', 
  5, 
  0, 
  1299.99, 
  'Warehouse A', 
  NOW()
FROM `categories` 
WHERE `name` = 'IT Equipment'
LIMIT 1;

INSERT INTO `inventory_items` (`id`, `name`, `description`, `category_id`, `sku`, `quantity_available`, `quantity_reserved`, `unit_price`, `location`, `created_at`)
SELECT 
  UUID(), 
  'HP Monitor 27-inch', 
  '27-inch 4K monitor', 
  id, 
  'HP-MON-27', 
  10, 
  2, 
  349.99, 
  'Warehouse B', 
  NOW()
FROM `categories` 
WHERE `name` = 'IT Equipment'
LIMIT 1;

INSERT INTO `inventory_items` (`id`, `name`, `description`, `category_id`, `sku`, `quantity_available`, `quantity_reserved`, `unit_price`, `location`, `created_at`)
SELECT 
  UUID(), 
  'Office Chair', 
  'Ergonomic office chair', 
  id, 
  'CHAIR-ERGO-1', 
  15, 
  3, 
  199.99, 
  'Warehouse C', 
  NOW()
FROM `categories` 
WHERE `name` = 'Furniture'
LIMIT 1;

INSERT INTO `inventory_items` (`id`, `name`, `description`, `category_id`, `sku`, `quantity_available`, `quantity_reserved`, `unit_price`, `location`, `created_at`)
SELECT 
  UUID(), 
  'Desk', 
  'Standard office desk', 
  id, 
  'DESK-STD-1', 
  8, 
  1, 
  299.99, 
  'Warehouse C', 
  NOW()
FROM `categories` 
WHERE `name` = 'Furniture'
LIMIT 1;

INSERT INTO `inventory_items` (`id`, `name`, `description`, `category_id`, `sku`, `quantity_available`, `quantity_reserved`, `unit_price`, `location`, `created_at`)
SELECT 
  UUID(), 
  'Notebook', 
  'Standard notebook', 
  id, 
  'NB-STD-1', 
  100, 
  0, 
  4.99, 
  'Warehouse A', 
  NOW()
FROM `categories` 
WHERE `name` = 'Office Supplies'
LIMIT 1;

INSERT INTO `inventory_items` (`id`, `name`, `description`, `category_id`, `sku`, `quantity_available`, `quantity_reserved`, `unit_price`, `location`, `created_at`)
SELECT 
  UUID(), 
  'Pen Set', 
  'Set of 10 pens', 
  id, 
  'PEN-SET-10', 
  50, 
  5, 
  9.99, 
  'Warehouse A', 
  NOW()
FROM `categories` 
WHERE `name` = 'Office Supplies'
LIMIT 1;
