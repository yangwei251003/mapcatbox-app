# 自有与第三方材料

本仓库的自有应用代码、公开整理文档与程序绘制SVG采用根MIT；MIT不覆盖下列第三方作品、商标或服务。原Next初始SVG/图标作为脚手架材料保留，按Next/Vercel原MIT；未把框架商标冒称个人作品。

React、Next、Zustand、Framer Motion、Supabase客户端、pg、Serwist及其依赖保留各自原通知；依赖出现在清单中不代表Serwist/PWA后台功能已经启用或验收。Leaflet为BSD-2-Clause；**React-Leaflet 5与其core为Hippocratic-2.1**，完整原许可随源码和静态网页提供，不把它改授MIT或宣称全栈纯MIT。Lucide为ISC。

`npm run licenses:generate` 从实际安装生产树递归读取完整LICENSE/COPYING/NOTICE，记录每个包与原文，不用短SPDX标签代替全文。缺少原文时仅允许已核实的同版本Next/React上游补充；未解决时失败。Linux Sharp/libvips通知补充是确切1.3.4原包的版本校验材料，保留LGPL/GPL/MPL等组成条款，不能因npm包声明Apache就抹去原组件许可。资料在 `licenses/upstream/`，来源、哈希、组件版本一并保存。

另两个npm包未捆绑许可证，按 `WASM-NOTICE-SOURCES.json` 保留完整官方补充：napi-rs采用其确切npm gitHead的根许可证；wasm-util0.10.3确切gitHead的package.json标MIT，但该提交的LICENSE路径不存在，因此明确采用当前官方维护者MIT全文与原署名作补充，未伪造为旧提交或npm包内原文。

完整生产依赖通知写入 `licenses/NPM_NOTICES.md` 与 `public/licenses/NPM_NOTICES.md`，自有MIT写入 `public/licenses/PROJECT_MIT.txt`，随静态 `out` 一同交付。`.env.local`、依赖二进制、私人数据库、旧机器缓存、原私人定位与真实连接配置不在仓库中。

默认网格/猫咪SVG为自有绘图，猫箱的SVG由应用代码绘制，人物/故事/位置为确定合成数据；无客户图像、真实宠物照片、外部地图瓦片或Google字体文件。原未知真伪城市种子不再分发。

个人显式云模式改用OSM标准瓦片，按其[瓦片政策](https://operations.osmfoundation.org/policies/tiles/)与[版权/归属](https://www.openstreetmap.org/copyright)使用，页面保留OpenStreetMap贡献者归属；没有下载/打包瓦片。原CARTO/unpkg热链已移除。云/GPS/OSM模式此次没有连接验证。
