-- Brew Beans — Addon Catalog + Menu Item Linkage
-- Run this once in the Supabase SQL Editor for the project
-- js/supabase-config.js actually points to (confirmed live via its public
-- anon key: project ref rtqbpviegxwgaknmrrsg).
--
-- Why this is needed: the customization modal reads addon groups through
-- the menu_item_addon_groups join table (which menu item -> which addon
-- groups). That table was completely empty, which is the entire reason
-- the modal has been showing "This item is ready to go" with no options
-- for every item — not a frontend bug, a missing data step.
--
-- What this does (all idempotent — safe to run more than once):
--   1. Fills out the existing "Temperature" group with the full set of
--      preferences (it only had Hot/Iced before).
--   2. Creates two groups that didn't exist yet: "Coffee Blend" and
--      "Sweetness Level".
--   3. Links every hot-coffee, cold-coffee, and frappe menu item to the
--      six relevant groups: Temperature, Size, Milk Type, Coffee Blend,
--      Sweetness Level, Extras. Desserts and summer-coolers are left
--      unlinked on purpose (a cookie doesn't need a milk type) — they'll
--      keep showing the graceful "ready to go" state.
--
-- Prices: where none were specified when this catalog was requested
-- (Signature Roast, Sweetness Level, the new Temperature options), it's
-- seeded free (Rs. 0) rather than guessed — adjust in the admin
-- dashboard's addon editor if any of these should be paid.

-- 1) Round out the existing Temperature group
INSERT INTO addons (group_id, name, price, is_available)
SELECT g.id, x.name, x.price, true
FROM addon_groups g
CROSS JOIN (VALUES
    ('Extra Cold', 0), ('Cold', 0), ('Room Temperature', 0), ('Warm', 0)
) AS x(name, price)
WHERE g.name = 'Temperature'
AND NOT EXISTS (SELECT 1 FROM addons a WHERE a.group_id = g.id AND a.name = x.name);

-- 2) New group: Coffee Blend
INSERT INTO addon_groups (name, is_required, max_selections)
SELECT 'Coffee Blend', false, 1
WHERE NOT EXISTS (SELECT 1 FROM addon_groups WHERE name = 'Coffee Blend');

INSERT INTO addons (group_id, name, price, is_available)
SELECT (SELECT id FROM addon_groups WHERE name = 'Coffee Blend' LIMIT 1), x.name, x.price, true
FROM (VALUES
    ('House Blend', 0), ('Ethiopian Single Origin', 150), ('Colombian Supremo', 180), ('Signature Roast', 0)
) AS x(name, price)
WHERE NOT EXISTS (
    SELECT 1 FROM addons a
    WHERE a.group_id = (SELECT id FROM addon_groups WHERE name = 'Coffee Blend' LIMIT 1)
    AND a.name = x.name
);

-- 3) New group: Sweetness Level
INSERT INTO addon_groups (name, is_required, max_selections)
SELECT 'Sweetness Level', false, 1
WHERE NOT EXISTS (SELECT 1 FROM addon_groups WHERE name = 'Sweetness Level');

INSERT INTO addons (group_id, name, price, is_available)
SELECT (SELECT id FROM addon_groups WHERE name = 'Sweetness Level' LIMIT 1), x.name, x.price, true
FROM (VALUES
    ('No Sugar', 0), ('Less Sugar', 0), ('Normal', 0), ('Extra Sweet', 0)
) AS x(name, price)
WHERE NOT EXISTS (
    SELECT 1 FROM addons a
    WHERE a.group_id = (SELECT id FROM addon_groups WHERE name = 'Sweetness Level' LIMIT 1)
    AND a.name = x.name
);

-- 4) Link every hot-coffee / cold-coffee / frappe item to all six groups
INSERT INTO menu_item_addon_groups (menu_item_id, addon_group_id)
SELECT m.id, g.id
FROM menu_items m
CROSS JOIN addon_groups g
WHERE m.category IN ('hot-coffee', 'cold-coffee', 'frappes')
AND g.name IN ('Temperature', 'Size', 'Milk Type', 'Coffee Blend', 'Sweetness Level', 'Extras')
AND NOT EXISTS (
    SELECT 1 FROM menu_item_addon_groups link
    WHERE link.menu_item_id = m.id AND link.addon_group_id = g.id
);

-- Verify: should show 6 rows per hot-coffee/cold-coffee/frappe item
SELECT m.name AS menu_item, g.name AS addon_group, g.is_required
FROM menu_item_addon_groups link
JOIN menu_items m ON m.id = link.menu_item_id
JOIN addon_groups g ON g.id = link.addon_group_id
ORDER BY m.name, g.name;
