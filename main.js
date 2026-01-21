// 预置的抽奖人员名单（来自用户提供），顺序稍后会随机打乱
const PRESET_NAMES = [
  "梁永红",
  "于含",
  "邹德君",
  "廖晓涛",
  "宋立新",
  "路亮",
  "于孝民",
  "赵红云",
  "郑瑶",
  "李欣然",
  "李洪栋",
  "郑茜",
  "张靖",
  "李婷婷",
  "周静",
  "赵洋",
  "魏阔",
  "赵晨",
  "冀娟",
  "魏庆飞",
  "赵静",
  "魏丽红",
  "左丽萍",
  "刘津酉",
  "颜颜",
  "张方",
  "王雷",
  "孙丽颖",
  "白红英",
  "贾燕",
  "姜立娜",
  "吴萍",
  "司霞",
  "刘春花",
  "张雪",
  "赵涛",
  "王琼",
  "杨星雨",
  "唐丽萍",
  "曹雪梅",
  "李敏",
  "黄玲",
  "王杰",
  "李京川",
  "刘伟",
  "陈明",
  "王毅",
  "何莉婕",
  "莫小枫",
  "银焕邦",
  "黄丽娟",
  "王杰",
  "周兴颖",
  "姜鹏",
  "肖旺",
  "陈皓",
  "郑航",
  "崔昕瞳",
  "乔国桂",
  "袁伦鹏",
  "周自棋",
  "于光华",
  "李魏",
  "董德旭",
  "李洋",
  "袁学",
  "吴彬",
  "杨永志",
  "干川川",
  "张应华",
  "张代根",
  "吕静",
  "徐明军",
  "左明伟",
  "胡先豪",
  "沈清元",
  "华健森",
  "赵玉林",
  "魏阳",
  "白成渝",
  "龙洪彬",
  "徐操",
  "祝东",
  "陶中富",
  "张万勤",
  "宋先福",
  "唐发祥",
  "赵德福",
  "谢永洪",
  "郭鹏博",
  "石玉刚",
  "郭鹏飞",
  "秦晓东",
  "梁伟",
  "袁宝忠",
  "吕相超",
  "胡云奎",
  "毛波",
  "邹亮",
  "石强",
  "张家豪",
  "刘良明",
  "何琦",
  "李洪兆",
  "张文宇",
  "唐洪全",
  "张利红",
  "付明兴",
  "施祖成",
  "秦小风",
  "袁文月",
  "吴富发",
  "张静",
  "胡洪",
  "张作昌",
  "周贵权",
  "王代强",
  "张俊雨",
  "张立丰",
  "向申磊",
  "车宛靖",
  "郭宇",
  "黄治龙",
  "白志敏",
  "廖义根",
  "于文达",
];

// 简单的数据结构：所有待抽奖人员 & 获奖记录
const state = {
  people: [], // { id, name }
  remaining: [], // 剩余可抽的人 id 列表
  winners: {
    special: [],
    first: [],
    second: [],
    third: [],
  },
  rollingTimer: null,
  autoStopTimer: null,
  currentCandidateId: null,
  isRolling: false,
};

// DOM 引用
const els = {
  levelSelect: document.getElementById("level-select"),
  countInput: document.getElementById("count-input"),
  modeRadios: document.querySelectorAll('input[name="mode"]'),
  autoDuration: document.getElementById("auto-duration"),
  autoRandom: document.getElementById("auto-random"),
  flashInterval: document.getElementById("flash-interval"),
  startBtn: document.getElementById("start-btn"),
  stopBtn: document.getElementById("stop-btn"),
  resetRoundBtn: document.getElementById("reset-round-btn"),
  displayArea: document.getElementById("display-area"),
  placeholderText: document.querySelector(".placeholder-text"),
  currentName: document.getElementById("current-name"),
  levelText: document.getElementById("current-level-text"),
  namesImport: document.getElementById("names-import"),
  applyImportBtn: document.getElementById("apply-import-btn"),
  poolList: document.getElementById("pool-list"),
  winnersLists: {
    special: document.getElementById("winners-special"),
    first: document.getElementById("winners-first"),
    second: document.getElementById("winners-second"),
    third: document.getElementById("winners-third"),
  },
  overlayControls: document.getElementById("overlay-controls"),
};

// 工具函数
function uuid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8)
  ).toUpperCase();
}

function getMode() {
  const checked = Array.from(els.modeRadios).find((r) => r.checked);
  return checked?.value || "auto";
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 渲染相关
function updateDisplayName(name) {
  if (!name) {
    els.currentName.classList.add("hidden");
    els.placeholderText.style.display = "block";
    return;
  }
  els.placeholderText.style.display = "none";
  els.currentName.classList.remove("hidden");
  els.currentName.textContent = name;
}

function showControls() {
  if (!els.overlayControls) return;
  els.overlayControls.classList.remove("hidden");
}

function hideControls() {
  if (!els.overlayControls) return;
  els.overlayControls.classList.add("hidden");
}

// 渲染当前奖池（仅显示未中奖的人员）
function renderPool() {
  if (!els.poolList) return;
  els.poolList.innerHTML = "";
  state.remaining.forEach((id) => {
    const person = state.people.find((p) => p.id === id);
    if (!person) return;
    const li = document.createElement("li");
    li.textContent = person.name;
    li.title = "点击可将其从奖池中移除";
    li.addEventListener("click", () => {
      removeFromPool(id);
    });
    els.poolList.appendChild(li);
  });
}

// 渲染中奖结果（按奖项分组）
function renderWinners() {
  if (!els.winnersLists) return;
  ["special", "first", "second", "third"].forEach((level) => {
    const ul = els.winnersLists[level];
    if (!ul) return;
    ul.innerHTML = "";
    state.winners[level].forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p.name;
      ul.appendChild(li);
    });
  });
}

// 从奖池中移除某人（不影响已中的历史记录）
function removeFromPool(id) {
  // 从剩余名单中删除
  state.remaining = state.remaining.filter((pid) => pid !== id);
  // 为了不再被导入为重复人员，将其也从 people 中移除
  state.people = state.people.filter((p) => p.id !== id);
  renderPool();
}

// 抽奖逻辑
function canStartDraw() {
  const remaining = state.remaining.length;
  const count = Math.max(1, parseInt(els.countInput.value || "1", 10));
  if (remaining === 0) {
    alert("没有可抽取的人员，名单已全部抽完。");
    return false;
  }
  if (count > remaining) {
    alert(
      `当前剩余未中奖人数为 ${remaining} 人，本轮抽取人数不能超过该数量。`
    );
    return false;
  }
  return true;
}

function startRolling() {
  if (!canStartDraw()) return;
  if (state.isRolling) return;

  state.isRolling = true;
  state.currentCandidateId = null;

  showControls();

  els.startBtn.disabled = true;
  els.stopBtn.disabled = false;

  // 抽奖开始前不显示姓名，这里先保持占位文字，稍后滚动时显示
  els.placeholderText.style.display = "block";
  els.currentName.classList.add("hidden");

  const ids = state.remaining.slice();
  if (ids.length === 0) return;

  // 闪烁轮播：不停随机切换剩余人员
  const interval =
    Math.max(
      30,
      Math.min(
        500,
        parseInt(els.flashInterval.value || "80", 10)
      )
    ) || 80;
  state.rollingTimer = setInterval(() => {
    if (ids.length === 0) return;
    const randIndex = Math.floor(Math.random() * ids.length);
    const id = ids[randIndex];
    const person = state.people.find((p) => p.id === id);
    if (person) {
      state.currentCandidateId = id;
      updateDisplayName(person.name);
    }
  }, interval); // 可调节的闪烁节奏

  if (getMode() === "auto") {
    const baseSec = Math.max(
      1,
      parseInt(els.autoDuration.value || "5", 10)
    );
    let durationSec = baseSec;
    if (els.autoRandom && els.autoRandom.checked) {
      const minSec = 1;
      const maxSec = Math.max(minSec, baseSec);
      durationSec =
        Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    }
    state.autoStopTimer = setTimeout(() => {
      stopAndConfirm();
    }, durationSec * 1000);
  }
}

function stopAndConfirm() {
  if (!state.isRolling) return;

  state.isRolling = false;
  clearInterval(state.rollingTimer);
  state.rollingTimer = null;

  if (state.autoStopTimer) {
    clearTimeout(state.autoStopTimer);
    state.autoStopTimer = null;
  }

  els.startBtn.disabled = false;
  els.stopBtn.disabled = true;

  // 根据本轮需要抽取的人数，从剩余人员中公平随机抽取
  const needCount = Math.max(
    1,
    parseInt(els.countInput.value || "1", 10)
  );
  const remainingIds = state.remaining.slice();
  const shuffled = shuffle(remainingIds);
  const takeIds = shuffled.slice(0, needCount);

  const level = els.levelSelect.value;
  const winnersThisRound = [];

  takeIds.forEach((id) => {
    const person = state.people.find((p) => p.id === id);
    if (!person) return;
    winnersThisRound.push(person);
    state.winners[level].push(person);
    // 从剩余中移除，后续不再参与抽奖
    state.remaining = state.remaining.filter((pid) => pid !== id);
  });

  // 更新奖池与中奖记录展示
  renderPool();
  renderWinners();

  if (winnersThisRound.length > 0) {
    if (winnersThisRound.length === 1) {
      const last = winnersThisRound[0];
      state.currentCandidateId = last.id;
      updateDisplayName(last.name);
    } else {
      // 多人时，最终展示本轮所有中奖人的姓名
      const names = winnersThisRound.map((p) => p.name).join("、");
      state.currentCandidateId = null;
      updateDisplayName(names);
    }
  } else {
    updateDisplayName("");
  }

  // 公布名单期间隐藏操作按钮，避免误触
  hideControls();

  // 短暂停留展示中奖者后，自动回到下一轮准备界面并切换到下一个奖项
  setTimeout(() => {
    if (!state.isRolling) {
      resetRound();
      advanceLevelIfAny();
      showControls();
    }
  }, 3000);
}

// 抽完当前奖项后，自动切换到下一个奖项（三等奖 -> 二等奖 -> 一等奖 -> 特等奖）
function advanceLevelIfAny() {
  const order = ["third", "second", "first", "special"];
  const current = els.levelSelect.value;
  const idx = order.indexOf(current);
  if (idx === -1) return;

  // 如果已经是最后一个奖项或剩余人员为 0，则不再自动切换
  if (idx >= order.length - 1 || state.remaining.length === 0) {
    return;
  }

  const next = order[idx + 1];
  els.levelSelect.value = next;

  const map = {
    third: "三等奖",
    second: "二等奖",
    first: "一等奖",
    special: "特等奖",
  };
  els.levelText.textContent = map[next] || "";
}

// 从文本导入奖池姓名，追加到当前奖池
function applyImportNames() {
  if (!els.namesImport) return;
  const raw = els.namesImport.value.trim();
  if (!raw) {
    alert("请输入要导入的姓名。");
    return;
  }

  const rawNames = raw
    .split(/[\n,，,]+/)
    .map((n) => n.trim())
    .filter((n) => !!n);

  if (rawNames.length === 0) {
    alert("未解析到有效姓名，请检查格式。");
    return;
  }

  // 追加新人员：对导入文本去重，并且跳过当前奖池中已有的姓名，保证全局唯一
  const uniqueNames = Array.from(new Set(rawNames));
  uniqueNames.forEach((name) => {
    if (state.people.some((p) => p.name === name)) {
      return;
    }
    const id = uuid();
    const person = { id, name };
    state.people.push(person);
    state.remaining.push(id);
  });

  // 将剩余奖池整体打乱一次，保证后续每个人的位置随机，机会均等
  state.remaining = shuffle(state.remaining);

  // 清空输入框
  els.namesImport.value = "";
  // 回到准备状态
  resetRound();
  renderPool();
  alert(`已成功导入并追加人员，当前奖池总人数：${state.people.length}。`);
}

function resetRound() {
  if (state.isRolling) {
    clearInterval(state.rollingTimer);
    state.rollingTimer = null;
    state.isRolling = false;
  }
  if (state.autoStopTimer) {
    clearTimeout(state.autoStopTimer);
    state.autoStopTimer = null;
  }
  state.currentCandidateId = null;
  els.startBtn.disabled = false;
  els.stopBtn.disabled = true;
  updateDisplayName("");
}

// 事件绑定
function bindEvents() {
  els.startBtn.addEventListener("click", startRolling);
  els.stopBtn.addEventListener("click", stopAndConfirm);
  els.resetRoundBtn.addEventListener("click", resetRound);

  // 奖项下拉变更时，实时更新顶部显示的当前奖项文字
  els.levelSelect.addEventListener("change", () => {
    const map = {
      third: "三等奖",
      second: "二等奖",
      first: "一等奖",
      special: "特等奖",
    };
    els.levelText.textContent = map[els.levelSelect.value] || "";
  });

  if (els.applyImportBtn) {
    els.applyImportBtn.addEventListener("click", applyImportNames);
  }
}

function init() {
  // 初始化人员列表：用预置名单生成人员对象并随机打乱顺序（且去重，确保每人概率相同）
  const uniquePreset = Array.from(new Set(PRESET_NAMES));
  const shuffledNames = shuffle(uniquePreset);
  shuffledNames.forEach((name) => {
    const id = uuid();
    const person = { id, name };
    state.people.push(person);
    state.remaining.push(id);
  });

  bindEvents();
  renderPool();
  renderWinners();
  // 初始化显示：默认三等奖
  els.levelText.textContent = "三等奖";
  updateDisplayName("");
  showControls();
}

document.addEventListener("DOMContentLoaded", init);

