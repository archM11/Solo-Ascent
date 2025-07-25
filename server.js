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
const createUser = (nickname) => {
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
  
  return {
    id: uuidv4(), nickname, level: 1, xp: 0, hp: 100, maxHp: 100, coins: 1000,
    stats: { str: 20, agi: 20, vit: 20, int: 20, per: 20 }, unspentPoints: 0,
    inventory: { equipped: { weapon: null, armor: [null,null,null,null], accessories: [null,null,null,null] }, items: starterItems },
    dailyTasks: { tasks: ['Push-ups (10)', 'Squats (15)', 'Jumping Jacks (20)', 'Plank (30s)', 'Burpees (5)'], completed: [], lastClaimed: 0, lastReset: 0 },
    dungeonProgress: { completedToday: [], totalClears: {E:0,D:0,C:0,B:0,A:0,S:0}, lastReset: 0 },
    shopState: { items: [], purchased: [], lastRefresh: 0 }, playlist: [],
    friends: [], capturedBosses: [], party: []
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
  const user = createUser(req.body.nickname);
  users[user.id] = user;
  generateShopItems(user);
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
  const { taskIndex } = req.body;
  if (!user.dailyTasks.completed.includes(taskIndex)) {
    user.dailyTasks.completed.push(taskIndex);
  }
  res.json(user.dailyTasks);
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
  const session = combatSessions[req.params.id];
  if (session && session.turn === 'player') {
    session.awaitingWorkout = true;
    session.workoutPrompt = workoutPrompts[Math.floor(Math.random() * workoutPrompts.length)];
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

          delete combatSessions[user.id];
          return res.json({ 
            victory: true, 
            rewards: { xp: xpGain, coins: coinGain },
            captured: capturedBoss ? true : false,
            boss: capturedBoss,
            itemDrops: itemDrops
          });
        }
      } else {
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

app.listen(3000, () => console.log('Solo Ascent running on http://localhost:3000'));