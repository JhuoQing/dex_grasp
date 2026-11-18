import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Layers,
  Database,
  Sparkles,
  BarChart3,
  MousePointerClick,
  Github,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Zap,
  Compass,
  Code2,
  Copy,
  Check,
  BookOpen,
  Box,
  Hand,
  Activity,
  AlertTriangle,
  Play,
  RotateCcw,
  Terminal,
  FileText,
  Filter,
  Eye,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ==========================================
// MATH RENDERING HELPERS (KaTeX)
// ==========================================
function Tex({ children, display = false }) {
  const html = useMemo(
    () =>
      katex.renderToString(String(children), {
        displayMode: display,
        throwOnError: false,
        strict: false
      }),
    [children, display]
  );
  return display ? (
    <div className="tex-display" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// Renders text containing inline math written as $...$
function Rich({ text }) {
  const parts = String(text).split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.length > 2 && part.startsWith('$') && part.endsWith('$') ? (
          <Tex key={i}>{part.slice(1, -1)}</Tex>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

const POSE_DESC = {
  pregrasp:
    '【Pre-grasp Pose $(R_p, T_p, q_p)$】：在 Grasp Pose 完成後，於 MuJoCo 開啟 2 cm contact margin 將手部往外推開，提供 CuRobo 進行無碰撞運動規劃的到達目標點。',
  grasp:
    '【Grasp Pose $(R_g, T_g, q_g)$】：經由 Stage 3 轉置雅可比局部精煉 (1 mm contact margin) 獲得，手部連桿貼合物體表面 $[0,\\,2\\,\\mathrm{mm}]$ 且保證 0.00 mm 零穿模。',
  squeeze:
    '【Squeeze Pose $q_s$】：由 Stage 4 接觸感知控制策略 (Eq. 3 & Eq. 8) 算出的關節力矩轉換而來，用於在真實世界或模擬器中向物體施加穩定內應力。'
};

// ==========================================
// DATA DEFINITIONS (From Paper & Appendices)
// ==========================================

const GRASP_TAXONOMY_DATA = [
  { id: 1, name: 'Large Diameter', zh: '大直徑圓柱抓握', category: 'Power', cln: 11.2, gsrNormal: 30.1, gsrHard: 18.4, pct: 3.0, objects: '大水瓶、保溫杯、罐頭、滅火器', fingers: '全五指包覆 + 手掌貼合', included: true },
  { id: 2, name: 'Small Diameter', zh: '小直徑圓柱抓握', category: 'Power', cln: 9.8, gsrNormal: 28.5, gsrHard: 16.2, pct: 3.3, objects: '螺絲起子柄、細管、手電筒', fingers: '五指緊密環繞握持', included: true },
  { id: 3, name: 'Medium Wrap', zh: '中度包覆抓握', category: 'Power', cln: 10.4, gsrNormal: 22.1, gsrHard: 13.0, pct: 1.7, objects: '鎚子、噴霧瓶、把手', fingers: '四指與拇指環繞包覆', included: true },
  { id: 4, name: 'Adducted Thumb', zh: '內收拇指抓握', category: 'Power', cln: 9.1, gsrNormal: 25.4, gsrHard: 14.1, pct: 2.8, objects: '玩偶、工具握柄、長條物', fingers: '四指彎曲、拇指內收貼合側面', included: true },
  { id: 5, name: 'Light Tool', zh: '輕型工具抓握', category: 'Power', cln: 8.5, gsrNormal: 21.0, gsrHard: 11.5, pct: 1.65, objects: '小型公仔、細桿工具', fingers: '四指包覆、拇指沿軸向壓住', included: true },
  { id: 6, name: 'Prismatic 4 Finger', zh: '四指稜柱抓握', category: 'Precision', cln: 5.4, gsrNormal: 57.1, gsrHard: 24.3, pct: 6.05, objects: '長方盒、書本、厚磚塊', fingers: '拇指與四指指腹對稱夾持', included: true },
  { id: 7, name: 'Prismatic 3 Finger', zh: '三指稜柱抓握', category: 'Precision', cln: 4.3, gsrNormal: 51.2, gsrHard: 20.8, pct: 5.5, objects: '中型盒裝物、絨毛玩偶', fingers: '拇指與食、中、無名指對夾', included: true },
  { id: 8, name: 'Prismatic 2 Finger', zh: '雙指稜柱抓握', category: 'Precision', cln: 3.2, gsrNormal: 44.6, gsrHard: 16.5, pct: 4.7, objects: '瓶頸、小型柱狀物', fingers: '拇指與食、中指指尖夾持', included: true },
  { id: 9, name: 'Palmar Pinch', zh: '掌指腹捏取', category: 'Precision', cln: 2.4, gsrNormal: 48.0, gsrHard: 14.2, pct: 2.75, objects: '硬幣、薄片、小圓餅', fingers: '拇指與食指指腹相對捏持', included: true },
  { id: 10, name: 'Power Disk', zh: '力量圓盤抓握', category: 'Power', cln: 8.9, gsrNormal: 26.8, gsrHard: 15.0, pct: 3.1, objects: '碗、圓罐蓋、球體上半部', fingers: '手掌與五指呈弧形包覆圓盤', included: true },
  { id: 11, name: 'Power Sphere', zh: '力量球體抓握', category: 'Power', cln: 10.1, gsrNormal: 38.4, gsrHard: 21.6, pct: 6.8, objects: '蘋果、球類、圓形燈泡', fingers: '五指與掌心全方位包覆球面', included: true },
  { id: 12, name: 'Precision Disk', zh: '精密圓盤抓握', category: 'Precision', cln: 5.1, gsrNormal: 41.2, gsrHard: 15.8, pct: 3.8, objects: '碟子、寬扁圓盒', fingers: '五指指尖沿圓盤邊緣對稱抓持', included: true },
  { id: 13, name: 'Precision Sphere', zh: '精密球體抓握', category: 'Precision', cln: 5.2, gsrNormal: 49.5, gsrHard: 19.2, pct: 4.95, objects: '網球、小杯口、球狀物', fingers: '五指指尖呈籠狀抓持球面', included: true },
  { id: 14, name: 'Tripod', zh: '三腳架抓握', category: 'Precision', cln: 3.3, gsrNormal: 39.8, gsrHard: 13.4, pct: 3.4, objects: '小瓶蓋、石塊、不規則小物', fingers: '拇指、食指、中指三點指尖穩定', included: true },
  { id: 15, name: 'Fixed Hook', zh: '固定鉤狀抓握', category: 'Power', cln: 7.2, gsrNormal: 16.5, gsrHard: 8.9, pct: 1.1, objects: '提籃把手、水壺提把、袋子', fingers: '四指彎曲成鉤狀承重，拇指輔助', included: true },
  { id: 16, name: 'Lateral', zh: '側向捏持 (鑰匙握)', category: 'Intermediate', cln: 3.1, gsrNormal: 24.5, gsrHard: 7.8, pct: 2.2, objects: '鑰匙、薄卡片、扁平書本', fingers: '拇指指腹壓向食指側邊', included: true },
  { id: 17, name: 'Index Finger Extension', zh: '食指伸展抓握', category: 'Power', cln: 8.4, gsrNormal: 19.8, gsrHard: 10.4, pct: 1.45, objects: '噴霧槍、手電筒開關、餐刀', fingers: '三指與拇指包覆，食指前伸按壓', included: true },
  { id: 18, name: 'Extension Type', zh: '伸展型平托抓握', category: 'Power', cln: 7.6, gsrNormal: 61.2, gsrHard: 22.4, pct: 4.8, objects: '托盤、平底盒、書冊', fingers: '四指伸直併攏與拇指對向夾托', included: true },
  { id: 19, name: 'Distal Type', zh: '遠端指節操作 (剪刀)', category: 'Power', cln: 6.5, gsrNormal: null, gsrHard: null, pct: 0, objects: '剪刀雙環', fingers: '拇指與中/無名指穿入孔洞', included: false, excludeReason: '高度綁定特定物體幾何（剪刀雙孔），故排除於通用 Dexonomy 資料集外（論文 Fig. 6 另有專門展示）' },
  { id: 20, name: 'Writing Tripod', zh: '書寫三腳架抓握', category: 'Precision', cln: 4.1, gsrNormal: 28.4, gsrHard: 9.5, pct: 2.3, objects: '筆、畫筆、棒狀工具', fingers: '拇指與食指捏持，筆桿靠在中指側', included: true },
  { id: 21, name: 'Tripod Variation', zh: '三腳架變體 (筷子)', category: 'Intermediate', cln: 5.0, gsrNormal: null, gsrHard: null, pct: 0, objects: '雙支筷子', fingers: '雙桿分離夾持機構', included: false, excludeReason: '專屬於雙桿（筷子）操作，不適用於單一剛體通用資料集' },
  { id: 22, name: 'Parallel Extension', zh: '平行伸展抓握', category: 'Precision', cln: 5.8, gsrNormal: 52.0, gsrHard: 19.6, pct: 3.15, objects: '方形盒、扁平容器、書本', fingers: '四指伸直與拇指平行對夾', included: true },
  { id: 23, name: 'Adduction Grip', zh: '手指內收夾持', category: 'Intermediate', cln: 2.8, gsrNormal: 38.2, gsrHard: 9.1, pct: 5.2, objects: '薄片、筆桿、高腳杯頸', fingers: '食指與中指側面內收夾住物體', included: true },
  { id: 24, name: 'Tip Pinch', zh: '指尖精確捏取', category: 'Precision', cln: 2.1, gsrNormal: 42.1, gsrHard: 11.2, pct: 4.55, objects: '極小零件、珠子、細柄', fingers: '拇指尖與食指尖端點對點捏取', included: true },
  { id: 25, name: 'Lateral Tripod', zh: '側向三腳架抓握', category: 'Intermediate', cln: 4.2, gsrNormal: 31.0, gsrHard: 8.8, pct: 3.05, objects: '鑰匙串、不規則扁平物', fingers: '拇指、食指尖與中指側面協同', included: true },
  { id: 26, name: 'Sphere 4 Finger', zh: '四指球體抓握', category: 'Power', cln: 6.8, gsrNormal: 51.3, gsrHard: 18.9, pct: 2.55, objects: '球形器皿、圓弧玩具', fingers: '拇指與三指環抱球體', included: true },
  { id: 27, name: 'Quadpod', zh: '四腳架抓握', category: 'Precision', cln: 4.4, gsrNormal: 46.8, gsrHard: 16.4, pct: 4.45, objects: '中型多面體、石塊、蓋子', fingers: '拇指、食、中、無名指四指尖對稱', included: true },
  { id: 28, name: 'Sphere 3 Finger', zh: '三指球體抓握', category: 'Power', cln: 5.9, gsrNormal: 43.2, gsrHard: 16.1, pct: 4.0, objects: '漢堡、圓球、小型碗', fingers: '拇指與食、中指深層包覆球面', included: true },
  { id: 29, name: 'Stick', zh: '棍棒握持', category: 'Power', cln: 8.7, gsrNormal: 21.8, gsrHard: 11.9, pct: 1.7, objects: '高腳杯柱、短劍柄、棒槌', fingers: '五指緊握軸柱，拇指壓在食指上', included: true },
  { id: 30, name: 'Palmar', zh: '全掌壓握', category: 'Power', cln: 8.2, gsrNormal: 15.4, gsrHard: 8.2, pct: 1.0, objects: '平盤、滑鼠狀物體', fingers: '四指彎曲與掌心包覆，拇指外展', included: true },
  { id: 31, name: 'Ring', zh: '環狀圈握', category: 'Intermediate', cln: 4.9, gsrNormal: 47.8, gsrHard: 14.5, pct: 1.2, objects: '圓柱瓶身、細管、捲筒', fingers: '拇指與食指圍成圓環圈住物體', included: true },
  { id: 32, name: 'Ventral', zh: '腹側夾握', category: 'Intermediate', cln: 5.5, gsrNormal: 22.4, gsrHard: 6.4, pct: 1.85, objects: '衣架桿、薄板邊緣', fingers: '手指近端指節與掌心夾住桿狀物', included: true },
  { id: 33, name: 'Inferior Pincer', zh: '下鉗式抓握', category: 'Precision', cln: 3.6, gsrNormal: 46.3, gsrHard: 15.1, pct: 1.95, objects: '馬芬蛋糕、圓球底部', fingers: '拇指與食指腹從下方呈鉗狀托起', included: true }
];

const PIPELINE_STAGES = [
  {
    step: 1,
    title: 'Grasp Template Library',
    zhTitle: '1. 抓取模板庫 (單一人工標註模板起點)',
    badge: 'Initialization',
    color: 'from-blue-500 to-cyan-500',
    timeCost: '一次性標註 (每手型 × 每類型僅需 1 個)',
    device: 'Human GUI / Library',
    summary: '打破傳統從零開始隨機搜索或依賴海量遙操作數據的限制。每個靈巧手與抓取類型只需要「1 個」人工標註的初始模板，即可啟動整個自動化合成飛輪。',
    mathTitle: '模板數學定義 (Template Representation)',
    formula: 'T = \\left\\{ \\mathbf{q} \\in \\mathbb{R}^{n_q},\\; \\left\\{ \\left( p_i^h \\in \\mathbb{R}^3,\\; n_i^h \\in \\mathbb{R}^3,\\; \\text{link}_i \\right) \\right\\}_{i=1}^{m} \\right\\}',
    details: [
      '關節組態 $\\mathbf{q} \\in \\mathbb{R}^{n_q}$：定義靈巧手該抓取類型的基礎自然手勢（如 Power Sphere 或 Tip Pinch）。',
      '手部接觸點 $p_i^h \\in \\mathbb{R}^3$ 與法向量 $n_i^h \\in \\mathbb{R}^3$：標註手部表面預期與物體接觸的位置與朝向。',
      '所屬連桿名稱 ($\\text{link}_i$)：記錄每個接觸點位於哪一個手指連桿上，供後續正向運動學與雅可比矩陣計算使用。'
    ]
  },
  {
    step: 2,
    title: 'Lightweight Global Alignment of Object Pose',
    zhTitle: '2. 輕量級物體姿態全域對齊 (逆向思維)',
    badge: 'GPU Massive Parallel',
    color: 'from-cyan-500 to-emerald-500',
    timeCost: '~3.0 秒 / 100,000 個初始採樣 (單張 RTX 3090)',
    device: 'NVIDIA Warp (GPU)',
    summary: '核心洞見：與其直接調整高維度的手部關節去遷就物體，不如「先固定手部模板，密集採樣並最佳化物體的旋轉、平移與縮放 $(s_o, R_o, t_o)$ 來對齊手部接觸點」！',
    mathTitle: '最近點距離與法向量對齊能量函數 (Eq. 7)',
    formula: 'L(s_o, R_o, t_o) = k_p \\sum_{i=1}^m \\| p_i^h - p_i^o \\|^2 + k_n \\sum_{i=1}^m \\| n_i^h - n_i^o \\|^2',
    details: [
      '密集初始化：隨機抽取模板上 1 個手部接觸點與物體表面 1 個點進行法向量反向對齊，隨機採樣法向平面內旋轉與尺度。',
      '極簡優化能量：在優化迴圈中僅使用 NVIDIA Warp 查詢最近點 $p_i^o$ 並最小化 Eq. 7，完全不放碰撞或力封閉項，實現極致 GPU 平行化（10萬樣本 1.2 秒優化完成）。',
      '四道順序後過濾 (Post-Filtering)：(1) 能量閾值過濾 (>50k/80k 被濾除) → (2) 手部線段碰撞骨架 (Collision Skeleton) 濾除嚴重穿模 → (3) Batched ReLU-QP 計算力封閉品質指標 $e$ → (4) 最遠點採樣 (FPS) 去除重複物體變換。'
    ]
  },
  {
    step: 3,
    title: 'Simulation-based Local Refinement of Hand Pose',
    zhTitle: '3. 基於物理模擬器的手部姿態局部精煉',
    badge: 'Zero-Penetration',
    color: 'from-emerald-500 to-teal-500',
    timeCost: '< 0.1 秒 / 200 步模擬 (>200 grasps/sec @ 32 threads)',
    device: 'MuJoCo (2nd-order Newton)',
    summary: '物體對齊後固定不動，將手部放入 MuJoCo 物理引擎中。不再手寫複雜且容易穿模的自訂梯度優化器，而是利用轉置雅可比控制施加虛擬吸引力，讓手指自然貼合物體表面。',
    mathTitle: '虛擬吸引力與轉置雅可比控制 (Eq. 8)',
    formula: 'f_i = k_f (p_i^h - p_i^o), \\quad \\tau = \\sum_{i=1}^m J_{h,i}^T f_i',
    details: [
      '世界座標固定目標點：在 200 步迭代中，物體目標點 $p_i^o$ 固定於世界座標系避免滑移，而手部點 $p_i^h$ 隨手部連桿移動。',
      '1mm 接觸邊距與 2mm 接觸容差：在 MuJoCo 設定 1mm contact margin 產生排斥力，確保碰撞網格零穿模 (PD = 0.00 mm)，並將 $[0,\\,2\\,\\mathrm{mm}]$ 內視為有效接觸。',
      '三道精煉後過濾：(1) 碰撞網格零穿模檢查 → (2) 所有具標註接觸的手指必須實際接觸物體 → (3) 重新驗證力封閉指標 Eq. 6。',
      '同時生成 Pre-grasp Pose：在精煉完成後開啟 2cm contact margin 將手向外推開，自動獲得無碰撞預抓取姿態。'
    ]
  },
  {
    step: 4,
    title: 'Simulation Validation with Contact-Aware Control',
    zhTitle: '4. 接觸感知控制策略之物理模擬驗證',
    badge: 'Force Closure 6-Axis',
    color: 'from-amber-500 to-orange-500',
    timeCost: '~3,000 步模擬 (6 個正交外力方向 × 500 步)',
    device: 'MuJoCo + LCQP Solver',
    summary: '傳統方法使用「固定比例縮小關節角」的啟發式擠壓，對於側面夾持、內收夾持或複雜抓取類型會導致手指脫離物體。本文提出接觸感知控制，透過 QP 解算每個接觸點應施予的最佳內力。',
    mathTitle: '帶摩擦錐約束之最佳接觸力二次規劃 (Eq. 3–5)',
    formula: '(f_1, \\dots, f_m) = \\arg\\min \\left\\| \\sum_{i=1}^m J_{o,i}^T x_i - g \\right\\|^2 \\quad \\text{s.t. } x_i \\in \\mathcal{F}_i, \\; \\sum_{i=1}^m x_{i,1} \\ge \\lambda',
    details: [
      '設 $g = 0$ 的統一控制信號：求解合力為零但總法向力 $\\sum_{i} x_{i,1} \\ge \\lambda$（約 1~10 N）的內應力組，再透過 $\\tau = \\sum_{i} J_{h,i}^{T} f_i$ 轉換為關節控制力矩 (衍生出 Squeeze Pose)。',
      '摩擦錐自然調節：當物體受到外力時，高達 1~10N 的正向接觸力提供充足的最大靜摩擦力空間，使摩擦錐自動抵消外力。',
      '六軸嚴格測試：對 100g 物體施加 6 個正交方向的重力/外力各持續 2 秒，位移 $<5\\,\\mathrm{cm}$ 且旋轉 $<15^{\\circ}$ 且無 $>1\\,\\mathrm{cm}$ 穿模才算成功。'
    ]
  },
  {
    step: 5,
    title: 'Construction of New Grasp Templates',
    zhTitle: '5. 新抓取模板建構與動態演進飛輪',
    badge: 'Self-Evolving Flywheel',
    color: 'from-purple-500 to-indigo-500',
    timeCost: '10 Epochs × 10 Attempts 迭代擴增',
    device: 'Template Repository',
    summary: '通過 MuJoCo 六軸測試的成功抓取，會自動提取其關節角 $\\mathbf{q}$ 與更新後的實際接觸點/法向量，加入抓取模板庫中，供下一輪 Global Alignment 隨機抽樣使用！',
    mathTitle: '局部接觸更新保護機制',
    formula: 'p_i^{h,\\text{new}} = \\begin{cases} p_i^{\\text{actual}}, & \\text{if } \\|p_i^{\\text{actual}} - p_i^h\\| < \\epsilon_{\\text{link}} \\\\ p_i^h, & \\text{otherwise} \\end{cases}',
    details: [
      '防止語意漂移：只有當新檢測到的接觸點位於同一連桿且靠近原始標註點時才更新接觸資訊，確保抓取類型語意不走樣。',
      '對抗劣質初始標註 (Table VII)：即使初始人工標註帶有嚴重法向量雜訊（無更新僅 1.7% 成功率），只要有極少數成功樣本進入模板庫，成功率即可飆升回 46.2% ~ 57.1%！',
      '跨幾何泛化：讓模板庫從單一圓柱姿態逐步適應各種扁平、凹陷、異形物體（Objaverse 物件成功率達 94.63%）。'
    ]
  }
];

const BENCHMARK_TABLE_II = [
  { method: 'DexGraspNet [47]', gsr: 12.10, osr: 57.01, speed: 3.25, cln: 3.22, cdc: 7.58, pd: 4.85, spd: 1.20, div: 29.03, note: '接觸點隨機性高，常出現手指扭曲或穿模' },
  { method: 'FRoGGeR [25]', gsr: 10.34, osr: 55.70, speed: 2.98, cln: 2.51, cdc: 4.95, pd: 0.22, spd: 0.00, div: 27.01, note: '簡單幾何表現佳，但在複雜幾何 (Scale=0.17) 全數失敗' },
  { method: 'SpringGrasp [8]', gsr: 7.83, osr: 35.44, speed: 5.47, cln: 2.79, cdc: 23.59, pd: 16.58, spd: 1.06, div: 70.18, note: '嚴重穿模 (16.58mm) 且拇指經常超出可行關節極限' },
  { method: 'BODex [7]', gsr: 49.23, osr: 96.56, speed: 403.9, cln: 3.85, cdc: 3.03, pd: 0.63, spd: 0.02, div: 32.50, note: 'GPU 極速優化，但手指幾乎不彎曲，手勢較不自然' },
  { method: 'Dexonomy (Ours)', gsr: 60.50, osr: 96.53, speed: 323.4, cln: 4.38, cdc: 0.21, pd: 0.00, spd: 0.00, div: 34.17, note: '最高成功率、0.00mm 絕對零穿模、0.21mm 極致接觸一致性', isOurs: true }
];

const DATASET_COMPARISON = [
  { name: 'DexGraspNet [47]', hand: 'Shadow', sim: 'IsaacGym', objects: '5.4k', grasps: '1.32M', types: 'Random', fc: true, dataType: 'Grasp pose', method: 'Optimization' },
  { name: 'RealDex [29]', hand: 'Shadow', sim: 'Real', objects: '52', grasps: '59k', types: 'Random', fc: false, dataType: 'Motion', method: 'Teleoperation' },
  { name: 'GraspXL [59]', hand: 'Multiple', sim: 'RaiSim', objects: '500k', grasps: '10M', types: 'Random', fc: false, dataType: 'Motion', method: 'RL' },
  { name: 'BODex [7]', hand: 'Shadow', sim: 'MuJoCo', objects: '2.4k', grasps: '3.62M', types: 'Fingertip', fc: true, dataType: 'Pre-grasp, grasp poses', method: 'Optimization' },
  { name: 'Dexonomy (Ours)', hand: 'Shadow (支援6種手)', sim: 'MuJoCo', objects: '10.7k', grasps: '9.5M', types: '31 Grasp Types', fc: true, dataType: 'Pre-grasp, grasp, squeeze poses', method: 'Sampling + Opt.', isOurs: true }
];

const ANNOTATION_OBJECTS = [
  {
    id: 'wineglass',
    name: '高腳酒杯 (Wine Glass)',
    regions: [
      { id: 'cup', label: '杯肚區域 (Cup Bowl)', x: 50, y: 28, recTypes: [1, 11, 13], desc: '寬弧面結構，適合包覆型或球體精密抓持' },
      { id: 'stem', label: '細長杯柱 (Thin Stem)', x: 50, y: 65, recTypes: [29, 7, 23], desc: '細圓柱結構，論文 Fig. 10 示範使用 Stick / Prismatic 抓握杯頸' },
      { id: 'base', label: '扁平杯底 (Flat Base)', x: 50, y: 88, recTypes: [16, 9, 12], desc: '薄圓盤邊緣，適合 Lateral 側向捏持或 Palmar Pinch' }
    ]
  },
  {
    id: 'mug',
    name: '馬克杯 (Coffee Mug)',
    regions: [
      { id: 'body', label: '圓柱杯身 (Cylinder Body)', x: 42, y: 52, recTypes: [1, 10, 31], desc: '標準大直徑圓柱，適合 Large Diameter 包覆' },
      { id: 'handle', label: '耳狀把手 (Mug Handle)', x: 78, y: 52, recTypes: [15, 8, 14], desc: '環狀細把手，論文 Fig. 6 展示高达 7 個連桿無穿模接觸' },
      { id: 'rim', label: '杯口邊緣 (Top Rim)', x: 42, y: 20, recTypes: [12, 13, 24], desc: '從上方夾持杯口，適合 Precision Disk 或 Tip Pinch' }
    ]
  },
  {
    id: 'scissors',
    name: '剪刀 (Scissors)',
    regions: [
      { id: 'rings', label: '雙指環孔 (Finger Loops)', x: 35, y: 72, recTypes: [19, 15, 2], desc: '功能性操作區域，論文 Fig. 6 展示 Distal Type (#19) 10 連桿緊密貼合' },
      { id: 'blade', label: '閉合刀身遞交處 (Closed Blade)', x: 65, y: 28, recTypes: [6, 16, 9], desc: '安全遞交剪刀時捏持刀身，適合 Prismatic 4 Finger' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStage, setActiveStage] = useState(2);
  const [showGithubModal, setShowGithubModal] = useState(false);

  // Interactive Pipeline Stage 2 Filter states
  const [initialSamples, setInitialSamples] = useState(80000);
  const [enableOpt, setEnableOpt] = useState(true);
  const [enableSkeletonFilter, setEnableSkeletonFilter] = useState(true);
  const [enableLocalRefine, setEnableLocalRefine] = useState(true);
  const [enableTemplateUpdate, setEnableTemplateUpdate] = useState(true);

  // Interactive Force Closure Sandbox states
  const [frictionMu, setFrictionMu] = useState(0.6);
  const [normalLambda, setNormalLambda] = useState(5.0);
  const [contactCount, setContactCount] = useState(9);
  const [graspCategorySim, setGraspCategorySim] = useState('Power');

  // Taxonomy Explorer states
  const [taxonomyFilter, setTaxonomyFilter] = useState('All');
  const [selectedGraspType, setSelectedGraspType] = useState(GRASP_TAXONOMY_DATA[0]);
  const [activePoseMode, setActivePoseMode] = useState('grasp'); // 'pregrasp' | 'grasp' | 'squeeze'

  // Annotation UI Simulator states
  const [selectedObj, setSelectedObj] = useState(ANNOTATION_OBJECTS[0]);
  const [selectedRegion, setSelectedRegion] = useState(ANNOTATION_OBJECTS[0].regions[1]);
  const [selectedAnnoType, setSelectedAnnoType] = useState(29);
  const [annoStatus, setAnnoStatus] = useState('synthesized'); // 'idle' | 'synthesized' | 'accepted' | 'rejected'

  // GitHub Repo Generator states
  const [ghUsername, setGhUsername] = useState('JhuoQing');
  const [ghRepoName, setGhRepoName] = useState('dex_grasp');
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Taxonomy List
  const filteredTaxonomy = useMemo(() => {
    if (taxonomyFilter === 'All') return GRASP_TAXONOMY_DATA;
    if (taxonomyFilter === 'Excluded') return GRASP_TAXONOMY_DATA.filter(t => !t.included);
    return GRASP_TAXONOMY_DATA.filter(t => t.category === taxonomyFilter);
  }, [taxonomyFilter]);

  // Computed ablation metrics based on user toggles (matching Table V)
  const simulatedAblationMetrics = useMemo(() => {
    if (!enableLocalRefine) {
      return { gsr: 17.8, osr: 72.6, cdc: 10.24, pd: 4.95, status: '未經 MuJoCo 局部精煉：手指未貼合物體且存在嚴重穿模 (4.95mm)' };
    }
    if (!enableSkeletonFilter) {
      return { gsr: 18.6, osr: 80.3, cdc: 0.34, pd: 0.00, status: '關閉全域後過濾：大量高能量與嚴重穿模樣本進入下一階段導致失敗' };
    }
    if (!enableTemplateUpdate) {
      return { gsr: 41.5, osr: 88.8, cdc: 0.24, pd: 0.00, status: '關閉模板庫動態更新：僅依賴初始模板，無法適應幾何差異大的物體' };
    }
    if (!enableOpt) {
      return { gsr: 45.7, osr: 88.4, cdc: 0.22, pd: 0.00, status: '僅靠密集採樣無梯度優化：對齊精度下降，成功率降低約 15%' };
    }
    return { gsr: 60.5, osr: 96.5, cdc: 0.21, pd: 0.00, status: '完整 Dexonomy 管線：最高成功率 (60.5%) 與絕對零穿模 (0.00mm)' };
  }, [enableOpt, enableSkeletonFilter, enableLocalRefine, enableTemplateUpdate]);

  // Force Closure Sandbox calculation
  const sandboxResult = useMemo(() => {
    const stabilityScore = Math.min(
      100,
      Math.round(
        (frictionMu * 65 + Math.log2(contactCount + 1) * 16 + normalLambda * 2.2) *
          (graspCategorySim === 'Power' ? 1.15 : graspCategorySim === 'Precision' ? 0.92 : 0.85)
      )
    );
    const residualE = Math.max(0, (1.2 - frictionMu * 1.4 - contactCount * 0.08).toFixed(4));
    return { coneAngle: theconeAngle(frictionMu), stabilityScore, residualE };
  }, [frictionMu, normalLambda, contactCount, graspCategorySim]);

  function theconeAngle(mu) {
    return ((Math.atan(mu) * 180) / Math.PI).toFixed(1);
  }

  // CLI Script Generator for GitHub Repo
  const cliScript = `# 1. 建立本地專案資料夾並初始化 Vite + React + Tailwind 環境
mkdir ${ghRepoName} && cd ${ghRepoName}
npm create vite@latest . -- --template react
npm install lucide-react tailwindcss @tailwindcss/vite

# 2. 將本頁右側編輯器之程式碼覆蓋至 src/App.jsx
# 3. 初始化 Git 並透過 GitHub CLI (gh) 直接在您的 GitHub 新增公開儲存庫並推送
git init
git add .
git commit -m "feat: Complete interactive paper explainer for Dexonomy (arXiv:2504.18829v2)"
gh repo create ${ghUsername}/${ghRepoName} --public --source=. --remote=origin --push

# 4. (選用) 一鍵部署至 GitHub Pages
npm run build
npx gh-pages -d dist`;

  const githubActionYaml = `name: Deploy Dexonomy Explainer to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install & Build
        run: |
          npm install
          npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Hand className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                  DEXONOMY
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  arXiv:2504.18829v2
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Synthesizing All Dexterous Grasp Types in a Grasp Taxonomy • PKU / Galbot / BAAI
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {[
              { id: 'overview', label: '核心總覽', icon: Sparkles },
              { id: 'pipeline', label: '四階段合成管線', icon: Layers },
              { id: 'math', label: '力封閉數學實驗室', icon: Sliders },
              { id: 'taxonomy', label: '33種抓取圖鑑與資料集', icon: Database },
              { id: 'learning', label: '生成模型與真實部署', icon: Cpu },
              { id: 'benchmarks', label: '實驗與消融數據', icon: BarChart3 },
              { id: 'github', label: '建立 GitHub Repo', icon: Github }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/70 via-slate-950 to-slate-950 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex flex-wrap items-center gap-2 text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Peking University (北京大學) • Galbot (銀河通用) • BAAI (智源研究院)</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Dexonomy: Synthesizing All Dexterous Grasp Types in a Grasp Taxonomy
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                真正的靈巧抓取不只是「用多指手抓住物體」（否則多指手只是昂貴的平行夾爪），而是<strong className="text-cyan-300 font-semibold">「根據任務需求選擇合適的抓取類型 (Grasp Type)」</strong>。
                本論文提出一套極速「採樣 + 優化」雙階段合成管線，每個手型與抓取類型<strong className="text-emerald-300 font-semibold">僅需 1 個</strong>人工標註模板，即可為任意物體與任意多關節靈巧手合成接觸豐富、絕對零穿模且通過六軸力封閉驗證的靈巧抓取姿態。
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="text-xs text-slate-400">
                  作者：<strong className="text-slate-200">Jiayi Chen*</strong>, <strong className="text-slate-200">Yubin Ke*</strong>, <strong className="text-slate-200">Lin Peng</strong>, <strong className="text-slate-200">He Wang†</strong>
                </span>
                <a
                  href="https://pku-epic.github.io/Dexonomy"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                >
                  官方專案頁面 (pku-epic.github.io/Dexonomy) <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setActiveTab('github')}
                  className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <Github className="w-3.5 h-3.5" />
                  一鍵生成 GitHub Repo 部署指令
                </button>
              </div>
            </div>

            {/* Key Quantitative Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:w-[440px] shrink-0">
              {[
                { val: '9.5M', label: '高品質靈巧抓取', sub: '< 3天 (8×RTX 3090)' },
                { val: '10.7k', label: '3D 物體資產', sub: 'DGN 5.7k + Objaverse 5k' },
                { val: '31 / 33', label: 'GRASP 分類學覆蓋', sub: '支援全部 33 種類型合成' },
                { val: '0.00 mm', label: '碰撞穿模深度 (PD)', sub: 'MuJoCo 1mm 接觸邊距' },
                { val: '82.3%', label: '真實世界抓取成功率', sub: '單視角點雲 + Shadow Hand' },
                { val: '6 種', label: '支援多關節靈巧手', sub: 'Shadow/Allegro/Leap/G1等' }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition"
                >
                  <div className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">
                    {stat.val}
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5">{stat.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* ============================================================
            TAB 1: OVERVIEW (核心痛點、突破與系統全景)
           ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Problem vs Solution Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-300">
                    傳統方法瓶頸 1
                  </span>
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white">解析法抓取合成 (Analytical Methods)</h3>
                <p className="text-xs text-slate-400">代表作：DexGraspNet, FRoGGeR, SpringGrasp, BODex</p>
                <ul className="space-y-2 text-sm text-slate-300 pt-1">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-1">•</span>
                    <span><strong>類型無感知 (Type-Unaware)：</strong>僅能透過力封閉指標隨機包裹物體或合成指尖抓取 (Fingertip)，無法指定特定功能手勢。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-1">•</span>
                    <span><strong>從展開姿態優化易陷局部最佳解：</strong>直接調整 20+ 維度的手部關節，常產生手指扭曲、反折或公分級嚴重穿模。</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300">
                    傳統方法瓶頸 2
                  </span>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">功能性抓取遷移 (Functional Transfer)</h3>
                <p className="text-xs text-slate-400">代表作：OakInk, LHFG, CCFG</p>
                <ul className="space-y-2 text-sm text-slate-300 pt-1">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span><strong>幾何與座標軸強烈假設：</strong>依賴物體接觸區域映射，僅限於與示範物體幾何高度相似且座標軸對齊 (Axis-aligned) 的同類物體。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span><strong>接觸點稀疏且穿模：</strong>如 CCFG 與 LHFG 在剪刀與馬克杯上僅靠指尖接觸，且存在約 1 cm 的穿模深度 (Fig. 6)。</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-emerald-950/50 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300">
                    本文核心突破
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Dexonomy 幾何匹配與雙階段合成</h3>
                <p className="text-xs text-cyan-300">Any Grasp Type × Any Object × Any Articulated Hand</p>
                <ul className="space-y-2 text-sm text-slate-200 pt-1">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span><strong>階段一「固定手、優化物體」：</strong>GPU 平行採樣 10萬個物體姿態去匹配手部模板接觸點，徹底避開高維手部關節局部最小值。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span><strong>階段二「MuJoCo 轉置雅可比局部精煉」：</strong>固定物體微調手部，達成 &gt;10 個連桿豐富接觸、0.00mm 零穿模與共享超參數。</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 6 Supported Dexterous Hands Showcase */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Hand className="w-5 h-5 text-cyan-400" />
                    跨硬體通用性：支援任意多關節靈巧手 (Any Articulated Hand - Fig. 1)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    全管線在所有抓取類型、物體與不同自由度的靈巧手上完全「共享同一套超參數 (Shared Hyperparameters)」，無需針對單一硬體重新調參。
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                  1 Template per Hand & Grasp Type
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { id: 'a', name: 'Shadow Hand', dof: '24 DoF (20 Actuated)', role: 'Dexonomy 9.5M 主資料集與真機實驗使用手型', highlight: true },
                  { id: 'b', name: 'Allegro Hand', dof: '16 DoF (4 Fingers)', role: 'Table II & III 類型無關基準對比主力手型', highlight: true },
                  { id: 'c', name: 'Leap Hand', dof: '16 DoF Low-cost', role: '低成本開源四指靈巧手無縫遷移驗證' },
                  { id: 'd', name: 'MANO Hand', dof: 'Articulated Human Hand', role: '支援人體手部參數化網格模型合成' },
                  { id: 'e', name: 'Inspire Hand', dof: '6 Actuators (12 Joints)', role: '因時機器人欠驅動五指靈巧手支援' },
                  { id: 'f', name: 'Unitree G1 Hand', dof: 'Dex3-1 Three-Finger', role: '宇樹 G1 人形機器人三指靈巧手支援' }
                ].map(hand => (
                  <div
                    key={hand.id}
                    className={`p-3.5 rounded-xl border transition ${
                      hand.highlight
                        ? 'bg-cyan-950/30 border-cyan-500/40'
                        : 'bg-slate-950/70 border-slate-800/80'
                    }`}
                  >
                    <div className="text-xs font-mono text-cyan-400">({hand.id})</div>
                    <div className="font-bold text-sm text-white mt-0.5">{hand.name}</div>
                    <div className="text-[11px] font-mono text-emerald-300 mt-1">{hand.dof}</div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{hand.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Navigation Cards to Deep Dive Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  tab: 'pipeline',
                  title: '探索四階段合成管線 + 模板演進',
                  desc: '互動式拆解 Global Alignment、Collision Skeleton、MuJoCo 轉置雅可比局部精煉與接觸感知控制。',
                  metric: '323.4 attempts/s'
                },
                {
                  tab: 'math',
                  title: '力封閉 QP 與摩擦錐互動實驗室',
                  desc: '親手調整摩擦係數 $\\mu$ ($0.6$ vs $0.3$) 與法向力下限 $\\lambda$，理解為何 Power Grasp 在低摩擦下更穩定。',
                  metric: 'LCQP (Eq. 1 ~ Eq. 8)'
                },
                {
                  tab: 'taxonomy',
                  title: '33種 GRASP Taxonomy 與三態姿態',
                  desc: '完整檢視 33 種人類抓取分類、Pre-grasp / Grasp / Squeeze 三態切換，以及 9.5M 資料集分佈。',
                  metric: '31 Types Included'
                },
                {
                  tab: 'learning',
                  title: 'Type-Conditional 模型與雙擊標註 UI',
                  desc: '體驗 Möbius Normalizing Flow + MLP 架構、Sim-to-Real 欠驅動差異，並親自操作「兩次點擊語意標註器」。',
                  metric: '82.3% 真機成功率'
                },
                {
                  tab: 'benchmarks',
                  title: '全面實驗數據與消融研究',
                  desc: '深入比較 DexGraspNet、FRoGGeR、SpringGrasp、BODex，以及含噪模板魯棒性測試。',
                  metric: '94.63% Objaverse OSR'
                },
                {
                  tab: 'github',
                  title: '在 GitHub 新增 Repo 並部署本網站',
                  desc: '自訂您的 GitHub 帳號與專案名稱，一鍵複製 gh repo create 腳本與 GitHub Actions 自動發布設定。',
                  metric: 'Ready to Push'
                }
              ].map((card, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(card.tab)}
                  className="text-left p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-2">
                      <span>MODULE 0{i + 1}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300">{card.metric}</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition flex items-center justify-between">
                      {card.title}
                      <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition" />
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed"><Rich text={card.desc} /></p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: PIPELINE EXPLORER (互動式四階段合成管線與閉環)
           ============================================================ */}
        {activeTab === 'pipeline' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-cyan-400">Section IV & Appendix A / F</span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  Dexonomy 四階段合成管線與模板自演進飛輪 (Fig. 2)
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  點擊下方任一階段節點，深入了解其演算法設計、數學公式、硬體平行化策略與時間開銷拆解。
                </p>
              </div>
            </div>

            {/* Interactive Flow Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {PIPELINE_STAGES.map(s => {
                const isSelected = activeStage === s.step;
                return (
                  <button
                    key={s.step}
                    onClick={() => setActiveStage(s.step)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/15'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className={`h-1 w-full absolute top-0 left-0 bg-gradient-to-r ${s.color}`} />
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-300 font-bold">STAGE {s.step}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {s.badge}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white mt-2 line-clamp-2">{s.zhTitle}</div>
                    <div className="text-[11px] text-slate-400 mt-1.5 font-mono">{s.device}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Detail Card */}
            {PIPELINE_STAGES.filter(s => s.step === activeStage).map(stage => (
              <div
                key={stage.step}
                className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r ${stage.color}`}>
                        Stage {stage.step}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{stage.title}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">{stage.zhTitle}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">執行設備</span>
                      <span className="text-cyan-300">{stage.device}</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">耗時與吞吐量 (Appendix F)</span>
                      <span className="text-emerald-300">{stage.timeCost}</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-200 text-sm sm:text-base leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <Rich text={stage.summary} />
                </p>

                {/* Formula Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30">
                  <div className="text-xs font-mono text-cyan-400 mb-1.5">{stage.mathTitle}</div>
                  <div className="text-base sm:text-lg text-emerald-300 overflow-x-auto py-1">
                    <Tex display>{stage.formula}</Tex>
                  </div>
                </div>

                {/* Key Implementation Points */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    關鍵技術細節與設計巧思
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stage.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-start gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed"><Rich text={detail} /></p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Interactive Sub-panel for Stage 2: Collision Skeleton & Funnel */}
                {stage.step === 2 && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 border border-cyan-500/30 space-y-4">
                    <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Stage 2 漏斗過濾剖析與「手部線段碰撞骨架 (Collision Skeleton - Fig. 11)」
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="font-mono text-cyan-400 font-bold">Filter 1: 接觸能量閾值</div>
                        <div className="text-lg font-extrabold text-white mt-1">80k → ~25k</div>
                        <p className="text-slate-400 mt-1">
                          超過 50,000 個樣本因為手部與物體接觸點/法向量距離過大 (Eq. 7) 被第一時間快速淘汰。
                        </p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="font-mono text-emerald-400 font-bold">Filter 2: 線段碰撞骨架</div>
                        <div className="text-lg font-extrabold text-white mt-1">Line-Mesh Query</div>
                        <p className="text-slate-400 mt-1">
                          以極簡線段近似手掌與手指骨幹（指尖線段刻意縮短，因指尖輕微穿模易於在 Stage 3 解決），極速剔除嚴重穿模。
                        </p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="font-mono text-amber-400 font-bold">Filter 3: 批次力封閉 QP</div>
                        <div className="text-lg font-extrabold text-white mt-1">Batched ReLU-QP</div>
                        <p className="text-slate-400 mt-1">
                          僅對剩餘約 5,000 個候選在 GPU 上平行解算 LCQP (Eq. 6)，耗時僅 0.3 秒。
                        </p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="font-mono text-purple-400 font-bold">Filter 4: FPS 姿態去重</div>
                        <div className="text-lg font-extrabold text-white mt-1">Top-K Diverse</div>
                        <p className="text-slate-400 mt-1">
                          結合旋轉角差、平移歐氏距離與尺度差異進行最遠點採樣，保留最具多樣性的候選進入 MuJoCo。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Interactive Pipeline Module Ablation Simulator (Table V) */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    互動式管線模組消融實驗模擬器 (對應論文 Table V - Allegro Hand)
                  </h3>
                  <p className="text-xs text-slate-400">
                    嘗試關閉管線中的特定模組，即時觀察對抓取成功率 (GSR)、物體成功率 (OSR)、接觸距離一致性 (CDC) 與穿模深度 (PD) 的真實影響。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Stage 2 全域梯度優化 (Global Opt.)', state: enableOpt, setter: setEnableOpt },
                  { label: 'Stage 2 後過濾器 (Global Filter)', state: enableSkeletonFilter, setter: setEnableSkeletonFilter },
                  { label: 'Stage 3 MuJoCo 局部精煉 (Local Opt.)', state: enableLocalRefine, setter: setEnableLocalRefine },
                  { label: 'Stage 5 模板庫動態更新 (Template Update)', state: enableTemplateUpdate, setter: setEnableTemplateUpdate }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => item.setter(!item.state)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      item.state
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[11px] font-mono uppercase">
                        {item.state ? 'ENABLED' : 'DISABLED (w/o)'}
                      </span>
                      {item.state ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold">{item.label}</div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">抓取成功率 GSR (%) ↑</div>
                  <div className="text-2xl font-extrabold text-cyan-300 mt-1">{simulatedAblationMetrics.gsr}%</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">物體成功率 OSR (%) ↑</div>
                  <div className="text-2xl font-extrabold text-emerald-300 mt-1">{simulatedAblationMetrics.osr}%</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">接觸一致性 CDC (mm) ↓</div>
                  <div className="text-2xl font-extrabold text-amber-300 mt-1">{simulatedAblationMetrics.cdc} mm</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">穿模深度 PD (mm) ↓</div>
                  <div className={`text-2xl font-extrabold mt-1 ${simulatedAblationMetrics.pd > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {simulatedAblationMetrics.pd.toFixed(2)} mm
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono text-cyan-200 bg-cyan-950/40 border border-cyan-800/50 px-4 py-2.5 rounded-lg">
                診斷結論：{simulatedAblationMetrics.status}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: MATH & FORCE-CLOSURE SANDBOX (數學原理與力封閉實驗室)
           ============================================================ */}
        {activeTab === 'math' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400">Section III & Section IV-D</span>
              <h2 className="text-2xl font-bold text-white mt-1">
                力封閉品質指標統一推導與互動式摩擦錐實驗室
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                論文第三節整合了近年解析法抓取合成 (DexGraspNet, BODex, Wu et al. [51]) 的力封閉數學框架，並將其應用於後過濾與接觸感知控制。
              </p>
            </div>

            {/* Unified Math Formulation Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-cyan-300">
                  1. 庫侖摩擦錐與物體接觸雅可比矩陣 (Eq. 1 & Eq. 2)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <Rich text={'假設物體 $O$ 被靈巧手以 $m$ 個接觸點抓持。對每個接觸點 $i$，定義接觸位置 $p_i \\in \\mathbb{R}^3$、指向物體內部的單位法向量 $n_i \\in \\mathbb{R}^3$，以及兩個正交單位切向量 $d_i, c_i \\in \\mathbb{R}^3$（滿足 $n_i = d_i \\times c_i$）：'} />
                </p>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 space-y-1 overflow-x-auto text-sm sm:text-base">
                  <div className="flex items-center justify-between gap-3">
                    <Tex display>{'\\mathcal{F}_i = \\left\\{ x_i \\in \\mathbb{R}^3 \\;\\middle|\\; 0 \\le x_{i,1} \\le 1,\\ x_{i,2}^2 + x_{i,3}^2 \\le \\mu^2\\, x_{i,1}^2 \\right\\}'}</Tex>
                    <span className="text-slate-500 text-xs font-mono shrink-0">(Eq. 1)</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Tex display>{'J_{o,i}^{T} = \\begin{bmatrix} n_i & d_i & c_i \\\\ p_i \\times n_i & p_i \\times d_i & p_i \\times c_i \\end{bmatrix} \\in \\mathbb{R}^{6\\times 3}'}</Tex>
                    <span className="text-slate-500 text-xs font-mono shrink-0">(Eq. 2)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  <Rich text={'其中 $\\mu$ 為摩擦係數，接觸力 $x_i$ 透過 $w_i = J_{o,i}^{T} x_i$ 映射為作用在物體上的 6 維螺旋力矩 (Wrench)。實作中以多邊形角錐近似圓錐，轉化為線性約束二次規劃 (LCQP) 並透過 GPU 加速之 ReLU-QP [2] 求解。'} />
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-emerald-300">
                  2. 三大主流力封閉簡化公式之權衡比較 (Section III)
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-bold text-white">標準六方向重力驗證 [BODex 測試基準]</div>
                    <p className="text-slate-400 mt-1">
                      考慮 6 個正交方向的外部重力螺旋 <span className="text-amber-300"><Tex>{'g \\in \\mathbb{R}^{6}'}</Tex></span>，每個抓取需解算 6 次 LCQP，準確但計算成本高。
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-bold text-white">DexGraspNet [27, 47] 零摩擦等力簡化</div>
                    <p className="text-slate-400 mt-1">
                      直接假設無摩擦且所有接觸點法向力相等 (<span className="text-rose-300"><Tex>{'f_i = [1,0,0]^{\\top},\\ g = 0'}</Tex></span>)，雖免去 QP 優化極快，但嚴重犧牲準確度。
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                    <div className="font-bold text-emerald-300">本文採用：Wu et al. [51] 齊次力平衡公式</div>
                    <p className="text-slate-300 mt-1">
                      設定 <span className="text-emerald-300"><Tex>{'g = 0'}</Tex></span> 並附加總法向力下限約束 <span className="text-emerald-300"><Tex>{'\\sum_{i=1}^{m} x_{i,1} \\ge \\lambda'}</Tex></span>，只需解 1 次 LCQP 即可同時作為 Stage 2/3 的品質過濾指標 <span className="text-emerald-300"><Tex>{'e = \\left\\| \\sum_{i=1}^{m} J_{o,i}^{T} f_i \\right\\|^{2}'}</Tex></span> 與 Stage 4 的內應力控制信號！
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Force Closure & Friction Cone Simulator */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    摩擦錐與接觸感知控制互動模擬器 (Normal vs. Harder Benchmark)
                  </h3>
                  <p className="text-xs text-slate-400">
                    調整摩擦係數 <Tex>{'\\mu'}</Tex>、接觸連桿數 <Tex>{'m'}</Tex> 與法向擠壓力下限 <Tex>{'\\lambda'}</Tex>，觀察摩擦錐張角與抗外力穩定度變化。
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setFrictionMu(0.6); setContactCount(9); setGraspCategorySim('Power'); }}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 cursor-pointer"
                  >
                    <Rich text={'預設：Normal 測試 ($\\mu=0.6$)'} />
                  </button>
                  <button
                    onClick={() => { setFrictionMu(0.3); setContactCount(4); setGraspCategorySim('Precision'); }}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 cursor-pointer"
                  >
                    <Rich text={'切換：Hard 困難基準 ($\\mu=0.3$)'} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Sliders */}
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">切向摩擦係數 (Friction Coefficient <Tex>{'\\mu'}</Tex>)：</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        <Tex>{`\\mu = ${frictionMu.toFixed(2)}`}</Tex> ({frictionMu <= 0.35 ? 'Hard 困難基準' : 'Normal 標準基準'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={frictionMu}
                      onChange={e => setFrictionMu(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">有效接觸連桿數 (Contact Link Number <Tex>{'m'}</Tex>)：</span>
                      <span className="font-mono text-emerald-300 font-bold">{contactCount} links (2mm 容差內)</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="1"
                      value={contactCount}
                      onChange={e => setContactCount(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">總法向力約束下限 (Minimum Normal Force <Tex>{'\\lambda'}</Tex> - Eq. 5)：</span>
                      <span className="font-mono text-amber-300 font-bold">{normalLambda.toFixed(1)} N (針對 100g 物體)</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.5"
                      value={normalLambda}
                      onChange={e => setNormalLambda(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">抓取大類：</span>
                    {['Power', 'Intermediate', 'Precision'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setGraspCategorySim(cat);
                          if (cat === 'Power') setContactCount(9);
                          if (cat === 'Intermediate') setContactCount(5);
                          if (cat === 'Precision') setContactCount(4);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          graspCategorySim === cat
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {cat} Grasp
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Friction Cone Visualizer */}
                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                  <svg viewBox="0 0 260 175" className="w-full max-w-[280px] h-auto">
                    {/* Object Surface */}
                    <rect x="20" y="140" width="220" height="22" rx="4" fill="#1e293b" stroke="#475569" />
                    <text x="130" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="serif" fontStyle="italic">
                      Object Surface (Contact Point p<tspan fontSize="7" dy="2">i</tspan><tspan dy="-2">)</tspan>
                    </text>

                    {/* Friction Cone Polygon */}
                    {(() => {
                      const spread = Math.min(95, frictionMu * 95);
                      return (
                        <polygon
                          points={`130,140 ${130 - spread},25 ${130 + spread},25`}
                          fill="rgba(34, 211, 238, 0.16)"
                          stroke="#22d3ee"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                      );
                    })()}

                    {/* Normal Vector n_i */}
                    <line x1="130" y1="140" x2="130" y2="25" stroke="#10b981" strokeWidth="2.5" />
                    <polygon points="130,18 125,28 135,28" fill="#10b981" />
                    <text x="136" y="34" fill="#10b981" fontSize="10" fontFamily="serif" fontStyle="italic">
                      n<tspan fontSize="7" dy="2">i</tspan><tspan dy="-2"> (Normal Force x</tspan><tspan fontSize="7" dy="2">i,1</tspan><tspan dy="-2">)</tspan>
                    </text>

                    {/* Contact Point Dot */}
                    <circle cx="130" cy="140" r="5" fill="#f43f5e" />
                  </svg>

                  <div className="w-full grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-slate-800/80">
                    <div>
                      <div className="text-[11px] text-slate-400">摩擦錐半張角</div>
                      <div className="text-sm font-mono font-bold text-cyan-300">{sandboxResult.coneAngle}°</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">QP 殘差指標 <Tex>{'e'}</Tex></div>
                      <div className="text-sm font-mono font-bold text-emerald-300">{sandboxResult.residualE}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">六軸抗擾穩定度</div>
                      <div className="text-sm font-mono font-bold text-amber-300">{sandboxResult.stabilityScore}/100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: GRASP TAXONOMY & DATASET (33種抓取圖鑑與三態姿態)
           ============================================================ */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-cyan-400">Section V & Feix et al. [20]</span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  GRASP Taxonomy 33 種靈巧抓取互動圖鑑與三態姿態分析
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  點擊任一抓取類型查看其在 Dexonomy 9.5M 資料集中的佔比、平均接觸連桿數 (CLN)，以及在標準與困難摩擦係數下的成功率表現。
                </p>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'All', label: '全部 (33)' },
                  { id: 'Power', label: 'Power 力量型 (15)' },
                  { id: 'Intermediate', label: 'Intermediate 中間型 (6)' },
                  { id: 'Precision', label: 'Precision 精密型 (12)' },
                  { id: 'Excluded', label: '特定物體排除 (2)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTaxonomyFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      taxonomyFilter === f.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Grasp Type Detail + 3 Key Poses Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 cols: Selected Type Card */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                        Type #{selectedGraspType.id}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-300 font-mono text-xs">
                        {selectedGraspType.category} Grasp
                      </span>
                      {!selectedGraspType.included && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold">
                          未納入通用 31 類資料集
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      資料集佔比 (Fig. 12)：<strong className="text-white">{selectedGraspType.pct}%</strong>
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">
                    {selectedGraspType.name} — {selectedGraspType.zh}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[11px] text-slate-400">手部接觸特徵</div>
                      <div className="text-sm font-semibold text-slate-200 mt-1">{selectedGraspType.fingers}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[11px] text-slate-400">典型適用物體幾何</div>
                      <div className="text-sm font-semibold text-cyan-300 mt-1">{selectedGraspType.objects}</div>
                    </div>
                  </div>

                  {selectedGraspType.included ? (
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400">平均接觸連桿 (CLN)</div>
                        <div className="text-xl font-extrabold text-emerald-300 mt-0.5">{selectedGraspType.cln}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400"><Rich text={'標準測試 GSR ($\\mu=0.6$)'} /></div>
                        <div className="text-xl font-extrabold text-cyan-300 mt-0.5">{selectedGraspType.gsrNormal}%</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400"><Rich text={'困難測試 GSR ($\\mu=0.3$)'} /></div>
                        <div className="text-xl font-extrabold text-amber-300 mt-0.5">{selectedGraspType.gsrHard}%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200">
                      <strong>排除原因說明 (Section V)：</strong> {selectedGraspType.excludeReason}
                    </div>
                  )}
                </div>

                {/* Group summary from Table IV */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Table IV 群組統計：</strong>Power 平均 CLN = 9.1 (Hard GSR 12.8%) ｜ Intermediate CLN = 4.8 (Hard GSR 6.6%) ｜ Precision CLN = 4.2 (Hard GSR 11.4%)
                  </span>
                </div>
              </div>

              {/* Right 5 cols: Three Key Poses Interactive Switcher */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400">Section V • Data Point Structure</span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    每筆資料內含「三態關鍵姿態 (Three Key Poses)」
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    點擊切換查看 Dexonomy 資料集如何支援從無碰撞運動規劃到穩定施力夾持的完整軌跡：
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pregrasp', label: '1. Pre-grasp', sub: '2cm 排斥邊距' },
                    { id: 'grasp', label: '2. Grasp Pose', sub: '0~2mm 零穿模接觸' },
                    { id: 'squeeze', label: '3. Squeeze Pose', sub: 'QP 內力夾緊' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setActivePoseMode(p.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        activePoseMode === p.id
                          ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      <div className="text-xs">{p.label}</div>
                      <div className={`text-[10px] mt-0.5 ${activePoseMode === p.id ? 'text-slate-900' : 'text-slate-500'}`}>
                        {p.sub}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Interactive SVG Pose Illustration */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                  <svg viewBox="0 0 260 130" className="w-full max-w-[260px] h-auto">
                    {/* Object Circle */}
                    <circle cx="130" cy="65" r="32" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    <text x="130" y="69" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="monospace">
                      Object
                    </text>

                    {/* Left & Right Fingers changing distance based on pose mode */}
                    {(() => {
                      const offset = activePoseMode === 'pregrasp' ? 24 : activePoseMode === 'grasp' ? 3 : -4;
                      const strokeColor =
                        activePoseMode === 'pregrasp'
                          ? '#a855f7'
                          : activePoseMode === 'grasp'
                          ? '#10b981'
                          : '#f59e0b';
                      return (
                        <>
                          {/* Left Finger */}
                          <path
                            d={`M ${88 - offset},25 Q ${62 - offset},65 ${88 - offset},105`}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          {/* Right Finger */}
                          <path
                            d={`M ${172 + offset},25 Q ${198 + offset},65 ${172 + offset},105`}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          {activePoseMode === 'squeeze' && (
                            <>
                              <line x1="88" y1="65" x2="108" y2="65" stroke="#f43f5e" strokeWidth="2.5" />
                              <line x1="172" y1="65" x2="152" y2="65" stroke="#f43f5e" strokeWidth="2.5" />
                            </>
                          )}
                        </>
                      );
                    })()}
                  </svg>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed text-center">
                    <Rich text={POSE_DESC[activePoseMode]} />
                  </p>
                </div>
              </div>
            </div>

            {/* 33 Grasp Types Interactive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {filteredTaxonomy.map(item => {
                const isSelected = selectedGraspType.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedGraspType(item)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/15'
                        : !item.included
                        ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                        : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-cyan-400 font-bold">#{item.id}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] ${
                            item.category === 'Power'
                              ? 'bg-blue-500/15 text-blue-300'
                              : item.category === 'Precision'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-purple-500/15 text-purple-300'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-white mt-1 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.zh}</div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>CLN: {item.cln}</span>
                      <span>{item.included ? `${item.gsrNormal}%` : 'Excluded'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dataset Comparison Table (Table I) */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 overflow-x-auto">
              <h3 className="text-base font-bold text-white">
                Table I：主流靈巧手抓取資料集全方位對比
              </h3>
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs">
                    <th className="py-2.5 px-3">Dataset</th>
                    <th className="py-2.5 px-3">Hand</th>
                    <th className="py-2.5 px-3">Sim./Real</th>
                    <th className="py-2.5 px-3">Objects</th>
                    <th className="py-2.5 px-3">Grasps</th>
                    <th className="py-2.5 px-3">Grasp Types</th>
                    <th className="py-2.5 px-3">Force Closure</th>
                    <th className="py-2.5 px-3">Data Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {DATASET_COMPARISON.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.isOurs ? 'bg-cyan-950/30 text-cyan-100 font-semibold' : 'text-slate-300'}
                    >
                      <td className="py-2.5 px-3">{row.name}</td>
                      <td className="py-2.5 px-3">{row.hand}</td>
                      <td className="py-2.5 px-3">{row.sim}</td>
                      <td className="py-2.5 px-3 font-mono">{row.objects}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-300">{row.grasps}</td>
                      <td className="py-2.5 px-3">{row.types}</td>
                      <td className="py-2.5 px-3">
                        {row.fc ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 inline" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs">{row.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 5: GENERATIVE MODEL, REAL-WORLD & 2-CLICK ANNOTATION UI
           ============================================================ */}
        {activeTab === 'learning' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400">Section VI, VII-E, VII-F, VIII & Appendix D / E</span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Type-Conditional 生成式模型、真機實驗與「雙擊語意標註系統」
              </h2>
            </div>

            {/* Architecture Diagram of Type-Conditional Generative Model (Fig. 4) */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Type-Conditional Grasp Generative Model 架構圖解 (Fig. 4)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-cyan-400 font-bold">1. 雙路輸入特徵</div>
                  <p className="text-slate-300">
                    • <strong>單視角物體點雲</strong>（由 SAM2 分割）經由 MinkowskiEngine <strong>Sparse 3DConv</strong> 提取視覺特徵 <Tex>{'f_v'}</Tex>。
                  </p>
                  <p className="text-slate-300">
                    • <strong>Grasp-type Codebook</strong>：選取第 <Tex>{'i'}</Tex> 種抓取類型的可學習嵌入向量 <span className="text-emerald-300"><Tex>{'f_t^{i}'}</Tex></span>。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-emerald-400 font-bold">2. 條件特徵融合</div>
                  <p className="text-slate-300">
                    將視覺特徵與類型條件特徵串接：
                    <span className="block text-emerald-300 my-2"><Tex display>{'f_c = f_v \\oplus f_t^{i}'}</Tex></span>
                    若移除紅框中的 Codebook，模型即退化為與 BODex 類似的無條件模型（在多類型資料集上 GSR 會從 63.9% 暴跌至 24.5%！）。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-amber-400 font-bold">3. Möbius Normalizing Flow</div>
                  <p className="text-slate-300">
                    在 SO(3) 流形上將基底分佈隨機樣本映射為手部根節點的 6-DoF 抓取姿態 <Tex>{'R_g,\\ T_g'}</Tex>，並輸出對數機率密度 <span className="text-amber-300"><Tex>{'p'}</Tex></span> 用於候選排序。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-purple-400 font-bold">4. MLP 解碼三態關節角</div>
                  <p className="text-slate-300">
                    將 <Tex>{'(f_c \\oplus R_g,\\ T_g)'}</Tex> 輸入 MLP，一次預測預抓取位移 <Tex>{'R_p,\\ T_p'}</Tex> 及三態關節角度 <span className="text-purple-300"><Tex>{'q_p,\\ q_g,\\ q_s'}</Tex></span>。
                  </p>
                </div>
              </div>

              {/* Appendix D Findings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="text-xs font-bold text-cyan-300 mb-2">
                    Appendix D 關鍵發現 1：為何 Flow + MLP (55.5%) 遠勝 Diffusion (16.0%)？(Table IX)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    手部 6-DoF 根節點姿態 <Tex>{'(R_g,\\ T_g)'}</Tex> 具多模態複雜分佈，適合由 Möbius Normalizing Flow 建模；而同一抓取類型下的手指關節組態 (qpos) 相對集中且規律，交由 MLP 迴歸最穩定（若全交由 Flow 訓練會出現 NaN 梯度，純 Diffusion 僅 16.0%，Diffusion + MLP 為 41.8%，而 <strong>Flow + MLP 達 55.5%</strong>）。
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="text-xs font-bold text-emerald-300 mb-2">
                    Appendix D 關鍵發現 2：如何為未知物體自動選擇最適合的抓取類型？(Table XI)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    對所有 31 種類型盲目平均僅有 28.9% GSR；但若搭配<strong>分類器 Classifier B（以生成模型自身在訓練集物體上表現最佳之類型作為真值標籤訓練）</strong>，GSR 躍升至 <strong>63.9%</strong>，Oracle Top-1 上限更高達 <strong>78.2%</strong>！在真機實驗中，也可直接由 <strong>GPT-4o</strong> 根據物體影像挑選 3 個合適類型。
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive 2-Click Semantic Annotation UI Simulator (Section VIII - Fig. 10) */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/40 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-mono uppercase text-emerald-400">Section VIII • Interactive Demo (Fig. 10)</span>
                  <h3 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-cyan-400" />
                    互動式「兩次點擊」功能性語意抓取標註系統模擬器
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    無需穿戴昂貴資料手套或專業遙操作員！請體驗論文圖 10 的流程：<strong>第 1 步點擊物體上的目標接觸紅點</strong>，<strong>第 2 步選擇抓取類型</strong>，演算法即在數秒內合成對應區域的高品質功能性抓取。
                  </p>
                </div>
              </div>

              {/* Object Selector */}
              <div className="flex flex-wrap gap-2">
                {ANNOTATION_OBJECTS.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => {
                      setSelectedObj(obj);
                      setSelectedRegion(obj.regions[0]);
                      setSelectedAnnoType(obj.regions[0].recTypes[0]);
                      setAnnoStatus('synthesized');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedObj.id === obj.id
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {obj.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Clickable Object Canvas */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center relative">
                  <div className="text-xs font-mono text-slate-400 mb-2">
                    Click 1：點擊物體上的接觸部位紅點
                  </div>
                  <div className="relative w-56 h-64 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center">
                    {/* Simple SVG Silhouette for Selected Object */}
                    <svg viewBox="0 0 100 110" className="w-44 h-52">
                      {selectedObj.id === 'wineglass' && (
                        <>
                          <path d="M25,12 C25,45 46,50 48,52 L48,85 L30,92 L70,92 L52,85 L52,52 C54,50 75,45 75,12 Z" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                        </>
                      )}
                      {selectedObj.id === 'mug' && (
                        <>
                          <rect x="20" y="22" width="46" height="62" rx="5" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                          <path d="M66,32 C84,32 84,72 66,72" fill="none" stroke="#94a3b8" strokeWidth="6" />
                        </>
                      )}
                      {selectedObj.id === 'scissors' && (
                        <>
                          <circle cx="32" cy="78" r="12" fill="none" stroke="#94a3b8" strokeWidth="4" />
                          <circle cx="48" cy="84" r="12" fill="none" stroke="#94a3b8" strokeWidth="4" />
                          <path d="M38,68 L75,18 M45,72 L62,15" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                        </>
                      )}
                    </svg>

                    {/* Clickable Contact Region Hotspots */}
                    {selectedObj.regions.map(reg => {
                      const active = selectedRegion.id === reg.id;
                      return (
                        <button
                          key={reg.id}
                          onClick={() => {
                            setSelectedRegion(reg);
                            setSelectedAnnoType(reg.recTypes[0]);
                            setAnnoStatus('synthesized');
                          }}
                          style={{ left: `${reg.x}%`, top: `${reg.y}%` }}
                          className={`-translate-x-1/2 -translate-y-1/2 absolute px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-lg ${
                            active
                              ? 'bg-rose-500 text-white ring-4 ring-rose-500/30 scale-110 z-10'
                              : 'bg-slate-800/90 text-slate-200 border border-slate-600 hover:bg-rose-500/80'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          {reg.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Select Grasp Type & Synthesize Result */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono text-cyan-400">
                      Click 2：為「{selectedRegion.label}」選擇抓取類型 (Type Selection)
                    </div>
                    <p className="text-xs text-slate-400">{selectedRegion.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegion.recTypes.map(typeId => {
                        const tObj = GRASP_TAXONOMY_DATA.find(t => t.id === typeId);
                        const active = selectedAnnoType === typeId;
                        return (
                          <button
                            key={typeId}
                            onClick={() => {
                              setSelectedAnnoType(typeId);
                              setAnnoStatus('synthesized');
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              active
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                                : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            Type #{tObj.id}: {tObj.name} ({tObj.zh})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Synthesized Output Card with Accept / Reject */}
                  <div className="p-5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-400">
                        Dexonomy 局部區域採樣與 MuJoCo 精煉結果 (耗時 ~1.8 秒)
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                        PD: 0.00 mm | Force Closure: PASS
                      </span>
                    </div>
                    <p className="text-sm text-white font-semibold">
                      已針對【{selectedObj.name} — {selectedRegion.label}】合成語意抓取：
                      <span className="text-cyan-300 ml-1">
                        Type #{selectedAnnoType} ({GRASP_TAXONOMY_DATA.find(t => t.id === selectedAnnoType)?.name})
                      </span>
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAnnoStatus('accepted')}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer transition"
                        >
                          ✓ Accept 寫入功能性抓取庫
                        </button>
                        <button
                          onClick={() => setAnnoStatus('rejected')}
                          className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs cursor-pointer transition"
                        >
                          ✕ Reject 重新採樣候選
                        </button>
                      </div>
                      {annoStatus === 'accepted' && (
                        <span className="text-xs text-emerald-400 font-mono">★ 已成功收錄此筆語意標註！</span>
                      )}
                      {annoStatus === 'rejected' && (
                        <span className="text-xs text-amber-400 font-mono">↻ 已切換至次佳排序候選姿態</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sim-to-Real Hardware & Under-Actuation Note (Appendix E - Fig. 15) */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-amber-500/30 space-y-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Appendix E 關鍵硬體洞察：Shadow Hand 真機與模擬器的欠驅動耦合差異 (Fig. 15)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                在 MuJoCo Menagerie 廣泛使用的 Shadow Hand 模擬資產中，除了拇指外，每根手指最遠端的兩個關節被設為永遠相等（<span className="text-cyan-300"><Tex>{'J_1 \\approx J_2'}</Tex></span>）；然而在<strong>真實世界的 Shadow Hand 硬體</strong>中，最遠端關節 <span className="text-amber-300"><Tex>{'J_1'}</Tex></span> 只有在第二關節 <span className="text-amber-300"><Tex>{'J_2'}</Tex></span> 彎曲達到約 <span className="text-amber-300"><Tex>{'90^{\\circ}'}</Tex></span> 後才會開始彎曲（即多數時候 <span className="text-amber-300"><Tex>{'J_1 = 0,\\ J_2 \\neq 0'}</Tex></span>）。作者團隊透過將模擬器中的 <Tex>{'J_1'}</Tex> 固定為 0 並重新合成資料訓練，成功在 UR10e + Shadow Hand + Azure Kinect 上實現 <strong>82.3% (約 200 次真機測試)</strong> 的高成功率！
              </p>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 6: BENCHMARKS & ABLATION CHARTS (實驗數據與消融研究)
           ============================================================ */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400">Section VII & Appendix C</span>
              <h2 className="text-2xl font-bold text-white mt-1">
                全面實驗評估：標準基準、困難基準與模板魯棒性驗證
              </h2>
            </div>

            {/* Table II Comparison */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 overflow-x-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Table II：與類型無關 (Type-Unaware) 解析法基準之全面對比 (Allegro Hand)
                  </h3>
                  <p className="text-xs text-slate-400">
                    測試於 5,697 個 DexGraspNet 物體 × 6 種尺度 (0.05 ~ 0.20)，物體質量 100g（比 BODex 原論文 30g 與 2,397 物體更具挑戰性）。
                  </p>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs">
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">GSR (%) ↑</th>
                    <th className="py-2.5 px-3">OSR (%) ↑</th>
                    <th className="py-2.5 px-3">Speed (s⁻¹) ↑</th>
                    <th className="py-2.5 px-3">CLN ↑</th>
                    <th className="py-2.5 px-3">CDC (mm) ↓</th>
                    <th className="py-2.5 px-3">PD (mm) ↓</th>
                    <th className="py-2.5 px-3">視覺定性分析 (Fig. 5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {BENCHMARK_TABLE_II.map((r, i) => (
                    <tr
                      key={i}
                      className={r.isOurs ? 'bg-emerald-950/30 text-emerald-100 font-semibold' : 'text-slate-300'}
                    >
                      <td className="py-3 px-3">{r.method}</td>
                      <td className="py-3 px-3 font-mono text-cyan-300 font-bold">{r.gsr}%</td>
                      <td className="py-3 px-3 font-mono">{r.osr}%</td>
                      <td className="py-3 px-3 font-mono">{r.speed}</td>
                      <td className="py-3 px-3 font-mono">{r.cln}</td>
                      <td className="py-3 px-3 font-mono">{r.cdc}</td>
                      <td className={`py-3 px-3 font-mono font-bold ${r.pd === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {r.pd.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table III Harder Benchmark & Table VII Robustness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Harder Benchmark Table III */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-cyan-300">
                  <Rich text={'Table III：困難基準測試 (Harder Benchmark: $\\mu = 0.3,\\ 0.002$)'} />
                </h3>
                <p className="text-xs text-slate-400">
                  將切向與扭轉摩擦係數減半至 0.3 與 0.002，並加入 5,000 個複雜的 Objaverse 野生物體。當嘗試次數從 20 增加至 100 時，受惠於模板庫動態更新，我們的方法在 Objaverse 上達成 <strong>94.63% 物體成功率</strong>（BODex 失敗率達 27%）。
                </p>
                <div className="space-y-3 pt-1 text-xs">
                  {[
                    { label: 'DGN Objects (100 attempts) - GSR / OSR', bodex: '14.80% / 89.84%', ours: '27.18% / 95.13%' },
                    { label: 'Objaverse 5k (20 attempts) - GSR / OSR', bodex: '6.92% / 43.48%', ours: '18.25% / 84.17%' },
                    { label: 'Objaverse 5k (100 attempts) - GSR / OSR', bodex: '6.91% / 73.53%', ours: '18.34% / 94.63%' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="font-semibold text-white">{item.label}</div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-400">BODex [7]: {item.bodex}</span>
                        <span className="text-emerald-400 font-bold">Ours: {item.ours}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Robustness to Noisy Initial Templates (Table VII & Fig. 7) */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-emerald-300">
                  Table VII & Fig. 7：對含噪人工標註初始模板之魯棒性
                </h3>
                <p className="text-xs text-slate-400">
                  若人工標註的初始模板接觸法向量極度混亂 (Noisy Template 3)，在不啟用模板庫更新時成功率僅有 <strong>1.7%</strong>；但啟用 Stage 5 自動從少數成功抓取建構新模板後，成功率立即回升至 <strong>46.2%</strong>！
                </p>
                <div className="space-y-3 pt-1 text-xs">
                  {[
                    { name: '6. Prismatic 4 Finger - Template 1 (標準標註)', wo: '45.6%', with: '57.1%' },
                    { name: '6. Prismatic 4 Finger - Template 2 (中度法向雜訊)', wo: '12.0%', with: '56.7%' },
                    { name: '6. Prismatic 4 Finger - Template 3 (重度法向雜訊)', wo: '1.7%', with: '46.2%' },
                    { name: '1. Large Diameter - Template 3 (大幅改變關節角)', wo: '7.2%', with: '26.8%' }
                  ].map((row, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-200 font-medium">{row.name}</span>
                      <div className="font-mono flex items-center gap-3">
                        <span className="text-rose-400">無更新: {row.wo}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-emerald-400 font-bold">動態更新: {row.with}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 7: GITHUB REPO CREATION & DEPLOYMENT (建立 GitHub Repo 專區)
           ============================================================ */}
        {activeTab === 'github' && (
          <div className="space-y-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-emerald-950/30 border border-cyan-500/40 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono uppercase text-emerald-400">GitHub Repository & Pages Generator</span>
                  <h2 className="text-2xl font-bold text-white mt-1 flex items-center gap-2.5">
                    <Github className="w-6 h-6 text-cyan-400" />
                    在您的 GitHub 新增儲存庫並部署此互動式論文解析網站
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    在下方輸入您的 GitHub 帳號與想要的 Repo 名稱，即可一鍵複製終端機自動化建庫推送指令 (`gh repo create`) 與 GitHub Pages 自動部署工作流。
                  </p>
                </div>
              </div>

              {/* Custom Repo Name Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs text-slate-400 mb-1">您的 GitHub 帳號 (Username / Organization)</label>
                  <input
                    type="text"
                    value={ghUsername}
                    onChange={e => setGhUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs text-slate-400 mb-1">新建 GitHub Repository 名稱</label>
                  <input
                    type="text"
                    value={ghRepoName}
                    onChange={e => setGhRepoName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Step 1 CLI Script */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    步驟 1：使用 GitHub CLI 一鍵新增遠端 Repo 並推送程式碼
                  </span>
                  <button
                    onClick={() => copyToClipboard(cliScript, 'cli')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer transition"
                  >
                    {copiedId === 'cli' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'cli' ? '已複製指令！' : '複製終端機腳本'}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {cliScript}
                </pre>
              </div>

              {/* Step 2 GitHub Actions Workflow */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    步驟 2：新增 <code className="text-cyan-300">.github/workflows/deploy.yml</code> 自動發布至 GitHub Pages
                  </span>
                  <button
                    onClick={() => copyToClipboard(githubActionYaml, 'yaml')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs cursor-pointer transition"
                  >
                    {copiedId === 'yaml' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'yaml' ? '已複製 YAML！' : '複製 GitHub Actions 設定'}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {githubActionYaml}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Interactive Academic Paper Explainer for <strong>Dexonomy (arXiv:2504.18829v2)</strong> • Built with React & Tailwind CSS
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://pku-epic.github.io/Dexonomy"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 transition"
            >
              PKU-EPIC Official Project Page
            </a>
            <button onClick={() => setActiveTab('github')} className="hover:text-emerald-400 transition cursor-pointer">
              GitHub Repo Deployment Guide
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}