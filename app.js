/**
 * 輔英科技大學 賴文亮教授 環境影響評估 (EIA) 雙欄課程網站與問卷控制器
 * - 上課時段：星期三 第 3-4 節 (10:10 - 12:00)
 * - 雙欄對照：⚡ 有 AI 導入週次 vs 📘 無 AI 導入週次
 * - 完整功能：W01 賴文亮教授自我介紹、KAB 期初/期末即時問卷結果與題目分布條狀圖
 */

document.addEventListener('DOMContentLoaded', () => {
  const aiColumnContent = document.getElementById('aiColumnContent');
  const nonAiColumnContent = document.getElementById('nonAiColumnContent');
  const courseSearchInput = document.getElementById('courseSearchInput');
  const btnTwoCol = document.getElementById('btnTwoCol');
  const btnTimeline = document.getElementById('btnTimeline');
  const twoColumnLayout = document.getElementById('twoColumnLayout');
  const singleSyllabusContainer = document.getElementById('singleSyllabusContainer');
  const surveyTriggerBtn = document.getElementById('surveyTriggerBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBody = document.getElementById('modalBody');

  let currentViewMode = 'twocol';
  let activeSurveyTab = 'live_results'; // 'live_results', 'pre', 'post', 'growth'

  // Dropdown Selectors Elements
  const categoryFilterSelect = document.getElementById('categoryFilterSelect');
  const weekSelectDropdown = document.getElementById('weekSelectDropdown');
  const resetWeekFilterBtn = document.getElementById('resetWeekFilterBtn');
  const filterStatusBadge = document.getElementById('filterStatusBadge');

  // Global helper for week navigation & scrolling focus
  window.handleWeekSelect = function(weekVal, shouldScroll = true) {
    if (weekSelectDropdown) {
      weekSelectDropdown.value = weekVal;
      if (weekVal !== 'all' && categoryFilterSelect) {
        categoryFilterSelect.value = 'all';
      }
      applyFiltersAndRender();

      if (shouldScroll) {
        setTimeout(() => {
          const targetEl = document.getElementById('columnLayoutContainer') || document.getElementById('singleSyllabusContainer');
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 60);
      }
    }
  };

  window.selectWeekNav = function(weekVal) {
    window.handleWeekSelect(weekVal, true);
  };

  // Filter Event Listeners
  if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener('change', () => {
      const catVal = categoryFilterSelect.value;
      const weekVal = weekSelectDropdown ? weekSelectDropdown.value : 'all';
      
      // If user selected a specific week, check if it matches the selected category; if not, reset week selector
      if (weekVal !== 'all' && window.EIA_COURSE_DATA) {
        const targetNum = parseInt(weekVal.replace('w', ''), 10);
        const isAiWeek = window.EIA_COURSE_DATA.aiWeeks.some(w => w.weekNum === targetNum);
        if ((catVal === 'ai' && !isAiWeek) || (catVal === 'non_ai' && isAiWeek)) {
          if (weekSelectDropdown) weekSelectDropdown.value = 'all';
        }
      }
      applyFiltersAndRender();
    });
  }

  if (weekSelectDropdown) {
    weekSelectDropdown.addEventListener('change', () => {
      window.handleWeekSelect(weekSelectDropdown.value, true);
    });

    weekSelectDropdown.addEventListener('click', () => {
      if (weekSelectDropdown.value !== 'all') {
        window.handleWeekSelect(weekSelectDropdown.value, true);
      }
    });
  }

  if (resetWeekFilterBtn) {
    resetWeekFilterBtn.addEventListener('click', () => {
      if (categoryFilterSelect) categoryFilterSelect.value = 'all';
      if (weekSelectDropdown) weekSelectDropdown.value = 'all';
      if (courseSearchInput) courseSearchInput.value = '';
      applyFiltersAndRender();
    });
  }

  function applyFiltersAndRender() {
    if (currentViewMode === 'twocol') {
      renderTwoColumns();
    } else {
      renderSingleTimeline();
    }
  }

  // Enhanced renderTwoColumns with Dropdown Filtering & Single-Week Focus
  function renderTwoColumns() {
    if (!window.EIA_COURSE_DATA) return;

    const keyword = courseSearchInput ? courseSearchInput.value.trim().toLowerCase() : '';
    const catVal = categoryFilterSelect ? categoryFilterSelect.value : 'all';
    const weekVal = weekSelectDropdown ? weekSelectDropdown.value : 'all';

    const aiColBox = document.querySelector('.column-box.ai-column');
    const nonAiColBox = document.querySelector('.column-box.non-ai-column');

    // Filter Weeks
    let filteredAiWeeks = window.EIA_COURSE_DATA.aiWeeks.filter(w => matchSearch(w, keyword));
    let filteredNonAiWeeks = window.EIA_COURSE_DATA.nonAiWeeks.filter(w => matchSearch(w, keyword));

    if (weekVal !== 'all') {
      const targetNum = parseInt(weekVal.replace('w', ''), 10);
      filteredAiWeeks = filteredAiWeeks.filter(w => w.weekNum === targetNum);
      filteredNonAiWeeks = filteredNonAiWeeks.filter(w => w.weekNum === targetNum);

      // Single week selection mode: Hide empty column and expand active column to full-width
      if (aiColBox && nonAiColBox) {
        if (filteredAiWeeks.length > 0) {
          aiColBox.style.display = 'block';
          aiColBox.style.gridColumn = '1 / -1';
          nonAiColBox.style.display = 'none';
        } else if (filteredNonAiWeeks.length > 0) {
          aiColBox.style.display = 'none';
          nonAiColBox.style.display = 'block';
          nonAiColBox.style.gridColumn = '1 / -1';
        }
      }
    } else {
      // Category filter mode or ALL weeks mode
      if (aiColBox && nonAiColBox) {
        if (catVal === 'ai') {
          aiColBox.style.display = 'block';
          aiColBox.style.gridColumn = '1 / -1';
          nonAiColBox.style.display = 'none';
        } else if (catVal === 'non_ai') {
          aiColBox.style.display = 'none';
          nonAiColBox.style.display = 'block';
          nonAiColBox.style.gridColumn = '1 / -1';
        } else {
          aiColBox.style.display = 'block';
          aiColBox.style.gridColumn = '';
          nonAiColBox.style.display = 'block';
          nonAiColBox.style.gridColumn = '';
        }
      }
    }

    aiColumnContent.innerHTML = filteredAiWeeks.map(w => renderColumnItem(w, true, weekVal !== 'all')).join('');
    nonAiColumnContent.innerHTML = filteredNonAiWeeks.map(w => renderColumnItem(w, false, weekVal !== 'all')).join('');

    // Update Filter Status Badge
    updateFilterBadge(catVal, weekVal, keyword);

    // Card Click Listeners (Delegated)
    attachCardClickDelegation();
  }

  function updateFilterBadge(catVal, weekVal, keyword) {
    if (!filterStatusBadge) return;
    const isFiltered = (catVal !== 'all' || weekVal !== 'all' || keyword !== '');

    if (resetWeekFilterBtn) {
      resetWeekFilterBtn.style.display = isFiltered ? 'inline-flex' : 'none';
    }

    if (weekVal !== 'all') {
      const targetNum = parseInt(weekVal.replace('w', ''), 10);
      const allW = [...(window.EIA_COURSE_DATA.aiWeeks || []), ...(window.EIA_COURSE_DATA.nonAiWeeks || [])];
      const found = allW.find(w => w.weekNum === targetNum);
      const wTitle = found ? found.title : `第 ${targetNum} 週`;
      filterStatusBadge.innerHTML = `<i class="fa-solid fa-location-dot"></i> 精準呈現：${found ? found.weekCode : ''} ${wTitle}`;
      filterStatusBadge.style.background = '#d1fae5';
      filterStatusBadge.style.color = '#047857';
    } else if (catVal === 'ai') {
      filterStatusBadge.innerHTML = `<i class="fa-solid fa-bolt"></i> 分類：僅顯示 8 週 AI 創新週次`;
      filterStatusBadge.style.background = '#fef3c7';
      filterStatusBadge.style.color = '#b45309';
    } else if (catVal === 'non_ai') {
      filterStatusBadge.innerHTML = `<i class="fa-solid fa-book"></i> 分類：僅顯示 10 週 無 AI 基礎週次`;
      filterStatusBadge.style.background = '#e0f2fe';
      filterStatusBadge.style.color = '#0369a1';
    } else {
      filterStatusBadge.innerHTML = `<i class="fa-solid fa-list-ul"></i> 模式：顯示全部 18 週雙欄對照`;
      filterStatusBadge.style.background = '#e0f2fe';
      filterStatusBadge.style.color = '#0369a1';
    }
  }

  function matchSearch(week, keyword) {
    if (!keyword) return true;
    const tMatch = week.title.toLowerCase().includes(keyword);
    const cMatch = week.weekCode.toLowerCase().includes(keyword);
    const oMatch = week.outcomes && (week.outcomes.knowledge.toLowerCase().includes(keyword) || week.outcomes.attitude.toLowerCase().includes(keyword) || week.outcomes.behavior.toLowerCase().includes(keyword));
    const cardMatch = week.cards.some(c => c.title.toLowerCase().includes(keyword) || c.desc.toLowerCase().includes(keyword));
    return tMatch || cMatch || oMatch || cardMatch;
  }

  function renderColumnItem(week, isAi, isFocused = false) {
    const prevNum = week.weekNum > 1 ? week.weekNum - 1 : 18;
    const nextNum = week.weekNum < 18 ? week.weekNum + 1 : 1;
    const isW1 = (week.weekNum === 1);

    return `
      <div class="col-week-item ${isFocused ? 'focused-single-week' : ''}" style="${isFocused ? 'border:2px solid #0284c7; background:#fff; padding:18px; border-radius:12px; box-shadow:0 4px 14px rgba(2,132,199,0.12);' : ''}">
        ${isFocused ? `
          <div style="display:flex; justify-content:space-between; align-items:center; background:#f0f9ff; border:1px solid #bae6fd; padding:10px 14px; border-radius:8px; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
            <button onclick="window.selectWeekNav('w${prevNum}')" style="background:#0284c7; color:#fff; border:none; padding:5px 12px; border-radius:6px; font-weight:700; font-size:0.85rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-chevron-left"></i> 上一週 (W${prevNum < 10 ? '0'+prevNum : prevNum})
            </button>
            <span style="font-weight:700; color:#0b3c5d; font-size:0.95rem;">
              <i class="fa-solid fa-graduation-cap" style="color:#0284c7;"></i> 精準呈現上課規劃內容：${week.weekCode}
            </span>
            <button onclick="window.selectWeekNav('w${nextNum}')" style="background:#0284c7; color:#fff; border:none; padding:5px 12px; border-radius:6px; font-weight:700; font-size:0.85rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
              下一週 (W${nextNum < 10 ? '0'+nextNum : nextNum}) <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        ` : ''}

        <div class="col-week-head">
          <span class="col-week-code">${week.weekCode}</span>
          <span class="col-week-date">${week.dateStr}</span>
        </div>
        <div class="col-week-title" style="font-size:1.1rem; font-weight:700; color:#0b3c5d; margin:6px 0 10px 0;">${week.title}</div>
        
        ${week.noticeAlert ? `
          <div style="font-size: 0.85rem; background: #fffbeb; color: #92400e; padding: 8px 12px; border-radius: 6px; border: 1px solid #fef3c7; margin-bottom:10px;">
            ${week.noticeAlert}
          </div>
        ` : ''}

        ${week.outcomes ? `
          <div class="outcome-breakdown-box" style="margin-bottom:12px;">
            <div class="outcome-item"><strong>🧠 知識 (K)：</strong> <span>${week.outcomes.knowledge}</span></div>
            <div class="outcome-item"><strong>❤️ 態度 (A)：</strong> <span>${week.outcomes.attitude}</span></div>
            <div class="outcome-item"><strong>🛠️ 行為 (B)：</strong> <span>${week.outcomes.behavior}</span></div>
          </div>
        ` : ''}

        ${isW1 ? `
          <!-- Prominent Direct Voice Guide Player Bar for W01 -->
          <div style="background: linear-gradient(135deg, #0b3c5d 0%, #0284c7 100%); color:#fff; padding:14px 18px; border-radius:10px; margin:12px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; box-shadow:0 4px 14px rgba(2,132,199,0.22); border:1px solid #38bdf8;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="background:#f59e0b; color:#fff; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; box-shadow:0 2px 8px rgba(245,158,11,0.4);">
                <i class="fa-solid fa-volume-high"></i>
              </div>
              <div>
                <strong style="font-size:1rem; color:#fff; font-weight:800;">W01 修課指南 AI 語音導讀播放器 (Web Speech API)</strong>
                <div style="font-size:0.83rem; color:#e0f2fe; margin-top:2px;">賴文亮教授親錄導讀 ‧ 期中考25%/期末考25%/實作成品20%/資訊學習15%/出席率10%/問卷5%</div>
              </div>
            </div>
            <button onclick="window.openCardModal('guide', 'w01-c1')" style="background:#f59e0b; color:#78350f; border:none; padding:8px 18px; border-radius:8px; font-weight:800; font-size:0.9rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
              <i class="fa-solid fa-play"></i> 開啟語音導讀播放器 ➔
            </button>
          </div>
        ` : ''}

        <div class="cards-list" style="margin-top: 8px;">
          ${week.cards.map(card => `
            <div class="course-card" data-modal="${card.modalType}" data-card-id="${card.id}" onclick="window.openCardModal('${card.modalType}', '${card.id}')">
              <div class="card-left">
                <div class="card-icon-box"><i class="${card.icon}"></i></div>
                <div class="card-content">
                  <div class="card-title-row">
                    <span class="card-title">${card.title}</span>
                    <span class="card-tag ${card.tagColor}">${card.tag}</span>
                  </div>
                  <div class="card-desc">${card.desc}</div>
                </div>
              </div>
              <div class="card-right"><i class="fa-solid fa-chevron-right"></i></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Toggle View Modes
  if (btnTwoCol && btnTimeline && twoColumnLayout && singleSyllabusContainer) {
    btnTwoCol.addEventListener('click', () => {
      btnTwoCol.classList.add('active');
      btnTimeline.classList.remove('active');
      twoColumnLayout.style.display = 'grid';
      singleSyllabusContainer.style.display = 'none';
      currentViewMode = 'twocol';
      renderTwoColumns();
    });

    btnTimeline.addEventListener('click', () => {
      btnTimeline.classList.add('active');
      btnTwoCol.classList.remove('active');
      twoColumnLayout.style.display = 'none';
      singleSyllabusContainer.style.display = 'flex';
      currentViewMode = 'timeline';
      renderSingleTimeline();
    });
  }

  if (courseSearchInput) {
    courseSearchInput.addEventListener('input', applyFiltersAndRender);
  }
  if (surveyTriggerBtn) {
    surveyTriggerBtn.addEventListener('click', () => openCardModal('kab_survey', 'kab-survey'));
  }

  function renderSingleTimeline() {
    if (!window.EIA_COURSE_DATA) return;

    const keyword = courseSearchInput ? courseSearchInput.value.trim().toLowerCase() : '';
    const catVal = categoryFilterSelect ? categoryFilterSelect.value : 'all';
    const weekVal = weekSelectDropdown ? weekSelectDropdown.value : 'all';

    let allWeeks = [...window.EIA_COURSE_DATA.aiWeeks, ...window.EIA_COURSE_DATA.nonAiWeeks];
    allWeeks.sort((a, b) => a.weekNum - b.weekNum);

    // Apply Search Keyword Filter
    allWeeks = allWeeks.filter(w => matchSearch(w, keyword));

    // Apply Category Filter
    if (catVal === 'ai') {
      allWeeks = allWeeks.filter(w => window.EIA_COURSE_DATA.aiWeeks.some(aiW => aiW.weekNum === w.weekNum));
    } else if (catVal === 'non_ai') {
      allWeeks = allWeeks.filter(w => window.EIA_COURSE_DATA.nonAiWeeks.some(nW => nW.weekNum === w.weekNum));
    }

    // Apply Week Dropdown Filter
    if (weekVal !== 'all') {
      const targetNum = parseInt(weekVal.replace('w', ''), 10);
      allWeeks = allWeeks.filter(w => w.weekNum === targetNum);
    }

    singleSyllabusContainer.innerHTML = allWeeks.map(w => `
      <div style="background:#fff; border:1px solid #e2e8f0; padding:20px; border-radius:10px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <strong style="color:#0b3c5d;">${w.weekCode} (${w.dateStr})</strong>
          <span style="font-size:0.8rem; padding:2px 8px; border-radius:10px; font-weight:700; ${w.cards.some(c=>c.type==='ai_tool' || c.id==='w04-c1' || c.id==='w06-c1' || c.id==='w08-c1' || c.id==='w09-c1' || c.id==='w12-c1' || c.id==='w13-c1' || c.id==='w14-c1' || c.id==='w18-c1') ? 'background:#d1fae5; color:#047857;' : 'background:#e0f2fe; color:#0369a1;'}">
            ${w.cards.some(c=>c.type==='ai_tool' || c.id==='w04-c1' || c.id==='w06-c1' || c.id==='w08-c1' || c.id==='w09-c1' || c.id==='w12-c1' || c.id==='w13-c1' || c.id==='w14-c1' || c.id==='w18-c1') ? '⚡ 導入 AI 設計' : '📘 未導入 AI 基礎'}
          </span>
        </div>
        <h3 style="font-size:1.05rem; margin-bottom:10px;">${w.title}</h3>
        ${w.outcomes ? `
          <div style="font-size:0.85rem; background:#f8fafc; padding:10px; border-radius:6px; margin-bottom:10px;">
            <p><strong>🧠 知識 (K)：</strong> ${w.outcomes.knowledge}</p>
            <p><strong>❤️ 態度 (A)：</strong> ${w.outcomes.attitude}</p>
            <p><strong>🛠️ 行為 (B)：</strong> ${w.outcomes.behavior}</p>
          </div>
        ` : ''}
        ${w.cards.map(c => `
          <div class="course-card" data-modal="${c.modalType}" data-card-id="${c.id}" onclick="window.openCardModal('${c.modalType}', '${c.id}')" style="margin-top:8px;">
            <div class="card-left">
              <div class="card-icon-box"><i class="${c.icon}"></i></div>
              <div><strong>${c.title}</strong> - <span style="font-size:0.85rem; color:#64748b;">${c.desc}</span></div>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');

    updateFilterBadge(catVal, weekVal, keyword);
    attachCardClickDelegation();
  }

  // Open Card Modal Function
  function openCardModal(modalType, cardId) {
    const modalBody = document.getElementById('modalBody');
    const modalBackdrop = document.getElementById('modalBackdrop');
    let contentHtml = '';

    if (modalType === 'w01_slides' || cardId === 'w01-slides' || modalType === 'w02_slides' || cardId === 'w02-slides') {
      const isW2 = (modalType === 'w02_slides' || cardId === 'w02-slides');
      const slides = isW2 ? (window.EIA_W02_SLIDES || []) : (window.EIA_W01_SLIDES || []);
      const totalCount = slides.length || (isW2 ? 42 : 35);
      const weekTitleStr = isW2 ? 'W02 我國環評法規體系與認定標準解析' : 'W01 環評法規體系總覽與學習地圖';

      window.currentSlideIdx = 0;

      function renderInteractiveSlideViewer() {
        const slide = slides[window.currentSlideIdx] || {
          slideNum: window.currentSlideIdx + 1,
          title: `簡報頁次 ${window.currentSlideIdx + 1}`,
          category: isW2 ? 'W02 法規解碼' : 'W01 基礎講義',
          bullets: ['講義內容載入中...'],
          notes: ''
        };

        const bulletsList = slide.bullets || slide.content || [];
        const notesStr = slide.notes || slide.note || '';
        const sectionBadge = slide.section || slide.category || (isW2 ? 'W02 法規解碼' : 'W01 基礎講義');

        return `
          <div id="slideModalContainer" style="background:#0f172a; color:#f8fafc; border-radius:12px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
            <!-- Slide Header Bar -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:12px; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="background:#0284c7; color:#fff; padding:4px 12px; border-radius:12px; font-size:0.82rem; font-weight:700;">${sectionBadge}</span>
                <strong style="font-size:1.05rem; color:#38bdf8;">${weekTitleStr}</strong>
              </div>
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <!-- Jump to Slide Selector -->
                <select onchange="window.jumpToSlide(this.value)" style="background:#1e293b; color:#f59e0b; border:1px solid #0284c7; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.85rem; cursor:pointer;">
                  ${slides.map((s, idx) => `
                    <option value="${idx}" ${idx === window.currentSlideIdx ? 'selected' : ''}>
                      頁次 ${(s.slideNum || idx+1) < 10 ? '0'+(s.slideNum || idx+1) : (s.slideNum || idx+1)}: ${(s.title || '').replace(/<[^>]*>/g, '').substring(0, 24)}...
                    </option>
                  `).join('')}
                </select>

                <span style="font-size:0.9rem; font-weight:700; color:#94a3b8;">
                  頁次：<span id="slideCounter" style="color:#f59e0b; font-size:1.1rem;">${window.currentSlideIdx + 1}</span> / ${totalCount}
                </span>
                <button onclick="window.toggleSlideFullscreen()" style="background:#334155; color:#f8fafc; border:1px solid #475569; padding:5px 12px; border-radius:6px; font-size:0.82rem; cursor:pointer; font-weight:600;">
                  <i class="fa-solid fa-expand"></i> 全螢幕呈現
                </button>
              </div>
            </div>

            <!-- Slide Content Card Area -->
            <div id="slideMainCard" style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:24px; min-height:360px; max-height:550px; overflow-y:auto; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                  <div>
                    <h3 id="slideTitle" style="font-size:1.25rem; color:#f1f5f9; font-weight:700; margin:0 0 4px 0;">
                      ${slide.title}
                    </h3>
                    ${slide.subtitle ? `<div style="font-size:0.88rem; color:#38bdf8; font-weight:600;">${slide.subtitle}</div>` : ''}
                  </div>
                  <span style="font-size:0.8rem; background:#0284c7; color:#fff; padding:3px 10px; border-radius:12px; font-weight:700;">
                    SLIDE #${slide.slideNum || (window.currentSlideIdx + 1)}
                  </span>
                </div>

                <div id="slideContentBody" style="font-size:0.96rem; line-height:1.8; color:#cbd5e1; margin-top:12px;">
                  ${Array.isArray(bulletsList) && bulletsList.length > 0 ? `
                    <ul style="padding-left:22px; margin:0;">
                      ${bulletsList.map(pt => `<li style="margin-bottom:10px;">${pt}</li>`).join('')}
                    </ul>
                  ` : `<div>${typeof bulletsList === 'string' ? bulletsList : '無詳細內文'}</div>`}
                </div>
              </div>

              ${notesStr ? `
                <div style="margin-top:18px; background:rgba(2,132,199,0.15); border-left:4px solid #0284c7; padding:12px 16px; border-radius:6px; font-size:0.88rem; color:#e0f2fe; line-height:1.6;">
                  <i class="fa-solid fa-lightbulb" style="color:#f59e0b; margin-right:6px;"></i> <strong>授課重點與備忘錄說明：</strong> ${notesStr}
                </div>
              ` : ''}
            </div>

            <!-- Slide Control Bar -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:18px; padding-top:12px; border-top:1px dashed #334155;">
              <button id="prevSlideBtn" onclick="window.navSlide(-1)" ${window.currentSlideIdx === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed; background:#334155; color:#94a3b8; border:none; padding:8px 18px; border-radius:6px;"' : 'style="background:#0284c7; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:700; cursor:pointer;"'}>
                <i class="fa-solid fa-chevron-left"></i> 上一頁 (Left)
              </button>

              <div style="font-size:0.85rem; color:#94a3b8;">
                <i class="fa-solid fa-keyboard"></i> 提示：可用鍵盤 ← / → 切換簡報
              </div>

              <button id="nextSlideBtn" onclick="window.navSlide(1)" ${window.currentSlideIdx === totalCount - 1 ? 'disabled style="opacity:0.4; cursor:not-allowed; background:#334155; color:#94a3b8; border:none; padding:8px 18px; border-radius:6px;"' : 'style="background:#0284c7; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:700; cursor:pointer;"'}>
                下一頁 (Right) <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        `;
      }

      window.jumpToSlide = function(idxStr) {
        const idx = parseInt(idxStr, 10);
        if (!isNaN(idx) && idx >= 0 && idx < totalCount) {
          window.currentSlideIdx = idx;
          modalBody.innerHTML = renderInteractiveSlideViewer();
        }
      };

      window.navSlide = function(dir) {
        window.currentSlideIdx += dir;
        if (window.currentSlideIdx < 0) window.currentSlideIdx = 0;
        if (window.currentSlideIdx >= totalCount) window.currentSlideIdx = totalCount - 1;
        modalBody.innerHTML = renderInteractiveSlideViewer();
      };

      window.toggleSlideFullscreen = function() {
        const container = document.getElementById('slideModalContainer');
        if (container) {
          if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => alert('無法開啟全螢幕模式: ' + err.message));
          } else {
            document.exitFullscreen();
          }
        }
      };

      contentHtml = renderInteractiveSlideViewer();
                } else if (modalType === 'kab_survey' || cardId === 'kab-survey' || modalType === 'survey') {
      function renderKabSurveyView() {
        const roster = (window.EIA_COURSE_DATA && window.EIA_COURSE_DATA.studentRoster) ? window.EIA_COURSE_DATA.studentRoster : [
          { id: '11301001', name: '陳冠宇', dept: '職業安全衛生系 3A' },
          { id: '11301002', name: '林雅婷', dept: '環境工程技術系 3B' },
          { id: '11301003', name: '黃家豪', dept: '公共衛生學系 4A' }
        ];

        let activeStudentId = localStorage.getItem('eia_kab_active_student_id') || roster[0].id;
        let studentObj = roster.find(s => s.id === activeStudentId) || roster[0];

        // Retrieve survey data for active student
        let studentRecordKey = 'eia_kab_record_' + studentObj.id;
        let studentRecord = JSON.parse(localStorage.getItem(studentRecordKey) || '{"pre":null, "post":null, "state":"unfilled_pre"}');

        const questions = [
          { id: 'q1', dim: 'K', dimName: '知識 (K)', title: '1. 對我國《環境影響評估法》體系與主管機關職掌之瞭解程度' },
          { id: 'q2', dim: 'K', dimName: '知識 (K)', title: '2. 對開發行為認定標準與範疇界定程序之掌握程度' },
          { id: 'q3', dim: 'K', dimName: '知識 (K)', title: '3. 對四大環境因子（物理、化學、生態、社經）評估技術之認識' },
          { id: 'q4', dim: 'A', dimName: '態度 (A)', title: '4. 認同環境影響評估在永續發展與風險預防之關鍵價值' },
          { id: 'q5', dim: 'A', dimName: '態度 (A)', title: '5. 願意在環評分析中保持嚴謹客觀之科學與法規精神' },
          { id: 'q6', dim: 'A', dimName: '態度 (A)', title: '6. 對於 AI 創新工具（如 AI 導讀/AERMOD）導入環評抱持積極學習態度' },
          { id: 'q7', dim: 'B', dimName: '行為 (B)', title: '7. 能主動查閱公開之環評說明書與環境監測公開數據' },
          { id: 'q8', dim: 'B', dimName: '行為 (B)', title: '8. 能運用生成式 AI 或分析工具輔助環評資料整理與報告編製' },
          { id: 'q9', dim: 'B', dimName: '行為 (B)', title: '9. 具備參與團隊討論、範疇界定演練與專案報告發表之實務能力' }
        ];

        let htmlContent = '';

        // Top Roster Selection & Excel Export Control Bar
        const topControlHeader = `
          <div style="background:#0b3c5d; color:#fff; padding:16px 20px; border-radius:10px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; box-shadow:0 4px 12px rgba(11,60,93,0.2);">
            <div>
              <h3 style="margin:0 0 4px 0; font-size:1.15rem;"><i class="fa-solid fa-clipboard-user"></i> KAB 課程學習成效評估問卷系統</h3>
              <p style="margin:0; font-size:0.85rem; color:#e0f2fe;">依學生名單填寫期初/期末自評問卷 ‧ 即時分析指標圖表與前後測成長對比 ‧ 支援 Excel 數據匯出</p>
            </div>
            
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <!-- Student Roster Selector -->
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:0.85rem; font-weight:700; color:#cbd5e1;">👤 選擇學生：</label>
                <select onchange="window.switchKabStudent(this.value)" style="background:#fff; color:#0f172a; border:2px solid #0284c7; padding:6px 12px; border-radius:8px; font-weight:700; font-size:0.88rem; cursor:pointer;">
                  ${roster.map(s => `
                    <option value="${s.id}" ${s.id === studentObj.id ? 'selected' : ''}>
                      ${s.name} (${s.id} - ${s.dept})
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Excel Export Button -->
              <button onclick="window.exportKabToExcel()" style="background:#10b981; color:#fff; border:none; padding:7px 14px; border-radius:8px; font-weight:800; font-size:0.85rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(16,185,129,0.3);">
                <i class="fa-solid fa-file-excel"></i> 匯出 EXCEL (CSV)
              </button>
            </div>
          </div>
        `;

        if (studentRecord.state === 'unfilled_pre') {
          htmlContent = `
            ${topControlHeader}

            <div style="background:#fffbeb; border:1px solid #fde68a; color:#b45309; padding:12px 16px; border-radius:8px; margin-bottom:16px; font-size:0.88rem; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>📌 當前選取學生：</strong> ${studentObj.name} (${studentObj.id} - ${studentObj.dept})
                <span style="background:#f59e0b; color:#fff; padding:2px 8px; border-radius:10px; font-weight:700; font-size:0.78rem; margin-left:8px;">階段 1/2：請填寫期初問卷</span>
              </div>
            </div>

            <form id="preTestForm" onsubmit="window.submitPreTestForm(event)" style="background:#f8fafc; border:1px solid #cbd5e1; padding:20px; border-radius:10px;">
              <div style="margin-bottom:16px; font-weight:700; color:#0b3c5d; border-bottom:2px solid #0284c7; padding-bottom:6px;">
                📝 1. 【期初 Pre-test 自評問卷】 (請依個人修課前認知評分 1 ~ 5 分)
              </div>
              ${questions.map(q => `
                <div style="background:#fff; border:1px solid #e2e8f0; padding:12px 16px; border-radius:8px; margin-bottom:12px;">
                  <div style="font-weight:700; color:#1e293b; font-size:0.92rem; margin-bottom:8px;">
                    <span style="background:${q.dim==='K'?'#e0f2fe':q.dim==='A'?'#fef3c7':'#d1fae5'}; color:${q.dim==='K'?'#0369a1':q.dim==='A'?'#b45309':'#047857'}; padding:2px 8px; border-radius:6px; font-size:0.78rem; margin-right:6px;">${q.dimName}</span>
                    ${q.title}
                  </div>
                  <div style="display:flex; gap:16px; font-size:0.88rem; color:#475569; flex-wrap:wrap;">
                    ${[1,2,3,4,5].map(v => `
                      <label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-weight:600;">
                        <input type="radio" name="${q.id}" value="${v}" required ${v===3?'checked':''}> ${v} 分
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
              
              <div style="text-align:right; margin-top:20px;">
                <button type="submit" style="background:#0284c7; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:800; font-size:0.95rem; cursor:pointer; box-shadow:0 4px 12px rgba(2,132,199,0.3);">
                  🚀 提交【期初 Pre-test】問卷並即時產生各提問分析結果 ➔
                </button>
              </div>
            </form>
          `;
        } else if (studentRecord.state === 'completed_pre') {
          const preData = studentRecord.pre;
          const kAvg = computeDimAvg(preData, ['q1','q2','q3']);
          const aAvg = computeDimAvg(preData, ['q4','q5','q6']);
          const bAvg = computeDimAvg(preData, ['q7','q8','q9']);

          htmlContent = `
            ${topControlHeader}

            <div style="background:#ecfdf5; border:1px solid #10b981; color:#065f46; padding:14px 18px; border-radius:10px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div>
                <strong style="font-size:1rem;"><i class="fa-solid fa-circle-check"></i> ${studentObj.name} 同學已完成【期初 Pre-test】問卷！</strong>
                <p style="margin:4px 0 0 0; font-size:0.85rem;">系統已即時運算該學生之期初學習基線與各提問指標分析圖表。期末時可開放填寫【期末 Post-test】並進行前後測成長對比。</p>
              </div>
              <button onclick="window.startPostTestForm()" style="background:#047857; color:#fff; border:none; padding:8px 18px; border-radius:8px; font-weight:800; font-size:0.88rem; cursor:pointer; box-shadow:0 2px 8px rgba(4,120,87,0.3);">
                📝 開放並填寫【期末 Post-test】問卷 ➔
              </button>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-bottom:20px;">
              <div style="background:#f0f9ff; border:1px solid #bae6fd; padding:16px; border-radius:10px; text-align:center;">
                <div style="font-size:0.85rem; color:#0369a1; font-weight:700;">🧠 知識 (Knowledge) 期初平均</div>
                <div style="font-size:1.8rem; font-weight:900; color:#0284c7; margin:6px 0;">${kAvg.toFixed(1)} <span style="font-size:1rem; color:#64748b;">/ 5.0</span></div>
                <div style="font-size:0.78rem; color:#0369a1;">基礎法規與環評架構認知</div>
              </div>
              <div style="background:#fffbeb; border:1px solid #fde68a; padding:16px; border-radius:10px; text-align:center;">
                <div style="font-size:0.85rem; color:#b45309; font-weight:700;">❤️ 態度 (Attitude) 期初平均</div>
                <div style="font-size:1.8rem; font-weight:900; color:#d97706; margin:6px 0;">${aAvg.toFixed(1)} <span style="font-size:1rem; color:#64748b;">/ 5.0</span></div>
                <div style="font-size:0.78rem; color:#b45309;">永續發展與科學精神認同</div>
              </div>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:16px; border-radius:10px; text-align:center;">
                <div style="font-size:0.85rem; color:#047857; font-weight:700;">🛠️ 行為 (Behavior) 期初平均</div>
                <div style="font-size:1.8rem; font-weight:900; color:#10b981; margin:6px 0;">${bAvg.toFixed(1)} <span style="font-size:1rem; color:#64748b;">/ 5.0</span></div>
                <div style="font-size:0.78rem; color:#047857;">AI 應用與環評案例實踐</div>
              </div>
            </div>

            <div style="background:#fff; border:1px solid #cbd5e1; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h4 style="font-size:1.05rem; color:#0b3c5d; font-weight:800; margin:0 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:8px;">
                📊 ${studentObj.name} 期初 Pre-test 各提問分項分析圖表
              </h4>
              ${questions.map(q => {
                const score = preData ? (preData[q.id] || 3) : 3;
                const pct = (score / 5) * 100;
                return `
                  <div style="margin-bottom:14px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.88rem; font-weight:700; color:#334155; margin-bottom:4px;">
                      <span>${q.title}</span>
                      <span style="color:#0284c7;">${score} 分 (${pct.toFixed(0)}%)</span>
                    </div>
                    <div style="background:#e2e8f0; height:12px; border-radius:6px; overflow:hidden;">
                      <div style="background:linear-gradient(90deg, #0284c7, #38bdf8); width:${pct}%; height:100%; border-radius:6px; transition:width 0.5s;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
              <button onclick="window.resetStudentKabRecord()" style="background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1; padding:6px 14px; border-radius:6px; font-size:0.82rem; cursor:pointer;">
                🔄 重置 ${studentObj.name} 的評估資料
              </button>
              <button onclick="window.startPostTestForm()" style="background:#0284c7; color:#fff; border:none; padding:8px 20px; border-radius:8px; font-weight:800; font-size:0.9rem; cursor:pointer;">
                進入【期末 Post-test】填寫 ➔
              </button>
            </div>
          `;
        } else if (studentRecord.state === 'filling_post') {
          htmlContent = `
            ${topControlHeader}

            <div style="background:#0b3c5d; color:#fff; padding:16px 20px; border-radius:10px; margin-bottom:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                  <h3 style="margin:0 0 4px 0; font-size:1.15rem;"><i class="fa-solid fa-graduation-cap"></i> 2. 【期末 Post-test 自評問卷】 (${studentObj.name})</h3>
                  <p style="margin:0; font-size:0.85rem; color:#e0f2fe;">請評估經歷 18 週學習後的最新成效。提交後系統將即時展現期末結果與前後測比較差別！</p>
                </div>
                <span style="background:#10b981; color:#fff; padding:4px 12px; border-radius:12px; font-weight:800; font-size:0.82rem;">階段 2/2：期末總結</span>
              </div>
            </div>

            <form id="postTestForm" onsubmit="window.submitPostTestForm(event)" style="background:#f8fafc; border:1px solid #cbd5e1; padding:20px; border-radius:10px;">
              <div style="margin-bottom:16px; font-weight:700; color:#0b3c5d; border-bottom:2px solid #10b981; padding-bottom:6px;">
                📝 期末學習量表 (請依學期結束後實際能力評分 1 ~ 5 分)
              </div>
              ${questions.map(q => `
                <div style="background:#fff; border:1px solid #e2e8f0; padding:12px 16px; border-radius:8px; margin-bottom:12px;">
                  <div style="font-weight:700; color:#1e293b; font-size:0.92rem; margin-bottom:8px;">
                    <span style="background:${q.dim==='K'?'#e0f2fe':q.dim==='A'?'#fef3c7':'#d1fae5'}; color:${q.dim==='K'?'#0369a1':q.dim==='A'?'#b45309':'#047857'}; padding:2px 8px; border-radius:6px; font-size:0.78rem; margin-right:6px;">${q.dimName}</span>
                    ${q.title}
                  </div>
                  <div style="display:flex; gap:16px; font-size:0.88rem; color:#475569; flex-wrap:wrap;">
                    ${[1,2,3,4,5].map(v => `
                      <label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-weight:600;">
                        <input type="radio" name="${q.id}" value="${v}" required ${v===5?'checked':''}> ${v} 分
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
              
              <div style="text-align:right; margin-top:20px;">
                <button type="submit" style="background:#10b981; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:800; font-size:0.95rem; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                  🚀 提交【期末 Post-test】問卷並檢視前後測差別與成長對比 ➔
                </button>
              </div>
            </form>
          `;
        } else if (studentRecord.state === 'completed_post') {
          const preData = studentRecord.pre;
          const postData = studentRecord.post;

          const kPre = computeDimAvg(preData, ['q1','q2','q3']);
          const aPre = computeDimAvg(preData, ['q4','q5','q6']);
          const bPre = computeDimAvg(preData, ['q7','q8','q9']);

          const kPost = computeDimAvg(postData, ['q1','q2','q3']);
          const aPost = computeDimAvg(postData, ['q4','q5','q6']);
          const bPost = computeDimAvg(postData, ['q7','q8','q9']);

          const kDiff = kPost - kPre;
          const aDiff = aPost - aPre;
          const bDiff = bPost - bPre;

          htmlContent = `
            ${topControlHeader}

            <div style="background:linear-gradient(135deg, #0b3c5d, #0284c7); color:#fff; padding:18px 20px; border-radius:10px; margin-bottom:18px; box-shadow:0 6px 16px rgba(11,60,93,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                  <h3 style="margin:0 0 4px 0; font-size:1.2rem;"><i class="fa-solid fa-chart-line"></i> ${studentObj.name} - 期初 vs 期末 KAB 學習成長差別與成效分析</h3>
                  <p style="margin:0; font-size:0.85rem; color:#e0f2fe;">已完成全學期前後測！以下呈現該生於期初與期末之各指標得分與顯著成長比對。</p>
                </div>
                <span style="background:#10b981; color:#fff; padding:4px 14px; border-radius:14px; font-weight:800; font-size:0.82rem;">前後測對比已完成</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-bottom:20px;">
              <div style="background:#fff; border:1px solid #bae6fd; padding:16px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="font-size:0.85rem; color:#0369a1; font-weight:700;">🧠 知識 (Knowledge) 成長</div>
                <div style="display:flex; align-items:baseline; gap:8px; margin:8px 0;">
                  <span style="font-size:1.1rem; color:#64748b; text-decoration:line-through;">${kPre.toFixed(1)}</span>
                  <span style="font-size:1.8rem; font-weight:900; color:#0284c7;">${kPost.toFixed(1)}</span>
                  <span style="background:#d1fae5; color:#047857; font-weight:800; font-size:0.85rem; padding:2px 8px; border-radius:10px;">+${kDiff > 0 ? kDiff.toFixed(1) : 0} (${((kDiff/kPre)*100).toFixed(0)}%)</span>
                </div>
                <div style="font-size:0.78rem; color:#64748b;">期初 ${kPre.toFixed(1)} ➔ 期末 ${kPost.toFixed(1)} 分</div>
              </div>

              <div style="background:#fff; border:1px solid #fde68a; padding:16px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="font-size:0.85rem; color:#b45309; font-weight:700;">❤️ 態度 (Attitude) 成長</div>
                <div style="display:flex; align-items:baseline; gap:8px; margin:8px 0;">
                  <span style="font-size:1.1rem; color:#64748b; text-decoration:line-through;">${aPre.toFixed(1)}</span>
                  <span style="font-size:1.8rem; font-weight:900; color:#d97706;">${aPost.toFixed(1)}</span>
                  <span style="background:#d1fae5; color:#047857; font-weight:800; font-size:0.85rem; padding:2px 8px; border-radius:10px;">+${aDiff > 0 ? aDiff.toFixed(1) : 0} (${((aDiff/aPre)*100).toFixed(0)}%)</span>
                </div>
                <div style="font-size:0.78rem; color:#64748b;">期初 ${aPre.toFixed(1)} ➔ 期末 ${aPost.toFixed(1)} 分</div>
              </div>

              <div style="background:#fff; border:1px solid #bbf7d0; padding:16px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="font-size:0.85rem; color:#047857; font-weight:700;">🛠️ 行為 (Behavior) 成長</div>
                <div style="display:flex; align-items:baseline; gap:8px; margin:8px 0;">
                  <span style="font-size:1.1rem; color:#64748b; text-decoration:line-through;">${bPre.toFixed(1)}</span>
                  <span style="font-size:1.8rem; font-weight:900; color:#10b981;">${bPost.toFixed(1)}</span>
                  <span style="background:#d1fae5; color:#047857; font-weight:800; font-size:0.85rem; padding:2px 8px; border-radius:10px;">+${bDiff > 0 ? bDiff.toFixed(1) : 0} (${((bDiff/bPre)*100).toFixed(0)}%)</span>
                </div>
                <div style="font-size:0.78rem; color:#64748b;">期初 ${bPre.toFixed(1)} ➔ 期末 ${bPost.toFixed(1)} 分</div>
              </div>
            </div>

            <div style="background:#fff; border:1px solid #cbd5e1; padding:20px; border-radius:10px; margin-bottom:20px;">
              <h4 style="font-size:1.05rem; color:#0b3c5d; font-weight:800; margin:0 0 16px 0; border-bottom:2px solid #0284c7; padding-bottom:8px;">
                📊 ${studentObj.name} 各提問 (Q1~Q9) 期初 vs 期末差別指標分析與成長對比
              </h4>
              ${questions.map(q => {
                const preVal = preData ? (preData[q.id] || 3) : 3;
                const postVal = postData ? (postData[q.id] || 5) : 5;
                const diffVal = postVal - preVal;
                const prePct = (preVal / 5) * 100;
                const postPct = (postVal / 5) * 100;

                return `
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:14px 16px; border-radius:8px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                      <span style="font-weight:700; color:#1e293b; font-size:0.9rem;">
                        <span style="background:${q.dim==='K'?'#e0f2fe':q.dim==='A'?'#fef3c7':'#d1fae5'}; color:${q.dim==='K'?'#0369a1':q.dim==='A'?'#b45309':'#047857'}; padding:2px 8px; border-radius:6px; font-size:0.78rem; margin-right:6px;">${q.dimName}</span>
                        ${q.title}
                      </span>
                      <div style="font-size:0.85rem; font-weight:800;">
                        期初: <span style="color:#64748b;">${preVal}分</span> ➔ 期末: <span style="color:#10b981;">${postVal}分</span>
                        <span style="background:${diffVal>=0?'#d1fae5':'#fee2e2'}; color:${diffVal>=0?'#047857':'#b91c1c'}; padding:2px 8px; border-radius:10px; font-size:0.8rem; margin-left:6px;">
                          ${diffVal>=0?'+':''}${diffVal} 分
                        </span>
                      </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:6px;">
                      <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:0.75rem; font-weight:700; color:#64748b; width:45px;">期初</span>
                        <div style="flex:1; background:#e2e8f0; height:10px; border-radius:5px; overflow:hidden;">
                          <div style="background:#94a3b8; width:${prePct}%; height:100%;"></div>
                        </div>
                      </div>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:0.75rem; font-weight:700; color:#047857; width:45px;">期末</span>
                        <div style="flex:1; background:#e2e8f0; height:10px; border-radius:5px; overflow:hidden;">
                          <div style="background:linear-gradient(90deg, #10b981, #059669); width:${postPct}%; height:100%;"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="text-align:center;">
              <button onclick="window.resetStudentKabRecord()" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:8px 20px; border-radius:8px; font-size:0.88rem; cursor:pointer; font-weight:700;">
                🔄 重置 ${studentObj.name} 的全學期問卷資料
              </button>
            </div>
          `;
        }

        return `
          <div id="kabSurveyModalContainer" style="padding:10px;">
            ${htmlContent}
          </div>
        `;
      }

      // Switch Active Student Helper
      window.switchKabStudent = function(studentId) {
        localStorage.setItem('eia_kab_active_student_id', studentId);
        modalBody.innerHTML = renderKabSurveyView();
      };

      // Submit Pre-Test for Active Student
      window.submitPreTestForm = function(e) {
        e.preventDefault();
        const roster = (window.EIA_COURSE_DATA && window.EIA_COURSE_DATA.studentRoster) ? window.EIA_COURSE_DATA.studentRoster : [];
        let activeStudentId = localStorage.getItem('eia_kab_active_student_id') || (roster[0] ? roster[0].id : '11301001');

        const form = document.getElementById('preTestForm');
        const formData = new FormData(form);
        const data = {};
        for (let [k, v] of formData.entries()) {
          data[k] = parseInt(v, 10);
        }

        let studentRecordKey = 'eia_kab_record_' + activeStudentId;
        let studentRecord = JSON.parse(localStorage.getItem(studentRecordKey) || '{"pre":null, "post":null, "state":"unfilled_pre"}');
        studentRecord.pre = data;
        studentRecord.state = 'completed_pre';

        localStorage.setItem(studentRecordKey, JSON.stringify(studentRecord));
        modalBody.innerHTML = renderKabSurveyView();
      };

      // Unlock & Start Post-Test Form
      window.startPostTestForm = function() {
        const roster = (window.EIA_COURSE_DATA && window.EIA_COURSE_DATA.studentRoster) ? window.EIA_COURSE_DATA.studentRoster : [];
        let activeStudentId = localStorage.getItem('eia_kab_active_student_id') || (roster[0] ? roster[0].id : '11301001');
        let studentRecordKey = 'eia_kab_record_' + activeStudentId;
        let studentRecord = JSON.parse(localStorage.getItem(studentRecordKey) || '{}');
        studentRecord.state = 'filling_post';
        localStorage.setItem(studentRecordKey, JSON.stringify(studentRecord));
        modalBody.innerHTML = renderKabSurveyView();
      };

      // Submit Post-Test for Active Student
      window.submitPostTestForm = function(e) {
        e.preventDefault();
        const roster = (window.EIA_COURSE_DATA && window.EIA_COURSE_DATA.studentRoster) ? window.EIA_COURSE_DATA.studentRoster : [];
        let activeStudentId = localStorage.getItem('eia_kab_active_student_id') || (roster[0] ? roster[0].id : '11301001');

        const form = document.getElementById('postTestForm');
        const formData = new FormData(form);
        const data = {};
        for (let [k, v] of formData.entries()) {
          data[k] = parseInt(v, 10);
        }

        let studentRecordKey = 'eia_kab_record_' + activeStudentId;
        let studentRecord = JSON.parse(localStorage.getItem(studentRecordKey) || '{}');
        studentRecord.post = data;
        studentRecord.state = 'completed_post';

        localStorage.setItem(studentRecordKey, JSON.stringify(studentRecord));
        modalBody.innerHTML = renderKabSurveyView();
      };

      // Reset record for single student
      window.resetStudentKabRecord = function() {
        const roster = (window.EIA_COURSE_DATA && window.EIA_COURSE_DATA.studentRoster) ? window.EIA_COURSE_DATA.studentRoster : [];
        let activeStudentId = localStorage.getItem('eia_kab_active_student_id') || (roster[0] ? roster[0].id : '11301001');
        let studentRecordKey = 'eia_kab_record_' + activeStudentId;
        localStorage.removeItem(studentRecordKey);
        modalBody.innerHTML = renderKabSurveyView();
      };

      // Export All Survey Results to Excel (CSV with UTF-8 BOM)
      window.exportKabToExcel = function() {
        const roster = (window.EIA_COURSE_DATA && window.EIA_COURSE_DATA.studentRoster) ? window.EIA_COURSE_DATA.studentRoster : [];
        
        let csvRows = [];
        // Header
        csvRows.push(['學號', '姓名', '科系班級', '期初狀態', '期初_K知識均分', '期初_A態度均分', '期初_B行為均分', '期初_Q1', '期初_Q2', '期初_Q3', '期初_Q4', '期初_Q5', '期初_Q6', '期初_Q7', '期初_Q8', '期初_Q9', '期末狀態', '期末_K知識均分', '期末_A態度均分', '期末_B行為均分', '期末_Q1', '期末_Q2', '期末_Q3', '期末_Q4', '期末_Q5', '期末_Q6', '期末_Q7', '期末_Q8', '期末_Q9', 'K成長差異', 'A成長差異', 'B成長差異'].join(','));

        roster.forEach(student => {
          let recKey = 'eia_kab_record_' + student.id;
          let rec = JSON.parse(localStorage.getItem(recKey) || '{"pre":null, "post":null, "state":"未填寫"}');

          let pre = rec.pre || {};
          let post = rec.post || {};

          let preK = pre.q1 ? ((pre.q1 + pre.q2 + pre.q3) / 3).toFixed(2) : '未填寫';
          let preA = pre.q4 ? ((pre.q4 + pre.q5 + pre.q6) / 3).toFixed(2) : '未填寫';
          let preB = pre.q7 ? ((pre.q7 + pre.q8 + pre.q9) / 3).toFixed(2) : '未填寫';

          let postK = post.q1 ? ((post.q1 + post.q2 + post.q3) / 3).toFixed(2) : '未填寫';
          let postA = post.q4 ? ((post.q4 + post.q5 + post.q6) / 3).toFixed(2) : '未填寫';
          let postB = post.q7 ? ((post.q7 + post.q8 + post.q9) / 3).toFixed(2) : '未填寫';

          let diffK = (post.q1 && pre.q1) ? (parseFloat(postK) - parseFloat(preK)).toFixed(2) : 'N/A';
          let diffA = (post.q4 && pre.q4) ? (parseFloat(postA) - parseFloat(preA)).toFixed(2) : 'N/A';
          let diffB = (post.q7 && pre.q7) ? (parseFloat(postB) - parseFloat(preB)).toFixed(2) : 'N/A';

          let row = [
            `"${student.id}"`,
            `"${student.name}"`,
            `"${student.dept}"`,
            `"${rec.pre ? '已完成' : '未填寫'}"`,
            preK, preA, preB,
            pre.q1||'', pre.q2||'', pre.q3||'', pre.q4||'', pre.q5||'', pre.q6||'', pre.q7||'', pre.q8||'', pre.q9||'',
            `"${rec.post ? '已完成' : '未填寫'}"`,
            postK, postA, postB,
            post.q1||'', post.q2||'', post.q3||'', post.q4||'', post.q5||'', post.q6||'', post.q7||'', post.q8||'', post.q9||'',
            diffK, diffA, diffB
          ];
          csvRows.push(row.join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `輔英EIA_KAB學習問卷結果匯出_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      function computeDimAvg(dataObj, qKeys) {
        if (!dataObj) return 3.0;
        let sum = 0;
        qKeys.forEach(k => { sum += (dataObj[k] || 3); });
        return sum / qKeys.length;
      }

      contentHtml = renderKabSurveyView();
    }
    else if (modalType === 'case') {
      contentHtml = `
        <div style="padding:10px;">
          <div style="background:#fff7ed; border-left:4px solid #f97316; padding:16px; border-radius:8px; margin-bottom:16px;">
            <h3 style="margin:0 0 6px 0; color:#c2410c; font-size:1.15rem;"><i class="fa-solid fa-triangle-exclamation"></i> 環評重大爭議與標竿案例分析個案</h3>
            <p style="margin:0; font-size:0.9rem; color:#7c2d12;">本案例探討開發行為於水質保護區、敏感地質帶或居民權益交會處之衝突處置與環評審查歷程。</p>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px; font-size:0.92rem; line-height:1.7; color:#334155;">
            <h4 style="font-size:1rem; color:#0b3c5d; margin:0 0 8px 0; font-weight:800;">🔍 案例核心爭點與分析步驟：</h4>
            <ol style="padding-left:20px; margin:0 0 12px 0;">
              <li style="margin-bottom:6px;"><strong>基線調查範疇界定：</strong> 盤點歷史生態與環境監測數據之完整性與可靠度。</li>
              <li style="margin-bottom:6px;"><strong>衝擊定量化評估：</strong> 運用氣候、水利與空氣擴散數值模式計算開發前後增量影響。</li>
              <li style="margin-bottom:6px;"><strong>減輕對策 (EMP) 承諾：</strong> 提出可量測、可追蹤之工程預防措施與生態補償機制。</li>
            </ol>
            <div style="background:#e0f2fe; color:#0369a1; padding:10px 14px; border-radius:6px; font-size:0.85rem; font-weight:700;">
              💡 課堂應用：請組員根據 eclass 個案評析指引，進行範疇界定矩陣實作與組間質詢對抗。
            </div>
          </div>
        </div>
      `;
    } else if (modalType === 'lab') {
      contentHtml = `
        <div style="padding:10px;">
          <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:16px; border-radius:8px; margin-bottom:16px;">
            <h3 style="margin:0 0 6px 0; color:#047857; font-size:1.15rem;"><i class="fa-solid fa-flask"></i> 環境模擬實驗與軟體電腦實作全紀錄</h3>
            <p style="margin:0; font-size:0.9rem; color:#065f46;">本單元包含大氣高斯擴散模式、水質 RPI 模式與污染傳播模擬之實驗數據處理與實機操作。</p>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px; font-size:0.92rem; line-height:1.7; color:#334155;">
            <h4 style="font-size:1rem; color:#0b3c5d; margin:0 0 8px 0; font-weight:800;">⚙️ 實驗與軟體操作要點：</h4>
            <ul style="padding-left:20px; margin:0 0 12px 0;">
              <li style="margin-bottom:6px;"><strong>輸入參數校正：</strong> 氣象背景資料 (Wind Rose)、排放源高與煙氣上升量 (Plume Rise)。</li>
              <li style="margin-bottom:6px;"><strong>網格計算與等濃線劃設：</strong> 模擬最大地面濃度著地距離與敏感點濃度影響。</li>
              <li style="margin-bottom:6px;"><strong>數據品質保證 (QA/QC)：</strong> 實測值與模式模擬值之比對校正與誤差分析。</li>
            </ul>
            <div style="background:#ecfdf5; color:#047857; padding:10px 14px; border-radius:6px; font-size:0.85rem; font-weight:700;">
              🛠️ 軟體環境：AERMOD / ISCST3 / River Water Quality Model 模擬軟體已配置於 C527 電腦教室。
            </div>
          </div>
        </div>
      `;
    } else if (modalType === 'tutorial') {
      contentHtml = `
        <div style="padding:10px;">
          <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:16px; border-radius:8px; margin-bottom:16px;">
            <h3 style="margin:0 0 6px 0; color:#1d4ed8; font-size:1.15rem;"><i class="fa-solid fa-laptop-code"></i> 環評技術演練與實務手把手教學</h3>
            <p style="margin:0; font-size:0.9rem; color:#1e40af;">提供高科技園區、開發案空氣品質與水質影響評估之完整實作步驟指南與數據庫說明。</p>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px; font-size:0.92rem; line-height:1.7; color:#334155;">
            <h4 style="font-size:1rem; color:#0b3c5d; margin:0 0 8px 0; font-weight:800;">📋 實作練習指引：</h4>
            <ol style="padding-left:20px; margin:0 0 12px 0;">
              <li style="margin-bottom:6px;">登入 eclass 課程專區下載範例數據套件與座標格式檔案。</li>
              <li style="margin-bottom:6px;">依據《開發行為環境影響評估作業準則》規定進行範疇篩選與推估。</li>
              <li style="margin-bottom:6px;">撰寫 2 頁精簡專案報告並上傳至課程系統進行同儕互評。</li>
            </ol>
          </div>
        </div>
      `;
    } else if (modalType === 'live_review') {
      contentHtml = `
        <div style="padding:10px;">
          <div style="background:#fef2f2; border-left:4px solid #ef4444; padding:16px; border-radius:8px; margin-bottom:16px;">
            <h3 style="margin:0 0 6px 0; color:#b91c1c; font-size:1.15rem;"><i class="fa-solid fa-users-rectangle"></i> 現場模擬環評審查大會攻防實錄</h3>
            <p style="margin:0; font-size:0.9rem; color:#991b1b;">模擬環境部環評審查委員會議，包含開發單位簡報、委員質詢、公民團體發言與審查結論決議。</p>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px; font-size:0.92rem; line-height:1.7; color:#334155;">
            <h4 style="font-size:1rem; color:#0b3c5d; margin:0 0 8px 0; font-weight:800;">🏛️ 模擬會議角色與審查流程：</h4>
            <ul style="padding-left:20px; margin:0 0 12px 0;">
              <li style="margin-bottom:6px;"><strong>開發單位：</strong> 15 分鐘簡報開發計畫內容與環境保護對策 (EMP)。</li>
              <li style="margin-bottom:6px;"><strong>環評委員與專家：</strong> 提出針對健康風險、大氣與地下水衝擊之專業質詢。</li>
              <li style="margin-bottom:6px;"><strong>審查結論決議：</strong> 閉門會議評定（通過 / 補正再審 / 進入二階環評 / 不應開發）。</li>
            </ul>
          </div>
        </div>
      `;
    } else if (modalType === 'instructor_profile' || cardId === 'w01-c0') {
      const prof = window.EIA_COURSE_DATA.instructorProfile;
      contentHtml = `
        <div class="instructor-profile-card">
          <div class="instructor-header-row">
            <div class="instructor-avatar"><i class="fa-solid fa-user-graduate"></i></div>
            <div class="instructor-name-box">
              <h3>${prof.name} <span style="font-size:0.95rem; font-weight:500;">(${prof.nameEn})</span></h3>
              <p>${prof.title}</p>
              <p><i class="fa-solid fa-envelope"></i> E-mail: ${prof.email}</p>
            </div>
          </div>
          <div style="font-size:0.85rem; background:rgba(255,255,255,0.15); padding:8px 12px; border-radius:6px; color:#e0f2fe; line-height:1.4;">
            <i class="fa-solid fa-quote-left" style="margin-right:6px;"></i> ${prof.motto}
          </div>
        </div>

        <div style="font-size: 0.925rem; line-height: 1.7; color: #334155;">
          <h4 style="font-size:1.05rem; font-weight:800; color:#0b3c5d; margin:16px 0 8px 0; border-bottom:2px solid #e2e8f0; padding-bottom:4px;">
            <i class="fa-solid fa-graduation-cap" style="color:#0284c7;"></i> 🎓 學歷 (Education)
          </h4>
          <ul style="list-style:none; padding-left:0;">
            ${prof.education.map(e => `<li style="margin-bottom:6px; padding-left:18px; position:relative;"><span style="position:absolute; left:0; color:#0284c7;">•</span> ${e}</li>`).join('')}
          </ul>

          <h4 style="font-size:1.05rem; font-weight:800; color:#0b3c5d; margin:16px 0 8px 0; border-bottom:2px solid #e2e8f0; padding-bottom:4px;">
            <i class="fa-solid fa-briefcase" style="color:#0284c7;"></i> 💼 經歷 (Experience 1991-2026)
          </h4>
          <ul style="list-style:none; padding-left:0;">
            ${prof.experience.map(exp => `<li style="margin-bottom:6px; padding-left:18px; position:relative;"><span style="position:absolute; left:0; color:#0284c7;">•</span> ${exp}</li>`).join('')}
          </ul>

          <h4 style="font-size:1.05rem; font-weight:800; color:#0b3c5d; margin:16px 0 8px 0; border-bottom:2px solid #e2e8f0; padding-bottom:4px;">
            <i class="fa-solid fa-trophy" style="color:#f59e0b;"></i> 🏆 榮譽與獎項 (Honors & Awards)
          </h4>
          <ul style="list-style:none; padding-left:0;">
            ${prof.honors.map(h => `<li style="margin-bottom:6px; padding-left:18px; position:relative;"><span style="position:absolute; left:0; color:#f59e0b;">•</span> ${h}</li>`).join('')}
          </ul>

          <h4 style="font-size:1.05rem; font-weight:800; color:#0b3c5d; margin:16px 0 8px 0; border-bottom:2px solid #e2e8f0; padding-bottom:4px;">
            <i class="fa-solid fa-award" style="color:#059669;"></i> 📜 專業證照 (Professional Certifications)
          </h4>
          <ul style="list-style:none; padding-left:0;">
            ${prof.certifications.map(c => `<li style="margin-bottom:6px; padding-left:18px; position:relative;"><span style="position:absolute; left:0; color:#059669;">•</span> ${c}</li>`).join('')}
          </ul>
        </div>
      `;
        } 
    else if (modalType === 'w03_guide' || cardId === 'w03-c1' || modalType === 'w03_lecture') {
      contentHtml = `
        <!-- W03 Voice Guide Header & Player -->
        <div style="background: linear-gradient(135deg, #064e3b 0%, #0d9488 50%, #0284c7 100%); color:#fff; padding:20px; border-radius:12px; margin-bottom:20px; box-shadow:0 6px 18px rgba(13,148,136,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="background:rgba(255,255,255,0.2); color:#fff; padding:3px 10px; border-radius:12px; font-size:0.8rem; font-weight:700;">
                <i class="fa-solid fa-volume-high"></i> W03 專屬 AI 語音導讀播放器
              </span>
              <h2 style="font-size:1.35rem; margin:8px 0 4px 0; color:#fff; font-weight:800;">
                <i class="fa-solid fa-wind"></i> W03 大氣擴散與氣象背景數據理論（2小時PPT上課講義）
              </h2>
              <p style="font-size:0.92rem; color:#ccfbf1; font-weight:700; margin:4px 0 0 0;">
                深入解析：氣象觀測站數據特徵、風玫瑰圖 (Wind Rose) 與 Pasquill 大氣穩定度 (A~F級) 劃分理論
              </p>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <button onclick="window.w03PlayVoice()" class="btn-primary" style="background:#f59e0b; border:none; color:#fff; padding:8px 16px; border-radius:20px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 4px 10px rgba(0,0,0,0.15);">
                <i class="fa-solid fa-circle-play"></i> 播放導讀
              </button>
              <button onclick="window.w03PauseVoice()" class="btn-secondary" style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4); color:#fff; padding:8px 14px; border-radius:20px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-pause"></i> 暫停
              </button>
              <button onclick="window.w03StopVoice()" class="btn-secondary" style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4); color:#fff; padding:8px 14px; border-radius:20px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-stop"></i> 停止
              </button>
            </div>
          </div>
          <div style="margin-top:12px; font-size:0.85rem; color:#e0f2fe; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-headphones"></i> <span id="w03_speech_status">語音播放器準備就緒 (點擊「播放導讀」開始)</span>
          </div>
        </div>

        <!-- Section Navigation Tabs -->
        <div style="display:flex; gap:8px; margin-bottom:18px; border-bottom:2px solid #e2e8f0; padding-bottom:8px; overflow-x:auto;">
          <button id="w03-tab-ppt" onclick="window.switchW03Tab('ppt')" class="w03-tab-btn active" style="padding:8px 16px; border:none; background:#0d9488; color:#fff; border-radius:8px; font-weight:700; cursor:pointer;">
            <i class="fa-solid fa-file-powerpoint"></i> 2小時 PPT 投影片播放器
          </button>
          <button id="w03-tab-h1" onclick="window.switchW03Tab('h1')" class="w03-tab-btn" style="padding:8px 16px; border:none; background:#f1f5f9; color:#334155; border-radius:8px; font-weight:700; cursor:pointer;">
            <i class="fa-solid fa-compass"></i> 第1小時：氣象數據與風玫瑰圖
          </button>
          <button id="w03-tab-h2" onclick="window.switchW03Tab('h2')" class="w03-tab-btn" style="padding:8px 16px; border:none; background:#f1f5f9; color:#334155; border-radius:8px; font-weight:700; cursor:pointer;">
            <i class="fa-solid fa-chart-area"></i> 第2小時：Pasquill 穩定度與高斯模式
          </button>
          <button id="w03-tab-quiz" onclick="window.switchW03Tab('quiz')" class="w03-tab-btn" style="padding:8px 16px; border:none; background:#f1f5f9; color:#334155; border-radius:8px; font-weight:700; cursor:pointer;">
            <i class="fa-solid fa-circle-question"></i> 觀念測驗
          </button>
        </div>

        <!-- TAB CONTENT 1: PPT Slide Deck Viewer -->
        <div id="w03-content-ppt" class="w03-tab-pane" style="display:block;">
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:#1e293b; color:#fff; padding:12px 18px; border-radius:8px;">
              <div>
                <span id="w03-slide-idx-badge" style="background:#0d9488; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.85rem;">Slide 1 / 10</span>
                <span style="margin-left:10px; font-weight:700; font-size:0.95rem; color:#94a3b8;">W03 大氣擴散與氣象背景數據理論 (2小時簡報)</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button onclick="window.w03PrevSlide()" style="background:#334155; border:none; color:#fff; padding:6px 14px; border-radius:6px; font-weight:700; cursor:pointer;">
                  <i class="fa-solid fa-arrow-left"></i> 上一張
                </button>
                <button onclick="window.w03NextSlide()" style="background:#0d9488; border:none; color:#fff; padding:6px 14px; border-radius:6px; font-weight:700; cursor:pointer;">
                  下一張 <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>

            <!-- Slide Body Display -->
            <div id="w03-slide-container" style="background:#fff; border:2px solid #e2e8f0; border-radius:10px; min-height:360px; padding:25px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.02);">
              <!-- Rendered via JS -->
            </div>

            <!-- Speaker Notes -->
            <div style="margin-top:15px; background:#fef3c7; border-left:4px solid #f59e0b; padding:12px 16px; border-radius:0 8px 8px 0; font-size:0.9rem; color:#92400e;">
              <strong><i class="fa-solid fa-chalkboard-user"></i> 授課教師講稿 (Speaker Notes)：</strong>
              <span id="w03-speaker-notes">請切換投影片查看對應講稿說明。</span>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT 2: Hour 1 Weather Station & Wind Rose -->
        <div id="w03-content-h1" class="w03-tab-pane" style="display:none;">
          <div style="background:#fff; border:1px solid #cbd5e1; border-radius:12px; padding:20px;">
            <h3 style="color:#0f766e; font-size:1.2rem; border-bottom:2px solid #ccfbf1; padding-bottom:8px; margin-top:0;">
              <i class="fa-solid fa-compass"></i> 第 1 小時：氣象觀測站數據特徵擷取與風玫瑰圖 (Wind Rose) 繪製解析
            </h3>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:15px;">
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:8px;">
                <h4 style="margin:0 0 8px 0; color:#166534;"><i class="fa-solid fa-tower-observation"></i> 1.1 氣象觀測站數據特徵 (Meteorological Data)</h4>
                <ul style="margin:0; padding-left:20px; font-size:0.9rem; color:#15803d; line-height:1.6;">
                  <li><strong>風速 ($u$, m/s)</strong>：影響污染物稀釋能力，風速愈大稀釋效應愈顯著。</li>
                  <li><strong>風向 ($\theta$, 角度/方位)</strong>：決定污染煙羽 (Plume) 漂移傳輸下風向區域。</li>
                  <li><strong>氣溫 ($T$, °C) 與大氣壓 ($P$, hPa)</strong>：影響大氣密度與熱力上升氣流。</li>
                  <li><strong>日照時數與輻射量 ($W/m^2$)</strong>：決定白天大氣熱力不穩定度。</li>
                  <li><strong>混合層高度 ($h_m$, m)</strong>：污染物在大氣垂直方向可擴散之上限容量。</li>
                </ul>
              </div>

              <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:15px; border-radius:8px;">
                <h4 style="margin:0 0 8px 0; color:#1e40af;"><i class="fa-solid fa-fan"></i> 1.2 風玫瑰圖 (Wind Rose Diagram) 理論</h4>
                <ul style="margin:0; padding-left:20px; font-size:0.9rem; color:#1d4ed8; line-height:1.6;">
                  <li><strong>16 方位風向頻率</strong>：將 360° 劃分為 N, NNE, NE, ENE... 等 16 方位扇區。</li>
                  <li><strong>風速級距分類 (Wind Speed Bands)</strong>：
                    <ul>
                      <li>靜風 (Calm): $u < 0.5 \text{ m/s}$</li>
                      <li>微風: $0.5 \le u < 2.1 \text{ m/s}$</li>
                      <li>和風: $2.1 \le u < 3.6 \text{ m/s}$</li>
                      <li>清風: $3.6 \le u < 5.7 \text{ m/s}$</li>
                      <li>強風: $u \ge 5.7 \text{ m/s}$</li>
                    </ul>
                  </li>
                  <li><strong>主導風向 (Prevailing Wind)</strong>：出現頻率最高之風向，為環評空品受體 (Sensitive Receivers) 評估首要重點。</li>
                </ul>
              </div>
            </div>

            <!-- Wind Rose Interactive Graphic representation -->
            <div style="margin-top:20px; background:#f8fafc; border:1px dashed #0d9488; padding:16px; border-radius:10px; text-align:center;">
              <h4 style="margin:0 0 10px 0; color:#0f766e;"><i class="fa-solid fa-chart-pie"></i> 風玫瑰圖 (Wind Rose) 示意圖與環評監測點位布設</h4>
              <div style="display:flex; justify-content:space-around; align-items:center; flex-wrap:wrap; gap:15px;">
                <div style="width:200px; height:200px; border-radius:50%; border:4px dashed #0d9488; display:flex; justify-content:center; align-items:center; position:relative; background:#ffffff;">
                  <span style="position:absolute; top:8px; font-weight:800; color:#0f766e;">N (北)</span>
                  <span style="position:absolute; bottom:8px; font-weight:800; color:#0f766e;">S (南)</span>
                  <span style="position:absolute; right:8px; font-weight:800; color:#0f766e;">E (東)</span>
                  <span style="position:absolute; left:8px; font-weight:800; color:#0f766e;">W (西)</span>
                  <div style="width:120px; height:120px; background:rgba(13,148,136,0.25); clip-path: polygon(50% 50%, 90% 10%, 100% 50%, 70% 80%); border-radius:50%;"></div>
                  <span style="font-size:0.75rem; font-weight:700; color:#0f766e; background:rgba(255,255,255,0.9); padding:2px 4px; border-radius:4px;">主導風向：NE 季風</span>
                </div>
                <div style="max-width:400px; text-align:left; font-size:0.88rem; color:#334155; line-height:1.6;">
                  <p><strong><i class="fa-solid fa-circle-info"></i> 環評空品監測佈點要領：</strong></p>
                  <ol style="margin:0; padding-left:20px;">
                    <li><strong>上風向背景點 (Upwind Control Point)</strong>：設定於主導風向之地向上風處，代表未受開發案影響之基線品質。</li>
                    <li><strong>下風向最大濃度點 (Downwind Peak Impact Point)</strong>：依據風玫瑰圖出現頻率最高之風向，配合高斯模式計算最大落地濃度距離。</li>
                    <li><strong>敏感受體點 (Sensitive Receptor Points)</strong>：下風處之學校、醫院與居民區。</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT 3: Hour 2 Pasquill Stability & Gaussian Model -->
        <div id="w03-content-h2" class="w03-tab-pane" style="display:none;">
          <div style="background:#fff; border:1px solid #cbd5e1; border-radius:12px; padding:20px;">
            <h3 style="color:#1e40af; font-size:1.2rem; border-bottom:2px solid #dbeafe; padding-bottom:8px; margin-top:0;">
              <i class="fa-solid fa-chart-area"></i> 第 2 小時：Pasquill 大氣穩定度 (A~F級) 劃分準則與大氣擴散理論
            </h3>

            <!-- Pasquill Matrix Table -->
            <h4 style="color:#1e3a8a; margin:15px 0 8px 0;"><i class="fa-solid fa-table"></i> Pasquill-Gifford 大氣穩定度劃分對照表 (Atmospheric Stability Matrix)</h4>
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
                <thead>
                  <tr style="background:#1e3a8a; color:#fff;">
                    <th style="padding:8px; border:1px solid #cbd5e1;" rowspan="2">地面風速 $u$ (m/s)</th>
                    <th style="padding:8px; border:1px solid #cbd5e1;" colspan="3">白天太陽輻射強度 (Daytime Solar Radiation)</th>
                    <th style="padding:8px; border:1px solid #cbd5e1;" colspan="2">夜間雲量 (Nighttime Cloud Cover)</th>
                  </tr>
                  <tr style="background:#3b82f6; color:#fff;">
                    <th style="padding:6px; border:1px solid #cbd5e1;">強 (Strong)</th>
                    <th style="padding:6px; border:1px solid #cbd5e1;">中 (Moderate)</th>
                    <th style="padding:6px; border:1px solid #cbd5e1;">弱 (Slight)</th>
                    <th style="padding:6px; border:1px solid #cbd5e1;">雲量 $\ge 4/8$</th>
                    <th style="padding:6px; border:1px solid #cbd5e1;">雲量 $\le 3/8$</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background:#fef2f2;">
                    <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700;">$< 2$</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700; color:#dc2626;">A (極不穩定)</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#ea580c;">A - B</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#d97706;">B</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#475569;">E (輕度穩定)</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700; color:#1e293b;">F (極度穩定)</td>
                  </tr>
                  <tr style="background:#fff7ed;">
                    <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700;">$2 - 3$</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#ea580c;">A - B</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#d97706;">B</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#ca8a04;">C</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#475569;">E</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#1e293b;">F</td>
                  </tr>
                  <tr style="background:#fefce8;">
                    <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700;">$3 - 5$</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#d97706;">B</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#ca8a04;">B - C</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#ca8a04;">C</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">D (中性)</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#475569;">E</td>
                  </tr>
                  <tr style="background:#f0fdf4;">
                    <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700;">$5 - 6$</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#ca8a04;">C</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">C - D</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">D</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">D</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">D</td>
                  </tr>
                  <tr style="background:#f0f9ff;">
                    <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700;">$> 6$</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">C</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">D</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">D</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">D</td>
                    <td style="padding:8px; border:1px solid #cbd5e1; color:#0284c7;">D</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Gaussian Model Formula -->
            <div style="margin-top:20px; background:#1e293b; color:#fff; padding:18px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.15);">
              <h4 style="margin:0 0 10px 0; color:#38bdf8;"><i class="fa-solid fa-square-root-variable"></i> 高斯煙羽擴散基本方程式 (Gaussian Plume Equation)</h4>
              <div style="background:#0f172a; padding:14px; border-radius:8px; text-align:center; font-family:'Courier New', monospace; font-size:1.05rem; color:#f1f5f9; overflow-x:auto;">
                $$C(x,y,z) = \frac{Q}{2\pi u \sigma_y \sigma_z} \exp\left(-\frac{y^2}{2\sigma_y^2}\right) \left[ \exp\left(-\frac{(z-H)^2}{2\sigma_z^2}\right) + \exp\left(-\frac{(z+H)^2}{2\sigma_z^2}\right) \right]$$
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; font-size:0.85rem; color:#cbd5e1;">
                <div>
                  <p style="margin:2px 0;">• <strong>$C(x,y,z)$</strong>: 下風向座標 $(x,y,z)$ 之大氣污染物濃度 ($\mu g/m^3$)</p>
                  <p style="margin:2px 0;">• <strong>$Q$</strong>: 煙Chimney排放速率 ($g/s$)</p>
                  <p style="margin:2px 0;">• <strong>$u$</strong>: 煙囪頂端平均風速 ($m/s$)</p>
                </div>
                <div>
                  <p style="margin:2px 0;">• <strong>$\sigma_y, \sigma_z$</strong>: 隨 Pasquill 穩定度等級變動之橫向與垂直擴散標準差 ($m$)</p>
                  <p style="margin:2px 0;">• <strong>$H = h_s + \Delta h$</strong>: 煙囪有效高度 (實體高度 $h_s$ + 熱力浮力抬升 $\Delta h$)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT 4: Knowledge Quiz -->
        <div id="w03-content-quiz" class="w03-tab-pane" style="display:none;">
          <div style="background:#fff; border:1px solid #cbd5e1; border-radius:12px; padding:20px;">
            <h3 style="color:#d97706; font-size:1.2rem; border-bottom:2px solid #fef3c7; padding-bottom:8px; margin-top:0;">
              <i class="fa-solid fa-circle-question"></i> W03 隨堂觀念測驗 (Quiz & Assessment)
            </h3>
            
            <div id="w03-quiz-box" style="margin-top:15px;">
              <div style="background:#fffbeb; border:1px solid #fde68a; padding:15px; border-radius:8px; margin-bottom:12px;">
                <p style="font-weight:700; color:#92400e; margin:0 0 8px 0;">Q1: 白天強烈日照且風速微弱 (< 2 m/s) 時，Pasquill 大氣穩定度屬於哪一級？</p>
                <div style="display:flex; flex-direction:column; gap:6px; font-size:0.9rem;">
                  <label style="cursor:pointer;"><input type="radio" name="w03_q1" value="A"> (A) A 級 (極不穩定)</label>
                  <label style="cursor:pointer;"><input type="radio" name="w03_q1" value="B"> (B) D 級 (中性)</label>
                  <label style="cursor:pointer;"><input type="radio" name="w03_q1" value="C"> (C) F 級 (極度穩定)</label>
                </div>
              </div>

              <div style="background:#fffbeb; border:1px solid #fde68a; padding:15px; border-radius:8px; margin-bottom:12px;">
                <p style="font-weight:700; color:#92400e; margin:0 0 8px 0;">Q2: 風玫瑰圖 (Wind Rose) 中出現頻率最高之風向稱為？</p>
                <div style="display:flex; flex-direction:column; gap:6px; font-size:0.9rem;">
                  <label style="cursor:pointer;"><input type="radio" name="w03_q2" value="A"> (A) 陣風風向</label>
                  <label style="cursor:pointer;"><input type="radio" name="w03_q2" value="B"> (B) 主導風向 (Prevailing Wind)</label>
                  <label style="cursor:pointer;"><input type="radio" name="w03_q2" value="C"> (C) 海陸風向</label>
                </div>
              </div>

              <button onclick="window.checkW03Quiz()" style="background:#d97706; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:700; cursor:pointer;">
                提交答案並查看解析
              </button>

              <div id="w03-quiz-result" style="margin-top:12px; display:none; padding:12px; border-radius:8px;"></div>
            </div>
          </div>
        </div>
      `;
    }

    else if (modalType === 'w02_guide' || cardId === 'w02-c1' || modalType === 'w02_lecture') {
      contentHtml = `
        <!-- W02 Voice Guide Header & Player -->
        <div style="background: linear-gradient(135deg, #0b3c5d 0%, #0284c7 100%); color:#fff; padding:20px; border-radius:12px; margin-bottom:20px; box-shadow:0 6px 18px rgba(2,132,199,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="background:rgba(255,255,255,0.2); color:#fff; padding:3px 10px; border-radius:12px; font-size:0.8rem; font-weight:700;">
                <i class="fa-solid fa-volume-high"></i> W02 專屬 AI 語音導讀播放器
              </span>
              <h2 style="font-size:1.35rem; margin:8px 0 4px 0; color:#fff; font-weight:800;">
                <i class="fa-solid fa-scale-balanced"></i> W02 環評法與施行細則解碼（含語音導讀）
              </h2>
              <p style="font-size:0.92rem; color:#fef3c7; font-weight:700; margin:4px 0 0 0;">
                法規講義：解析一階與二階環評程序、認定標準附表二、環現差與範疇界定指引法章體系。
              </p>
            </div>
            <span id="w02SpeechStatusTag" style="background:#f59e0b; color:#78350f; font-weight:800; padding:6px 14px; border-radius:20px; font-size:0.88rem;">
              ▶️ 點擊下方播放語音導讀
            </span>
          </div>

          <!-- Speech Control Panel -->
          <div style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); border-radius:10px; padding:14px; margin-top:16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <button onclick="window.playW02GuideSpeech()" style="background:#f59e0b; color:#fff; border:none; padding:8px 18px; border-radius:8px; font-weight:800; font-size:0.9rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                <i class="fa-solid fa-play"></i> 播放導讀
              </button>
              <button onclick="window.pauseW02GuideSpeech()" style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4); padding:8px 14px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">
                <i class="fa-solid fa-pause"></i> 暫停
              </button>
              <button onclick="window.stopW02GuideSpeech()" style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4); padding:8px 14px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">
                <i class="fa-solid fa-stop"></i> 停止
              </button>
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.82rem; font-weight:700; color:#e0f2fe;">語音速度：</span>
              <select onchange="window.setW02GuideSpeechRate(parseFloat(this.value))" style="background:#fff; color:#0f172a; border:none; padding:5px 10px; border-radius:6px; font-weight:700; font-size:0.85rem; cursor:pointer;">
                <option value="0.75">0.75x 慢速</option>
                <option value="1.0" selected>1.0x 標準速度</option>
                <option value="1.25">1.25x 快速</option>
                <option value="1.5">1.5x 高速</option>
              </select>
            </div>
          </div>
        </div>

        <!-- W02 Script Container -->
        <div id="w02GuideTextScript" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:18px; margin-bottom:20px; font-size:0.93rem; line-height:1.75; color:#334155;">
          <h4 style="color:#0b3c5d; margin:0 0 10px 0; font-weight:800; font-size:1.05rem; border-bottom:2px solid #0284c7; padding-bottom:6px;">
            🎙️ 賴文亮教授親錄 W02 授課導讀逐字稿：
          </h4>
          <p style="margin-bottom:10px;">
            各位同學們好，我是賴文亮教授。歡迎來到第二週《我國環境影響評估法規體系與認定標準解析》。本週講義我們將深入解析一階與二階環評程序、認定標準附表二、環現差與範疇界定指引法章體系。
          </p>
          <p style="margin-bottom:10px;">
            我國《環境影響評估法》自民國83年公布施行以來，即確立了『預防重於治療』的核心法理。依據第1條規定，環評目的在於預防及減輕開發行為對環境造成之不良影響。其中最關鍵的條文為第14條的『環評否決權』——若環評審查結論未獲通過，目的事業主管機關即不得許可該開發行為。
          </p>
          <p style="margin-bottom:0;">
            本週講義我們深入剖析第一階段環境影響說明書 (EIR) 與第二階段評估報告書 (EIS) 的程序差異，並配合《開發行為應實施環境影響評估細目及範圍認定標準》附表一與認定標準附表二，學習如何計算工業區、高科技園區與水資源工程的量化門檻、環現差與範疇界定指引。請大家切實對照學習！
          </p>
        </div>

        <!-- Structured Lecture Notes Body (規劃原則上課講義) -->
        <div style="background:#fff; border:1px solid #cbd5e1; border-radius:10px; padding:20px; margin-bottom:20px;">
          <h3 style="font-size:1.15rem; color:#0b3c5d; font-weight:800; margin:0 0 16px 0; border-bottom:2px solid #0284c7; padding-bottom:8px;">
            📚 W02 依規劃原則進行之系統化上課講義內容 (解析一階與二階環評程序、認定標準附表二、環現差與範疇界定指引法章體系)
          </h3>

          <!-- Unit 1 -->
          <div style="background:#f0f9ff; border-left:4px solid #0284c7; padding:14px 16px; border-radius:6px; margin-bottom:14px;">
            <h4 style="margin:0 0 8px 0; color:#0369a1; font-size:1rem; font-weight:800;">
              ⚖️ 單元一：解析一階與二階環評程序與核心法條解碼 (第1條~第24條)
            </h4>
            <ul style="margin:0; padding-left:18px; font-size:0.9rem; color:#334155; line-height:1.7;">
              <li><strong>第一階段環評程序 (EIR)</strong>：依據第 7 條規定，開發單位應編製環境影響說明書，向目的事業主管機關申請審查。</li>
              <li><strong>第二階段環評程序 (EIS)</strong>：依據第 8 條~第 13 條規定，對環境有重大影響之虞者，應進行現場勘察、範疇界定、公聽會及編製評估報告書。</li>
              <li><strong>環評否決權機制 (第14條)</strong>：環評審查結論未通過者，目的事業主管機關不得許可開發。違法許可者無效。</li>
              <li><strong>環現差 (環境現況差異分析) (第16條與第18條)</strong>：通過環評後超過 3 年未動工者，應提報『環境現況差異分析及對策檢討報告』。</li>
            </ul>
          </div>

          <!-- Unit 2 -->
          <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:14px 16px; border-radius:6px; margin-bottom:14px;">
            <h4 style="margin:0 0 8px 0; color:#b45309; font-size:1rem; font-weight:800;">
              🔍 單元二：開發行為應實施環評認定標準 (附表一與認定標準附表二實務拆解)
            </h4>
            <ul style="margin:0; padding-left:18px; font-size:0.9rem; color:#334155; line-height:1.7;">
              <li><strong>認定標準附表二解析</strong>：工業區與高科技園區開發擴建或新建面積達 10 公頃以上，或部位於敏感地質/水質保護區者。</li>
              <li><strong>水資源與水庫工程附表門檻</strong>：堰堤蓄水容量、水道變更長度達一定規模，或涉及特定保育類動物棲地者。</li>
              <li><strong>交通與能源設施認定</strong>：快速道路拓寬達 5 公里以上，或跨越一級環境敏感區者應實施環評。</li>
            </ul>
          </div>

          <!-- Unit 3 -->
          <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:14px 16px; border-radius:6px; margin-bottom:14px;">
            <h4 style="margin:0 0 8px 0; color:#047857; font-size:1rem; font-weight:800;">
              🛠️ 單元三：範疇界定指引法章體系與四大環境因子評估
            </h4>
            <ul style="margin:0; padding-left:18px; font-size:0.9rem; color:#334155; line-height:1.7;">
              <li><strong>範疇界定指引法章體系</strong>：依作業準則選定應進行調查之環境項目、替代方案及評估範疇。</li>
              <li><strong>物理與化學因子</strong>：空氣品質 (AERMOD 模擬)、水質 (RPI 指標)、噪音振動與土壤地下水。</li>
              <li><strong>生態與景觀因子</strong>：陸域/水域生物調查、特有種棲地評價、景觀視覺衝擊。</li>
              <li><strong>社會經濟與健康風險</strong>：居民問卷、文化資產保護、健康風險評估 (HRA) 四步驟。</li>
            </ul>
          </div>
        </div>

        <!-- Official Live Teaching Links -->
        <div style="background:#f0f9ff; border:2px solid #bae6fd; border-radius:12px; padding:18px; margin-bottom:20px;">
          <h4 style="font-size:1.05rem; color:#0b3c5d; margin:0 0 12px 0; font-weight:800;">
            🌐 W02 課堂實機操作與官方法規檢索連結門戶：
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px;">
            <a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0090001" target="_blank" style="background:#fff; border:1px solid #bae6fd; padding:10px 14px; border-radius:8px; text-decoration:none; color:#0284c7; font-weight:700; font-size:0.88rem; display:flex; align-items:center; justify-content:space-between;">
              <span><i class="fa-solid fa-scale-balanced"></i> 全國法規資料庫：環評法全文</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0090002" target="_blank" style="background:#fff; border:1px solid #bae6fd; padding:10px 14px; border-radius:8px; text-decoration:none; color:#0284c7; font-weight:700; font-size:0.88rem; display:flex; align-items:center; justify-content:space-between;">
              <span><i class="fa-solid fa-gavel"></i> 環評法施行的細則條文</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <a href="https://eiadoc.moenv.gov.tw/" target="_blank" style="background:#fff; border:1px solid #bae6fd; padding:10px 14px; border-radius:8px; text-decoration:none; color:#0284c7; font-weight:700; font-size:0.88rem; display:flex; align-items:center; justify-content:space-between;">
              <span><i class="fa-solid fa-database"></i> 環境部：環評書件查詢系統</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>
        </div>
      `;
    } else if (modalType === 'lecture' || cardId === 'w01-c2' || cardId === 'w03-c1' || cardId === 'w05-c1' || cardId === 'w07-c1' || cardId === 'w10-c1' || cardId === 'w11-c1' || cardId === 'w15-c1') {
      contentHtml = `
        <h2 class="modal-title" style="color:#0b3c5d;"><i class="fa-solid fa-scale-balanced" style="color:#0284c7;"></i> 環評法規體系總覽與官方網路連結點</h2>
        <p class="modal-subtitle">輔英科技大學 《環境影響評估》課程授課講義與法規檢索門戶 (授課教師：賴文亮 教授)</p>

        <!-- Lecture Key Concepts -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:18px; margin-bottom:20px;">
          <h4 style="font-size:1.05rem; color:#0b3c5d; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-book-bookmark" style="color:#0284c7;"></i> 法規架構與授課重點概要：
          </h4>
          <ul style="margin:0; padding-left:20px; font-size:0.92rem; color:#334155; line-height:1.7;">
            <li><strong>立法目的 (第1條)</strong>：預防及減輕開發行為對環境造成之不良影響，以達成永續發展目標。</li>
            <li><strong>環評否決權 (第14條)</strong>：環評審查結論未通過者，目的事業主管機關不得許可該開發行為。</li>
            <li><strong>四大環境範疇</strong>：物理及化學、生態環境、景觀及遊憩、社會經濟環境。</li>
            <li><strong>兩階段審查</strong>：第一階段環境影響說明書 (EIR) 初審 ➜ 第二階段評估報告書 (EIS) 範疇界定與公聽會。</li>
          </ul>
        </div>

        <!-- Official Web Hyperlinks Portal for Live Teaching -->
        <div style="background:#f0f9ff; border:2px solid #bae6fd; border-radius:12px; padding:20px; margin-bottom:20px; box-shadow:0 4px 12px rgba(2,132,199,0.06);">
          <h4 style="font-size:1.1rem; color:#0369a1; margin-bottom:12px; font-weight:800; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-globe" style="color:#0284c7;"></i> 授課專用：國家級官方法規與資料庫網路連結點 (點擊開啟)
          </h4>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
            <!-- Link 1: EIA Act (Moj LawAll O0090001) -->
            <a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0090001" target="_blank" rel="noopener noreferrer" onclick="window.open('https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0090001', '_blank'); return false;" style="text-decoration:none; background:#fff; border:1px solid #93c5fd; border-radius:8px; padding:14px; display:flex; align-items:flex-start; gap:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.03);">
              <div style="background:#0284c7; color:#fff; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;"><i class="fa-solid fa-gavel"></i></div>
              <div>
                <div style="font-weight:700; color:#0b3c5d; font-size:0.95rem; margin-bottom:2px;">1. 《環境影響評估法》母法</div>
                <div style="font-size:0.82rem; color:#64748b;">法務部全國法規資料庫 (最新全文條文)</div>
                <span style="font-size:0.8rem; color:#0284c7; font-weight:700; display:inline-block; margin-top:4px;">前往法規資料庫 ↗</span>
              </div>
            </a>

            <!-- Link 2: EIA Enforcement Rules (Moj LawAll O0090002) -->
            <a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0090002" target="_blank" rel="noopener noreferrer" onclick="window.open('https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0090002', '_blank'); return false;" style="text-decoration:none; background:#fff; border:1px solid #93c5fd; border-radius:8px; padding:14px; display:flex; align-items:flex-start; gap:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.03);">
              <div style="background:#0369a1; color:#fff; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;"><i class="fa-solid fa-file-contract"></i></div>
              <div>
                <div style="font-weight:700; color:#0b3c5d; font-size:0.95rem; margin-bottom:2px;">2. 《環境影響評估法施行細則》</div>
                <div style="font-size:0.82rem; color:#64748b;">法務部全國法規資料庫 (環境因子與細節)</div>
                <span style="font-size:0.8rem; color:#0284c7; font-weight:700; display:inline-block; margin-top:4px;">前往法規資料庫 ↗</span>
              </div>
            </a>

            <!-- Link 3: Development Activities Standards (Moj LawAll O0090003) -->
            <a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0090003" target="_blank" rel="noopener noreferrer" onclick="window.open('https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0090003', '_blank'); return false;" style="text-decoration:none; background:#fff; border:1px solid #93c5fd; border-radius:8px; padding:14px; display:flex; align-items:flex-start; gap:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.03);">
              <div style="background:#0891b2; color:#fff; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;"><i class="fa-solid fa-list-check"></i></div>
              <div>
                <div style="font-weight:700; color:#0b3c5d; font-size:0.95rem; margin-bottom:2px;">3. 《開發行為應實施環評認定標準》</div>
                <div style="font-size:0.82rem; color:#64748b;">法務部全國法規資料庫 (工廠/交通/能源門檻)</div>
                <span style="font-size:0.8rem; color:#0284c7; font-weight:700; display:inline-block; margin-top:4px;">前往法規資料庫 ↗</span>
              </div>
            </a>

            <!-- Link 4: EIA Query System (MOENV EIA Online) -->
            <a href="https://eiadoc.moenv.gov.tw/" target="_blank" rel="noopener noreferrer" onclick="window.open('https://eiadoc.moenv.gov.tw/', '_blank'); return false;" style="text-decoration:none; background:#fff; border:1px solid #93c5fd; border-radius:8px; padding:14px; display:flex; align-items:flex-start; gap:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.03);">
              <div style="background:#059669; color:#fff; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;"><i class="fa-solid fa-database"></i></div>
              <div>
                <div style="font-weight:700; color:#0b3c5d; font-size:0.95rem; margin-bottom:2px;">4. 環評書件查詢系統 (EIA Online)</div>
                <div style="font-size:0.82rem; color:#64748b;">全台歷年 EIR 與 EIS 開發說明書完整資料庫</div>
                <span style="font-size:0.8rem; color:#059669; font-weight:700; display:inline-block; margin-top:4px;">開啟實務資料庫 ↗</span>
              </div>
            </a>

            <!-- Link 5: Net-Zero Climate Act (Moj LawAll O0020098) -->
            <a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0020098" target="_blank" rel="noopener noreferrer" onclick="window.open('https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=O0020098', '_blank'); return false;" style="text-decoration:none; background:#fff; border:1px solid #93c5fd; border-radius:8px; padding:14px; display:flex; align-items:flex-start; gap:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.03);">
              <div style="background:#16a34a; color:#fff; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;"><i class="fa-solid fa-leaf"></i></div>
              <div>
                <div style="font-weight:700; color:#0b3c5d; font-size:0.95rem; margin-bottom:2px;">5. 《氣候變遷因應法》與淨零專區</div>
                <div style="font-size:0.82rem; color:#64748b;">法務部全國法規資料庫 (溫室氣體盤查與碳評估)</div>
                <span style="font-size:0.8rem; color:#16a34a; font-weight:700; display:inline-block; margin-top:4px;">前往法規資料庫 ↗</span>
              </div>
            </a>

          </div>
        </div>
      `;
    } else if (modalType === 'guide') {
      contentHtml = `
        <div style="background: linear-gradient(135deg, #0b3c5d 0%, #0284c7 100%); color:#fff; padding:20px; border-radius:12px; margin-bottom:20px; box-shadow:0 6px 18px rgba(2,132,199,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="background:rgba(255,255,255,0.2); color:#fff; padding:3px 10px; border-radius:12px; font-size:0.8rem; font-weight:700;">
                <i class="fa-solid fa-volume-high"></i> AI 語音導讀專區
              </span>
              <h2 style="font-size:1.35rem; margin:8px 0 4px 0; color:#fff; font-weight:800;">
                <i class="fa-solid fa-compass"></i> W01 課程修課指南 (賴文亮教授 語音親錄導讀)
              </h2>
              <p style="font-size:0.88rem; color:#e0f2fe; margin:0;">
                輔英科技大學 環境工程與科學系《環境影響評估》 (星期三 第3-4節)
              </p>
            </div>
            <span id="speechStatusTag" style="background:#f59e0b; color:#78350f; font-weight:800; padding:6px 14px; border-radius:20px; font-size:0.88rem;">
              ▶️ 點擊下方播放語音導讀
            </span>
          </div>

          <!-- Speech Control Panel -->
          <div style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); border-radius:10px; padding:14px; margin-top:16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <button id="btnPlaySpeech" onclick="window.playGuideSpeech()" style="background:#10b981; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:700; font-size:0.92rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(16,185,129,0.3);">
                <i class="fa-solid fa-play"></i> 播放語音導讀
              </button>
              <button id="btnPauseSpeech" onclick="window.pauseGuideSpeech()" style="background:#f59e0b; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:700; font-size:0.92rem; cursor:pointer; display:none; align-items:center; gap:6px;">
                <i class="fa-solid fa-pause"></i> 暫停 / 繼續
              </button>
              <button id="btnStopSpeech" onclick="window.stopGuideSpeech()" style="background:#ef4444; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:700; font-size:0.92rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-square"></i> 停止
              </button>
            </div>

            <div style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:#f0f9ff;">
              <span><i class="fa-solid fa-gauge-high"></i> 語速調整：</span>
              <button onclick="window.setGuideSpeechRate(0.85)" style="background:rgba(255,255,255,0.2); color:#fff; border:none; padding:3px 8px; border-radius:4px; font-weight:600; cursor:pointer;">0.85x 慢速</button>
              <button onclick="window.setGuideSpeechRate(1.0)" style="background:#38bdf8; color:#0f172a; border:none; padding:3px 8px; border-radius:4px; font-weight:700; cursor:pointer;">1.0x 標準</button>
              <button onclick="window.setGuideSpeechRate(1.2)" style="background:rgba(255,255,255,0.2); color:#fff; border:none; padding:3px 8px; border-radius:4px; font-weight:600; cursor:pointer;">1.2x 快速</button>
            </div>
          </div>
        </div>

        <!-- Full Audio Narration Text Script -->
        <div id="guideTextScript" style="font-size: 0.95rem; line-height: 1.8; color: #334155; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:20px;">
          
          <div class="speech-section" style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px dashed #e2e8f0;">
            <h4 style="color:#0b3c5d; font-size:1.05rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
              <span style="background:#0284c7; color:#fff; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem;">1</span>
              歡迎詞與授課教師簡介
            </h4>
            <p style="margin:0; color:#475569;">
              同學你好！歡迎來到輔英科技大學環境工程與科學系《環境影響評估》課程，我是授課教師賴文亮教授。本課程上課時段為每星期三第 3 至 4 節（10 點 10 分至 12 點）。
            </p>
          </div>

          <div class="speech-section" style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px dashed #e2e8f0;">
            <h4 style="color:#0b3c5d; font-size:1.05rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
              <span style="background:#0284c7; color:#fff; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem;">2</span>
              課程定位與核心目標
            </h4>
            <p style="margin:0; color:#475569;">
              本課程旨在引導大家全面掌握我國《環境影響評估法》母法、施行細則與開發行為認定標準。同時，我們特別導入最新的生成式 AI 工具，包含 NotebookLM 與 ChatGPT，協助同學秒級拆解非結構化的龐大環評說明書，快速完成評估範疇界定與減輕對策設計。
            </p>
          </div>

          <div class="speech-section" style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px dashed #e2e8f0;">
            <h4 style="color:#0b3c5d; font-size:1.05rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
              <span style="background:#0284c7; color:#fff; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem;">3</span>
              18 週學期地圖規劃
            </h4>
            <p style="margin:0; color:#475569;">
              全學期分為兩大主軸：前九週聚焦一階環評與四大部分環境影響評估（包含物理化學、生態、水質廢棄物及空氣品質 AERMOD 模擬與期中報告）；後九週涵蓋二階段環評範疇界定、EMP 減輕對策 AI 生成、ISO 14064 碳足跡整合與第 18 週期末成果發表。
            </p>
          </div>

          <div class="speech-section" style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px dashed #e2e8f0;">
            <h4 style="color:#0b3c5d; font-size:1.05rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
              <span style="background:#0284c7; color:#fff; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem;">4</span>
              學期評分標準與成績計算詳細說明 (官方 6 項權重配分 100%)
            </h4>
            <p style="margin:0 0 10px 0; color:#475569; line-height:1.7;">
              本課程學期總成績包含六大評分維度：期中考 25%、期末考 25%、實作成品 20%、資訊學習 15%、出席率 10%、問卷填寫與教學回饋 5%，合計 100%。
            </p>

            <!-- Detailed Score Calculation Table -->
            <div style="background:#fff; border:1.5px solid #bae6fd; border-radius:8px; padding:14px; margin:10px 0;">
              <h5 style="margin:0 0 10px 0; color:#0369a1; font-size:0.95rem; font-weight:700;">
                <i class="fa-solid fa-calculator" style="color:#0284c7;"></i> 學期總成績評分計算公式與權重配分表：
              </h5>

              <div style="background:#e0f2fe; border:1px solid #7dd3fc; border-radius:6px; padding:10px 14px; font-weight:700; color:#0369a1; font-size:0.9rem; margin-bottom:12px; line-height:1.6;">
                🎓 學期總成績 (100%) = 期中考 (25%) + 期末考 (25%) + 實作成品 (20%) + 資訊學習 (15%) + 出席率 (10%) + 問卷填寫與教學回饋 (5%)
              </div>

              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.88rem; color:#334155;">
                <thead>
                  <tr style="background:#f0f9ff; border-bottom:2px solid #bae6fd; color:#0b3c5d;">
                    <th style="padding:8px 10px; width:22%;">評量項目</th>
                    <th style="padding:8px 10px; width:15%;">佔比權重</th>
                    <th style="padding:8px 10px; width:38%;">評分規範與執行內容</th>
                    <th style="padding:8px 10px; width:25%;">工具與方式</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom:1px solid #f1f5f9; background:#f0fdf4;">
                    <td style="padding:8px 10px; font-weight:700; color:#15803d;">1. 期中考</td>
                    <td style="padding:8px 10px; font-weight:700; color:#15803d; font-size:0.95rem;">25%</td>
                    <td style="padding:8px 10px;">第 9 週一階環評說明書範疇與四大環境因子小組專案簡報與答詢。</td>
                    <td style="padding:8px 10px; color:#15803d; font-weight:600;">簡報發表評分</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9; background:#fff1f2;">
                    <td style="padding:8px 10px; font-weight:700; color:#be123c;">2. 期末考</td>
                    <td style="padding:8px 10px; font-weight:700; color:#be123c; font-size:0.95rem;">25%</td>
                    <td style="padding:8px 10px; color:#9f1239;">第 18 週實體閉卷會考，驗收《環評法》母法、細則、認定標準與工程法理。</td>
                    <td style="padding:8px 10px; color:#be123c; font-weight:600;">⛔ 實體閉卷筆試</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9; background:#e0f2fe;">
                    <td style="padding:8px 10px; font-weight:700; color:#0369a1;">3. 實作成品</td>
                    <td style="padding:8px 10px; font-weight:700; color:#0369a1; font-size:0.95rem;">20%</td>
                    <td style="padding:8px 10px;">各單元開發行為範疇界定矩陣、EMP 減輕對策與環評說明書大綱成品。</td>
                    <td style="padding:8px 10px; color:#0284c7; font-weight:600;">專案成果報告</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9; background:#faf5ff;">
                    <td style="padding:8px 10px; font-weight:700; color:#7e22ce;">4. 資訊學習</td>
                    <td style="padding:8px 10px; font-weight:700; color:#7e22ce; font-size:0.95rem;">15%</td>
                    <td style="padding:8px 10px;">NotebookLM 數據拆解、AERMOD 模擬與 AI 提問 Prompt 歷程日誌作業。</td>
                    <td style="padding:8px 10px; color:#7e22ce; font-weight:600;">✅ AI / 資訊作業</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9; background:#f8fafc;">
                    <td style="padding:8px 10px; font-weight:700; color:#334155;">5. 出席率</td>
                    <td style="padding:8px 10px; font-weight:700; color:#334155; font-size:0.95rem;">10%</td>
                    <td style="padding:8px 10px;">每週三第 3-4 節課堂實體點名、問答互動與課堂紀律。</td>
                    <td style="padding:8px 10px; color:#64748b; font-weight:600;">課堂實體點名</td>
                  </tr>
                  <tr style="background:#fefce8;">
                    <td style="padding:8px 10px; font-weight:700; color:#b45309;">6. 問卷填寫與教學回饋</td>
                    <td style="padding:8px 10px; font-weight:700; color:#b45309; font-size:0.95rem;">5%</td>
                    <td style="padding:8px 10px;">完成期初 Pre-test、期末 Post-test KAB 學習自評問卷與課後教學回饋。</td>
                    <td style="padding:8px 10px; color:#b45309; font-weight:600;">線上問卷填寫</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="speech-section">
            <h4 style="color:#0b3c5d; font-size:1.05rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
              <span style="background:#0284c7; color:#fff; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem;">5</span>
              期末專案需求與總結
            </h4>
            <p style="margin:0; color:#475569;">
              期末專案將以實務開發案例進行小組演練，同學需產出完整的環境影響說明書大綱，並於第 18 週進行分組成果發表。請同學們先仔細閱讀本指南，預祝大家學期學習順利！
            </p>
          </div>

        </div>
      `;
    } else if (modalType.startsWith('ai_module_')) {
      const num = modalType.replace('ai_module_', '');
      contentHtml = `
        <h2 class="modal-title"><i class="fa-solid fa-robot" style="color:#0284c7;"></i> 【AI 模組 ${num}】生成式 AI 輔助環評專案沙盒</h2>
        <p class="modal-subtitle">輔英科技大學 EIA 課程 AI 創新教學實驗單元</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px; margin-bottom: 16px;">
          <p style="font-weight:700; color:#0b3c5d;">🤖 模組功能與演練指示：</p>
          <p style="font-size:0.9rem; color:#475569; line-height:1.6;">本單元引導同學運用 ChatGPT / NotebookLM 進行大檔數據萃取、AERMOD/AQUATOX 模擬輔助與減輕對策草案生成。請同學於 eclass 上傳 AI Prompt 歷程日誌。</p>
        </div>
      `;
    } else {
      contentHtml = `
        <h2 class="modal-title"><i class="fa-solid fa-book-open"></i> 課程單元詳細大綱與講義資訊</h2>
        <p class="modal-subtitle">輔英科技大學 環境影響評估 (EIA) 課程</p>
        <p>本單元課程教材與簡報已於 eclass 平台上架，請同學登入下載或進行課後線上檢核。</p>
      `;
    }

    if (modalBody && modalBackdrop) {
      modalBody.innerHTML = contentHtml;
      modalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  // EXPOSE GLOBALLY ON WINDOW
  window.openCardModal = openCardModal;

  // Modal Close Listeners
  if (modalCloseBtn && modalBackdrop) {
    
  // Web Speech API Synthesis Engine for W01 Course Guide
  window.guideSpeechRate = 1.0;
  window.guideUtterance = null;

  window.setGuideSpeechRate = function(rate) {
    window.guideSpeechRate = rate;
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.playGuideSpeech(); // Restart with new rate
    }
  };

  window.playGuideSpeech = function() {
    if (!('speechSynthesis' in window)) {
      alert('您的瀏覽器不支援語音合成功能，建議使用 Chrome 或 Edge 瀏覽器！');
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech

    const scriptContainer = document.getElementById('guideTextScript');
    if (!scriptContainer) return;

    const fullText = scriptContainer.innerText;
    const utterance = new SpeechSynthesisUtterance(fullText);

    utterance.lang = 'zh-TW';
    utterance.rate = window.guideSpeechRate || 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = function() {
      const tag = document.getElementById('speechStatusTag');
      const btnPlay = document.getElementById('btnPlaySpeech');
      const btnPause = document.getElementById('btnPauseSpeech');
      if (tag) tag.innerHTML = '🔊 語音導讀進行中...';
      if (tag) tag.style.background = '#10b981';
      if (tag) tag.style.color = '#fff';
      if (btnPlay) btnPlay.style.display = 'none';
      if (btnPause) btnPause.style.display = 'inline-flex';
    };

    utterance.onend = function() {
      const tag = document.getElementById('speechStatusTag');
      const btnPlay = document.getElementById('btnPlaySpeech');
      const btnPause = document.getElementById('btnPauseSpeech');
      if (tag) tag.innerHTML = '✓ 語音導讀已播放完成';
      if (tag) tag.style.background = '#0284c7';
      if (tag) tag.style.color = '#fff';
      if (btnPlay) btnPlay.style.display = 'inline-flex';
      if (btnPause) btnPause.style.display = 'none';
    };

    utterance.onerror = function(err) {
      console.warn('Speech synthesis error:', err);
    };

    window.guideUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  };

  window.pauseGuideSpeech = function() {
    if (!window.speechSynthesis) return;

    const tag = document.getElementById('speechStatusTag');
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        if (tag) tag.innerHTML = '🔊 語音導讀進行中...';
      } else {
        window.speechSynthesis.pause();
        if (tag) tag.innerHTML = '⏸️ 語音導讀已暫停';
      }
    }
  };

  window.stopGuideSpeech = function() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const tag = document.getElementById('speechStatusTag');
    const btnPlay = document.getElementById('btnPlaySpeech');
    const btnPause = document.getElementById('btnPauseSpeech');
    if (tag) tag.innerHTML = '▶️ 點擊播放語音導讀';
    if (tag) tag.style.background = '#f59e0b';
    if (tag) tag.style.color = '#78350f';
    if (btnPlay) btnPlay.style.display = 'inline-flex';
    if (btnPause) btnPause.style.display = 'none';
  };

  modalCloseBtn.addEventListener('click', () => modalBackdrop.classList.remove('active'));
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) modalBackdrop.classList.remove('active');
    });
  }

  // Keyboard navigation for slide deck (Left / Right arrows & Escape key)
  document.addEventListener('keydown', (e) => {
    if (modalBackdrop && modalBackdrop.classList.contains('active')) {
      if (e.key === 'ArrowLeft' && typeof window.navSlide === 'function') {
        window.navSlide(-1);
      } else if (e.key === 'ArrowRight' && typeof window.navSlide === 'function') {
        window.navSlide(1);
      } else if (e.key === 'Escape') {
        modalBackdrop.classList.remove('active');
      }
    }
  });

  // Initial Render
  renderTwoColumns();
});

// Global Event Delegation for Course Cards
let isCardDelegationAttached = false;
function attachCardClickDelegation() {
  if (isCardDelegationAttached) return;
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.course-card');
    if (card) {
      const modalType = card.getAttribute('data-modal');
      const cardId = card.getAttribute('data-card-id');
      if (typeof window.openCardModal === 'function') {
        window.openCardModal(modalType, cardId);
      }
    }
  });
  isCardDelegationAttached = true;
}

  // Web Speech API Synthesis Engine for W02 Course Guide
  window.w02GuideSpeechRate = 1.0;
  window.w02GuideUtterance = null;

  window.setW02GuideSpeechRate = function(rate) {
    window.w02GuideSpeechRate = rate;
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.playW02GuideSpeech();
    }
  };

  window.playW02GuideSpeech = function() {
    if (!('speechSynthesis' in window)) {
      alert('您的瀏覽器不支援語音合成功能，建議使用 Chrome 或 Edge 瀏覽器！');
      return;
    }

    window.speechSynthesis.cancel();

    const scriptContainer = document.getElementById('w02GuideTextScript');
    if (!scriptContainer) return;

    const fullText = scriptContainer.innerText;
    const utterance = new SpeechSynthesisUtterance(fullText);

    utterance.lang = 'zh-TW';
    utterance.rate = window.w02GuideSpeechRate || 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = function() {
      const tag = document.getElementById('w02SpeechStatusTag');
      if (tag) tag.innerHTML = '🔊 W02 語音導讀進行中...';
    };

    utterance.onend = function() {
      const tag = document.getElementById('w02SpeechStatusTag');
      if (tag) tag.innerHTML = '✓ W02 語音導讀已播放完成';
    };

    utterance.onerror = function() {
      const tag = document.getElementById('w02SpeechStatusTag');
      if (tag) tag.innerHTML = '▶️ 點擊播放語音導讀';
    };

    window.w02GuideUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  };

  window.pauseW02GuideSpeech = function() {
    if (window.speechSynthesis) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        const tag = document.getElementById('w02SpeechStatusTag');
        if (tag) tag.innerHTML = '⏸️ W02 語音導讀已暫停';
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        const tag = document.getElementById('w02SpeechStatusTag');
        if (tag) tag.innerHTML = '🔊 W02 語音導讀進行中...';
      }
    }
  };

  window.stopW02GuideSpeech = function() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const tag = document.getElementById('w02SpeechStatusTag');
      if (tag) tag.innerHTML = '▶️ 點擊播放語音導讀';
    }
  };


// W03 Voice Audio Guide & PPT Controller Scripts
window.w03VoiceUtterance = null;

window.w03PlayVoice = function() {
  if (!('speechSynthesis' in window)) {
    alert('您的瀏覽器不支援 Web Speech API 語音朗讀。');
    return;
  }
  window.speechSynthesis.cancel();

  const textToRead = "歡迎來到第03週大氣擴散與氣象背景數據理論課程。本單元包含兩小時核心教學PPT。第一小時重點探討氣象觀測站數據指標特徵，包括風速、風向、氣溫與混合層高度，並深入解析十六方位風玫瑰圖 Wind Rose 的繪製、風速級距統計與主導風向判讀，作為環評空品受體佈點基礎。第二小時深入 Pasquill 大氣穩定度 A 到 F 級劃分矩陣，結合白天太陽輻射量與夜間雲量判定大氣熱力與動力狀態，並介紹高斯煙羽擴散基本方程式與煙囪有效高度抬升計算。點擊簡報投影片切換按鈕，即可觀看十張完整 PPT 上課簡報與教師講稿說明。";

  const utter = new SpeechSynthesisUtterance(textToRead);
  utter.lang = 'zh-TW';
  utter.rate = 1.0;

  utter.onstart = function() {
    const status = document.getElementById('w03_speech_status');
    if (status) status.innerHTML = '<span style="color:#4ade80; font-weight:800;"><i class="fa-solid fa-volume-high fa-beat"></i> 語音導讀播放中...</span>';
  };

  utter.onend = function() {
    const status = document.getElementById('w03_speech_status');
    if (status) status.innerHTML = '語音導讀播放完成。';
  };

  utter.onerror = function() {
    const status = document.getElementById('w03_speech_status');
    if (status) status.innerHTML = '語音導讀播放完畢或終止。';
  };

  window.w03VoiceUtterance = utter;
  window.speechSynthesis.speak(utter);
};

window.w03PauseVoice = function() {
  if (window.speechSynthesis) {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      const status = document.getElementById('w03_speech_status');
      if (status) status.innerHTML = '<span style="color:#fde047;">語音導讀已暫停</span>';
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      const status = document.getElementById('w03_speech_status');
      if (status) status.innerHTML = '<span style="color:#4ade80;">語音導讀繼續播放...</span>';
    }
  }
};

window.w03StopVoice = function() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const status = document.getElementById('w03_speech_status');
    if (status) status.innerHTML = '語音導讀已停止。';
  }
};

window.switchW03Tab = function(tabName) {
  document.querySelectorAll('.w03-tab-btn').forEach(btn => {
    btn.style.background = '#f1f5f9';
    btn.style.color = '#334155';
    btn.classList.remove('active');
  });
  document.querySelectorAll('.w03-tab-pane').forEach(pane => {
    pane.style.display = 'none';
  });

  const activeBtn = document.getElementById('w03-tab-' + tabName);
  const activePane = document.getElementById('w03-content-' + tabName);

  if (activeBtn) {
    activeBtn.style.background = '#0d9488';
    activeBtn.style.color = '#fff';
    activeBtn.classList.add('active');
  }
  if (activePane) {
    activePane.style.display = 'block';
  }
};

// 10 W03 PPT Slides Deck Data
window.w03SlidesData = [
  {
    slideNum: 1,
    title: "Slide 01: 課程主題與學習目標 (2小時大綱)",
    subtitle: "W03 大氣擴散與氣象背景數據理論（含語音導讀）",
    bullets: [
      "📌 <strong>單元一 (Hour 1)</strong>：氣象觀測站數據特徵擷取 & 風玫瑰圖 (Wind Rose) 繪製與主導風向解析",
      "📌 <strong>單元二 (Hour 2)</strong>：Pasquill-Gifford 大氣穩定度 (A~F級) 劃分矩陣 & 高斯煙羽擴散理論基礎",
      "⚡ <strong>核心目標</strong>：學會在環評空品章節中，如何利用觀測站資料判讀下風向受體風險。"
    ],
    notes: "歡迎同學！本週課程為空品模擬之理論核心。請注意氣象資料如何直接決定空氣污染物之傳輸與擴散。"
  },
  {
    slideNum: 2,
    title: "Slide 02: 氣象觀測站數據指標特徵解析",
    subtitle: "中央氣象署 / 環保署觀測站之 5 大核心氣象因子",
    bullets: [
      "🚩 <strong>風速 ($u$, m/s)</strong>：風速愈高，單位時間稀釋體積愈大，大氣污染物濃度成反比下降。",
      "🚩 <strong>風向 ($\theta$)</strong>：16 方位角，決定污染煙羽漂移之傳輸路徑。",
      "🚩 <strong>氣溫與氣壓 ($T, P$)</strong>：決定空氣密度與熱力對流上升效應。",
      "🚩 <strong>混合層高度 ($h_m$, m)</strong>：邊界層逆溫層頂，限制污染物垂直垂直擴散上限。"
    ],
    notes: "氣象觀測站數據為 AERMOD 等擴散模式之必要輸入檔案 (Surface & Profile File)。"
  },
  {
    slideNum: 3,
    title: "Slide 03: 風玫瑰圖 (Wind Rose) 構造與統計要領",
    subtitle: "風向頻率扇形圖與風速級距分色疊加",
    bullets: [
      "📊 <strong>16 方位風向扇區</strong>：以圓心為基準，長度代表該風向出現之累積頻率百分比 (%)。",
      "🎨 <strong>風速級距分色</strong>：疊加不同風速級距 (Calm, 0.5-2.1, 2.1-3.6, 3.6-5.7, >5.7 m/s)。",
      "⚠️ <strong>靜風 (Calm Wind) 處理</strong>：風速 < 0.5 m/s 時，無明確風向，標示於圓心百分比。"
    ],
    notes: "風玫瑰圖為環評報告書中空品章節之必備圖表，能一眼看出當地全年或季節風場特性。"
  },
  {
    slideNum: 4,
    title: "Slide 04: 主導風向與季節性風玫瑰圖對比",
    subtitle: "台灣典型季風氣候（冬季東北季風 vs 夏季西南季風）",
    bullets: [
      "❄️ <strong>冬季風玫瑰圖</strong>：東北季風盛行 (NE/NNE)，下風向為台灣中南部西海岸，易產生背風側尾流積聚。",
      "☀️ <strong>夏季風玫瑰圖</strong>：西南季風盛行 (SW/SSW)，下風向為北部與東北部。",
      "🔍 <strong>主導風向 (Prevailing Wind)</strong>：累積頻率最高之風向，為監測點位設點指標。"
    ],
    notes: "環評評估時，必須分別檢視「全年」、「冬季」與「夏季」風玫瑰圖，確保各季節敏感受體安全。"
  },
  {
    slideNum: 5,
    title: "Slide 05: 風玫瑰圖在環評監測佈點之應用實務",
    subtitle: "上風點、下風最大濃度點與敏感受體布設原則",
    bullets: [
      "📍 <strong>上風向對照點 (Control Point)</strong>：設於盛行風之上風處，代表未受本開發案影響之基線品質。",
      "📍 <strong>最大落地濃度點 (Impact Point)</strong>：盛行風下風向 500m ~ 3000m（視煙囪高度而定）。",
      "📍 <strong>敏感受體點 (Receptors)</strong>：下風向之學校、社區、醫院。"
    ],
    notes: "若審查委員詢問為何監測點設在某處，答案就是依據風玫瑰圖與最大落地濃度距離！"
  },
  {
    slideNum: 6,
    title: "Slide 06: Pasquill 大氣穩定度 (A~F級) 物理意義",
    subtitle: "大氣湍流熱力與動力狀態分類",
    bullets: [
      "🔥 <strong>A ~ C 級 (不穩定 Unstable)</strong>：白天強熱力對流，垂直混合劇烈，煙羽呈浪滾狀 (Looping)。",
      "⚖️ <strong>D 級 (中性 Neutral)</strong>：陰天或強風，動力湍流主導，煙羽呈錐狀 (Coning)。",
      "❄️ <strong>E ~ F 級 (穩定 Stable)</strong>：夜間輻射冷卻逆溫，湍流壓制，煙羽呈扇狀 (Fanning) 傳播極遠。"
    ],
    notes: "大氣穩定度直接控制污染物擴散標準差 sigma_y 與 sigma_z 的大小！"
  },
  {
    slideNum: 7,
    title: "Slide 07: Pasquill 穩定度查表判定矩陣",
    subtitle: "地面風速、白天太陽輻射量與夜間雲量判定",
    bullets: [
      "☀️ <strong>白天情況</strong>：微風 (<2 m/s) + 強日照 ➜ <strong>A 級</strong>；高風速 (>6 m/s) ➜ <strong>D 級</strong>。",
      "🌙 <strong>夜間情況</strong>：微風 (<2 m/s) + 晴朗少雲 ($\le 3/8$) ➜ <strong>F 級</strong>（極度穩定最不利擴散）。",
      "📋 <strong>對照矩陣應用</strong>：為 AERMOD 與 ISC3 模式計算每小時穩定度之依據。"
    ],
    notes: "請同學務必熟記 A~F 級之物理代表意義，F 級往往對遠距離地表濃度最不利。"
  },
  {
    slideNum: 8,
    title: "Slide 08: 擴散參數 $\\sigma_y, \\sigma_z$ 經驗曲線",
    subtitle: "Pasquill-Gifford 擴散標準差隨下風距離 $x$ 之變化",
    bullets: [
      "📈 <strong>橫向標準差 $\\sigma_y(x)$</strong>：煙羽水平寬度隨距離 $x$ 增加而擴大。",
      "📈 <strong>垂直標準差 $\\sigma_z(x)$</strong>：煙羽垂直高度隨距離 $x$ 擴張，A級遠大於 F級。",
      "📐 <strong>經驗公式</strong>：$\\sigma_y = a \\cdot x^b$, $\\sigma_z = c \\cdot x^d$ (a,b,c,d 為穩定度等級參數)。"
    ],
    notes: "Sigma_y 與 Sigma_z 是高斯公式中分母的重要變數，直接決定煙羽稀釋程度。"
  },
  {
    slideNum: 9,
    title: "Slide 09: 高斯煙羽擴散基本方程式簡介",
    subtitle: "Gaussian Plume Equation & Effective Stack Height $H$",
    bullets: [
      "🧮 <strong>高斯公式</strong>：$C(x,y,z) = \\frac{Q}{2\\pi u \\sigma_y \\sigma_z} \\exp(-\\frac{y^2}{2\\sigma_y^2}) [...]$",
      "🏭 <strong>有效煙囪高度 $H$</strong>：實體高度 $h_s$ + 熱力上升與排出速度抬升 $\\Delta h$。",
      "💡 <strong>地面最大濃度距離</strong>：$x_{max}$ 出現於 $\\sigma_z(x) \\approx H / \\sqrt{2}$ 之位置。"
    ],
    notes: "高斯模式為現代大氣品質評估之基石，下一週 W04 將實作 25m 與 50m 煙囪加高模擬！"
  },
  {
    slideNum: 10,
    title: "Slide 10: 2 小時單元總結與 W04 實作預告",
    subtitle: "氣象數據與大氣擴散理論重點回顧",
    bullets: [
      "✅ <strong>學習重點 1</strong>：風玫瑰圖提供風向頻率與風速分級，為環評點位佈局之首要指引。",
      "✅ <strong>學習重點 2</strong>：Pasquill A~F 級穩定度反映大氣對流與逆溫，決定 $\\sigma_y, \\sigma_z$ 擴散率。",
      "🚀 <strong>W04 預告</strong>：煙囪高斯擴散模擬實作（25m vs 50m 煙囪加高實測比對）。"
    ],
    notes: "感謝各位同學！請完成觀念測驗，並準備好下一週的電腦實驗課。"
  }
];

window.w03CurrentSlideIdx = 0;

window.renderW03Slide = function(idx) {
  if (!window.w03SlidesData || window.w03SlidesData.length === 0) return;
  if (idx < 0) idx = 0;
  if (idx >= window.w03SlidesData.length) idx = window.w03SlidesData.length - 1;
  window.w03CurrentSlideIdx = idx;

  const slide = window.w03SlidesData[idx];
  const badge = document.getElementById('w03-slide-idx-badge');
  const container = document.getElementById('w03-slide-container');
  const notes = document.getElementById('w03-speaker-notes');

  if (badge) badge.innerText = `Slide ${slide.slideNum} / ${window.w03SlidesData.length}`;

  if (container) {
    let bulletsHtml = slide.bullets.map(b => `<li style="margin-bottom:12px; font-size:1.02rem; color:#1e293b; line-height:1.6;">${b}</li>`).join('');
    container.innerHTML = `
      <div style="border-bottom:2px solid #0d9488; padding-bottom:12px; margin-bottom:16px;">
        <h2 style="margin:0 0 6px 0; color:#0f766e; font-weight:800; font-size:1.4rem;">
          <i class="fa-solid fa-play-circle" style="color:#0d9488;"></i> ${slide.title}
        </h2>
        <p style="margin:0; font-size:0.98rem; color:#64748b; font-weight:700;">${slide.subtitle}</p>
      </div>
      <ul style="padding-left:22px; margin:0;">
        ${bulletsHtml}
      </ul>
    `;
  }

  if (notes) {
    notes.innerText = slide.notes;
  }
};

window.w03PrevSlide = function() {
  window.renderW03Slide(window.w03CurrentSlideIdx - 1);
};

window.w03NextSlide = function() {
  window.renderW03Slide(window.w03CurrentSlideIdx + 1);
};

window.checkW03Quiz = function() {
  const q1 = document.querySelector('input[name="w03_q1"]:checked');
  const q2 = document.querySelector('input[name="w03_q2"]:checked');
  const res = document.getElementById('w03-quiz-result');
  if (!res) return;

  if (!q1 || !q2) {
    res.style.display = 'block';
    res.style.background = '#fef2f2';
    res.style.color = '#991b1b';
    res.innerText = '請完成所有題目後再點擊提交！';
    return;
  }

  let score = 0;
  if (q1.value === 'A') score += 50;
  if (q2.value === 'B') score += 50;

  res.style.display = 'block';
  if (score === 100) {
    res.style.background = '#f0fdf4';
    res.style.color = '#166534';
    res.innerHTML = '<strong>🎉 恭喜全對 (100分)！</strong><br>Q1解析：白天強烈日照且風速 < 2m/s 為極強對流狀態， Pasquill 劃分為 A 級 (極不穩定)。<br>Q2解析：出現頻率最高之風向即為「主導風向 (Prevailing Wind)」。';
  } else {
    res.style.background = '#fff7ed';
    res.style.color = '#c2410c';
    res.innerHTML = `<strong>得分：${score} 分</strong>。請重新核對講義內容：<br>Q1正確答案為 (A) A 級；Q2正確答案為 (B) 主導風向。`;
  }
};

// Initialize slide rendering when modal rendered
setTimeout(function() {
  window.renderW03Slide(0);
}, 500);
