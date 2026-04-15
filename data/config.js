const elementColors = {
  "普通":"#6c8bad","草":"#4caf50","火":"#e64a19","水":"#2196f3",
  "光":"#29b6f6","地":"#8d6e63","冰":"#7ab5ca","龙":"#e91e63",
  "电":"#ffc107","毒":"#9c27b0","虫":"#8bc34a","武":"#ff9800",
  "翼":"#26c6da","萌":"#f06292","幽":"#7e57c2","恶":"#c2185b",
  "机械":"#26a69a","幻":"#9575cd"
};

const allElements = [
  "全部","普通","草","火","水","光","地","冰","龙","电",
  "毒","虫","武","翼","萌","幽","恶","机械","幻"
];

const weaknessTable = {
  "普通": {
    "very-effective": [], 
    "not-effective": ["地", "机械", "幽"]
  },
  "草": {
    "very-effective": ["水", "地", "光"], 
    "not-effective": ["火", "龙", "毒", "虫", "翼", "机械"]
  },
  "火": {
    "very-effective": ["草", "冰", "虫", "机械"], 
    "not-effective": ["水", "地", "龙"]
  },
  "水": {
    "very-effective": ["火", "地", "机械"], 
    "not-effective": ["草", "冰", "龙"]
  },
  "光": {
    "very-effective": ["幽", "恶"], 
    "not-effective": ["草", "冰"]
  },
  "地": {
    "very-effective": ["火", "冰", "电"], 
    "not-effective": ["草", "武"]
  },
  "冰": {
    "very-effective": ["草", "地", "龙", "翼"], 
    "not-effective": ["火", "冰", "机械"]
  },
  "龙": {
    "very-effective": ["龙"], 
    "not-effective": ["机械"]
  },
  "电": {
    "very-effective": ["水", "翼"], 
    "not-effective": ["草", "地", "龙", "电"]
  },
  "毒": {
    "very-effective": ["草", "萌"], 
    "not-effective": ["地", "毒", "幽", "机械"]
  },
  "虫": {
    "very-effective": ["草", "恶", "幻"], 
    "not-effective": ["火", "毒", "武", "翼", "萌", "幽", "机械"]
  },
  "武": {
    "very-effective": ["普通", "地", "冰", "恶", "机械"], 
    "not-effective": ["毒", "虫", "翼", "萌", "幽", "幻"]
  },
  "翼": {
    "very-effective": ["草","虫","武"], 
    "not-effective": ["地", "龙", "电", "机械"]
  },
  "萌": {
    "very-effective": ["龙", "武", "恶"], 
    "not-effective": ["火", "毒", "机械"]
  },
  "幽": {
    "very-effective": ["光", "幽", "幻"], 
    "not-effective": ["普通", "恶"]
  },
  "恶": {
    "very-effective": ["毒", "萌", "幽"], 
    "not-effective": ["光", "武", "恶"]
  },
  "机械": {
    "very-effective": ["地", "冰", "萌"], 
    "not-effective": ["火", "水", "电", "机械"]
  },
  "幻": {
    "very-effective": ["毒", "武"], 
    "not-effective": ["光", "机械", "幻"]
  },
};