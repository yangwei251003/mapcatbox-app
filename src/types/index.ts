// ============================================================
// MapCatBox Type Definitions
// ============================================================

export interface Profile {
  id: string;
  username: string;
  cat_name: string;
  cat_breed: string;
  cat_color: string;
  cat_eyes: string;
  cat_accessory: string | null;
  bio: string;
  avatar_url: string | null;
  theme_preference: 'warm' | 'dark';
  visibility: 'public' | 'friends_only' | 'invisible';
  created_at: string;
  updated_at: string;
}

export interface Cat {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  personality: string;
  story: string;
  adopted_at: string;
  evolved_at: string | null;
  level: number;
  hunger: number;
  mood: number;
  energy: number;
  is_away: boolean;
  away_since: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  owner?: Profile;
  interactions?: CatInteraction[];
  diaries?: CatDiary[];
}

export interface CatAccessory {
  id: string;
  cat_id: string;
  accessory_type: string;
  accessory_name: string;
  equipped: boolean;
  acquired_at: string;
}

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  updated_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  // Relations
  profile?: Profile;
  friend?: Profile;
}

export interface StrayCat {
  id: string;
  name: string;
  breed: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  personality: string;
  story: string;
  latitude: number;
  longitude: number;
  city: string;
  is_found: boolean;
  found_by: string | null;
  found_at: string | null;
  created_at: string;
}

export interface CatInteraction {
  id: string;
  cat_id: string;
  user_id: string;
  interaction_type: 'feed' | 'play' | 'pet' | 'dress' | 'gift_food';
  details: string;
  created_at: string;
}

export interface CatDiary {
  id: string;
  cat_id: string;
  date: string;
  title: string;
  content: string;
  highlights: string[];
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  check_date: string;
  streak: number;
  reward: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'gift_received' | 'cat_hungry' | 'cat_away' | 'stray_nearby' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface CatFood {
  id: string;
  user_id: string;
  amount: number;
  updated_at: string;
}

// Cat breed definitions for avatar creation
export interface CatBreedOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  colors: CatColorOption[];
}

export interface CatColorOption {
  id: string;
  name: string;
  hex: string;
  secondary_hex: string;
}

export interface CatEyeOption {
  id: string;
  name: string;
  description: string;
}

// Cat interaction constants
export const CAT_BREEDS: CatBreedOption[] = [
  {
    id: 'tabby',
    name: '田园猫',
    emoji: '🐱',
    description: '最常见的中华田园猫，活泼好动',
    colors: [
      { id: 'orange', name: '橘色', hex: '#F59E6B', secondary_hex: '#FDEBD7' },
      { id: 'black', name: '黑色', hex: '#3D322B', secondary_hex: '#8B7D72' },
      { id: 'white', name: '白色', hex: '#FEFEFE', secondary_hex: '#F0E8DF' },
      { id: 'grey', name: '灰白', hex: '#C4B8AF', secondary_hex: '#F5F0EB' },
    ],
  },
  {
    id: 'siamese',
    name: '暹罗猫',
    emoji: '🐱',
    description: '优雅的暹罗猫，聪明且黏人',
    colors: [
      { id: 'seal', name: '海豹色', hex: '#8B7355', secondary_hex: '#F5E6D3' },
      { id: 'blue', name: '蓝色', hex: '#9CA3AF', secondary_hex: '#E5E7EB' },
      { id: 'chocolate', name: '巧克力', hex: '#8B4513', secondary_hex: '#DEB887' },
    ],
  },
  {
    id: 'persian',
    name: '波斯猫',
    emoji: '🐱',
    description: '高贵优雅的波斯猫，温柔安静',
    colors: [
      { id: 'white', name: '雪白', hex: '#FAFAFA', secondary_hex: '#F5F0EB' },
      { id: 'cream', name: '奶油', hex: '#F5E6D3', secondary_hex: '#FDEBD7' },
      { id: 'silver', name: '银灰', hex: '#D4D4D8', secondary_hex: '#E4E4E7' },
    ],
  },
  {
    id: 'american_shorthair',
    name: '美短',
    emoji: '🐱',
    description: '虎斑美短，活泼亲人',
    colors: [
      { id: 'silver_tabby', name: '银虎斑', hex: '#A8A29E', secondary_hex: '#F5F0EB' },
      { id: 'brown_tabby', name: '棕虎斑', hex: '#8B7355', secondary_hex: '#DEB887' },
    ],
  },
  {
    id: 'calico',
    name: '三花猫',
    emoji: '🐱',
    description: '独特的三花配色，每只都不一样',
    colors: [
      { id: 'calico_classic', name: '经典三花', hex: '#F59E6B', secondary_hex: '#F0A8B8' },
      { id: 'dilute_calico', name: '淡三花', hex: '#D4C4A8', secondary_hex: '#E8D5C8' },
    ],
  },
  {
    id: 'ragdoll',
    name: '布偶猫',
    emoji: '🐱',
    description: '仙女猫布偶，性格超好',
    colors: [
      { id: 'blue_point', name: '蓝重点', hex: '#E8E0D8', secondary_hex: '#9CA3AF' },
      { id: 'seal_point', name: '海豹重点', hex: '#F5E6D3', secondary_hex: '#8B7355' },
    ],
  },
];

export const CAT_EYES: CatEyeOption[] = [
  { id: 'round_yellow', name: '金黄圆瞳', description: '温暖可爱的金黄色大眼' },
  { id: 'round_green', name: '翡翠绿瞳', description: '神秘优雅的绿色眼睛' },
  { id: 'round_blue', name: '蓝宝石瞳', description: '清澈迷人的蓝色眼睛' },
  { id: 'heterochromia', name: '异色瞳', description: '一蓝一黄的独特异色瞳' },
  { id: 'sleepy', name: '眯眯眼', description: '总是看起来很困的眯眼' },
];

export const INITIAL_ACCESSORIES = [
  { type: 'collar', name: '红色项圈' },
  { type: 'collar', name: '蓝色项圈' },
  { type: 'bell', name: '小铃铛' },
  { type: 'bow', name: '蝴蝶结' },
  { type: 'ribbon', name: '丝带' },
];
