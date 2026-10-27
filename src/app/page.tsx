import Link from 'next/link';

export default function Home() {
  return <section className="min-h-[70dvh] flex flex-col items-center justify-center text-center gap-4 px-6"><span className="text-6xl">🐱</span><h1 className="text-3xl font-bold">地图猫箱 · 合成演示</h1><p>开发中的地图探索与虚拟猫咪原型。默认数学网格、虚构数据、本机存储。</p><Link href="/map" className="px-6 py-3 rounded-xl bg-orange-400 text-white">进入合成地图</Link><p className="text-sm">不请求位置、不连接远程数据库、不接收账号密码。</p></section>;
}
