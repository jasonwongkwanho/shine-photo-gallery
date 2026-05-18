function doGet(e) {
  e = e || { parameter: {} };

  const action = e.parameter.action || "albums";
  const publicReadActions = ["albums", "photos", "latest", "list"];

  try {
    // GitHub Pages 版本：只開放公開 read-only action，不需要 token。
    // 注意：不要在前台放 API_SECRET。所有寫入／刪除功能日後才需要 token 保護。
    if (!publicReadActions.includes(action)) {
      return jsonOutput_({ ok: false, error: "Unknown action" }, e);
    }

    if (action === "albums") {
      return jsonOutput_(getAlbumsData_(), e);
    }

    if (action === "photos") {
      return jsonOutput_(getPhotosByAlbumData_(e.parameter.albumId), e);
    }

    if (action === "latest" || action === "list") {
      return jsonOutput_(getLatestPhotosData_(e.parameter.limit || 24), e);
    }

    return jsonOutput_({ ok: false, error: "Unknown action" }, e);
  } catch (error) {
    return jsonOutput_({ ok: false, error: error.message }, e);
  }
}

function getAlbumsData_() {
  const albums = getPublishedAlbums_();

  const result = albums.map(function(album) {
    const photos = getImagesFromFolder_(album.folderId);
    const latestPhoto = photos[0] || null;

    return {
      id: album.albumId,
      albumId: album.albumId,
      title: album.title,
      folderId: album.folderId,
      category: album.category,
      dateText: album.dateText,
      description: album.description,
      coverFileId: album.coverFileId,
      coverUrl: album.coverFileId
        ? makeThumbnailUrl_(album.coverFileId)
        : latestPhoto
          ? latestPhoto.thumbnailUrl
          : "",
      photoCount: photos.length,
      latestUpdated: latestPhoto ? latestPhoto.updatedAt : "",
      sortOrder: album.sortOrder,
      featured: album.featured
    };
  });

  result.sort(function(a, b) {
    return Number(a.sortOrder || 999) - Number(b.sortOrder || 999);
  });

  return { ok: true, count: result.length, albums: result };
}

function getPhotosByAlbumData_(albumId) {
  if (!albumId) {
    return { ok: false, error: "Missing albumId" };
  }

  const albums = getPublishedAlbums_();
  const album = albums.find(function(item) {
    return item.albumId === albumId;
  });

  if (!album) {
    return { ok: false, error: "Album not found" };
  }

  const photos = getImagesFromFolder_(album.folderId);

  return {
    ok: true,
    album: {
      id: album.albumId,
      albumId: album.albumId,
      title: album.title,
      category: album.category,
      dateText: album.dateText,
      description: album.description
    },
    count: photos.length,
    photos: photos
  };
}

function getLatestPhotosData_(limit) {
  const albums = getPublishedAlbums_();
  let allPhotos = [];

  albums.forEach(function(album) {
    const photos = getImagesFromFolder_(album.folderId).map(function(photo) {
      return Object.assign({}, photo, {
        albumId: album.albumId,
        albumTitle: album.title,
        category: album.category
      });
    });

    allPhotos = allPhotos.concat(photos);
  });

  allPhotos.sort(function(a, b) {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const max = Math.max(1, Number(limit) || 24);

  return {
    ok: true,
    count: allPhotos.length,
    photos: allPhotos.slice(0, max)
  };
}

function getPublishedAlbums_() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("ALBUM_SHEET_ID");
  const sheetName = props.getProperty("ALBUM_SHEET_NAME") || "Albums";

  if (!sheetId) {
    throw new Error("Missing ALBUM_SHEET_ID");
  }

  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Cannot find sheet: " + sheetName);
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) return [];

  const headers = values[0].map(function(h) {
    return String(h).trim();
  });

  const idx = function(name) {
    return headers.indexOf(name);
  };

  const requiredHeaders = [
    "albumId",
    "title",
    "folderId",
    "category",
    "dateText",
    "description",
    "coverFileId",
    "published",
    "sortOrder"
  ];

  requiredHeaders.forEach(function(header) {
    if (idx(header) === -1) {
      throw new Error("Missing column: " + header);
    }
  });

  return values.slice(1)
    .map(function(row) {
      return {
        albumId: String(row[idx("albumId")] || "").trim(),
        title: String(row[idx("title")] || "").trim(),
        folderId: String(row[idx("folderId")] || "").trim(),
        category: String(row[idx("category")] || "").trim(),
        dateText: String(row[idx("dateText")] || "").trim(),
        description: String(row[idx("description")] || "").trim(),
        coverFileId: String(row[idx("coverFileId")] || "").trim(),
        published: String(row[idx("published")] || "").trim().toUpperCase(),
        sortOrder: row[idx("sortOrder")],
        featured: idx("featured") >= 0 ? String(row[idx("featured")] || "").trim().toUpperCase() : "FALSE"
      };
    })
    .filter(function(album) {
      return album.albumId && album.title && album.folderId && album.published === "TRUE";
    });
}

function getImagesFromFolder_(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const photos = [];

  while (files.hasNext()) {
    const file = files.next();
    const mimeType = file.getMimeType();

    if (!mimeType.startsWith("image/")) continue;

    const fileId = file.getId();

    photos.push({
      id: fileId,
      name: file.getName(),
      mimeType: mimeType,
      createdAt: file.getDateCreated().toISOString(),
      updatedAt: file.getLastUpdated().toISOString(),
      thumbnailUrl: makeThumbnailUrl_(fileId),
      viewUrl: "https://drive.google.com/file/d/" + fileId + "/view"
    });
  }

  photos.sort(function(a, b) {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return photos;
}

function makeThumbnailUrl_(fileId) {
  return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200";
}

function jsonOutput_(data, e) {
  const json = JSON.stringify(data);
  const callback = e && e.parameter ? String(e.parameter.callback || "") : "";

  if (callback && isValidCallbackName_(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidCallbackName_(name) {
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(name);
}

function authorizeSetup() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("ALBUM_SHEET_ID");
  const sheetName = props.getProperty("ALBUM_SHEET_NAME") || "Albums";

  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();

  Logger.log("Sheet name: " + sheet.getName());
  Logger.log("Rows: " + values.length);
}
