const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory storage
const users = {};
const combatSessions = {};

// Item pool - only using actual images provided
const itemPool = {
  weapons: [
    // E-Tier (Basic)
    { name: 'Dawnbreaker Blade', rarity: 'E', stats: { str: 2 }, description: 'A simple but effective blade forged at first light', icon: 'itempngs/itempngs/basicsword.png' },
    { name: 'Earthshaker Cleaver', rarity: 'E', stats: { str: 3 }, description: 'A sturdy bronze blade that trembles the ground', icon: 'itempngs/itempngs/bronzesword.png' },
    { name: 'Shadowstrike Dagger', rarity: 'E', stats: { str: 2, agi: 1 }, description: 'A swift blade for quick strikes', icon: 'itempngs/itempngs/daggar.png' },
    
    // D-Tier (Common)
    { name: 'Frostwind Saber', rarity: 'D', stats: { str: 4, agi: 1 }, description: 'A magical blue-tinted blade blessed by winter winds', icon: 'itempngs/itempngs/bluesword.png' },
    { name: 'Rosebane Rapier', rarity: 'D', stats: { str: 5, per: 1 }, description: 'A mystical pink-hued blade that cuts through illusions', icon: 'itempngs/itempngs/pinksword.png' },
    { name: 'Soulreaper Scythe', rarity: 'D', stats: { str: 5, int: 1 }, description: 'A curved blade that harvests more than grain', icon: 'itempngs/itempngs/bluescythe.png' },
    { name: 'Twin Fang Blades', rarity: 'D', stats: { str: 4, agi: 2 }, description: 'Dual wielded blades that strike as one', icon: 'itempngs/itempngs/dualies.png' },
    
    // C-Tier (Uncommon)
    { name: 'Thornspike Greatsword', rarity: 'C', stats: { str: 6, vit: 2 }, description: 'An emerald-colored blade wreathed in nature\'s fury', icon: 'itempngs/itempngs/greensword.png' },
    { name: 'Tidebreaker Cutlass', rarity: 'C', stats: { str: 7, int: 2 }, description: 'A water-blessed blade that flows like the ocean', icon: 'itempngs/itempngs/watersword.png' },
    { name: 'Arcane Spellblade', rarity: 'C', stats: { str: 6, int: 3 }, description: 'A sword infused with magical energies', icon: 'itempngs/itempngs/spellsword.png' },
    { name: 'Colossus Cleaver', rarity: 'C', stats: { str: 8, vit: 1 }, description: 'A massive blade that splits mountains', icon: 'itempngs/itempngs/greatsword.png' },
    
    // B-Tier (Rare)
    { name: 'Inferno\'s Wrath', rarity: 'B', stats: { str: 8, int: 3 }, description: 'An eternally burning blade forged in dragon fire', icon: 'itempngs/itempngs/firesword.png' },
    { name: 'Molten Core Blade', rarity: 'B', stats: { str: 9, vit: 2 }, description: 'A sword forged in the heart of a volcano', icon: 'itempngs/itempngs/lavasword.png' },
    { name: 'Phantom Edge', rarity: 'B', stats: { str: 8, agi: 3 }, description: 'A ghostly blade that phases through armor', icon: 'itempngs/itempngs/ghostsword.png' },
    { name: 'Astral Spirit Sword', rarity: 'B', stats: { str: 7, int: 4 }, description: 'A blade blessed by celestial spirits', icon: 'itempngs/itempngs/spiritsword.png' },
    
    // A-Tier (Epic)
    { name: 'Starfall Excalibur', rarity: 'A', stats: { str: 12, agi: 4 }, description: 'A crystal-clear diamond edge that fell from the heavens', icon: 'itempngs/itempngs/diamond sword.png' },
    { name: 'Diamond Emperor Blade', rarity: 'A', stats: { str: 13, vit: 3 }, description: 'The ultimate crystalline weapon of royalty', icon: 'itempngs/itempngs/diamondsword.png' },
    { name: 'Dragonflame Greatsword', rarity: 'A', stats: { str: 14, int: 4 }, description: 'A colossal blade wreathed in dragon fire', icon: 'itempngs/itempngs/Flaming Greatsword in Pixel Art.png' },
    { name: 'Archmage\'s Scepter', rarity: 'A', stats: { str: 8, int: 8, per: 2 }, description: 'A mystical staff of immense magical power', icon: 'itempngs/itempngs/Mystical Pixelated Staff.png' },
    
    // S-Tier (Legendary)
    { name: 'Demon King\'s Dagger', rarity: 'S', stats: { str: 16, agi: 8, int: 6 }, description: 'The cursed blade of the fallen Demon King, whispers dark secrets', icon: 'itempngs/itempngs/demonkingdagger.png' },
    { name: 'Godslayer\'s Edge', rarity: 'S', stats: { str: 18, agi: 10, vit: 6, int: 4 }, description: 'The ultimate blade capable of slaying gods themselves', icon: 'itempngs/itempngs/stiersowrd.png' }
  ],
  accessories: [
    // RINGS
    // E-Tier (Basic)
    { name: 'Wanderer\'s Band', rarity: 'E', stats: { str: 1 }, description: 'A simple ring worn by travelers', icon: 'itempngs/itempngs/rings/normal ring.png', type: 'ring' },
    { name: 'Cursed Skull Ring', rarity: 'E', stats: { int: 1, per: 1 }, description: 'A ring that brings misfortune to enemies', icon: 'itempngs/itempngs/rings/badone.png', type: 'ring' },
    
    // D-Tier (Common)
    { name: 'Amethyst Dream Ring', rarity: 'D', stats: { int: 2, per: 1 }, description: 'A purple gem that enhances magical focus', icon: 'itempngs/itempngs/rings/amethyst.png', type: 'ring' },
    { name: 'Ruby Bloodstone', rarity: 'D', stats: { str: 2, vit: 1 }, description: 'A crimson ring forged in gold and blood', icon: 'itempngs/itempngs/rings/rubygold.png', type: 'ring' },
    
    // C-Tier (Uncommon)
    { name: 'Diamond Frost Ring', rarity: 'C', stats: { agi: 3, vit: 2 }, description: 'A brilliant diamond ring cold to the touch', icon: 'itempngs/itempngs/rings/diamondring.png', type: 'ring' },
    { name: 'Frostbite Circle', rarity: 'C', stats: { int: 4, agi: 1 }, description: 'An ice-cold ring that freezes the soul', icon: 'itempngs/itempngs/rings/icecold.png', type: 'ring' },
    
    // B-Tier (Rare)
    { name: 'Phoenix Flame Ring', rarity: 'B', stats: { str: 4, int: 3 }, description: 'A ring burning with eternal phoenix fire', icon: 'itempngs/itempngs/rings/fiya.png', type: 'ring' },
    { name: 'Spectral Ghost Band', rarity: 'B', stats: { agi: 4, per: 3 }, description: 'A ring that phases between dimensions', icon: 'itempngs/itempngs/rings/spectral.png', type: 'ring' },
    { name: 'Champion\'s Glory Ring', rarity: 'B', stats: { str: 3, vit: 3, agi: 2 }, description: 'A ring worn by legendary champions', icon: 'itempngs/itempngs/rings/kindagoated.png', type: 'ring' },
    
    // A-Tier (Epic)
    { name: 'Diamond Emperor\'s Seal', rarity: 'A', stats: { str: 5, vit: 4, int: 3 }, description: 'The imperial seal of the diamond throne', icon: 'itempngs/itempngs/rings/diamondone.png', type: 'ring' },
    { name: 'Necromancer\'s Death Ring', rarity: 'A', stats: { int: 6, per: 4, vit: 2 }, description: 'A ring that commands the undead legions', icon: 'itempngs/itempngs/rings/necron.png', type: 'ring' },
    { name: 'Lich King\'s Phylactery', rarity: 'A', stats: { int: 7, str: 3, agi: 3 }, description: 'The soul vessel of an ancient lich lord', icon: 'itempngs/itempngs/rings/necronnnn.png', type: 'ring' },
    
    // S-Tier (Legendary)
    { name: 'Demon King\'s Signet', rarity: 'S', stats: { str: 8, agi: 6, int: 6, vit: 5 }, description: 'The royal seal of the fallen Demon King', icon: 'itempngs/itempngs/rings/demon kingsdagger.png', type: 'ring' },
    { name: 'Infinity\'s End', rarity: 'S', stats: { str: 10, agi: 10, vit: 10, int: 10, per: 10 }, description: 'The ultimate ring that transcends all reality', icon: 'itempngs/itempngs/rings/finalring.png', type: 'ring' },
    
    // NECKLACES
    // E-Tier (Basic)
    { name: 'Simple String Pendant', rarity: 'E', stats: { int: 1 }, description: 'A basic necklace made of string and stone', icon: 'itempngs/necklace/neck1.png', type: 'necklace' },
    { name: 'Wooden Charm Necklace', rarity: 'E', stats: { per: 1 }, description: 'A wooden charm on a leather cord', icon: 'itempngs/necklace/neck2.png', type: 'necklace' },
    
    // D-Tier (Common)
    { name: 'Silver Moon Pendant', rarity: 'D', stats: { int: 2, per: 1 }, description: 'A silver crescent moon pendant', icon: 'itempngs/necklace/neck3.png', type: 'necklace' },
    { name: 'Crystal Shard Necklace', rarity: 'D', stats: { int: 3 }, description: 'A necklace with a glowing crystal shard', icon: 'itempngs/necklace/neck4.png', type: 'necklace' },
    { name: 'Golden Chain of Wisdom', rarity: 'D', stats: { int: 2, vit: 1 }, description: 'An elegant golden chain that enhances wisdom', icon: 'itempngs/necklace/neck5.png', type: 'necklace' },
    
    // C-Tier (Uncommon)
    { name: 'Mystic Pearl Necklace', rarity: 'C', stats: { int: 4, per: 2 }, description: 'A string of mystical pearls', icon: 'itempngs/necklace/neck6.png', type: 'necklace' },
    { name: 'Enchanted Ruby Pendant', rarity: 'C', stats: { str: 3, int: 3 }, description: 'A ruby pendant pulsing with power', icon: 'itempngs/necklace/neck7.png', type: 'necklace' },
    { name: 'Storm Caller\'s Amulet', rarity: 'C', stats: { int: 5, agi: 1 }, description: 'An amulet that crackles with lightning', icon: 'itempngs/necklace/neck8.png', type: 'necklace' },
    
    // B-Tier (Rare)
    { name: 'Phoenix Feather Charm', rarity: 'B', stats: { int: 6, vit: 3 }, description: 'A charm containing an eternal phoenix feather', icon: 'itempngs/necklace/neck9.png', type: 'necklace' },
    { name: 'Archmage\'s Focus Crystal', rarity: 'B', stats: { int: 8, per: 3 }, description: 'A crystal that amplifies magical power', icon: 'itempngs/necklace/neck10.png', type: 'necklace' },
    
    // A-Tier (Epic)
    { name: 'Dragon\'s Eye Medallion', rarity: 'A', stats: { int: 10, str: 4, per: 3 }, description: 'A medallion containing a dragon\'s crystallized eye', icon: 'itempngs/necklace/neck11.png', type: 'necklace' },
    { name: 'Celestial Star Pendant', rarity: 'A', stats: { int: 12, per: 5, vit: 2 }, description: 'A pendant forged from fallen stars', icon: 'itempngs/necklace/neck12.png', type: 'necklace' },
    
    // S-Tier (Legendary)
    { name: 'Void Emperor\'s Soul Chain', rarity: 'S', stats: { int: 15, str: 6, agi: 6, per: 8 }, description: 'The chain that binds the Void Emperor\'s soul', icon: 'itempngs/necklace/neck13.png', type: 'necklace' },
    { name: 'Infinity\'s Wisdom Pendant', rarity: 'S', stats: { int: 18, per: 10, vit: 8, agi: 5 }, description: 'The ultimate pendant of infinite knowledge', icon: 'itempngs/necklace/neck14.png', type: 'necklace' }
  ],
  armor: [
    // E-Tier (Basic)
    { name: 'Novice War Helm', rarity: 'E', stats: { vit: 2 }, description: 'A basic helmet for new warriors', icon: 'itempngs/itempngs/helmets/helmet1.png' },
    { name: 'Verdant Sovereign Circlet', rarity: 'E', stats: { vit: 2, str: 1 }, description: 'A crown forged from emerald crystals', icon: 'itempngs/itempngs/helmets/helmet2.png' },
    { name: 'Emerald Battle Mask', rarity: 'E', stats: { vit: 3 }, description: 'A mask carved from pure emerald', icon: 'itempngs/itempngs/helmets/helmet3.png' },
    
    // D-Tier (Common)
    { name: 'Knight\'s Honor Helm', rarity: 'D', stats: { vit: 4, agi: 1 }, description: 'A helmet worn by honorable knights', icon: 'itempngs/itempngs/helmets/helmet7.png' },
    
    // C-Tier (Uncommon)
    { name: 'Mystic Battle Crown', rarity: 'C', stats: { vit: 5, int: 2 }, description: 'A helmet infused with magical protection', icon: 'itempngs/itempngs/helmets/helmet8.png' },
    { name: 'Templar\'s Sacred Helm', rarity: 'C', stats: { vit: 6, str: 2 }, description: 'Blessed headgear of holy warriors', icon: 'itempngs/itempngs/helmets/helmet9.png' },
    { name: 'Shadow Walker Mask', rarity: 'C', stats: { vit: 5, agi: 2, per: 1 }, description: 'A helm that conceals the wearer in shadows', icon: 'itempngs/itempngs/helmets/helmet10.png' },
    
    // B-Tier (Rare)
    { name: 'Dragonscale War Crown', rarity: 'B', stats: { vit: 7, str: 3, int: 1 }, description: 'Forged from ancient dragon scales', icon: 'itempngs/itempngs/helmets/helmet11.png' },
    { name: 'Paladin\'s Divine Helm', rarity: 'B', stats: { vit: 8, str: 2, per: 2 }, description: 'A helmet blessed by divine light', icon: 'itempngs/itempngs/helmets/helmet14.png' },
    { name: 'Arcane Battlecrown', rarity: 'B', stats: { vit: 6, int: 4, agi: 1 }, description: 'A crown that amplifies magical power', icon: 'itempngs/itempngs/helmets/helmet15.png' },
    
    // A-Tier (Epic)
    
    // S-Tier (Legendary)
    { name: 'Crown of the Void King', rarity: 'S', stats: { vit: 12, str: 6, int: 6, agi: 4 }, description: 'The ultimate helm that commands the void itself', icon: 'itempngs/itempngs/helmets/helmet12.png' },
    { name: 'Infinity\'s Aegis Helm', rarity: 'S', stats: { vit: 15, str: 5, int: 5, agi: 5, per: 5 }, description: 'A helmet that transcends mortal comprehension', icon: 'itempngs/itempngs/helmets/helmet13.png' },
    
    // CHESTPLATES
    // E-Tier (Basic)
    { name: 'Cobblestone Guardian Vest', rarity: 'E', stats: { vit: 4 }, description: 'Basic protection made from rough cobblestone', icon: 'itempngs/chestplatepngs/cobblechest.png' },
    { name: 'Leather Wanderer\'s Jerkin', rarity: 'E', stats: { vit: 3, agi: 1 }, description: 'Simple leather armor for travelers', icon: 'itempngs/chestplatepngs/leatherchest.png' },
    
    // D-Tier (Common)
    { name: 'Bronze Battleplate', rarity: 'D', stats: { vit: 5, str: 2 }, description: 'Sturdy bronze armor for warriors', icon: 'itempngs/chestplatepngs/bronzechest.png' },
    { name: 'Phantom Wraith Chestguard', rarity: 'D', stats: { vit: 4, agi: 2, per: 1 }, description: 'A ghostly chestplate that whispers secrets', icon: 'itempngs/chestplatepngs/spookychest.png' },
    
    // C-Tier (Uncommon)
    { name: 'Mystic Enchanted Cuirass', rarity: 'C', stats: { vit: 5, int: 4, per: 1 }, description: 'A chestplate humming with magical energy', icon: 'itempngs/chestplatepngs/enchantedchest.png' },
    { name: 'Umbral Shadow Plate', rarity: 'C', stats: { vit: 6, agi: 3 }, description: 'Dark armor that bends shadows to its will', icon: 'itempngs/chestplatepngs/shadowchest.png' },
    { name: 'Void Walker\'s Cuirass', rarity: 'C', stats: { vit: 5, int: 2, per: 2 }, description: 'Strange armor from unknown dimensions', icon: 'itempngs/chestplatepngs/strangechest.png' },
    
    // B-Tier (Rare)
    { name: 'Molten Lava Forge Armor', rarity: 'B', stats: { vit: 8, str: 4, int: 2 }, description: 'Forged in the heart of volcanic fury', icon: 'itempngs/chestplatepngs/lavachest.png' },
    { name: 'Diamond Sovereign Breastplate', rarity: 'B', stats: { vit: 9, str: 3, agi: 2 }, description: 'Crystalline armor of unmatched brilliance', icon: 'itempngs/chestplatepngs/diamondchest.png' },
    { name: 'Celestial Divine Aegis', rarity: 'B', stats: { vit: 8, int: 5, per: 3 }, description: 'Blessed armor touched by divine light', icon: 'itempngs/chestplatepngs/divinechest.png' },
    
    // A-Tier (Epic)
    { name: 'Royal Throne Guard Plate', rarity: 'A', stats: { vit: 10, str: 5, int: 3, per: 2 }, description: 'The ceremonial armor of royal protectors', icon: 'itempngs/chestplatepngs/royal chest.png' },
    { name: 'Sovereign\'s Majesty Cuirass', rarity: 'A', stats: { vit: 11, str: 4, agi: 3, int: 2 }, description: 'The ultimate expression of royal power', icon: 'itempngs/chestplatepngs/royaltychest.png' },
    { name: 'Akuma Demon Slayer Plate', rarity: 'A', stats: { vit: 12, str: 6, agi: 2 }, description: 'Armor forged to hunt the most dangerous demons', icon: 'itempngs/chestplatepngs/akumachest.png' },
    
    // S-Tier (Legendary)
    { name: 'Demon King\'s Infernal Aegis', rarity: 'S', stats: { vit: 18, str: 8, int: 6, agi: 4 }, description: 'The cursed armor of the fallen Demon King', icon: 'itempngs/chestplatepngs/demonkingchest.png' },
    { name: 'Shadow Monarch\'s Eternal Plate', rarity: 'S', stats: { vit: 20, str: 6, agi: 8, int: 6, per: 5 }, description: 'The ultimate armor that commands all shadows', icon: 'itempngs/chestplatepngs/shadowmonarchchest.png' },
    
    // LEGGINGS
    // E-Tier (Basic)
    { name: 'Traveler\'s Cloth Pants', rarity: 'E', stats: { vit: 2 }, description: 'Basic cloth leggings for wanderers', icon: 'itempngs/leggings/normallegs.png' },
    { name: 'Simple Leather Leggings', rarity: 'E', stats: { vit: 2, agi: 1 }, description: 'Standard leather protection', icon: 'itempngs/leggings/normalleg.png' },
    { name: 'Cobblestone Greaves', rarity: 'E', stats: { vit: 3 }, description: 'Heavy stone leggings for basic defense', icon: 'itempngs/leggings/cobblelegs.png' },
    
    // D-Tier (Common)
    { name: 'Bronze Warrior Leggings', rarity: 'D', stats: { vit: 4, str: 1 }, description: 'Sturdy bronze leg armor', icon: 'itempngs/leggings/bronzelegs.png' },
    { name: 'Iron Defender Greaves', rarity: 'D', stats: { vit: 4, str: 1 }, description: 'Solid iron leg protection', icon: 'itempngs/leggings/ironlegs.png' },
    { name: 'Shadow Ninja Pants', rarity: 'D', stats: { vit: 3, agi: 3 }, description: 'Silent leggings for stealthy warriors', icon: 'itempngs/leggings/ninjalegs.png' },
    
    // C-Tier (Uncommon)
    { name: 'Golden Emperor Greaves', rarity: 'C', stats: { vit: 5, str: 2, int: 1 }, description: 'Ornate golden leg armor of royalty', icon: 'itempngs/leggings/goldlegs.png' },
    { name: 'Spiked Battle Leggings', rarity: 'C', stats: { vit: 6, str: 3 }, description: 'Aggressive leggings covered in spikes', icon: 'itempngs/leggings/spikelegs.png' },
    { name: 'Mystic Void Pants', rarity: 'C', stats: { vit: 5, int: 3, per: 1 }, description: 'Strange leggings from another dimension', icon: 'itempngs/leggings/wierdlegs.png' },
    
    // B-Tier (Rare)
    { name: 'Celestial Divine Greaves', rarity: 'B', stats: { vit: 8, int: 4, per: 2 }, description: 'Holy leggings blessed by the gods', icon: 'itempngs/leggings/divinelegs.png' },
    
    // A-Tier (Epic)
    { name: 'Arcane Scholar Leggings', rarity: 'A', stats: { vit: 10, int: 6, per: 3 }, description: 'Leggings imbued with ancient knowledge', icon: 'itempngs/leggings/interesetinglegs.png' },
    
    // S-Tier (Legendary)
    { name: 'Demon King\'s Hellfire Greaves', rarity: 'S', stats: { vit: 16, str: 8, agi: 6, int: 4 }, description: 'The burning leggings of the fallen Demon King', icon: 'itempngs/leggings/demoniclegs.png' },
    { name: 'Shadow Monarch\'s Void Leggings', rarity: 'S', stats: { vit: 18, agi: 10, int: 6, per: 4 }, description: 'Leggings that merge with the darkness itself', icon: 'itempngs/leggings/shadowleg.png' }
  ]
};

// Data templates
const createUser = (nickname, preferences = null) => {
  // Give all available items plus basic items
  const starterItems = [];
  
  // Add all weapons
  itemPool.weapons.forEach(weapon => {
    starterItems.push({
      id: uuidv4(),
      name: weapon.name,
      category: 'weapons',
      rarity: weapon.rarity,
      stats: weapon.stats,
      description: weapon.description,
      icon: weapon.icon
    });
  });
  
  // Add all accessories (rings)
  itemPool.accessories.forEach(accessory => {
    starterItems.push({
      id: uuidv4(),
      name: accessory.name,
      category: 'accessories',
      rarity: accessory.rarity,
      stats: accessory.stats,
      description: accessory.description,
      icon: accessory.icon
    });
  });
  
  // Add all armor (helmets)
  itemPool.armor.forEach(armor => {
    starterItems.push({
      id: uuidv4(),
      name: armor.name,
      category: 'armor',
      rarity: armor.rarity,
      stats: armor.stats,
      description: armor.description,
      icon: armor.icon
    });
  });
  
  // Add basic potions
  starterItems.push(
    { id: uuidv4(), name: 'Health Potion', category: 'potions', rarity: 'E', stats: {}, description: 'Restores 50 HP', effect: 'heal', value: 50 },
    { id: uuidv4(), name: 'Health Potion', category: 'potions', rarity: 'E', stats: {}, description: 'Restores 50 HP', effect: 'heal', value: 50 },
    { id: uuidv4(), name: 'Health Potion', category: 'potions', rarity: 'E', stats: {}, description: 'Restores 50 HP', effect: 'heal', value: 50 }
  );
  
  const defaultPreferences = {
    workoutSplit: 'full-body',
    gymLevel: 'beginner',
    goals: ['general-fitness'],
    preferredActivities: ['bodyweight'],
    dailyGoals: {
      waterIntake: true,
      steps: false,
      meditation: false,
      stretching: true
    },
    restDays: {
      enabled: true,
      frequency: 'weekly', // weekly, every-other-day
      dayOfWeek: 'sunday' // for weekly rest
    }
  };
  
  const userPrefs = preferences || defaultPreferences;
  const dailyTasks = generateDailyTasks(userPrefs);
  
  // The first item in starterItems is the starting sword
  const startingSword = starterItems[0];
  
  return {
    id: uuidv4(), nickname, level: 1, xp: 0, hp: 100, maxHp: 100, coins: 1000,
    stats: { str: 20, agi: 20, vit: 20, int: 20, per: 20 }, unspentPoints: 0,
    inventory: { equipped: { weapon: startingSword, armor: [null,null,null], accessories: [null,null,null] }, items: starterItems },
    dailyTasks: { tasks: dailyTasks, completed: [], lastClaimed: 0, lastReset: Date.now() },
    dungeonProgress: { completedToday: [], totalClears: {E:0,D:0,C:0,B:0,A:0,S:0}, lastReset: 0 },
    shopState: { items: [], purchased: [], lastRefresh: 0 }, playlist: [],
    friends: [], capturedBosses: [], party: [],
    preferences: userPrefs,
    hasSetPreferences: preferences !== null,
    nextResetTime: getNext4AM().getTime()
  };
};

const dungeonTiers = {
  E: { per: 1, xp: 25, coins: 15, mobs: ['Goblin','Rat','Spider'], boss: 'Goblin King' },
  D: { per: 5, xp: 50, coins: 30, mobs: ['Orc','Wolf','Skeleton'], boss: 'Orc Chieftain' },
  C: { per: 15, xp: 100, coins: 60, mobs: ['Troll','Bear','Wraith'], boss: 'Elder Troll' },
  B: { per: 30, xp: 200, coins: 120, mobs: ['Dragon','Demon','Lich'], boss: 'Demon Lord' },
  A: { per: 50, xp: 300, coins: 180, mobs: ['Titan','Phoenix','Vampire'], boss: 'Ancient Phoenix' },
  S: { per: 75, xp: 400, coins: 250, mobs: ['Ancient','Void Lord','Death'], boss: 'Shadow Emperor' }
};


const workoutPrompts = ['10 Push-ups','15 Squats','20 Jumping Jacks','30 Second Plank','5 Burpees','25 Crunches','15 Lunges','10 Burpees'];

const generateDailyTasks = (preferences) => {
  const tasks = [];
  
  // Check if it's a rest day
  if (isRestDay(preferences)) {
    return [
      '🛌 Rest Day: Take it easy today',
      '🚶 Light walk (15-20 minutes)',
      '🤸 Gentle neck turns x8 (each direction)',
      '🥤 Stay hydrated - drink plenty of water',
      '😴 Get quality sleep tonight'
    ];
  }
  
  // Add water intake if enabled
  if (preferences.dailyGoals.waterIntake) {
    tasks.push('🥤 Drink 8 glasses of water');
  }
  
  // Add step goal if enabled
  if (preferences.dailyGoals.steps) {
    const stepTarget = preferences.gymLevel === 'beginner' ? 5000 : preferences.gymLevel === 'intermediate' ? 8000 : 10000;
    tasks.push(`🚶 Walk ${stepTarget} steps`);
  }
  
  // Add meditation if enabled
  if (preferences.dailyGoals.meditation) {
    const duration = preferences.gymLevel === 'beginner' ? 5 : preferences.gymLevel === 'intermediate' ? 10 : 15;
    tasks.push(`🧘 Meditate for ${duration} minutes`);
  }
  
  // Add stretching if enabled
  if (preferences.dailyGoals.stretching) {
    const stretchingTasks = [
      '🤸 Touch your toes x10',
      '🤸 Arm stretches overhead x15',
      '🤸 Side bends x10 (each side)',
      '🤸 Shoulder shrugs x15',
      '🤸 Ankle rolls x10 (each foot)',
      '🤸 Simple back stretches x10',
      '🤸 Gentle neck turns x8 (each direction)',
      '🤸 Basic leg stretches x30 seconds'
    ];
    const randomStretch = stretchingTasks[Math.floor(Math.random() * stretchingTasks.length)];
    tasks.push(randomStretch);
  }
  
  // Add workout-specific tasks based on split and level
  const workoutTasks = getWorkoutTasks(preferences);
  tasks.push(...workoutTasks);
  
  // Ensure we have exactly 5 tasks with specific exercises and counts
  while (tasks.length < 5) {
    const specificTasks = [
      '💪 Push-ups x15',
      '🦵 Squats x20',
      '🤸 Planks x30 seconds',
      '🏃 Jumping jacks x25',
      '🔥 Burpees x8',
      '🤸 Lunges x12 (each leg)',
      '🦵 Calf raises x20',
      '🤲 Wall push-ups x12',
      '🧘 Deep breathing x10 breaths',
      '🤸 Mountain climbers x20',
      '🦵 Glute bridges x15',
      '💪 Tricep dips x10'
    ];
    const randomTask = specificTasks[Math.floor(Math.random() * specificTasks.length)];
    if (!tasks.includes(randomTask)) {
      tasks.push(randomTask);
    }
  }
  
  return tasks.slice(0, 5);
};

const getWorkoutTasks = (preferences) => {
  const { workoutSplit, gymLevel, preferredActivities } = preferences;
  const intensity = { beginner: 1, intermediate: 1.5, advanced: 2 }[gymLevel] || 1;
  
  const tasks = [];
  
  if (workoutSplit === 'full-body') {
    if (preferredActivities.includes('bodyweight')) {
      tasks.push(`💪 Push-ups x${Math.floor(10 * intensity)}`);
      tasks.push(`🦵 Squats x${Math.floor(15 * intensity)}`);
      tasks.push(`🤸 Lunges x${Math.floor(12 * intensity)} (each leg)`);
    }
    if (preferredActivities.includes('cardio')) {
      tasks.push(`🏃 Jumping Jacks x${Math.floor(20 * intensity)}`);
      tasks.push(`🔥 Burpees x${Math.floor(5 * intensity)}`);
    }
  } else if (workoutSplit === 'upper-lower') {
    const isUpperDay = Math.random() > 0.5;
    if (isUpperDay) {
      tasks.push(`💪 Push-ups x${Math.floor(12 * intensity)}`);
      tasks.push(`🤲 Pike push-ups x${Math.floor(8 * intensity)}`);
      tasks.push(`🤸 Tricep dips x${Math.floor(10 * intensity)}`);
    } else {
      tasks.push(`🦵 Squats x${Math.floor(18 * intensity)}`);
      tasks.push(`🤸 Lunges x${Math.floor(14 * intensity)} (each leg)`);
      tasks.push(`🦵 Calf raises x${Math.floor(20 * intensity)}`);
    }
  } else if (workoutSplit === 'push-pull') {
    const dayType = ['push', 'pull', 'legs'][Math.floor(Math.random() * 3)];
    if (dayType === 'push') {
      tasks.push(`💪 Push-ups x${Math.floor(15 * intensity)}`);
      tasks.push(`🤸 Tricep dips x${Math.floor(10 * intensity)}`);
    } else if (dayType === 'pull') {
      tasks.push(`🤲 Pull-ups/Assisted pull-ups x${Math.floor(8 * intensity)}`);
      tasks.push(`🤸 Superman holds x${Math.floor(12 * intensity)}`);
    } else {
      tasks.push(`🦵 Squats x${Math.floor(20 * intensity)}`);
      tasks.push(`🤸 Lunges x${Math.floor(16 * intensity)} (each leg)`);
    }
  }
  
  return tasks;
};

const generateDungeonWorkout = (preferences) => {
  const { gymLevel } = preferences;
  const intensity = { beginner: 1, intermediate: 1.5, advanced: 2 }[gymLevel] || 1;
  
  // Normal, tried and true workouts for dungeons
  const basicWorkouts = [
    `Push-ups (${Math.floor(10 * intensity)})`,
    `Squats (${Math.floor(15 * intensity)})`,
    `Jumping Jacks (${Math.floor(20 * intensity)})`,
    `Lunges (${Math.floor(12 * intensity)})`,
    `Burpees (${Math.floor(5 * intensity)})`,
    `Mountain Climbers (${Math.floor(15 * intensity)})`,
    `Plank Hold (${Math.floor(30 * intensity)} seconds)`,
    `High Knees (${Math.floor(20 * intensity)})`,
    `Crunches (${Math.floor(15 * intensity)})`,
    `Wall Sit (${Math.floor(20 * intensity)} seconds)`
  ];
  
  return basicWorkouts[Math.floor(Math.random() * basicWorkouts.length)];
};

const chestTypes = {
  E: { name: 'Wooden Chest', openTime: 1, icon: '📦', color: '#8B4513' },
  D: { name: 'Iron Chest', openTime: 2, icon: '🗳️', color: '#708090' },
  C: { name: 'Silver Chest', openTime: 4, icon: '💼', color: '#C0C0C0' },
  B: { name: 'Golden Chest', openTime: 8, icon: '🎁', color: '#FFD700' },
  A: { name: 'Platinum Chest', openTime: 12, icon: '💎', color: '#E5E4E2' },
  S: { name: 'Legendary Chest', openTime: 24, icon: '🏆', color: '#FF6347' },
  SILVER_TEST: { name: 'Silver Chest', openTime: 0.00139, icon: '🗄️', color: '#C0C0C0' }, // 5 seconds
  GOLD_TEST: { name: 'Gold Chest', openTime: 0.00139, icon: '🗄️', color: '#FFD700' } // 5 seconds
};

const generateChest = (tier, source = 'dungeon') => {
  const chestInfo = chestTypes[tier];
  return {
    id: uuidv4(),
    tier,
    name: chestInfo.name,
    icon: chestInfo.icon,
    color: chestInfo.color,
    openTimeHours: chestInfo.openTime,
    source, // 'dungeon', 'daily-tasks', 'scavenge'
    obtainedAt: Date.now(),
    startedOpening: null,
    isOpening: false,
    contents: generateChestContents(tier)
  };
};

const generateChestContents = (tier) => {
  const contents = { coins: 0, xp: 0, items: [] };
  
  // Test chests don't give XP/coins, only items
  if (tier === 'SILVER_TEST' || tier === 'GOLD_TEST') {
    contents.coins = 0;
    contents.xp = 0;
  } else {
    const tierLevel = tier.charCodeAt(0) - 69; // E=0, D=1, etc.
    // Base rewards scale with tier
    contents.coins = Math.floor((50 + tierLevel * 30) * (0.8 + Math.random() * 0.4));
    contents.xp = Math.floor((25 + tierLevel * 15) * (0.8 + Math.random() * 0.4));
  }
  
  // Item drops - higher tiers have more items
  let numItems;
  let tierLevel;
  
  if (tier === 'SILVER_TEST' || tier === 'GOLD_TEST') {
    numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items for test chests
    tierLevel = tier === 'SILVER_TEST' ? 2 : 3; // Use C/B tier equivalent for item quality
  } else {
    tierLevel = tier.charCodeAt(0) - 69; // E=0, D=1, etc.
    numItems = Math.min(3, Math.floor(Math.random() * (tierLevel + 2)));
  }
  
  for (let i = 0; i < numItems; i++) {
    const categories = ['weapons', 'armor', 'accessories', 'potions'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // Chest tier influences item rarity
    let itemRarity = 'E';
    const rarityRoll = Math.random();
    
    if (tierLevel >= 5 && rarityRoll < 0.15) itemRarity = 'S';
    else if (tierLevel >= 4 && rarityRoll < 0.25) itemRarity = 'A';
    else if (tierLevel >= 3 && rarityRoll < 0.35) itemRarity = 'B';
    else if (tierLevel >= 2 && rarityRoll < 0.5) itemRarity = 'C';
    else if (tierLevel >= 1 && rarityRoll < 0.7) itemRarity = 'D';
    
    const possibleItems = itemPool[category].filter(item => item.rarity === itemRarity);
    if (possibleItems.length > 0) {
      const baseItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      const item = {
        id: uuidv4(),
        name: baseItem.name,
        category: baseItem.category,
        rarity: baseItem.rarity,
        description: baseItem.description,
        stats: { ...baseItem.stats },
        effect: baseItem.effect,
        value: baseItem.value,
        duration: baseItem.duration
      };
      contents.items.push(item);
    }
  }
  
  return contents;
};

const generateMonsterLoot = (tier, monsterName) => {
  const tierLevel = tier.charCodeAt(0) - 69;
  const lootRoll = Math.random();
  
  // 60% chance for loot drop
  if (lootRoll > 0.6) return null;
  
  const loot = {
    id: uuidv4(),
    monsterName,
    tier,
    coins: Math.floor((10 + tierLevel * 5) * (0.5 + Math.random() * 0.5)),
    xp: Math.floor((5 + tierLevel * 3) * (0.5 + Math.random() * 0.5))
  };
  
  // 30% chance for item drop
  if (Math.random() < 0.3) {
    const categories = ['weapons', 'armor', 'accessories', 'potions'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    let itemRarity = 'E';
    const rarityRoll = Math.random();
    if (tierLevel >= 3 && rarityRoll < 0.1) itemRarity = 'C';
    else if (tierLevel >= 1 && rarityRoll < 0.3) itemRarity = 'D';
    
    const possibleItems = itemPool[category].filter(item => item.rarity === itemRarity);
    if (possibleItems.length > 0) {
      const baseItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      loot.item = {
        id: uuidv4(),
        name: baseItem.name,
        category: baseItem.category,
        rarity: baseItem.rarity,
        description: baseItem.description,
        stats: { ...baseItem.stats },
        effect: baseItem.effect,
        value: baseItem.value,
        duration: baseItem.duration
      };
    }
  }
  
  return loot;
};

const isRestDay = (preferences) => {
  if (!preferences.restDays.enabled) return false;
  
  const today = new Date();
  
  if (preferences.restDays.frequency === 'weekly') {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    return todayName === preferences.restDays.dayOfWeek;
  }
  
  // For every-other-day, check if it's an odd day of the year
  if (preferences.restDays.frequency === 'every-other-day') {
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    return dayOfYear % 2 === 0;
  }
  
  return false;
};

// Utility functions
const getNext4AM = () => {
  const now = new Date();
  const next4AM = new Date(now);
  next4AM.setHours(4, 0, 0, 0);
  
  // If it's already past 4 AM today, set for tomorrow's 4 AM
  if (now.getHours() >= 4) {
    next4AM.setDate(next4AM.getDate() + 1);
  }
  
  return next4AM;
};

const getLastValidReset = () => {
  const now = new Date();
  const last4AM = new Date(now);
  last4AM.setHours(4, 0, 0, 0);
  
  // If it's before 4 AM today, use yesterday's 4 AM
  if (now.getHours() < 4) {
    last4AM.setDate(last4AM.getDate() - 1);
  }
  
  return last4AM;
};

const checkDailyReset = (user) => {
  const now = Date.now();
  const lastValidReset = getLastValidReset().getTime();
  
  // Only reset if user's last reset was before the most recent 4 AM
  if (!user.dailyTasks.lastReset || user.dailyTasks.lastReset < lastValidReset) {
    user.dailyTasks.tasks = generateDailyTasks(user.preferences);
    user.dailyTasks.completed = [];
    user.dailyTasks.lastClaimed = 0;
    user.dailyTasks.lastReset = now;
    user.dungeonProgress.completedToday = [];
    user.dungeonProgress.lastReset = now;
    user.shopState.purchased = [];
    user.shopState.lastRefresh = now;
    generateShopItems(user);
  }
};

const getRarityMultiplier = (rarity) => {
  const multipliers = { E: 1, D: 1.5, C: 2.5, B: 4, A: 6, S: 10 };
  return multipliers[rarity] || 1;
};

const generateShopItems = (user) => {
  user.shopState.items = [];
  const categories = ['weapons', 'accessories', 'armor'];
  
  categories.forEach(cat => {
    // Higher chance for E/D tier items in shop
    const rarityRoll = Math.random();
    let selectedItems;
    if (rarityRoll < 0.4) {
      selectedItems = itemPool[cat].filter(item => item.rarity === 'E');
    } else if (rarityRoll < 0.7) {
      selectedItems = itemPool[cat].filter(item => item.rarity === 'D');
    } else if (rarityRoll < 0.9) {
      selectedItems = itemPool[cat].filter(item => item.rarity === 'C');
    } else if (rarityRoll < 0.98) {
      selectedItems = itemPool[cat].filter(item => item.rarity === 'B');
    } else {
      selectedItems = itemPool[cat].filter(item => item.rarity === 'A');
    }
    
    if (selectedItems.length === 0) selectedItems = itemPool[cat];
    
    const baseItem = selectedItems[Math.floor(Math.random() * selectedItems.length)];
    const rarityMultiplier = getRarityMultiplier(baseItem.rarity);
    const basePrice = cat === 'potions' ? 25 : 50;
    
    const item = { 
      id: uuidv4(), 
      name: baseItem.name,
      category: cat, 
      rarity: baseItem.rarity,
      description: baseItem.description,
      price: Math.floor(basePrice * rarityMultiplier + Math.random() * 30), 
      stats: { ...baseItem.stats },
      effect: baseItem.effect,
      value: baseItem.value,
      duration: baseItem.duration
    };
    user.shopState.items.push(item);
  });
};

const createEnemy = (tier, enemyIndex) => {
  const config = dungeonTiers[tier];
  const isBoss = enemyIndex === 3;
  const name = isBoss ? config.boss : config.mobs[enemyIndex];
  const tierMultiplier = Math.abs(tier.charCodeAt(0) - 69);
  const baseHp = 50 + tierMultiplier * 25;
  const baseAttack = 10 + tierMultiplier * 5;
  const hp = isBoss ? Math.floor(baseHp * 1.5) : baseHp;
  const attack = isBoss ? Math.floor(baseAttack * 1.3) : baseAttack;
  const enemy = { name, hp, maxHp: hp, attack, agility: 5 + tierMultiplier * 2 };
  console.log('Created enemy:', enemy, 'tier:', tier, 'index:', enemyIndex);
  return enemy;
};

const calculateStats = (user) => {
  let totalStats = { str: user.stats.str, agi: user.stats.agi, vit: user.stats.vit, int: user.stats.int, per: user.stats.per };
  const equipped = user.inventory.equipped;
  [equipped.weapon, ...equipped.armor, ...equipped.accessories].forEach(item => {
    if (item) Object.keys(item.stats || {}).forEach(stat => totalStats[stat] += item.stats[stat]);
  });
  return totalStats;
};

// API Routes
app.post('/api/login', (req, res) => {
  const { nickname, preferences } = req.body;
  const user = createUser(nickname, preferences);
  users[user.id] = user;
  generateShopItems(user);
  res.json(user);
});

app.post('/api/user/:id/preferences', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  user.preferences = { ...user.preferences, ...req.body };
  user.hasSetPreferences = true;
  
  // Only regenerate tasks if this is the first time setting preferences
  if (!user.dailyTasks.tasks || user.dailyTasks.tasks.length === 0) {
    user.dailyTasks.tasks = generateDailyTasks(user.preferences);
    user.dailyTasks.completed = [];
  }
  
  res.json(user);
});

app.get('/api/user/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  checkDailyReset(user);
  
  // Add next reset time to response
  user.nextResetTime = getNext4AM().getTime();
  
  // Calculate correct max HP based on VIT stat
  const stats = calculateStats(user);
  user.maxHp = 100 + (stats.vit - 20) * 5; // Base 20 VIT = 100 HP, +5 HP per VIT above 20
  
  // Ensure current HP doesn't exceed max HP
  if (user.hp > user.maxHp) user.hp = user.maxHp;
  
  // Calculate unspent points correctly (starting stats were 20 each = 100 total)
  const totalSpentStats = user.stats.str + user.stats.agi + user.stats.vit + user.stats.int + user.stats.per;
  const baseStats = 100; // 20 * 5 stats
  const gainedFromLeveling = (user.level - 1) * 5; // 5 points per level after 1
  user.unspentPoints = Math.max(0, baseStats + gainedFromLeveling - totalSpentStats);
  
  res.json(user);
});

app.post('/api/user/:id/tasks/complete', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const { taskIndex } = req.body;
  if (taskIndex >= 0 && taskIndex < user.dailyTasks.tasks.length) {
    if (!user.dailyTasks.completed.includes(taskIndex)) {
      user.dailyTasks.completed.push(taskIndex);
    }
  }
  
  res.json({ success: true, completed: user.dailyTasks.completed });
});

app.post('/api/user/:id/tasks/claim', (req, res) => {
  const user = users[req.params.id];
  const now = Date.now();
  if (user.dailyTasks.completed.length === 5 && now - user.dailyTasks.lastClaimed > 86400000) {
    user.dailyTasks.lastClaimed = now;
    
    // Generate a random chest (silver or gold) for completing daily tasks
    const chestTiers = ['SILVER_TEST', 'GOLD_TEST'];
    const randomTier = chestTiers[Math.floor(Math.random() * chestTiers.length)];
    const dailyChest = generateChest(randomTier, 'Daily Tasks');
    
    if (!user.chests) user.chests = [];
    user.chests.push(dailyChest);
    
    while (user.xp >= user.level * 100) {
      user.xp -= user.level * 100;
      user.level++;
    }
    
    // Return both user and the chest that was awarded
    res.json({ user, rewardChest: dailyChest });
  } else {
    res.json({ user });
  }
});

app.post('/api/user/:id/stats/assign', (req, res) => {
  const user = users[req.params.id];
  const { stat } = req.body;
  if (user.unspentPoints > 0 && ['str','agi','vit','int','per'].includes(stat)) {
    user.stats[stat]++;
    user.unspentPoints--;
  }
  res.json(user.stats);
});

app.post('/api/user/:id/heal', (req, res) => {
  const user = users[req.params.id];
  user.hp = user.maxHp;
  res.json(user);
});


app.get('/api/user/:id/dungeons', (req, res) => {
  const user = users[req.params.id];
  const stats = calculateStats(user);
  const available = Object.keys(dungeonTiers).filter(tier => stats.per >= dungeonTiers[tier].per);
  res.json({ available, progress: user.dungeonProgress });
});

app.post('/api/user/:id/dungeon/:tier/enter', (req, res) => {
  const user = users[req.params.id];
  const tier = req.params.tier;
  
  // Calculate max HP including equipment bonuses
  const stats = calculateStats(user);
  user.maxHp = 100 + (stats.vit - 20) * 5;
  user.hp = user.maxHp; // Reset to full HP when entering dungeon
  
  // Reset party member HP and status when starting dungeon
  user.party.forEach(member => {
    member.hp = member.maxHp;
    member.isAlive = true;
  });
  
  const enemy = createEnemy(tier, 0);
  const session = { enemy, tier, enemyIndex: 0, turn: 'player', awaitingWorkout: false, monstersKilled: 0 };
  combatSessions[user.id] = session;
  res.json(session);
});

app.post('/api/user/:id/combat/attack', (req, res) => {
  const user = users[req.params.id];
  const session = combatSessions[req.params.id];
  if (session && session.turn === 'player') {
    session.awaitingWorkout = true;
    // Use normal workouts for dungeon combat
    session.workoutPrompt = generateDungeonWorkout(user.preferences);
  }
  res.json(session);
});

app.post('/api/user/:id/combat/confirm-workout', (req, res) => {
  const user = users[req.params.id];
  const session = combatSessions[req.params.id];
  if (session && session.awaitingWorkout) {
    const stats = calculateStats(user);
    const damage = Math.floor(Math.random() * 20) + stats.str * 5;
    session.enemy.hp -= damage;
    if (session.enemy.hp < 0) session.enemy.hp = 0;
    session.awaitingWorkout = false;
    session.workoutPrompt = null;
    session.damageDealt = damage;
    session.showingDamage = true;
    
    if (session.enemy.hp <= 0) {
      session.enemyDefeated = true;
      session.enemyIndex++;
      
      if (session.enemyIndex >= 4 || session.summoned) {
        // Dungeon complete or summoned boss defeated
        const tier = session.tier;
        const config = dungeonTiers[tier];
        
        if (session.summoned) {
          // Capture the summoned boss
          const capturedBoss = {
            id: uuidv4(),
            name: session.enemy.name,
            tier,
            onMission: false,
            captureTime: Date.now()
          };
          user.capturedBosses.push(capturedBoss);
          
          const xpGain = 200 + (tier.charCodeAt(0) - 69) * 50;
          const coinGain = 100 + (tier.charCodeAt(0) - 69) * 30;
          
          user.xp += xpGain;
          user.coins += coinGain;
          
          while (user.xp >= user.level * 100) {
            user.xp -= user.level * 100;
            user.level++;
          }
          
          delete combatSessions[user.id];
          return res.json({ victory: true, captured: true, boss: capturedBoss, rewards: { xp: xpGain, coins: coinGain } });
        } else {
          // Regular dungeon completion - roll for boss capture
          const firstClear = !user.dungeonProgress.completedToday.includes(tier);
          const xpGain = firstClear ? Math.floor(config.xp * 1.5) : config.xp;
          const coinGain = firstClear ? Math.floor(config.coins * 1.5) : config.coins;
          
          user.xp += xpGain;
          user.coins += coinGain;
          user.dungeonProgress.completedToday.push(tier);
          user.dungeonProgress.totalClears[tier]++;
          
          while (user.xp >= user.level * 100) {
            user.xp -= user.level * 100;
            user.level++;
          }
          
          // Roll for boss capture if this was the final boss (index 3)
          let capturedBoss = null;
          if (session.enemyIndex === 4) { // Just completed final boss
            const captureRate = 100; // 100% capture rate for testing
            const captureSuccess = Math.random() * 100 < captureRate;
            
            if (captureSuccess) {
              capturedBoss = {
                id: uuidv4(),
                name: config.boss,
                tier,
                onMission: false,
                captureTime: Date.now()
              };
              user.capturedBosses.push(capturedBoss);
            }
          }
          
          // Generate item drops
          const itemDrops = [];
          const dropChance = Math.random();
          
          if (dropChance < 0.3) { // 30% chance for item drop
            const categories = ['weapons', 'armor', 'accessories', 'potions'];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const tierLevel = tier.charCodeAt(0) - 69; // E=0, D=1, C=2, etc.
            
            let rarityRoll = Math.random();
            let selectedRarity = 'E';
            
            // Higher tiers have better drop rates
            if (tierLevel >= 5 && rarityRoll < 0.05) selectedRarity = 'S';
            else if (tierLevel >= 4 && rarityRoll < 0.1) selectedRarity = 'A';
            else if (tierLevel >= 3 && rarityRoll < 0.2) selectedRarity = 'B';
            else if (tierLevel >= 2 && rarityRoll < 0.4) selectedRarity = 'C';
            else if (tierLevel >= 1 && rarityRoll < 0.6) selectedRarity = 'D';
            else selectedRarity = 'E';
            
            const possibleItems = itemPool[category].filter(item => item.rarity === selectedRarity);
            if (possibleItems.length > 0) {
              const baseItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
              const droppedItem = {
                id: uuidv4(),
                name: baseItem.name,
                category: baseItem.category,
                rarity: baseItem.rarity,
                description: baseItem.description,
                stats: { ...baseItem.stats },
                effect: baseItem.effect,
                value: baseItem.value,
                duration: baseItem.duration
              };
              itemDrops.push(droppedItem);
              user.inventory.items.push(droppedItem);
            }
          }

          // Generate dungeon completion chest (same tier as dungeon, opens instantly)
          const dungeonChest = generateChest(tier, 'dungeon');
          dungeonChest.openTimeHours = 0; // Dungeon chests open instantly
          if (!user.chests) user.chests = [];
          user.chests.push(dungeonChest);
          
          // Give items for each monster killed during dungeon
          const monstersKilled = session.monstersKilled || 0;
          const monsterKillItems = [];
          for (let i = 0; i < monstersKilled; i++) {
            const loot = generateMonsterLoot(session.tier, 'Monster');
            if (loot && loot.item) {
              monsterKillItems.push(loot.item);
              user.inventory.items.push(loot.item);
            }
          }
          
          delete combatSessions[user.id];
          return res.json({ 
            victory: true, 
            rewards: { xp: xpGain, coins: coinGain },
            captured: capturedBoss ? true : false,
            boss: capturedBoss,
            itemDrops: itemDrops,
            dungeonChest: dungeonChest,
            monsterKillItems: monsterKillItems,
            monstersKilled: monstersKilled
          });
        }
      } else {
        // Track monsters killed
        if (!session.monstersKilled) session.monstersKilled = 0;
        session.monstersKilled++;
        
        // Don't spawn next enemy immediately - let client handle timing
        return res.json(session);
      }
    }
    
    // Party boss mini-attacks after player attack
    let partyAttacks = [];
    const alivePartyMembers = user.party.filter(member => member.isAlive);
    alivePartyMembers.forEach(member => {
      if (session.enemy.hp > 0) { // Only attack if enemy is still alive
        const partyDamage = Math.floor(Math.random() * 10) + member.attack;
        session.enemy.hp -= partyDamage;
        if (session.enemy.hp < 0) session.enemy.hp = 0;
        partyAttacks.push({ name: member.name, damage: partyDamage });
      }
    });
    session.partyAttacks = partyAttacks;
    
    // Check if enemy died from party attacks
    if (session.enemy.hp <= 0 && !session.enemyDefeated) {
      session.enemyDefeated = true;
      session.enemyIndex++;
    }
    
    session.turn = 'enemy';
  }
  res.json(session);
});

app.post('/api/user/:id/combat/enemy-turn', (req, res) => {
  const user = users[req.params.id];
  const session = combatSessions[req.params.id];
  if (session && session.turn === 'enemy') {
    const totalDamage = Math.floor(Math.random() * 15) + session.enemy.attack;
    let remainingDamage = totalDamage;
    let partyDamageSpread = [];
    
    // Party members tank damage proportionally
    const alivePartyMembers = user.party.filter(member => member.isAlive);
    const totalDefenders = alivePartyMembers.length + 1; // +1 for player
    
    if (alivePartyMembers.length > 0) {
      // Distribute damage: 40% to player, 60% spread among party members
      const playerDamage = Math.floor(totalDamage * 0.4);
      const partyDamage = totalDamage - playerDamage;
      const damagePerMember = Math.floor(partyDamage / alivePartyMembers.length);
      
      // Apply damage to party members
      alivePartyMembers.forEach((member, index) => {
        const memberDamage = index === alivePartyMembers.length - 1 ? 
          partyDamage - (damagePerMember * index) : // Last member gets remainder
          damagePerMember;
        
        member.hp -= memberDamage;
        if (member.hp <= 0) {
          member.hp = 0;
          member.isAlive = false;
        }
        partyDamageSpread.push({ name: member.name, damage: memberDamage });
      });
      
      user.hp -= playerDamage;
      remainingDamage = playerDamage;
    } else {
      // No party members, player takes full damage
      user.hp -= totalDamage;
      remainingDamage = totalDamage;
    }
    
    if (user.hp <= 0) {
      user.hp = 0;
      delete combatSessions[user.id];
      return res.json({ defeat: true, playerDamage: remainingDamage, partyDamage: partyDamageSpread });
    }
    
    session.turn = 'player';
    session.playerDamage = remainingDamage;
    session.partyDamage = partyDamageSpread;
  }
  res.json(session);
});

app.post('/api/user/:id/combat/cancel', (req, res) => {
  const session = combatSessions[req.params.id];
  if (session) {
    session.awaitingWorkout = false;
    session.workoutPrompt = null;
  }
  res.json(session);
});

app.post('/api/user/:id/combat/next-enemy', (req, res) => {
  const session = combatSessions[req.params.id];
  if (session && session.enemyDefeated) {
    const newEnemy = createEnemy(session.tier, session.enemyIndex);
    session.enemy = newEnemy;
    session.turn = 'player';
    session.enemyDefeated = false;
    session.showingDamage = false;
    session.damageDealt = null;
    return res.json({ nextEnemy: true, session });
  }
  res.json(session);
});

app.post('/api/user/:id/inventory/equip/:itemId', (req, res) => {
  const user = users[req.params.id];
  const itemId = req.params.itemId;
  const item = user.inventory.items.find(i => i.id === itemId);
  if (item) {
    const { category } = item;
    if (category === 'weapons') user.inventory.equipped.weapon = item;
    else if (category === 'armor') {
      // Find first empty armor slot
      const emptySlot = user.inventory.equipped.armor.findIndex(slot => slot === null);
      if (emptySlot !== -1) {
        user.inventory.equipped.armor[emptySlot] = item;
      } else {
        user.inventory.equipped.armor[0] = item; // Replace first slot if all full
      }
    }
    else if (category === 'accessories') {
      // Determine slot based on item type
      if (item.type === 'ring') {
        // Rings go in slots 0 or 1 (ring slots)
        if (user.inventory.equipped.accessories[0] === null) {
          user.inventory.equipped.accessories[0] = item;
        } else {
          user.inventory.equipped.accessories[1] = item;
        }
      } else if (item.type === 'necklace') {
        // Necklaces go in slot 2 (necklace slot)
        user.inventory.equipped.accessories[2] = item;
      }
    }
  }
  res.json(user.inventory);
});

app.post('/api/user/:id/inventory/unequip/:itemId', (req, res) => {
  const user = users[req.params.id];
  const itemId = req.params.itemId;
  const equipped = user.inventory.equipped;
  
  // Unequip weapon
  if (equipped.weapon && equipped.weapon.id === itemId) {
    equipped.weapon = null;
  }
  
  // Unequip armor
  for (let i = 0; i < equipped.armor.length; i++) {
    if (equipped.armor[i] && equipped.armor[i].id === itemId) {
      equipped.armor[i] = null;
      break;
    }
  }
  
  // Unequip accessories
  for (let i = 0; i < equipped.accessories.length; i++) {
    if (equipped.accessories[i] && equipped.accessories[i].id === itemId) {
      equipped.accessories[i] = null;
      break;
    }
  }
  
  res.json(user.inventory);
});

app.post('/api/user/:id/inventory/use/:itemId', (req, res) => {
  const user = users[req.params.id];
  const itemId = req.params.itemId;
  const itemIndex = user.inventory.items.findIndex(i => i.id === itemId);
  const item = user.inventory.items[itemIndex];
  let used = false;
  
  if (item && item.category === 'potions' && item.effect) {
    switch (item.effect) {
      case 'heal':
        if (user.hp < user.maxHp) {
          user.hp = Math.min(user.maxHp, user.hp + item.value);
          used = true;
        }
        break;
      case 'mana':
        // Future mana system
        used = true;
        break;
      case 'buff_str':
      case 'buff_agi':
      case 'buff_vit':
      case 'buff_int':
      case 'buff_per':
      case 'buff_all':
        // Future buff system
        used = true;
        break;
    }
    
    if (used) {
      user.inventory.items.splice(itemIndex, 1);
    }
  }
  
  res.json({ success: used, user });
});

app.get('/api/user/:id/shop', (req, res) => {
  const user = users[req.params.id];
  res.json(user.shopState);
});

app.post('/api/user/:id/shop/buy/:itemId', (req, res) => {
  const user = users[req.params.id];
  const itemId = req.params.itemId;
  const item = user.shopState.items.find(i => i.id === itemId);
  if (item && user.coins >= item.price && !user.shopState.purchased.includes(itemId)) {
    user.coins -= item.price;
    user.inventory.items.push(item);
    user.shopState.purchased.push(itemId);
  }
  res.json(user);
});

app.post('/api/user/:id/music/:action', (req, res) => {
  const user = users[req.params.id];
  const { action } = req.params;
  const { song, index } = req.body;
  
  switch(action) {
    case 'add': user.playlist.push(song); break;
    case 'delete': user.playlist.splice(index, 1); break;
  }
  res.json(user.playlist);
});

app.post('/api/user/:id/friends/add', (req, res) => {
  const user = users[req.params.id];
  const { friendName } = req.body;
  const friend = Object.values(users).find(u => u.nickname === friendName);
  
  if (friend && friend.id !== user.id && !user.friends.includes(friend.nickname)) {
    user.friends.push(friend.nickname);
    friend.friends.push(user.nickname);
  }
  res.json(user.friends);
});

app.post('/api/user/:id/friends/remove', (req, res) => {
  const user = users[req.params.id];
  const { friendName } = req.body;
  const friend = Object.values(users).find(u => u.nickname === friendName);
  
  if (friend) {
    user.friends = user.friends.filter(f => f !== friendName);
    friend.friends = friend.friends.filter(f => f !== user.nickname);
  }
  res.json(user.friends);
});


app.post('/api/user/:id/boss/:bossId/party/add', (req, res) => {
  const user = users[req.params.id];
  const bossId = req.params.bossId;
  const boss = user.capturedBosses.find(b => b.id === bossId);
  
  if (boss && !user.party.find(p => p.id === bossId) && user.party.length < 3) {
    const partyMember = {
      id: boss.id,
      name: boss.name,
      tier: boss.tier,
      hp: 100,
      maxHp: 100,
      attack: 10 + (boss.tier.charCodeAt(0) - 69) * 5,
      isAlive: true
    };
    user.party.push(partyMember);
  }
  
  res.json(user);
});

app.post('/api/user/:id/boss/:bossId/party/remove', (req, res) => {
  const user = users[req.params.id];
  const bossId = req.params.bossId;
  
  user.party = user.party.filter(member => member.id !== bossId);
  
  res.json(user);
});

// Chest management endpoints
app.get('/api/user/:id/chests', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Initialize chests array if it doesn't exist
  if (!user.chests) user.chests = [];
  
  res.json({ chests: user.chests });
});

app.post('/api/user/:id/chest/:chestId/start-opening', (req, res) => {
  const user = users[req.params.id];
  const chestId = req.params.chestId;
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const chest = user.chests.find(c => c.id === chestId);
  if (!chest) return res.status(404).json({ error: 'Chest not found' });
  
  if (chest.isOpening) return res.status(400).json({ error: 'Chest is already opening' });
  
  chest.isOpening = true;
  chest.startedOpening = Date.now();
  
  res.json({ success: true, chest });
});

app.post('/api/user/:id/chest/:chestId/open', (req, res) => {
  const user = users[req.params.id];
  const chestId = req.params.chestId;
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const chestIndex = user.chests.findIndex(c => c.id === chestId);
  if (chestIndex === -1) return res.status(404).json({ error: 'Chest not found' });
  
  const chest = user.chests[chestIndex];
  
  if (!chest.isOpening) return res.status(400).json({ error: 'Chest opening not started' });
  
  const openTimeMs = chest.openTimeHours * 60 * 60 * 1000;
  const elapsedTime = Date.now() - chest.startedOpening;
  
  if (elapsedTime < openTimeMs) {
    const remainingTime = openTimeMs - elapsedTime;
    return res.status(400).json({ error: 'Chest not ready to open', remainingTime });
  }
  
  // Open the chest and give rewards
  const contents = chest.contents;
  user.coins += contents.coins;
  user.xp += contents.xp;
  
  contents.items.forEach(item => {
    user.inventory.items.push(item);
  });
  
  // Level up check
  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100;
    user.level++;
  }
  
  // Remove chest from inventory
  user.chests.splice(chestIndex, 1);
  
  res.json({ success: true, contents, user });
});

// Add status endpoint to check monsters killed
app.get('/api/user/:id/dungeon/:tier/status', (req, res) => {
  const session = combatSessions[req.params.id];
  if (!session) return res.json({ monstersKilled: 0 });
  res.json({ monstersKilled: session.monstersKilled || 0 });
});

// Add run away endpoint that gives items for monsters killed
app.post('/api/user/:id/dungeon/:tier/run-away', (req, res) => {
  const user = users[req.params.id];
  const session = combatSessions[req.params.id];
  
  if (!user || !session) return res.status(404).json({ error: 'User or session not found' });
  
  const monstersKilled = session.monstersKilled || 0;
  const items = [];
  
  // Give one item for each monster killed
  for (let i = 0; i < monstersKilled; i++) {
    const loot = generateMonsterLoot(session.tier, 'Monster');
    if (loot && loot.item) {
      items.push(loot.item);
      user.inventory.items.push(loot.item);
    }
  }
  
  // Clean up session
  delete combatSessions[user.id];
  
  res.json({ success: true, items, user });
});


app.listen(3000, () => console.log('Solo Ascent running on http://localhost:3000'));