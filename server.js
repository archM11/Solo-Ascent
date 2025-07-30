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

// Data templates
const createUser = (nickname, preferences = null) => {
  const starterItems = [
    { id: uuidv4(), name: 'Iron Sword', category: 'weapons', rarity: 'E', stats: { str: 2, agi: 1 }, description: 'A sturdy iron blade' },
    { id: uuidv4(), name: 'Leather Helmet', category: 'armor', rarity: 'E', stats: { vit: 2 }, description: 'Basic leather protection' },
    { id: uuidv4(), name: 'Chain Mail', category: 'armor', rarity: 'E', stats: { vit: 3, str: 1 }, description: 'Interlocked metal rings' },
    { id: uuidv4(), name: 'Iron Ring', category: 'accessories', rarity: 'E', stats: { str: 1 }, description: 'Simple iron band' },
    { id: uuidv4(), name: 'Silver Necklace', category: 'accessories', rarity: 'E', stats: { int: 2, per: 1 }, description: 'Elegant silver chain' },
    { id: uuidv4(), name: 'Health Potion', category: 'potions', rarity: 'E', stats: {}, description: 'Restores 50 HP', effect: 'heal', value: 50 },
    { id: uuidv4(), name: 'Health Potion', category: 'potions', rarity: 'E', stats: {}, description: 'Restores 50 HP', effect: 'heal', value: 50 },
    { id: uuidv4(), name: 'Health Potion', category: 'potions', rarity: 'E', stats: {}, description: 'Restores 50 HP', effect: 'heal', value: 50 },
    { id: uuidv4(), name: 'Strength Elixir', category: 'potions', rarity: 'D', stats: {}, description: 'Temporarily boosts STR by 5', effect: 'buff_str', value: 5, duration: 300000 },
    { id: uuidv4(), name: 'Agility Tonic', category: 'potions', rarity: 'D', stats: {}, description: 'Temporarily boosts AGI by 5', effect: 'buff_agi', value: 5, duration: 300000 }
  ];
  
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
  
  return {
    id: uuidv4(), nickname, level: 1, xp: 0, hp: 100, maxHp: 100, coins: 1000,
    stats: { str: 20, agi: 20, vit: 20, int: 20, per: 20 }, unspentPoints: 0,
    inventory: { equipped: { weapon: null, armor: [null,null,null,null], accessories: [null,null,null,null] }, items: starterItems },
    dailyTasks: { tasks: dailyTasks, completed: [], lastClaimed: 0, lastReset: 0 },
    dungeonProgress: { completedToday: [], totalClears: {E:0,D:0,C:0,B:0,A:0,S:0}, lastReset: 0 },
    shopState: { items: [], purchased: [], lastRefresh: 0 }, playlist: [],
    friends: [], capturedBosses: [], party: [],
    preferences: userPrefs,
    hasSetPreferences: preferences !== null
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

const itemPool = {
  weapons: [
    { name: 'Iron Sword', rarity: 'E', stats: { str: 2, agi: 1 }, description: 'A sturdy iron blade' },
    { name: 'Steel Axe', rarity: 'E', stats: { str: 3, vit: 1 }, description: 'Heavy two-handed axe' },
    { name: 'Hunter\'s Bow', rarity: 'E', stats: { agi: 3, per: 1 }, description: 'Well-crafted hunting bow' },
    { name: 'Wizard Staff', rarity: 'D', stats: { int: 4, per: 2 }, description: 'Staff imbued with magic' },
    { name: 'Shadow Dagger', rarity: 'D', stats: { agi: 3, str: 2 }, description: 'Blade that cuts through shadows' },
    { name: 'Flaming Sword', rarity: 'C', stats: { str: 5, int: 2 }, description: 'Sword wreathed in eternal flames' },
    { name: 'Dragon Slayer', rarity: 'B', stats: { str: 8, vit: 3 }, description: 'Legendary weapon of dragon hunters' },
    { name: 'Excalibur', rarity: 'A', stats: { str: 10, agi: 5, vit: 3 }, description: 'The legendary sword of kings' },
    { name: 'Void Blade', rarity: 'S', stats: { str: 15, agi: 8, int: 5 }, description: 'Forged from the essence of the void' }
  ],
  armor: [
    { name: 'Leather Helmet', rarity: 'E', stats: { vit: 2 }, description: 'Basic leather protection' },
    { name: 'Chain Mail', rarity: 'E', stats: { vit: 3, str: 1 }, description: 'Interlocked metal rings' },
    { name: 'Iron Plate', rarity: 'D', stats: { vit: 4, str: 2 }, description: 'Heavy iron armor' },
    { name: 'Ranger\'s Cloak', rarity: 'D', stats: { agi: 3, per: 2 }, description: 'Light and stealthy' },
    { name: 'Mage Robes', rarity: 'C', stats: { int: 5, per: 3 }, description: 'Robes woven with magic' },
    { name: 'Dragon Scale Armor', rarity: 'B', stats: { vit: 8, str: 4 }, description: 'Armor made from dragon scales' },
    { name: 'Divine Plate', rarity: 'A', stats: { vit: 10, str: 5, int: 3 }, description: 'Blessed by the gods' },
    { name: 'Celestial Aegis', rarity: 'S', stats: { vit: 15, str: 8, int: 6 }, description: 'Armor of the heavens' }
  ],
  accessories: [
    { name: 'Iron Ring', rarity: 'E', stats: { str: 1 }, description: 'Simple iron band' },
    { name: 'Silver Necklace', rarity: 'E', stats: { int: 2, per: 1 }, description: 'Elegant silver chain' },
    { name: 'Agility Bracelet', rarity: 'D', stats: { agi: 3 }, description: 'Increases movement speed' },
    { name: 'Wisdom Amulet', rarity: 'D', stats: { int: 3, per: 2 }, description: 'Enhances magical knowledge' },
    { name: 'Ruby Ring', rarity: 'C', stats: { str: 3, vit: 2 }, description: 'Ring with a brilliant ruby' },
    { name: 'Phoenix Feather', rarity: 'B', stats: { int: 5, agi: 3 }, description: 'Feather of the legendary phoenix' },
    { name: 'Crown of Kings', rarity: 'A', stats: { str: 4, int: 4, per: 4, vit: 2 }, description: 'Crown worn by ancient rulers' },
    { name: 'Eternal Sigil', rarity: 'S', stats: { str: 6, agi: 6, vit: 6, int: 6, per: 6 }, description: 'Symbol of infinite power' }
  ],
  potions: [
    { name: 'Health Potion', rarity: 'E', stats: {}, description: 'Restores 50 HP', effect: 'heal', value: 50 },
    { name: 'Mana Potion', rarity: 'E', stats: {}, description: 'Restores MP', effect: 'mana', value: 30 },
    { name: 'Strength Elixir', rarity: 'D', stats: {}, description: 'Temporarily boosts STR by 5', effect: 'buff_str', value: 5, duration: 300000 },
    { name: 'Agility Tonic', rarity: 'D', stats: {}, description: 'Temporarily boosts AGI by 5', effect: 'buff_agi', value: 5, duration: 300000 },
    { name: 'Vitality Brew', rarity: 'C', stats: {}, description: 'Temporarily boosts VIT by 8', effect: 'buff_vit', value: 8, duration: 600000 },
    { name: 'Greater Health Potion', rarity: 'C', stats: {}, description: 'Restores 100 HP', effect: 'heal', value: 100 },
    { name: 'Elixir of Power', rarity: 'B', stats: {}, description: 'Boosts all stats by 5', effect: 'buff_all', value: 5, duration: 900000 },
    { name: 'Divine Essence', rarity: 'A', stats: {}, description: 'Boosts all stats by 10', effect: 'buff_all', value: 10, duration: 1200000 },
    { name: 'Immortal Elixir', rarity: 'S', stats: {}, description: 'Boosts all stats by 15', effect: 'buff_all', value: 15, duration: 1800000 }
  ]
};

const workoutPrompts = ['10 Push-ups','15 Squats','20 Jumping Jacks','30 Second Plank','5 Burpees','25 Crunches','15 Lunges','10 Burpees'];

const generateDailyTasks = (preferences) => {
  const tasks = [];
  
  // Check if it's a rest day
  if (isRestDay(preferences)) {
    return [
      '🛌 Rest Day: Take it easy today',
      '🚶 Light walk (15-20 minutes)',
      '🧘 Gentle stretching or meditation',
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
    tasks.push('🤸 Complete 10-minute stretching routine');
  }
  
  // Add workout-specific tasks based on split and level
  const workoutTasks = getWorkoutTasks(preferences);
  tasks.push(...workoutTasks);
  
  // Ensure we have exactly 5 tasks
  while (tasks.length < 5) {
    const genericTasks = ['💪 Complete bonus workout', '🏃 Do light cardio (10 min)', '🍎 Eat a healthy meal'];
    const randomTask = genericTasks[Math.floor(Math.random() * genericTasks.length)];
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
      tasks.push(`💪 Push-ups (${Math.floor(10 * intensity)})`);
      tasks.push(`🦵 Squats (${Math.floor(15 * intensity)})`);
    }
    if (preferredActivities.includes('cardio')) {
      tasks.push(`🏃 Jumping Jacks (${Math.floor(20 * intensity)})`);
    }
  } else if (workoutSplit === 'upper-lower') {
    const isUpperDay = Math.random() > 0.5;
    if (isUpperDay) {
      tasks.push(`💪 Upper body workout (${Math.floor(20 * intensity)} min)`);
      if (preferredActivities.includes('bodyweight')) {
        tasks.push(`🤲 Push-ups (${Math.floor(12 * intensity)})`);
      }
    } else {
      tasks.push(`🦵 Lower body workout (${Math.floor(20 * intensity)} min)`);
      if (preferredActivities.includes('bodyweight')) {
        tasks.push(`🦵 Squats (${Math.floor(18 * intensity)})`);
      }
    }
  } else if (workoutSplit === 'push-pull') {
    const dayType = ['push', 'pull', 'legs'][Math.floor(Math.random() * 3)];
    if (dayType === 'push') {
      tasks.push(`💪 Push workout (${Math.floor(25 * intensity)} min)`);
    } else if (dayType === 'pull') {
      tasks.push(`🤲 Pull workout (${Math.floor(25 * intensity)} min)`);
    } else {
      tasks.push(`🦵 Leg workout (${Math.floor(25 * intensity)} min)`);
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
  S: { name: 'Legendary Chest', openTime: 24, icon: '🏆', color: '#FF6347' }
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
  const tierLevel = tier.charCodeAt(0) - 69; // E=0, D=1, etc.
  
  // Base rewards scale with tier
  contents.coins = Math.floor((50 + tierLevel * 30) * (0.8 + Math.random() * 0.4));
  contents.xp = Math.floor((25 + tierLevel * 15) * (0.8 + Math.random() * 0.4));
  
  // Item drops - higher tiers have more items
  const numItems = Math.min(3, Math.floor(Math.random() * (tierLevel + 2)));
  
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
const checkDailyReset = (user) => {
  const now = Date.now();
  const today = new Date(now).toDateString();
  const lastReset = new Date(user.dailyTasks.lastReset).toDateString();
  
  if (today !== lastReset) {
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
  const categories = ['weapons','armor','accessories','potions'];
  
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
  
  // Regenerate daily tasks based on new preferences
  user.dailyTasks.tasks = generateDailyTasks(user.preferences);
  user.dailyTasks.completed = []; // Reset completed tasks when preferences change
  
  res.json(user);
});

app.get('/api/user/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  checkDailyReset(user);
  
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
    user.xp += 100;
    user.coins += 50;
    user.dailyTasks.lastClaimed = now;
    while (user.xp >= user.level * 100) {
      user.xp -= user.level * 100;
      user.level++;
    }
  }
  res.json(user);
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
  
  const enemy = createEnemy(tier, 0);
  const session = { enemy, tier, enemyIndex: 0, turn: 'player', awaitingWorkout: false };
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
          
          // Also check for scavenged loot chest if there's scavenged loot
          let scavengeChest = null;
          if (!user.scavengedLoot) user.scavengedLoot = [];
          if (user.scavengedLoot.length > 0) {
            scavengeChest = generateChest('E', 'scavenge');
            if (!user.chests) user.chests = [];
            user.chests.push(scavengeChest);
          }
          
          delete combatSessions[user.id];
          return res.json({ 
            victory: true, 
            rewards: { xp: xpGain, coins: coinGain },
            captured: capturedBoss ? true : false,
            boss: capturedBoss,
            itemDrops: itemDrops,
            dungeonChest: dungeonChest,
            scavengeChest: scavengeChest,
            scavengedLoot: user.scavengedLoot.length > 0 ? [...user.scavengedLoot] : null
          });
        }
      } else {
        // Generate monster loot if scavenging is enabled
        if (session.scavenging) {
          const loot = generateMonsterLoot(session.tier, session.enemy.name);
          if (loot) {
            if (!user.scavengedLoot) user.scavengedLoot = [];
            user.scavengedLoot.push(loot);
          }
        }
        
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
      // Find first empty accessory slot
      const emptySlot = user.inventory.equipped.accessories.findIndex(slot => slot === null);
      if (emptySlot !== -1) {
        user.inventory.equipped.accessories[emptySlot] = item;
      } else {
        user.inventory.equipped.accessories[0] = item; // Replace first slot if all full
      }
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

app.post('/api/user/:id/dungeon/:tier/toggle-scavenge', (req, res) => {
  const user = users[req.params.id];
  const session = combatSessions[req.params.id];
  
  if (!user || !session) return res.status(404).json({ error: 'User or session not found' });
  
  session.scavenging = !session.scavenging;
  
  // Clear previous scavenged loot when toggling
  if (session.scavenging) {
    user.scavengedLoot = [];
  }
  
  res.json({ scavenging: session.scavenging, session });
});

app.post('/api/user/:id/scavenged-loot/collect', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  let totalCoins = 0;
  let totalXp = 0;
  const items = [];
  
  user.scavengedLoot.forEach(loot => {
    totalCoins += loot.coins;
    totalXp += loot.xp;
    if (loot.item) {
      items.push(loot.item);
      user.inventory.items.push(loot.item);
    }
  });
  
  user.coins += totalCoins;
  user.xp += totalXp;
  
  // Level up check
  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100;
    user.level++;
  }
  
  const collectedLoot = [...user.scavengedLoot];
  user.scavengedLoot = [];
  
  res.json({ success: true, collectedLoot, totalCoins, totalXp, items, user });
});

app.listen(3000, () => console.log('Solo Ascent running on http://localhost:3000'));