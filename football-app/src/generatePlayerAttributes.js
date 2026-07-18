const fs = require('fs');
const path = require('path');

// Paths
const STATS_PATH = path.join(__dirname, 'football_stats_2025_2026.json');
const OUTPUT_PATH = path.join(__dirname,'player_attributes.json');

// All 28 skill attributes (in order)
const SKILLS = [
  'Acceleration', 'Sprint Speed',
  'Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties',
  'Vision', 'Crossing', 'Free Kick Accuracy', 'Short Passing', 'Long Passing', 'Curve',
  'Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure',
  'Interceptions', 'Heading Accuracy', 'Def Awareness', 'Standing Tackle', 'Sliding Tackle',
  'Jumping', 'Stamina', 'Strength', 'Aggression'
];

// Helper: compute main ratings from detailed attributes
function computeMainRatings(attrs) {
  const groups = {
    PAC: ['Acceleration', 'Sprint Speed'],
    SHO: ['Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'],
    PAS: ['Vision', 'Crossing', 'Free Kick Accuracy', 'Short Passing', 'Long Passing', 'Curve'],
    DRI: ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'],
    DEF: ['Interceptions', 'Heading Accuracy', 'Def Awareness', 'Standing Tackle', 'Sliding Tackle'],
    PHY: ['Jumping', 'Stamina', 'Strength', 'Aggression']
  };
  const result = {};
  for (const [key, fields] of Object.entries(groups)) {
    const sum = fields.reduce((acc, f) => acc + (parseInt(attrs[f]) || 0), 0);
    result[key] = Math.round(sum / fields.length);
  }
  return result;
}

// Random integer helper
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Main generation
function generate() {
  // 1. Read stats to get contributor names
  if (!fs.existsSync(STATS_PATH)) {
    console.error(`❌ Stats file not found at ${STATS_PATH}`);
    return;
  }
  const statsData = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
  const names = [...new Set(statsData.map(s => s.Contributor).filter(Boolean))];
  if (names.length === 0) {
    console.error('❌ No contributors found in stats.');
    return;
  }

  // 2. Build array of objects
  const attributesArray = names.map(name => {
    // Create a base object with Contributor
    const entry = { Contributor: name };

    // Assign random values for each skill
    SKILLS.forEach(skill => {
      entry[skill] = randomInt(0, 99);
    });

    // Compute main ratings
    const main = computeMainRatings(entry);

    // Compute overall (average of six)
    const overall = Math.round(
      (main.PAC + main.SHO + main.PAS + main.DRI + main.DEF + main.PHY) / 6
    );

    // Add main ratings and overall to the entry
    entry.PAC = main.PAC;
    entry.SHO = main.SHO;
    entry.PAS = main.PAS;
    entry.DRI = main.DRI;
    entry.DEF = main.DEF;
    entry.PHY = main.PHY;
    entry.overall = overall;

    // Optional: add a random position
    const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
    entry.position = positions[randomInt(0, positions.length - 1)];

    // Picture can be added later – we'll leave it blank (or you can add a placeholder)
    entry.picture = '';

    return entry;
  });

  // 3. Write to file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(attributesArray, null, 2));
  console.log(`✅ Generated random attributes for ${names.length} contributors.`);
  console.log(`📁 Saved to ${OUTPUT_PATH}`);
}

generate();