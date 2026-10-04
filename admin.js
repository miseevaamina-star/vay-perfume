// ===================================================================
// VAY PERFUME — админка (Supabase Auth + CRUD по таблице fragrances)
// ===================================================================

const loginScreen = document.getElementById("loginScreen");
const adminApp = document.getElementById("adminApp");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginSubmit = document.getElementById("loginSubmit");
const loginError = document.getElementById("loginError");
const notConfiguredNote = document.getElementById("notConfiguredNote");
const adminStatus = document.getElementById("adminStatus");
const logoutBtn = document.getElementById("logoutBtn");
const adminTableBody = document.getElementById("adminTableBody");
const adminEmpty = document.getElementById("adminEmpty");
const fragCountEl = document.getElementById("fragCount");
const addFragBtn = document.getElementById("addFragBtn");

let currentList = [];
let pendingPhotoFile = null;
let editingId = null;

function setStatus(text, kind) {
  adminStatus.textContent = text || "";
  adminStatus.className = "admin-status" + (kind ? " " + kind : "");
}

// ---------------- вход ----------------
async function init() {
  if (!isSupabaseConfigured()) {
    notConfiguredNote.style.display = "block";
    loginSubmit.disabled = true;
    loginSubmit.style.opacity = ".5";
    return;
  }
  const sb = getSupabase();
  if (!sb) {
    loginError.textContent = "Не удалось загрузить Supabase (проверьте интернет-соединение).";
    return;
  }
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showApp();
  }
  sb.auth.onAuthStateChange((_event, session) => {
    if (session) showApp(); else showLogin();
  });
}

function showLogin() {
  loginScreen.style.display = "flex";
  adminApp.style.display = "none";
}
function showApp() {
  loginScreen.style.display = "none";
  adminApp.style.display = "block";
  loadList();
}

loginSubmit.addEventListener("click", async () => {
  const sb = getSupabase();
  if (!sb) return;
  loginError.textContent = "";
  loginSubmit.disabled = true;
  const { error } = await sb.auth.signInWithPassword({
    email: loginEmail.value.trim(),
    password: loginPassword.value,
  });
  loginSubmit.disabled = false;
  if (error) {
    loginError.textContent = "Не удалось войти: проверьте email и пароль.";
    return;
  }
});
loginPassword.addEventListener("keydown", (e) => { if (e.key === "Enter") loginSubmit.click(); });

logoutBtn.addEventListener("click", async () => {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  showLogin();
});

// ---------------- список товаров ----------------
async function loadList() {
  const sb = getSupabase();
  if (!sb) return;
  setStatus("Загрузка…");
  const { data, error } = await sb.from("fragrances").select("*").order("sort_order", { ascending: true });
  if (error) {
    setStatus("Ошибка загрузки: " + error.message, "err");
    return;
  }
  currentList = data || [];
  renderTable();
  setStatus("Синхронизировано с базой", "ok");
}

function renderTable() {
  fragCountEl.textContent = currentList.length;
  adminEmpty.style.display = currentList.length ? "none" : "block";
  adminTableBody.innerHTML = currentList.map(row => {
    const catLabel = row.category === "her" ? "Для неё" : row.category === "unisex" ? "Унисекс" : "Для него";
    return `
    <tr data-id="${row.id}">
      <td>${row.image_url ? `<img src="${row.image_url}" alt="">` : ""}</td>
      <td>${row.name}<div style="color:var(--taupe);font-size:12px;">${row.brand || ""}</div></td>
      <td>${catLabel}</td>
      <td>${row.price || ""}${row.old_price ? `<div style="color:var(--taupe);font-size:12px;text-decoration:line-through;">${row.old_price}</div>` : ""}</td>
      <td><span class="admin-badge${row.in_stock ? " instock" : ""}">${row.in_stock ? "В наличии" : "Под заказ"}</span></td>
      <td>${row.sort_order ?? 0}</td>
      <td>
        <div class="admin-row-actions">
          <button data-edit="${row.id}">Изменить</button>
          <button data-del="${row.id}" class="danger">Удалить</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  adminTableBody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openForm(btn.dataset.edit));
  });
  adminTableBody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => deleteFragrance(btn.dataset.del));
  });
}

// ---------------- форма ----------------
const fragModalOverlay = document.getElementById("fragModalOverlay");
const fragFormPhotoFile = document.getElementById("fragFormPhotoFile");
const fragFormPhotoPreview = document.getElementById("fragFormPhotoPreview");
const fragFormPhotoImg = document.getElementById("fragFormPhotoImg");
const fragFormPhotoStatus = document.getElementById("fragFormPhotoStatus");
const fragFormBrand = document.getElementById("fragFormBrand");
const fragFormName = document.getElementById("fragFormName");
const fragFormFeel = document.getElementById("fragFormFeel");
const fragFormNotesTop = document.getElementById("fragFormNotesTop");
const fragFormNotesHeart = document.getElementById("fragFormNotesHeart");
const fragFormNotesBase = document.getElementById("fragFormNotesBase");
const fragFormVolume = document.getElementById("fragFormVolume");
const fragFormOrder = document.getElementById("fragFormOrder");
const fragFormPrice = document.getElementById("fragFormPrice");
const fragFormOldPrice = document.getElementById("fragFormOldPrice");
const fragFormCharacter = document.getElementById("fragFormCharacter");
const fragFormType = document.getElementById("fragFormType");
const fragFormInStock = document.getElementById("fragFormInStock");
const fragFormError = document.getElementById("fragFormError");
const fragFormDelete = document.getElementById("fragFormDelete");
const fragGenderBtns = document.querySelectorAll(".frag-gender-btn");
let currentGender = "him";
let existingImageUrl = "";

fragGenderBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentGender = btn.dataset.gender;
    fragGenderBtns.forEach(b => b.classList.toggle("active", b === btn));
  });
});

fragFormPhotoFile.addEventListener("change", () => {
  const file = fragFormPhotoFile.files[0];
  if (!file) return;
  pendingPhotoFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    fragFormPhotoImg.src = e.target.result;
    fragFormPhotoPreview.style.display = "block";
  };
  reader.readAsDataURL(file);
  fragFormPhotoStatus.textContent = "Новое фото будет загружено при сохранении.";
});

function openForm(id) {
  editingId = id;
  pendingPhotoFile = null;
  fragFormPhotoFile.value = "";
  fragFormError.textContent = "";
  fragFormPhotoStatus.textContent = "";

  if (id) {
    const row = currentList.find(x => x.id === id);
    fragFormBrand.value = row.brand || "";
    fragFormName.value = row.name || "";
    fragFormFeel.value = row.feel || "";
    fragFormNotesTop.value = row.notes_top || "";
    fragFormNotesHeart.value = row.notes_heart || "";
    fragFormNotesBase.value = row.notes_base || "";
    fragFormVolume.value = row.volume || "";
    fragFormOrder.value = row.sort_order ?? 0;
    fragFormPrice.value = row.price || "";
    fragFormOldPrice.value = row.old_price || "";
    fragFormCharacter.value = row.character || "";
    fragFormType.value = row.type || "";
    fragFormInStock.checked = row.in_stock !== false;
    currentGender = row.category || "him";
    existingImageUrl = row.image_url || "";
    if (existingImageUrl) {
      fragFormPhotoImg.src = existingImageUrl;
      fragFormPhotoPreview.style.display = "block";
    } else {
      fragFormPhotoPreview.style.display = "none";
    }
    fragFormDelete.style.display = "block";
  } else {
    fragFormBrand.value = "";
    fragFormName.value = "";
    fragFormFeel.value = "";
    fragFormNotesTop.value = "";
    fragFormNotesHeart.value = "";
    fragFormNotesBase.value = "";
    fragFormVolume.value = "";
    fragFormOrder.value = currentList.length;
    fragFormPrice.value = "";
    fragFormOldPrice.value = "";
    fragFormCharacter.value = "";
    fragFormType.value = "";
    fragFormInStock.checked = true;
    currentGender = "him";
    existingImageUrl = "";
    fragFormPhotoPreview.style.display = "none";
    fragFormDelete.style.display = "none";
  }
  fragGenderBtns.forEach(b => b.classList.toggle("active", b.dataset.gender === currentGender));
  fragModalOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeForm() {
  fragModalOverlay.classList.remove("open");
  document.body.style.overflow = "";
}
document.getElementById("fragFormCancel").addEventListener("click", closeForm);
fragModalOverlay.addEventListener("click", (e) => { if (e.target === fragModalOverlay) closeForm(); });

function slugify(name) {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .trim().replace(/\s+/g, "-");
  return (base || "item") + "-" + Date.now().toString(36);
}

async function uploadPhotoIfNeeded(id) {
  if (!pendingPhotoFile) return existingImageUrl;
  const sb = getSupabase();
  const ext = (pendingPhotoFile.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${id}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("fragrance-photos").upload(path, pendingPhotoFile, {
    upsert: true,
    contentType: pendingPhotoFile.type || "image/jpeg",
  });
  if (error) throw new Error("Не удалось загрузить фото: " + error.message);
  const { data } = sb.storage.from("fragrance-photos").getPublicUrl(path);
  return data.publicUrl;
}

document.getElementById("fragFormSave").addEventListener("click", async () => {
  const sb = getSupabase();
  if (!sb) return;
  const name = fragFormName.value.trim();
  if (!name) { fragFormError.textContent = "Укажите название аромата."; return; }

  const saveBtn = document.getElementById("fragFormSave");
  saveBtn.disabled = true;
  fragFormError.textContent = "";

  try {
    const id = editingId || slugify(name);
    const imageUrl = await uploadPhotoIfNeeded(id);

    const row = {
      id,
      name,
      brand: fragFormBrand.value.trim(),
      category: currentGender,
      volume: fragFormVolume.value.trim(),
      price: fragFormPrice.value.trim(),
      old_price: fragFormOldPrice.value.trim(),
      feel: fragFormFeel.value.trim(),
      notes_top: fragFormNotesTop.value.trim(),
      notes_heart: fragFormNotesHeart.value.trim(),
      notes_base: fragFormNotesBase.value.trim(),
      character: fragFormCharacter.value.trim(),
      type: fragFormType.value,
      in_stock: fragFormInStock.checked,
      image_url: imageUrl,
      sort_order: parseInt(fragFormOrder.value, 10) || 0,
      is_visible: true,
    };

    const { error } = await sb.from("fragrances").upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);

    closeForm();
    await loadList();
  } catch (e) {
    fragFormError.textContent = e.message || "Не удалось сохранить.";
  } finally {
    saveBtn.disabled = false;
  }
});

fragFormDelete.addEventListener("click", async () => {
  if (!editingId) return;
  if (!confirm("Удалить этот аромат безвозвратно?")) return;
  await deleteFragrance(editingId);
  closeForm();
});

async function deleteFragrance(id) {
  const sb = getSupabase();
  if (!sb) return;
  if (!confirm("Удалить этот аромат безвозвратно?")) return;
  const { error } = await sb.from("fragrances").delete().eq("id", id);
  if (error) { alert("Не удалось удалить: " + error.message); return; }
  await loadList();
}

addFragBtn.addEventListener("click", () => openForm(null));

init();
