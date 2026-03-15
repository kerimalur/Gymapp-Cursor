import { FoodItem } from '@/types';

export const foodDatabase: FoodItem[] = [
  // Fleisch
  { id: 'food1', name: 'Hühnerbrust', calories: 165, protein: 31, carbs: 0, fats: 3.6, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { id: 'food2', name: 'Putenbrust', calories: 135, protein: 30, carbs: 0, fats: 1, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { id: 'food3', name: 'Rinderfilet', calories: 271, protein: 26, carbs: 0, fats: 18, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { id: 'food4', name: 'Rinderhackfleisch (mager)', calories: 250, protein: 26, carbs: 0, fats: 17, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { id: 'food5', name: 'Schweinefilet', calories: 143, protein: 27, carbs: 0, fats: 3.5, servingSize: 100, servingUnit: 'g', category: 'meat' },

  // Fisch
  { id: 'food6', name: 'Lachs', calories: 208, protein: 20, carbs: 0, fats: 13, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food7', name: 'Thunfisch (Dose in Wasser)', calories: 116, protein: 26, carbs: 0, fats: 1, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food8', name: 'Kabeljau', calories: 82, protein: 18, carbs: 0, fats: 0.7, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food9', name: 'Garnelen', calories: 99, protein: 24, carbs: 0, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food10', name: 'Forelle', calories: 119, protein: 20, carbs: 0, fats: 3.5, servingSize: 100, servingUnit: 'g', category: 'fish' },

  // Milchprodukte
  { id: 'food11', name: 'Magerquark', calories: 67, protein: 12, carbs: 4, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food12', name: 'Griechischer Joghurt (0%)', calories: 59, protein: 10, carbs: 4, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food13', name: 'Skyr', calories: 63, protein: 11, carbs: 4, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food14', name: 'Hüttenkäse', calories: 98, protein: 11, carbs: 3.4, fats: 4.3, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food15', name: 'Milch (1,5%)', calories: 47, protein: 3.4, carbs: 4.9, fats: 1.5, servingSize: 100, servingUnit: 'ml', category: 'dairy' },
  { id: 'food16', name: 'Eier', calories: 155, protein: 13, carbs: 1.1, fats: 11, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food17', name: 'Whey Protein', calories: 380, protein: 80, carbs: 8, fats: 5, servingSize: 100, servingUnit: 'g', category: 'supplements' },

  // Gemüse
  { id: 'food18', name: 'Brokkoli', calories: 34, protein: 2.8, carbs: 7, fats: 0.4, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food19', name: 'Spinat', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food20', name: 'Paprika', calories: 31, protein: 1, carbs: 6, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food21', name: 'Tomaten', calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food22', name: 'Gurke', calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food23', name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food24', name: 'Blumenkohl', calories: 25, protein: 1.9, carbs: 5, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food25', name: 'Grüne Bohnen', calories: 31, protein: 1.8, carbs: 7, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'vegetables' },

  // Kohlenhydrate/Beilagen
  { id: 'food26', name: 'Reis (gekocht)', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food27', name: 'Kartoffeln (gekocht)', calories: 77, protein: 2, carbs: 17, fats: 0.1, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food28', name: 'Süßkartoffeln', calories: 86, protein: 1.6, carbs: 20, fats: 0.1, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food29', name: 'Vollkornnudeln (gekocht)', calories: 131, protein: 5, carbs: 26, fats: 1, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food30', name: 'Haferflocken', calories: 379, protein: 13, carbs: 68, fats: 7, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food31', name: 'Quinoa (gekocht)', calories: 120, protein: 4.4, carbs: 21, fats: 1.9, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food32', name: 'Vollkornbrot', calories: 247, protein: 9, carbs: 46, fats: 3.5, servingSize: 100, servingUnit: 'g', category: 'grains' },

  // Obst
  { id: 'food33', name: 'Banane', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food34', name: 'Apfel', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food35', name: 'Beeren (gemischt)', calories: 57, protein: 0.7, carbs: 14, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food36', name: 'Erdbeeren', calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'fruits' },

  // Nüsse & Samen
  { id: 'food37', name: 'Mandeln', calories: 579, protein: 21, carbs: 22, fats: 50, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food38', name: 'Erdnussbutter', calories: 588, protein: 25, carbs: 20, fats: 50, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food39', name: 'Chiasamen', calories: 486, protein: 17, carbs: 42, fats: 31, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food40', name: 'Walnüsse', calories: 654, protein: 15, carbs: 14, fats: 65, servingSize: 100, servingUnit: 'g', category: 'snacks' },

  // Fette/Öle
  { id: 'food41', name: 'Olivenöl', calories: 884, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'ml', category: 'other' },
  { id: 'food42', name: 'Avocado', calories: 160, protein: 2, carbs: 9, fats: 15, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food43', name: 'Kokosöl', calories: 862, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'ml', category: 'other' },
  { id: 'food44', name: 'Leinöl', calories: 884, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'ml', category: 'other' },

  // Mehr Fleisch
  { id: 'food45', name: 'Truthahn', calories: 135, protein: 29, carbs: 0, fats: 1, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { id: 'food46', name: 'Ente', calories: 337, protein: 19, carbs: 0, fats: 28, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { id: 'food47', name: 'Lamm', calories: 294, protein: 25, carbs: 0, fats: 21, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { id: 'food48', name: 'Wild', calories: 130, protein: 28, carbs: 0, fats: 2, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { id: 'food49', name: 'Hackfleisch (Pute)', calories: 149, protein: 29, carbs: 0, fats: 3, servingSize: 100, servingUnit: 'g', category: 'meat' },
  
  // Mehr Fisch & Meeresfrüchte
  { id: 'food50', name: 'Makrele', calories: 205, protein: 19, carbs: 0, fats: 14, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food51', name: 'Hering', calories: 158, protein: 18, carbs: 0, fats: 9, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food52', name: 'Sardinen', calories: 208, protein: 25, carbs: 0, fats: 11, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food53', name: 'Muscheln', calories: 86, protein: 18, carbs: 4, fats: 1, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food54', name: 'Tintenfisch', calories: 92, protein: 16, carbs: 3, fats: 1, servingSize: 100, servingUnit: 'g', category: 'fish' },
  { id: 'food55', name: 'Krabben', calories: 97, protein: 19, carbs: 0, fats: 1, servingSize: 100, servingUnit: 'g', category: 'fish' },
  
  // Mehr Milchprodukte
  { id: 'food56', name: 'Feta', calories: 264, protein: 14, carbs: 4, fats: 21, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food57', name: 'Mozzarella', calories: 280, protein: 18, carbs: 3, fats: 22, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food58', name: 'Parmesan', calories: 431, protein: 38, carbs: 4, fats: 29, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food59', name: 'Gouda', calories: 356, protein: 25, carbs: 2, fats: 27, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { id: 'food60', name: 'Buttermilch', calories: 40, protein: 3.3, carbs: 4, fats: 1, servingSize: 100, servingUnit: 'ml', category: 'dairy' },
  { id: 'food61', name: 'Kefir', calories: 41, protein: 3, carbs: 4, fats: 1, servingSize: 100, servingUnit: 'ml', category: 'dairy' },
  
  // Mehr Gemüse
  { id: 'food62', name: 'Aubergine', calories: 25, protein: 1, carbs: 6, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food63', name: 'Champignons', calories: 22, protein: 3.1, carbs: 0.6, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food64', name: 'Spargel', calories: 20, protein: 2.2, carbs: 3.9, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food65', name: 'Sellerie', calories: 14, protein: 0.7, carbs: 3, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food66', name: 'Radieschen', calories: 16, protein: 0.7, carbs: 3.4, fats: 0.1, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food67', name: 'Kürbis', calories: 26, protein: 1, carbs: 7, fats: 0.1, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food68', name: 'Kohlrabi', calories: 27, protein: 2, carbs: 6, fats: 0.1, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food69', name: 'Rosenkohl', calories: 43, protein: 3.4, carbs: 9, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  { id: 'food70', name: 'Lauch', calories: 61, protein: 1.5, carbs: 14, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'vegetables' },
  
  // Mehr Kohlenhydrate
  { id: 'food71', name: 'Couscous', calories: 112, protein: 3.8, carbs: 23, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food72', name: 'Bulgur', calories: 342, protein: 12, carbs: 76, fats: 1.3, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food73', name: 'Amaranth', calories: 371, protein: 14, carbs: 65, fats: 7, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food74', name: 'Hirse', calories: 378, protein: 11, carbs: 73, fats: 4, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food75', name: 'Pumpernickel', calories: 250, protein: 7, carbs: 47, fats: 2, servingSize: 100, servingUnit: 'g', category: 'grains' },
  { id: 'food76', name: 'Reiswaffeln', calories: 387, protein: 8, carbs: 82, fats: 3, servingSize: 100, servingUnit: 'g', category: 'grains' },
  
  // Mehr Obst
  { id: 'food77', name: 'Kiwi', calories: 61, protein: 1.1, carbs: 15, fats: 0.5, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food78', name: 'Ananas', calories: 50, protein: 0.5, carbs: 13, fats: 0.1, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food79', name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fats: 0.4, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food80', name: 'Pfirsich', calories: 39, protein: 0.9, carbs: 10, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food81', name: 'Wassermelone', calories: 30, protein: 0.6, carbs: 8, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food82', name: 'Heidelbeeren', calories: 57, protein: 0.7, carbs: 14, fats: 0.3, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food83', name: 'Himbeeren', calories: 52, protein: 1.2, carbs: 12, fats: 0.7, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food84', name: 'Brombeeren', calories: 43, protein: 1.4, carbs: 10, fats: 0.5, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food85', name: 'Kirschen', calories: 63, protein: 1, carbs: 16, fats: 0.2, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  { id: 'food86', name: 'Birne', calories: 57, protein: 0.4, carbs: 15, fats: 0.1, servingSize: 100, servingUnit: 'g', category: 'fruits' },
  
  // Mehr Nüsse & Samen
  { id: 'food87', name: 'Cashews', calories: 553, protein: 18, carbs: 30, fats: 44, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food88', name: 'Pistazien', calories: 560, protein: 20, carbs: 28, fats: 45, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food89', name: 'Haselnüsse', calories: 628, protein: 15, carbs: 17, fats: 61, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food90', name: 'Macadamia', calories: 718, protein: 8, carbs: 14, fats: 76, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food91', name: 'Pekannüsse', calories: 691, protein: 9, carbs: 14, fats: 72, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food92', name: 'Sonnenblumenkerne', calories: 584, protein: 21, carbs: 20, fats: 51, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food93', name: 'Kürbiskerne', calories: 559, protein: 30, carbs: 15, fats: 49, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food94', name: 'Leinsamen', calories: 534, protein: 18, carbs: 29, fats: 42, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  { id: 'food95', name: 'Sesam', calories: 573, protein: 18, carbs: 23, fats: 50, servingSize: 100, servingUnit: 'g', category: 'snacks' },
  
  // Getränke & Extras
  { id: 'food96', name: 'Mandelmilch (ungesüßt)', calories: 24, protein: 1, carbs: 1, fats: 2, servingSize: 100, servingUnit: 'ml', category: 'drinks' },
  { id: 'food97', name: 'Hafermilch', calories: 47, protein: 1, carbs: 7, fats: 1.5, servingSize: 100, servingUnit: 'ml', category: 'drinks' },
  { id: 'food98', name: 'Sojamilch', calories: 54, protein: 3, carbs: 6, fats: 1.8, servingSize: 100, servingUnit: 'ml', category: 'drinks' },
  { id: 'food99', name: 'Kokosmilch', calories: 230, protein: 2, carbs: 6, fats: 24, servingSize: 100, servingUnit: 'ml', category: 'drinks' },
  { id: 'food100', name: 'Proteinriegel', calories: 380, protein: 20, carbs: 40, fats: 12, servingSize: 60, servingUnit: 'g', category: 'supplements' },
  { id: 'food101', name: 'Casein Protein', calories: 350, protein: 75, carbs: 10, fats: 2, servingSize: 100, servingUnit: 'g', category: 'supplements' },
  { id: 'food102', name: 'BCAA', calories: 0, protein: 0, carbs: 0, fats: 0, servingSize: 5, servingUnit: 'g', category: 'supplements' },
  { id: 'food103', name: 'Honig', calories: 304, protein: 0.3, carbs: 82, fats: 0, servingSize: 100, servingUnit: 'g', category: 'other' },
  { id: 'food104', name: 'Ahornsirup', calories: 260, protein: 0, carbs: 67, fats: 0.2, servingSize: 100, servingUnit: 'ml', category: 'other' },
  { id: 'food105', name: 'Hummus', calories: 166, protein: 8, carbs: 14, fats: 10, servingSize: 100, servingUnit: 'g', category: 'other' },
];
