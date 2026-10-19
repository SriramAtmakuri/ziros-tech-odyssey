// SQL Island starting database — a village network scrambled by a hurricane.
export const SQL_ISLAND_SCHEMA = `
CREATE TABLE village (
  villageid INTEGER PRIMARY KEY,
  name TEXT,
  chief_id INTEGER,
  population INTEGER,
  founded_year INTEGER
);

CREATE TABLE inhabitant (
  personid INTEGER PRIMARY KEY,
  name TEXT,
  villageid INTEGER,
  gender TEXT,
  job TEXT,
  gold INTEGER,
  state TEXT,
  age INTEGER
);

CREATE TABLE item (
  itemid INTEGER PRIMARY KEY,
  name TEXT,
  owner_id INTEGER,
  value INTEGER,
  found_location TEXT
);

CREATE TABLE quest (
  questid INTEGER PRIMARY KEY,
  title TEXT,
  giver_id INTEGER,
  reward_gold INTEGER,
  completed INTEGER,
  difficulty TEXT
);

CREATE TABLE trade (
  tradeid INTEGER PRIMARY KEY,
  seller_id INTEGER,
  buyer_id INTEGER,
  item_id INTEGER,
  price INTEGER,
  trade_date TEXT
);

INSERT INTO village VALUES (1, 'Coral Bay', 1, 42, 1850);
INSERT INTO village VALUES (2, 'Palm Hollow', 5, 30, 1900);
INSERT INTO village VALUES (3, 'Driftwood', 9, 18, 1975);
INSERT INTO village VALUES (4, 'Stormrest', 12, 25, 1920);

INSERT INTO inhabitant VALUES (1, 'Kai', 1, 'M', 'chief', 500, 'friendly', 45);
INSERT INTO inhabitant VALUES (2, 'Moana', 1, 'F', 'fisherman', 120, 'friendly', 28);
INSERT INTO inhabitant VALUES (3, 'Tane', 1, 'M', 'blacksmith', 300, 'friendly', 34);
INSERT INTO inhabitant VALUES (4, 'Ana', 1, 'F', 'trader', 250, 'unfriendly', 40);
INSERT INTO inhabitant VALUES (5, 'Rongo', 2, 'M', 'chief', 400, 'friendly', 50);
INSERT INTO inhabitant VALUES (6, 'Hina', 2, 'F', 'healer', 180, 'friendly', 29);
INSERT INTO inhabitant VALUES (7, 'Maui', 2, 'M', 'goldsmith', 350, 'neutral', 38);
INSERT INTO inhabitant VALUES (8, 'Lani', 2, 'F', 'farmer', 90, 'friendly', 22);
INSERT INTO inhabitant VALUES (9, 'Koa', 3, 'M', 'chief', 220, 'friendly', 60);
INSERT INTO inhabitant VALUES (10, 'Nalani', 3, 'F', 'fisherman', 60, 'unfriendly', 19);
INSERT INTO inhabitant VALUES (11, 'Iolana', 3, 'F', 'warrior', 150, 'friendly', 26);
INSERT INTO inhabitant VALUES (12, 'Kimo', 4, 'M', 'chief', 280, 'neutral', 55);
INSERT INTO inhabitant VALUES (13, 'Leilani', 4, 'F', 'blacksmith', 310, 'friendly', 31);
INSERT INTO inhabitant VALUES (14, 'Pua', 4, 'F', 'trader', 200, 'unfriendly', 44);
INSERT INTO inhabitant VALUES (15, 'Keoni', 4, 'M', 'farmer', 70, 'friendly', 24);

INSERT INTO item VALUES (1, 'Golden Idol', 1, 500, 'Coral Bay');
INSERT INTO item VALUES (2, 'Fishing Net', 2, 20, 'Coral Bay');
INSERT INTO item VALUES (3, 'Iron Sword', NULL, 150, 'Driftwood Cave');
INSERT INTO item VALUES (4, 'Ancient Map', NULL, 300, 'Stormrest Cliffs');
INSERT INTO item VALUES (5, 'Pearl Necklace', 4, 220, 'Coral Bay');
INSERT INTO item VALUES (6, 'Healing Herb', 6, 15, 'Palm Hollow');
INSERT INTO item VALUES (7, 'War Club', 11, 90, 'Driftwood');
INSERT INTO item VALUES (8, 'Silver Coin Pouch', NULL, 60, 'Stormrest');
INSERT INTO item VALUES (9, 'Ceremonial Mask', 12, 180, 'Stormrest');
INSERT INTO item VALUES (10, 'Lost Compass', NULL, 40, 'Coral Bay');

INSERT INTO quest VALUES (1, 'Find the Golden Idol', 1, 100, 0, 'easy');
INSERT INTO quest VALUES (2, 'Clear Driftwood Cave', 9, 200, 1, 'medium');
INSERT INTO quest VALUES (3, 'Deliver Healing Herbs', 6, 50, 0, 'easy');
INSERT INTO quest VALUES (4, 'Map the Storm Cliffs', 12, 250, 0, 'hard');
INSERT INTO quest VALUES (5, 'Broker Peace with Driftwood', 5, 300, 0, 'hard');
INSERT INTO quest VALUES (6, 'Recover Lost Compass', 4, 40, 1, 'easy');

INSERT INTO trade VALUES (1, 3, 1, 1, 480, '2024-01-05');
INSERT INTO trade VALUES (2, 4, 6, 5, 210, '2024-01-10');
INSERT INTO trade VALUES (3, 7, 11, 7, 85, '2024-02-01');
INSERT INTO trade VALUES (4, 12, 9, 9, 175, '2024-02-15');
INSERT INTO trade VALUES (5, 2, 8, 2, 18, '2024-03-01');
INSERT INTO trade VALUES (6, 13, 14, 8, 55, '2024-03-20');
INSERT INTO trade VALUES (7, 1, 5, 4, 290, '2024-04-02');
INSERT INTO trade VALUES (8, 6, 10, 6, 12, '2024-04-18');
`
