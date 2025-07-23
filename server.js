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
    { id: uuidv4(), name: 'Iron Sword', category: 'weapons', stats: { str: 2, agi: 1 } },
    { id: uuidv4(), name: 'Leather Helmet', category: 'armor', stats: { str: 1, vit: 1 } },
    { id: uuidv4(), name: 'Chain Mail', category: 'armor', stats: { str: 1, vit: 2 } },
    { id: uuidv4(), name: 'Iron Ring', category: 'accessories', stats: { str: 1, agi: 1 } },
    { id: uuidv4(), name: 'Silver Necklace', category: 'accessories', stats: { int: 2, per: 1 } },
    { id: uuidv4(), name: 'Health Potion', category: 'potions', stats: {} }
  ];
  
  return {
    id: uuidv4(), nickname, level: 90, xp: 0, hp: 100, maxHp: 100, coins: 10000,
    stats: { str: 20, agi: 20, vit: 20, int: 20, per: 20 }, unspentPoints: 45,
    inventory: { equipped: { weapon: null, armor: [null,null,null,null], accessories: [null,null,null,null] }, items: starterItems },
    dailyTasks: { tasks: ['Push-ups (10)', 'Squats (15)', 'Jumping Jacks (20)', 'Plank (30s)', 'Burpees (5)'], completed: [], lastClaimed: 0, lastReset: 0 },
    dungeonProgress: { completedToday: [], totalClears: {E:0,D:0,C:0,B:0,A:0,S:0}, lastReset: 0 },
    shopState: { items: [], purchased: [], lastRefresh: 0 }, playlist: [],
    friends: [], capturedBosses: [], activeMissions: []
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
  weapons: ['Sword','Axe','Bow','Staff','Dagger'],
  armor: ['Helmet','Chest','Legs','Boots'],
  accessories: ['Ring','Necklace','Bracelet','Amulet'],
  potions: ['Health Potion','Mana Potion','Strength Elixir']
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

const generateShopItems = (user) => {
  user.shopState.items = [];
  const categories = ['weapons','armor','accessories','potions'];
  categories.forEach(cat => {
    const item = { id: uuidv4(), name: itemPool[cat][Math.floor(Math.random() * itemPool[cat].length)], 
                  category: cat, price: Math.floor(Math.random() * 100) + 20, 
                  stats: { str: Math.floor(Math.random() * 5), agi: Math.floor(Math.random() * 5) } };
    user.shopState.items.push(item);
  });
};

const createEnemy = (tier, enemyIndex) => {
  const config = dungeonTiers[tier];
  const isBoss = enemyIndex === 3;
  const name = isBoss ? config.boss : config.mobs[enemyIndex];
  const baseHp = 50 + (tier.charCodeAt(0) - 69) * 25;
  const baseAttack = 10 + (tier.charCodeAt(0) - 69) * 5;
  const hp = isBoss ? Math.floor(baseHp * 1.5) : baseHp;
  const attack = isBoss ? Math.floor(baseAttack * 1.3) : baseAttack;
  const enemy = { name, hp, maxHp: hp, attack, agility: 5 + (tier.charCodeAt(0) - 69) * 2 };
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
  user.maxHp = 100 + (user.stats.vit - 1) * 20;
  user.unspentPoints = user.level - (user.stats.str + user.stats.agi + user.stats.vit + user.stats.int + user.stats.per - 5);
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
  user.hp = user.maxHp; // Reset to full HP when entering dungeon
  const enemy = createEnemy(tier, 0);
  const stats = calculateStats(user);
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
    session.awaitingWorkout = false;
    session.workoutPrompt = null;
    
    if (session.enemy.hp <= 0) {
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
            const captureRate = Math.min(95, 5 + user.stats.int * 2);
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
          
          delete combatSessions[user.id];
          return res.json({ 
            victory: true, 
            rewards: { xp: xpGain, coins: coinGain },
            captured: capturedBoss ? true : false,
            boss: capturedBoss
          });
        }
      } else {
        // Spawn next enemy
        const newEnemy = createEnemy(session.tier, session.enemyIndex);
        session.enemy = newEnemy;
        session.turn = 'player';
        return res.json({ nextEnemy: true, session });
      }
    }
    
    session.turn = 'enemy';
  }
  res.json(session);
});

app.post('/api/user/:id/combat/enemy-turn', (req, res) => {
  const user = users[req.params.id];
  const session = combatSessions[req.params.id];
  if (session && session.turn === 'enemy') {
    const damage = Math.floor(Math.random() * 15) + session.enemy.attack;
    user.hp -= damage;
    
    if (user.hp <= 0) {
      user.hp = 0;
      delete combatSessions[user.id];
      return res.json({ defeat: true });
    }
    
    session.turn = 'player';
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

app.post('/api/user/:id/inventory/equip/:itemId', (req, res) => {
  const user = users[req.params.id];
  const itemId = req.params.itemId;
  const item = user.inventory.items.find(i => i.id === itemId);
  if (item) {
    const { category } = item;
    if (category === 'weapons') user.inventory.equipped.weapon = item;
    else if (category === 'armor') user.inventory.equipped.armor[0] = item;
    else if (category === 'accessories') user.inventory.equipped.accessories[0] = item;
  }
  res.json(user.inventory);
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


app.post('/api/user/:id/boss/:bossId/mission', (req, res) => {
  const user = users[req.params.id];
  const bossId = req.params.bossId;
  const boss = user.capturedBosses.find(b => b.id === bossId);
  
  if (boss && !boss.onMission) {
    boss.onMission = true;
    boss.missionStart = Date.now();
    boss.missionDuration = 3600000; // 1 hour
    
    user.activeMissions.push({
      bossId,
      startTime: Date.now(),
      duration: 3600000,
      rewards: { xp: Math.floor(Math.random() * 200) + 100, coins: Math.floor(Math.random() * 100) + 50 }
    });
  }
  
  res.json(user);
});

app.listen(3000, () => console.log('Solo Ascent running on http://localhost:3000'));