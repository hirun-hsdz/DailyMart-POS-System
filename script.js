const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const TAX = 0.08,
  KEY = "dailymart-v1";
const CATS = [
  "Fruits & Veg",
  "Dairy",
  "Bakery",
  "Pantry",
  "Drinks",
  "Household",
];
const money = (n) =>
  "Rs. " +
  Number(n).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const P = (name, category, price, stock) => ({
  id: uid() + name.length,
  name,
  category,
  price,
  stock,
});
const seed = () => ({
  seq: 1000,
  products: [
    P("Bananas (1kg)", "Fruits & Veg", 280, 40),
    P("Tomatoes (500g)", "Fruits & Veg", 220, 30),
    P("Carrots (500g)", "Fruits & Veg", 190, 25),
    P("Fresh milk 1L", "Dairy", 390, 20),
    P("Curd pot", "Dairy", 260, 18),
    P("Cheese slices", "Dairy", 720, 12),
    P("Sandwich bread", "Bakery", 180, 22),
    P("Butter bun", "Bakery", 60, 50),
    P("Samba rice 5kg", "Pantry", 1450, 15),
    P("Lentils 1kg", "Pantry", 620, 20),
    P("Coconut oil 1L", "Pantry", 980, 14),
    P("Ginger beer 1L", "Drinks", 340, 24),
    P("Orange juice 1L", "Drinks", 560, 16),
    P("Dish soap", "Household", 410, 18),
  ],
  customers: [
    {
      id: "c1",
      name: "Nimal Perera",
      phone: "0771234567",
      email: "nimal@example.com",
    },
    {
      id: "c2",
      name: "Sanduni Silva",
      phone: "0712345678",
      email: "sanduni@example.com",
    },
  ],
  orders: [],
});
let db;
try {
  db = JSON.parse(localStorage.getItem(KEY));
} catch {}
db = db || seed();
let cart = [],
  cat = "All",
  q = "";
const save = () => localStorage.setItem(KEY, JSON.stringify(db));
function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2200);
}

/* navigation */
$("#nav").onclick = (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  $$("#nav button").forEach((x) => x.classList.toggle("on", x === b));
  $$(".view").forEach((v) => v.classList.toggle("on", v.id === b.dataset.view));
};

/* checkout screen */
function renderCats() {
  $("#cats").innerHTML = ["All", ...CATS]
    .map(
      (c) =>
        `<button class="${c === cat ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`,
    )
    .join("");
}
$("#cats").onclick = (e) => {
  const b = e.target.closest("button");
  if (b) {
    cat = b.dataset.c;
    renderCats();
    renderGrid();
  }
};
$("#search").oninput = (e) => {
  q = e.target.value.toLowerCase();
  renderGrid();
};
function renderGrid() {
  const list = db.products.filter(
    (p) =>
      (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q),
  );
  $("#grid").innerHTML = list.length
    ? list
        .map(
          (p) =>
            `<button class="item" data-id="${p.id}" ${p.stock < 1 ? "disabled" : ""}><b>${esc(p.name)}</b><small>${esc(p.category)} · ${p.stock < 1 ? "Out of stock" : p.stock + " left"}</small><span class="p">${money(p.price)}</span></button>`,
        )
        .join("")
    : '<p class="note">No products match. Try another category or search.</p>';
}
$("#grid").onclick = (e) => {
  const b = e.target.closest(".item");
  if (b) addToCart(b.dataset.id);
};
function addToCart(id) {
  const p = db.products.find((x) => x.id === id),
    l = cart.find((x) => x.id === id);
  if ((l ? l.qty : 0) >= p.stock)
    return toast("Only " + p.stock + " of " + p.name + " in stock");
  l ? l.qty++ : cart.push({ id, qty: 1 });
  renderCart();
}
function totals() {
  const sub = cart.reduce(
    (s, l) => s + l.qty * db.products.find((p) => p.id === l.id).price,
    0,
  );
  const tax = +(sub * TAX).toFixed(2);
  return { sub, tax, total: sub + tax };
}
function renderCart() {
  $("#cart").innerHTML = cart.length
    ? cart
        .map((l) => {
          const p = db.products.find((x) => x.id === l.id);
          return `<li><span>${esc(p.name)}</span><b>${money(p.price * l.qty)}</b><span class="qty"><button data-d="-1" data-id="${l.id}" aria-label="Decrease">−</button>${l.qty}<button data-d="1" data-id="${l.id}" aria-label="Increase">+</button></span><button class="danger" data-rm="${l.id}">Remove</button></li>`;
        })
        .join("")
    : '<li class="empty">The bill is empty. Tap a product to add it.</li>';
  const t = totals();
  $("#sub").textContent = money(t.sub);
  $("#tax").textContent = money(t.tax);
  $("#tot").textContent = money(t.total);
}
$("#cart").onclick = (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.rm) cart = cart.filter((l) => l.id !== b.dataset.rm);
  else if (b.dataset.d) {
    const l = cart.find((x) => x.id === b.dataset.id);
    if (b.dataset.d === "1") return addToCart(l.id);
    l.qty--;
    if (l.qty < 1) cart = cart.filter((x) => x !== l);
  }
  renderCart();
};
$("#clear").onclick = () => {
  cart = [];
  renderCart();
};
function renderCustSel() {
  const v = $("#custSel").value;
  $("#custSel").innerHTML =
    '<option value="">Walk-in customer</option>' +
    db.customers
      .map((c) => `<option value="${c.id}">${esc(c.name)}</option>`)
      .join("");
  $("#custSel").value = v;
}
$("#pay").onclick = () => {
  if (!cart.length) return toast("Add at least one product first");
  const t = totals(),
    c = db.customers.find((x) => x.id === $("#custSel").value);
  const o = {
    id: "ORD-" + ++db.seq,
    date: new Date().toISOString(),
    customerName: c ? c.name : "Walk-in",
    status: "Paid",
    items: cart.map((l) => {
      const p = db.products.find((x) => x.id === l.id);
      p.stock -= l.qty;
      return { name: p.name, price: p.price, qty: l.qty };
    }),
    ...t,
  };
  db.orders.unshift(o);
  save();
  cart = [];
  renderAll();
  showReceipt(o);
  toast("Order " + o.id + " saved");
};

/* receipt */
function showReceipt(o) {
  $("#receipt").innerHTML =
    `<h2>DailyMart</h2><p>${esc(o.id)} · ${new Date(o.date).toLocaleString()}<br>Customer: ${esc(o.customerName)}</p><hr>` +
    o.items
      .map(
        (i) =>
          `<div class="ln"><span>${i.qty} × ${esc(i.name)}</span><span>${money(i.qty * i.price)}</span></div>`,
      )
      .join("") +
    `<hr><div class="ln"><span>Subtotal</span><span>${money(o.sub)}</span></div><div class="ln"><span>Tax (8%)</span><span>${money(o.tax)}</span></div><div class="ln"><b>Total</b><b>${money(o.total)}</b></div><hr><p>Thank you for shopping with us.</p>`;
  $("#rcpDlg").showModal();
}
$("#rcpClose").onclick = () => $("#rcpDlg").close();
$("#rcpPrint").onclick = () => window.print();

/* tables */
function renderProducts() {
  $("#tbProducts").innerHTML =
    db.products
      .map(
        (p) =>
          `<tr><td data-l="Name">${esc(p.name)}</td><td data-l="Category">${esc(p.category)}</td><td data-l="Price">${money(p.price)}</td><td data-l="Stock" class="${p.stock <= 5 ? "low" : ""}">${p.stock}</td><td><button data-edit="products" data-id="${p.id}">Edit</button><button class="danger" data-del="products" data-id="${p.id}">Delete</button></td></tr>`,
      )
      .join("") ||
    "<tr><td>No products yet. Add one to start selling.</td></tr>";
}
function renderCustomers() {
  $("#tbCustomers").innerHTML =
    db.customers
      .map(
        (c) =>
          `<tr><td data-l="Name">${esc(c.name)}</td><td data-l="Phone">${esc(c.phone)}</td><td data-l="Email">${esc(c.email || "-")}</td><td><button data-edit="customers" data-id="${c.id}">Edit</button><button class="danger" data-del="customers" data-id="${c.id}">Delete</button></td></tr>`,
      )
      .join("") ||
    "<tr><td>No customers yet. Add one to link them to orders.</td></tr>";
}
function renderOrders() {
  $("#revenue").textContent =
    "Paid revenue: " +
    money(
      db.orders
        .filter((o) => o.status === "Paid")
        .reduce((s, o) => s + o.total, 0),
    );
  $("#tbOrders").innerHTML =
    db.orders
      .map(
        (o) =>
          `<tr><td data-l="Order">${o.id}</td><td data-l="Date">${new Date(o.date).toLocaleDateString()}</td><td data-l="Customer">${esc(o.customerName)}</td><td data-l="Total">${money(o.total)}</td><td data-l="Status"><span class="tag ${o.status}">${o.status}</span></td><td><button data-view-o="${o.id}">Receipt</button><button data-edit="orders" data-id="${o.id}">Edit</button><button class="danger" data-del="orders" data-id="${o.id}">Delete</button></td></tr>`,
      )
      .join("") ||
    "<tr><td>No orders yet. Complete a sale at Checkout.</td></tr>";
}

/* generic CRUD form */
const FIELDS = {
  products: [
    ["name", "Name", "text"],
    ["category", "Category", "select", CATS],
    ["price", "Price (Rs.)", "number"],
    ["stock", "Stock", "number"],
  ],
  customers: [
    ["name", "Name", "text"],
    ["phone", "Phone", "tel"],
    ["email", "Email", "email"],
  ],
  orders: [
    ["customerName", "Customer name", "text"],
    ["status", "Status", "select", ["Paid", "Pending", "Refunded"]],
  ],
};
function openForm(type, id) {
  const rec = id ? db[type].find((x) => x.id === id) : {};
  $("#form").innerHTML =
    `<h2>${id ? "Edit" : "Add"} ${type.slice(0, -1)}</h2>` +
    FIELDS[type]
      .map(
        ([k, l, t, opts]) =>
          `<label>${l}` +
          (t === "select"
            ? `<select name="${k}">${opts.map((o) => `<option ${rec[k] === o ? "selected" : ""}>${o}</option>`).join("")}</select>`
            : `<input name="${k}" type="${t}" value="${esc(rec[k] ?? "")}" ${t === "number" ? 'min="0" step="any"' : ""}>`) +
          "</label>",
      )
      .join("") +
    `<p class="err" id="err"></p><div class="row"><button type="button" class="ghost" id="cancel">Cancel</button><button class="primary">Save</button></div>`;
  $("#cancel").onclick = () => $("#formDlg").close();
  $("#form").onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData($("#form")));
    d.name = (d.name || "").trim();
    if (
      (type !== "orders" && !d.name) ||
      (type === "orders" && !d.customerName.trim())
    )
      return ($("#err").textContent = "Please enter a name.");
    if (type === "products") {
      d.price = +d.price;
      d.stock = Math.floor(+d.stock);
      if (!(d.price > 0) || !(d.stock >= 0))
        return ($("#err").textContent =
          "Price must be above 0 and stock cannot be negative.");
    }
    if (type === "customers" && !/^[0-9+\- ]{7,15}$/.test(d.phone))
      return ($("#err").textContent = "Enter a valid phone number.");
    if (id) Object.assign(rec, d);
    else db[type].push({ id: uid(), ...d });
    save();
    renderAll();
    $("#formDlg").close();
    toast(id ? "Changes saved" : "Added");
  };
  $("#formDlg").showModal();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.add) openForm(b.dataset.add);
  if (b.dataset.edit) openForm(b.dataset.edit, b.dataset.id);
  if (b.dataset.viewO)
    showReceipt(db.orders.find((o) => o.id === b.dataset.viewO));
  if (b.dataset.del && confirm("Delete this record? This cannot be undone.")) {
    db[b.dataset.del] = db[b.dataset.del].filter((x) => x.id !== b.dataset.id);
    cart = cart.filter((l) => db.products.some((p) => p.id === l.id));
    save();
    renderAll();
    toast("Deleted");
  }
});

function renderAll() {
  renderCats();
  renderGrid();
  renderCart();
  renderCustSel();
  renderProducts();
  renderCustomers();
  renderOrders();
}
renderAll();
