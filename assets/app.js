(function () {
  "use strict";

  const CONFIG = window.GALLERY_CONFIG || {};
  const DEFAULT_CATEGORIES = ["焦點活動", "大型活動", "工作體驗", "校園服務", "其他"];
  const categories = Array.isArray(CONFIG.categories) && CONFIG.categories.length
    ? CONFIG.categories
    : DEFAULT_CATEGORIES;
  const allCategory = categories[0] || "焦點活動";

  const state = {
    albums: [],
    photos: [],
    mode: "albums",
    activeCategory: allCategory,
    sortBy: "newest",
    currentAlbum: null
  };

  let els = {};

  function init() {
    cacheElements();
    applyConfigText();
    renderBrandMark();
    renderFilters();
    bindEvents();

    const albumId = new URLSearchParams(window.location.search).get("album");
    if (albumId) {
      loadAlbum(albumId);
    } else {
      loadAlbums();
    }
  }

  function cacheElements() {
    els = {
      brandMark: document.getElementById("brandMark"),
      schoolZh: document.getElementById("schoolZh"),
      schoolEn: document.getElementById("schoolEn"),
      siteTitle: document.getElementById("siteTitle"),
      siteSubtitle: document.getElementById("siteSubtitle"),
      footerSchool: document.getElementById("footerSchool"),
      footerText: document.getElementById("footerText"),
      filters: document.getElementById("filters"),
      searchInput: document.getElementById("searchInput"),
      sortSelect: document.getElementById("sortSelect"),
      metaLine: document.getElementById("metaLine"),
      status: document.getElementById("status"),
      featureSection: document.querySelector(".feature-section"),
      moreSection: document.querySelector(".more-section"),
      featuredArea: document.getElementById("featuredArea"),
      albumGrid: document.getElementById("albumGrid"),
      homeHero: document.getElementById("homeHero"),
      galleryControls: document.getElementById("galleryControls"),
      homeView: document.getElementById("homeView"),
      albumView: document.getElementById("albumView"),
      albumMasthead: document.getElementById("albumMasthead"),
      photoStatus: document.getElementById("photoStatus"),
      photoGrid: document.getElementById("photoGrid")
    };
  }

  function applyConfigText() {
    document.title = CONFIG.siteTitle || "尚計劃活動相片集";
    setText(els.schoolZh, CONFIG.schoolNameZh || "香海正覺蓮社佛教普光學校");
    setText(els.schoolEn, CONFIG.schoolNameEn || "HHCLKA Buddhist Po Kwong School");
    setText(els.siteTitle, CONFIG.siteTitle || "尚計劃活動相片集");
    setText(els.siteSubtitle, CONFIG.siteSubtitle || "記錄學生的學習歷程，見證每一次參與、嘗試與成長。");
    setText(els.footerSchool, CONFIG.schoolNameZh || "香海正覺蓮社佛教普光學校");
    setText(els.footerText, CONFIG.footerText || CONFIG.schoolNameEn || "HHCLKA Buddhist Po Kwong School");
  }

  function renderBrandMark() {
    if (!els.brandMark) return;

    if (CONFIG.logoUrl) {
      els.brandMark.innerHTML = `<img src="${escapeAttr(CONFIG.logoUrl)}" alt="${escapeAttr(CONFIG.schoolNameZh || "學校標誌")}" />`;
      return;
    }

    els.brandMark.textContent = "尚";
  }

  function renderFilters() {
    if (!els.filters) return;

    els.filters.innerHTML = categories.map(function (category, index) {
      const activeClass = index === 0 ? " is-active" : "";
      return `<button class="filter-button${activeClass}" type="button" data-category="${escapeAttr(category)}">${escapeHtml(category)}</button>`;
    }).join("");
  }

  function bindEvents() {
    if (els.filters) {
      els.filters.addEventListener("click", function (event) {
        const button = event.target.closest(".filter-button");
        if (!button) return;

        state.activeCategory = button.dataset.category || allCategory;
        els.filters.querySelectorAll(".filter-button").forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        renderAlbums();
      });
    }

    if (els.searchInput) {
      els.searchInput.addEventListener("input", function () {
        if (state.mode === "albums") renderAlbums();
      });
    }

    if (els.sortSelect) {
      els.sortSelect.addEventListener("change", function () {
        state.sortBy = els.sortSelect.value || "newest";
        renderAlbums();
      });
    }

    document.querySelectorAll("[data-scroll-target]").forEach(function (button) {
      button.addEventListener("click", function () {
        const target = document.getElementById(button.dataset.scrollTarget);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    const focusSearch = document.getElementById("focusSearch");
    if (focusSearch && els.searchInput) {
      focusSearch.addEventListener("click", function () {
        if (state.mode === "photos") {
          window.location.href = "./";
          return;
        }
        els.searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(function () {
          els.searchInput.focus();
        }, 360);
      });
    }
  }

  async function loadAlbums() {
    state.mode = "albums";
    state.currentAlbum = null;
    state.photos = [];
    showHomeView();
    setText(els.status, "正在載入相簿資料...");

    try {
      const data = await getJson("albums");
      if (!data || !data.ok) throw new Error((data && data.error) || "Apps Script API 回傳錯誤");

      state.albums = Array.isArray(data.albums)
        ? data.albums.map(normalizeAlbum).filter(isPublished)
        : [];
      renderAlbums();
      updateMetaLine(state.albums);
    } catch (error) {
      showHomeError(error.message);
    }
  }

  async function loadAlbum(albumId) {
    state.mode = "photos";
    state.photos = [];
    showAlbumView();
    setText(els.photoStatus, "正在載入相片...");

    try {
      const data = await getJson("photos", { albumId: albumId });
      if (!data || !data.ok) throw new Error((data && data.error) || "Apps Script API 回傳錯誤");

      state.currentAlbum = normalizeAlbum(data.album || { id: albumId, title: "活動相簿" });
      state.photos = Array.isArray(data.photos) ? data.photos : [];
      renderAlbumMasthead(state.currentAlbum);
      renderPhotos();
      updateMetaLine([state.currentAlbum], state.photos.length);
    } catch (error) {
      renderAlbumMasthead({ title: "未能載入相簿", category: "相簿", description: "" });
      showPhotoError(error.message);
    }
  }

  function showHomeView() {
    if (els.homeHero) els.homeHero.hidden = false;
    if (els.galleryControls) els.galleryControls.hidden = false;
    if (els.homeView) els.homeView.hidden = false;
    if (els.albumView) els.albumView.hidden = true;
  }

  function showAlbumView() {
    if (els.homeHero) els.homeHero.hidden = true;
    if (els.galleryControls) els.galleryControls.hidden = true;
    if (els.homeView) els.homeView.hidden = true;
    if (els.albumView) els.albumView.hidden = false;
  }

  function buildApiUrl(action, extra) {
    const params = new URLSearchParams(Object.assign({ action: action }, extra || {}));
    const baseUrl = CONFIG.apiBaseUrl || "./api";
    return baseUrl + (baseUrl.includes("?") ? "&" : "?") + params.toString();
  }

  function getJson(action, extra) {
    const url = buildApiUrl(action, extra);
    if ((CONFIG.apiMode || "jsonp") === "jsonp") return jsonp(url);

    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("API request failed: " + response.status);
      return response.json();
    });
  }

  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      const callback = "jsonp_cb_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      const script = document.createElement("script");
      const separator = url.includes("?") ? "&" : "?";
      const timer = window.setTimeout(function () {
        cleanup();
        reject(new Error("Apps Script JSONP 載入逾時"));
      }, 20000);

      function cleanup() {
        window.clearTimeout(timer);
        delete window[callback];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callback] = function (data) {
        cleanup();
        resolve(data);
      };

      script.onerror = function () {
        cleanup();
        reject(new Error("Apps Script JSONP 載入失敗"));
      };
      script.src = url + separator + "callback=" + encodeURIComponent(callback);
      document.body.appendChild(script);
    });
  }

  function normalizeAlbum(album) {
    const dateSource = album.dateText || album.activityDate || album.date || album.eventDateValue || "";
    return {
      id: String(album.id || album.albumId || "").trim(),
      albumId: String(album.albumId || album.id || "").trim(),
      title: String(album.title || album.name || "未命名相簿").trim(),
      folderId: String(album.folderId || "").trim(),
      category: String(album.category || "其他").trim(),
      dateText: formatDisplayDate(dateSource),
      rawDate: dateSource,
      description: String(album.description || "").trim(),
      coverUrl: String(album.coverUrl || album.thumbnailUrl || "").trim(),
      photoCount: Number(album.photoCount || album.count || 0),
      latestUpdated: album.latestUpdated || "",
      eventDateValue: Number(album.eventDateValue || 0),
      featured: album.featured,
      published: album.published
    };
  }

  function isPublished(album) {
    if (album.published === undefined || album.published === null || album.published === "") return true;
    return normalizeBoolean(album.published);
  }

  function normalizeBoolean(value) {
    if (value === true) return true;
    if (value === false) return false;
    const text = String(value || "").trim().toUpperCase();
    return text === "TRUE" || text === "YES" || text === "Y" || text === "1" || text === "是";
  }

  function isFeatured(album) {
    return normalizeBoolean(album.featured);
  }

  function getVisibleAlbums() {
    const keyword = (els.searchInput ? els.searchInput.value : "").trim().toLowerCase();
    const filtered = state.albums.filter(function (album) {
      const matchCategory = state.activeCategory === allCategory || album.category === state.activeCategory;
      if (!matchCategory) return false;
      if (!keyword) return true;

      return [album.title, album.category, album.description, album.dateText]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    return sortAlbums(filtered, state.sortBy);
  }

  function sortAlbums(list, sortBy) {
    const next = list.slice();
    if (sortBy === "oldest") {
      return next.sort(function (a, b) {
        return getAlbumDateValue(a) - getAlbumDateValue(b) || a.title.localeCompare(b.title, "zh-Hant");
      });
    }

    if (sortBy === "photoCount") {
      return next.sort(function (a, b) {
        return Number(b.photoCount || 0) - Number(a.photoCount || 0) || getAlbumDateValue(b) - getAlbumDateValue(a);
      });
    }

    return next.sort(function (a, b) {
      return getAlbumDateValue(b) - getAlbumDateValue(a) || a.title.localeCompare(b.title, "zh-Hant");
    });
  }

  function getAlbumDateValue(album) {
    if (Number(album.eventDateValue || 0)) return Number(album.eventDateValue);
    return parseDateValue(album.rawDate || album.dateText);
  }

  function splitAlbums(list) {
    const featured = list.filter(isFeatured);
    return {
      featured: featured.slice(0, 1),
      more: list.filter(function (album) {
        return !isFeatured(album);
      })
    };
  }

  function getAlbumSections(list, activeCategory) {
    if (activeCategory !== allCategory) {
      return {
        featured: [],
        grid: list.slice(),
        showFeatured: false
      };
    }

    const split = splitAlbums(list);
    return {
      featured: split.featured,
      grid: split.more,
      showFeatured: true
    };
  }

  function renderAlbums() {
    const visible = getVisibleAlbums();
    const sections = getAlbumSections(visible, state.activeCategory);

    setText(els.status, visible.length
      ? `顯示 ${visible.length} 個公開相簿`
      : "未有符合條件的公開相簿");

    if (els.featureSection) {
      els.featureSection.hidden = !sections.showFeatured;
    }

    if (els.moreSection) {
      els.moreSection.hidden = sections.showFeatured;
    }

    if (els.featuredArea) {
      els.featuredArea.innerHTML = sections.featured.length
        ? renderFeaturedCard(sections.featured[0])
        : renderEmptyState("更新中，密切留意", "更多精彩活動相片即將上載。");
    }

    if (els.albumGrid) {
      els.albumGrid.innerHTML = sections.showFeatured
        ? ""
        : sections.grid.length
        ? sections.grid.map(renderAlbumCard).join("")
        : renderEmptyState("更新中，密切留意", "更多精彩活動相片即將上載。");
    }

    updateMetaLine(visible);
  }

  function renderFeaturedCard(album) {
    const href = makeAlbumHref(album);
    return `
      <article class="featured-card">
        <div class="featured-copy">
          <span class="feature-label">${escapeHtml(album.category)}</span>
          <h3 class="featured-title">${escapeHtml(album.title)}</h3>
          <p class="featured-desc">${escapeHtml(album.description || "活動相片已整理成專題相簿，記錄學習與參與的精彩片段。")}</p>
          <div class="feature-meta">
            <span>${escapeHtml(album.dateText)}</span>
            <span>${Number(album.photoCount || 0)} 張相片</span>
          </div>
          <a class="feature-action" href="${escapeAttr(href)}">查看相簿</a>
        </div>
        <a class="featured-media" href="${escapeAttr(href)}" aria-label="查看 ${escapeAttr(album.title)}">
          ${renderCoverImage(album.coverUrl, album.title)}
        </a>
      </article>
    `;
  }

  function renderAlbumCard(album) {
    const href = makeAlbumHref(album);
    return `
      <article class="album-card">
        <a class="album-cover" href="${escapeAttr(href)}" aria-label="查看 ${escapeAttr(album.title)}">
          ${renderCoverImage(album.coverUrl, album.title)}
          <span class="album-label">${escapeHtml(album.category)}</span>
        </a>
        <div class="album-body">
          <h3 class="album-title">${escapeHtml(album.title)}</h3>
          <p class="album-desc">${escapeHtml(excerpt(album.description || "活動相片已整理成相簿，歡迎瀏覽。", 76))}</p>
          <div class="album-meta">
            <span>${escapeHtml(album.dateText)}</span>
            <span>${Number(album.photoCount || 0)} 張相片</span>
          </div>
          <a class="album-action" href="${escapeAttr(href)}">查看相簿</a>
        </div>
      </article>
    `;
  }

  function renderAlbumMasthead(album) {
    if (!els.albumMasthead) return;

    els.albumMasthead.innerHTML = `
      <div class="masthead-cover">
        ${renderCoverImage(album.coverUrl, album.title)}
      </div>
      <div class="masthead-content">
        <span class="masthead-label">${escapeHtml(album.category || "活動相簿")}</span>
        <h1 class="masthead-title">${escapeHtml(album.title || "活動相簿")}</h1>
        <p class="masthead-desc">${escapeHtml(album.description || "活動相片已整理成相片牆。")}</p>
        <div class="masthead-meta">
          <span>${escapeHtml(album.dateText || "日期待定")}</span>
          <span>${Number(album.photoCount || state.photos.length || 0)} 張相片</span>
        </div>
      </div>
    `;
  }

  function renderPhotos() {
    if (!els.photoGrid) return;

    setText(els.photoStatus, state.photos.length
      ? `顯示 ${state.photos.length} 張相片`
      : "此相簿暫時未有可顯示相片");

    els.photoGrid.innerHTML = state.photos.length
      ? state.photos.map(renderPhotoTile).join("")
      : renderEmptyState("暫時未有相片", "請確認 Google Drive folder 已加入已審核的 JPG、PNG 或 WebP 相片。");
  }

  function renderPhotoTile(photo) {
    const imageUrl = photo.thumbnailUrl || photo.imageUrl || "";
    const viewUrl = photo.viewUrl || photo.url || imageUrl || "#";
    return `
      <a class="photo-tile" href="${escapeAttr(viewUrl)}" target="_blank" rel="noopener" aria-label="開啟 Google Drive 原圖">
        <img src="${escapeAttr(imageUrl)}" alt="相簿相片" loading="lazy" onerror="this.style.opacity='0';" />
      </a>
    `;
  }

  function renderCoverImage(url, title) {
    const fallback = renderCoverFallback(title);
    if (!url) return fallback;

    return `
      <img src="${escapeAttr(url)}" alt="${escapeAttr(title || "活動相簿封面")}" loading="lazy" onerror="this.remove();" />
      ${fallback}
    `;
  }

  function renderCoverFallback(title) {
    return `
      <span class="cover-art" aria-hidden="true">
        <span>${escapeHtml(getCoverInitials(title))}</span>
      </span>
    `;
  }

  function getCoverInitials(title) {
    const value = String(title || "相簿").trim();
    return value.slice(0, 2).toUpperCase();
  }

  function renderEmptyState(title, detail) {
    return `<div class="empty-state"><strong>${escapeHtml(title)}</strong>${escapeHtml(detail)}</div>`;
  }

  function renderErrorState(title, detail) {
    return `<div class="error-state"><strong>${escapeHtml(title)}</strong>${escapeHtml(detail)}</div>`;
  }

  function showHomeError(message) {
    setText(els.status, "未能載入相簿資料");
    if (els.featuredArea) els.featuredArea.innerHTML = "";
    if (els.albumGrid) els.albumGrid.innerHTML = renderErrorState("載入失敗", message);
    updateMetaLine([]);
  }

  function showPhotoError(message) {
    setText(els.photoStatus, "未能載入相片");
    if (els.photoGrid) els.photoGrid.innerHTML = renderErrorState("載入失敗", message);
    updateMetaLine([], 0);
  }

  function updateMetaLine(list, explicitPhotoCount) {
    const albumsForMeta = Array.isArray(list) ? list : [];
    const albumCount = state.mode === "photos" ? 1 : albumsForMeta.length;
    const photoCount = Number.isFinite(explicitPhotoCount)
      ? explicitPhotoCount
      : albumsForMeta.reduce(function (sum, album) {
        return sum + Number(album.photoCount || 0);
      }, 0);
    const latest = sortAlbums(albumsForMeta, "newest")[0];
    const latestText = latest ? latest.dateText : "日期待定";
    setText(els.metaLine, `${albumCount} 個相簿　${photoCount} 張相片　最新活動：${latestText}`);
  }

  function makeAlbumHref(album) {
    const id = album.id || album.albumId;
    return `?album=${encodeURIComponent(id)}`;
  }

  function formatDisplayDate(value) {
    const timestamp = parseDateValue(value);
    if (!timestamp) return "日期待定";

    const date = new Date(timestamp);
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("-");
  }

  function parseDateValue(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;

    const raw = String(value || "").trim();
    if (!raw) return 0;

    const yyyyMmDd = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (yyyyMmDd) return new Date(Number(yyyyMmDd[1]), Number(yyyyMmDd[2]) - 1, Number(yyyyMmDd[3])).getTime();

    const zhDate = raw.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (zhDate) return new Date(Number(zhDate[1]), Number(zhDate[2]) - 1, Number(zhDate[3])).getTime();

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function excerpt(text, maxLength) {
    const value = String(text || "").trim();
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength - 1).trim() + "…";
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(text) {
    return escapeHtml(text).replaceAll("`", "&#096;");
  }

  window.GalleryAppTest = {
    excerpt,
    formatDisplayDate,
    isFeatured,
    normalizeAlbum,
    parseDateValue,
    renderPhotoTile,
    sortAlbums,
    splitAlbums,
    getAlbumSections
  };

  if (typeof document !== "undefined" && document.addEventListener) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})();
