export interface PositionSample { latitude:number; longitude:number; accuracy:number }
/** Explicit sharing gate with an actual monotonic 30s attempt limit and no concurrent writes. */
export function createLocationWriter(write:(sample:PositionSample)=>Promise<unknown>,now=()=>performance.now(),intervalMs=30000) {
 let active=true,busy=false,lastAttempt=-Infinity;
 let pending:Promise<unknown>|null=null;
 return {
  async submit(sample:PositionSample) {
   if(!active||busy||![sample.latitude,sample.longitude,sample.accuracy].every(Number.isFinite)||Math.abs(sample.latitude)>90||Math.abs(sample.longitude)>180||sample.accuracy<0)return false;
   const time=now();if(time-lastAttempt<intervalMs)return false;
   busy=true;lastAttempt=time;
   try {pending=Promise.resolve().then(()=>active?write(sample):undefined);await pending;return active;} finally {busy=false;pending=null;}
  },
  async stop(){active=false;try {await pending;}catch {/* The caller handles the write error; revocation still proceeds. */}}
 };
}
