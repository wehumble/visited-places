function Contact(id, name, email, phone, address) {
  this.id = id || String(Date.now()) + Math.random().toString(36).slice(2,8);
  this.name = name || "";
  this.email = email || "";
  this.phone = phone || "";
  this.address = address || "";
}

Contact.prototype.summary = function () {
  return `${this.name}${this.email ? " — " + this.email : ""}${this.phone ? " (" + this.phone + ")" : ""}`;
};

function AddressBook() {
  this.contacts = [];
}

AddressBook.prototype.addContact = function (contact) {
  if (!(contact instanceof Contact)) {
    throw new TypeError("Must pass a Contact instance");
  }
  this.contacts.push(contact);
  return contact;
};

AddressBook.prototype.findById = function (id) {
  return this.contacts.find(c => c.id === id) || null;
};

AddressBook.prototype.findByName = function (name) {
  const n = String(name).toLowerCase();
  return this.contacts.filter(c => c.name.toLowerCase().includes(n));
};

AddressBook.prototype.updateContact = function (id, updates) {
  const c = this.findById(id);
  if (!c) return null;
  Object.keys(updates).forEach(k => {
    if (k in c) c[k] = updates[k];
  });
  return c;
};

AddressBook.prototype.removeContact = function (id) {
  const idx = this.contacts.findIndex(c => c.id === id);
  if (idx === -1) return false;
  this.contacts.splice(idx,1);
  return true;
};

/*Places Constructor & Prototype*/

function Place(id, name, location, landmarks, season, notes) {
  this.id = id || String(Date.now()) + Math.random().toString(36).slice(2,8);
  this.name = name || "";
  this.location = location || "";
  // store landmarks as array
  this.landmarks = Array.isArray(landmarks) ? landmarks : (landmarks ? String(landmarks).split(/\s*,\s*/) : []);
  this.season = season || "";
  this.notes = notes || "";
  this.visitedAt = new Date();
}

Place.prototype.summary = function() {
  return `${this.name} — ${this.location || "unknown location"}`;
};

Place.prototype.detailEntries = function() {
  return {
    Name: this.name,
    Location: this.location,
    Landmarks: this.landmarks.join(", "),
    "Time of year": this.season,
    Notes: this.notes,
    "Visited at": this.visitedAt.toISOString()
  };
};

/* In-memory stores (simple)*/

const book = new AddressBook();
const places = []; // array of Place instances

/*DOM Utilities & UI glue */

function el(q) { return document.querySelector(q); }
function elAll(q) { return Array.from(document.querySelectorAll(q)); }

function renderContacts() {
  const list = el("#contacts-list");
  list.innerHTML = "";
  book.contacts.forEach(c => {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.dataset.id = c.id;
    li.textContent = c.summary();
    list.appendChild(li);
  });
}

function renderPlaces() {
  const list = el("#places-list");
  list.innerHTML = "";
  places.forEach(p => {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.dataset.id = p.id;
    li.textContent = p.summary();
    list.appendChild(li);
  });
}

/* Event handlers */
document.addEventListener("DOMContentLoaded", () => {
  // forms
  el("#ab-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = el("#contact-name").value.trim();
    const email = el("#contact-email").value.trim();
    const phone = el("#contact-phone").value.trim();
    const addressVal = el("#contact-address").value.trim();
    if (!name) return alert("Name required");
    const c = new Contact(null, name, email, phone, addressVal);
    book.addContact(c);
    renderContacts();
    ev.target.reset();
  });

  el("#place-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = el("#place-name").value.trim();
    if (!name) return alert("Place name required");
    const location = el("#place-location").value.trim();
    const landmarks = el("#place-landmarks").value.trim();
    const season = el("#place-season").value.trim();
    const notes = el("#place-notes").value.trim();
    const p = new Place(null, name, location, landmarks, season, notes);
    places.push(p);
    renderPlaces();
    ev.target.reset();
  });

  // click handlers for lists (event delegation)
  el("#contacts-list").addEventListener("click", (ev) => {
    const li = ev.target.closest("li");
    if (!li) return;
    const id = li.dataset.id;
    showContactDetails(id);
  });
  el("#contacts-list").addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") ev.target.click();
  });

  el("#places-list").addEventListener("click", (ev) => {
    const li = ev.target.closest("li");
    if (!li) return;
    const id = li.dataset.id;
    showPlaceDetails(id);
  });
  el("#places-list").addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") ev.target.click();
  });

  // contact detail buttons
  el("#contact-close").addEventListener("click", () => {
    el("#contact-details").hidden = true;
  });

  el("#contact-delete").addEventListener("click", () => {
    const id = el("#contact-details").dataset.id;
    if (!id) return;
    if (confirm("Delete contact?")) {
      book.removeContact(id);
      renderContacts();
      el("#contact-details").hidden = true;
    }
  });

  el("#contact-edit").addEventListener("click", () => {
    const id = el("#contact-details").dataset.id;
    const contact = book.findById(id);
    if (!contact) return;
    // populate form for quick edit (simple approach)
    el("#contact-name").value = contact.name;
    el("#contact-email").value = contact.email;
    el("#contact-phone").value = contact.phone;
    el("#contact-address").value = contact.address;
    // remove old and let submit add a new entity with new id (simple UX)
    book.removeContact(id);
    renderContacts();
    el("#contact-details").hidden = true;
  });

  el("#place-close").addEventListener("click", () => {
    el("#place-details").hidden = true;
  });

  // run unit tests
  runTests();
});

/* show details functions */
function showContactDetails(id) {
  const c = book.findById(id);
  if (!c) return;
  el("#contact-detail-block").innerHTML = `
    <strong>${escapeHtml(c.name)}</strong><br/>
    ${c.email ? `<a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a><br/>` : ""}
    ${c.phone ? `<span>Phone: ${escapeHtml(c.phone)}</span><br/>` : ""}
    ${c.address ? `<span>${escapeHtml(c.address)}</span>` : ""}
  `;
  el("#contact-details").dataset.id = c.id;
  el("#contact-details").hidden = false;
}

function showPlaceDetails(id) {
  const p = places.find(x => x.id === id);
  if (!p) return;
  const entries = p.detailEntries();
  const dl = el("#place-detail-block");
  dl.innerHTML = "";
  Object.keys(entries).forEach(k => {
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = entries[k];
    dl.appendChild(dt);
    dl.appendChild(dd);
  });
  el("#place-details").dataset.id = p.id;
  el("#place-details").hidden = false;
}

/* small HTML escape util */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

/*Tiny test runner for TDD*/

function assert(name, condition) {
  const log = el("#test-log");
  const li = document.createElement("li");
  li.textContent = `${name}: ${condition ? "PASS" : "FAIL"}`;
  if (condition) {
    li.style.color = "lightgreen";
  } else {
    li.style.color = "salmon";
  }
  log.appendChild(li);
  console.assert(condition, name);
}

function runTests() {
  // clean test DOM area
  el("#test-log").innerHTML = "";

  // Test 1: Contact creation & summary
  const c1 = new Contact("id-1", "Ada Lovelace", "ada@example.com", "555-0101", "1 Computer Ln");
  assert("Contact created with correct name", c1.name === "Ada Lovelace");
  assert("Contact summary includes email", c1.summary().includes("ada@example.com"));

  // Test 2: AddressBook add/find/remove
  const ab = new AddressBook();
  ab.addContact(c1);
  assert("AddressBook stores contact", ab.findById("id-1") === c1);
  assert("Find by name works", ab.findByName("Ada").length === 1);

  const removed = ab.removeContact("id-1");
  assert("Contact removal returns true", removed === true);
  assert("Contact no longer present", ab.findById("id-1") === null);

  // Test 3: updateContact returns null for missing id
  const upNull = ab.updateContact("missing-id", { name: "xxx" });
  assert("updateContact returns null for unknown id", upNull === null);

  // Test 4: Place creation & detailEntries
  const p1 = new Place("p-1", "Mt. Kilimanjaro", "Tanzania", "Uhuru Peak,Marangu Gate", "July", "Epic climb");
  assert("Place created with landmarks array", Array.isArray(p1.landmarks) && p1.landmarks.length >= 1);
  const details = p1.detailEntries();
  assert("Place detailEntries has Name", details.Name === "Mt. Kilimanjaro");

  // Test 5: Add place to store and render
  places.length = 0;
  places.push(p1);
  renderPlaces();
  assert("Places rendered to DOM", el("#places-list").children.length === 1);

  // Test 6: Add and edit contact via AddressBook (end-to-end)
  const c2 = new Contact("id-2","Grace Hopper","grace@navy.mil","555-0202","2 Code Rd");
  book.addContact(c2);
  renderContacts();
  assert("book has new contact", book.findById("id-2") === c2);
  book.updateContact("id-2",{phone:"555-9999"});
  assert("book updateContact changed phone", book.findById("id-2").phone === "555-9999");

  // Final summary
  assert("All tests completed (see above)", true);
  console.log("Unit tests completed - check the Tests section in the page and the console for details.");
}
