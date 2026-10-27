import type { Profile, Cat, Notification, CatInteraction, CatDiary, CatAccessory, StrayCat } from '../types/index';

/** Fictional identities and Simple-CRS grid values; no physical location, account or original data. */
export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
const DATE = '2026-01-01T00:00:00.000Z';
const KEY = 'mapcatbox_app_synthetic_v1';
export interface DemoState { profile: Profile; cats: Cat[]; notifications: Notification[]; interactions: CatInteraction[]; diaries: CatDiary[]; accessories: CatAccessory[] }
export function initialDemo(): DemoState {
 return {
  profile: {id:DEMO_USER_ID,username:'合成演示用户',cat_name:'演示橘团',cat_breed:'田园猫',cat_color:'orange',cat_eyes:'round_yellow',cat_accessory:null,bio:'这里是离线虚构猫咪，不代表真人、真实地点或真实云账号。',avatar_url:null,theme_preference:'warm',visibility:'invisible',created_at:DATE,updated_at:DATE},
  cats: ['演示橘团','演示花卷'].map((name,i)=>({id:`demo-pet-${i}`,owner_id:DEMO_USER_ID,name,breed:'田园猫',color:i?'calico_classic':'orange',rarity:i?'rare':'common',personality:'friendly',story:'程序生成的虚构猫咪',adopted_at:DATE,evolved_at:null,level:1,hunger:50,mood:50,energy:80,is_away:false,away_since:null,created_at:DATE,updated_at:DATE})),
  notifications:[{id:'demo-notice',user_id:DEMO_USER_ID,type:'system',title:'离线合成演示',message:'数据仅保存在当前浏览器，不连接云端、不请求设备位置。',is_read:false,action_url:null,created_at:DATE}],
  interactions:[],diaries:[{id:'demo-diary',cat_id:'demo-pet-0',date:'2026-01-01',title:'演示日记',content:'这段文字为程序合成样例。',highlights:['离线','虚构'],created_at:DATE}],accessories:[]
 };
}
let memory: DemoState | null = null;
export function readDemo(): DemoState {
 if(memory)return memory;
 if(typeof window!=='undefined')try {
  const value=JSON.parse(localStorage.getItem(KEY)||'null');
  // Only read this application's new demo key; never import old/private application stores.
  if(value?.profile?.id===DEMO_USER_ID && Array.isArray(value.cats) && Array.isArray(value.notifications) && Array.isArray(value.interactions) && Array.isArray(value.diaries) && Array.isArray(value.accessories)) memory=value;
 } catch { /* Invalid local demo data is discarded. */ }
 return memory ||= initialDemo();
}
export function saveDemo(state:DemoState):DemoState {
 memory=state;
 if(typeof window!=='undefined')try {localStorage.setItem(KEY,JSON.stringify(state));}catch {/* Storage can be disabled by the browser. */}
 return state;
}
export function resetDemo(){return saveDemo(initialDemo());}
export function interactDemo(catId:string,kind:'feed'|'play'|'pet') {
 const state=readDemo();
 state.cats=state.cats.map(cat=>cat.id!==catId?cat:{...cat,hunger:kind==='feed'?Math.min(100,cat.hunger+20):cat.hunger,mood:kind==='feed'?cat.mood:Math.min(100,cat.mood+(kind==='play'?20:5)),energy:kind==='play'?Math.max(0,cat.energy-10):cat.energy});
 state.interactions.unshift({id:`demo-action-${Date.now()}-${state.interactions.length}`,cat_id:catId,user_id:DEMO_USER_ID,interaction_type:kind,details:'离线合成互动',created_at:new Date().toISOString()});
 saveDemo(state);return state.cats.find(x=>x.id===catId)||null;
}
export const demoStrays: StrayCat[] = [[-18,-24],[-12,-7],[-20,12],[-8,26],[16,-22],[22,-6],[10,10],[25,24]].map(([latitude,longitude],i)=>({id:`demo-stray-${i}`,name:`合成小猫${i+1}`,breed:'田园猫',color:'orange',rarity:'common',personality:'friendly',story:'虚构猫咪与数学网格示例，不代表现实动物或地点。',latitude,longitude,city:'合成网格',is_found:false,found_by:null,found_at:null,created_at:DATE}));
