/* Global reset */
* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial;
  background: #0f1117;
  color: #f8f8f8;
  line-height: 1.6;
  height: 100%;
  width: 100%;
}

/* Smooth fade/slide animations */
@keyframes fadeUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.enter-up { animation: fadeUp 0.6s ease forwards; }

/* Header */
.app-header {
  padding: 1rem 2rem;
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(90deg,#1e1f29,#2d3142);
  box-shadow: 0 2px 20px rgba(0,0,0,0.4);
  position: sticky; top: 0; z-index: 10;
}
.app-header .brand { display: flex; align-items: center; gap: 1rem; }
.app-header .logo { font-size: 2rem; }
.app-header .title h1 { font-weight: 800; font-size: 1.4rem; }
.app-header .title p { font-size: 0.85rem; color: #aaa; }
.app-header .badge {
  color: #fff; text-decoration: none; font-weight: 600;
  background: #ff3366; padding: 0.4rem 0.8rem;
  border-radius: 8px; transition: all 0.3s;
}
.app-header .badge:hover { background: #ff5588; }

/* Layout */
.layout {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 2rem; padding: 2rem;
}
.left, .right { display: flex; flex-direction: column; gap: 1.5rem; }

/* Card look */
.card {
  background: #1a1c25;
  padding: 1.5rem;
  border-radius: 18px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
}

/* Form */
form .row { display: flex; gap: 1rem; margin-bottom: 1rem; }
form .row.two > * { flex: 1; }
.field label { font-size: 0.85rem; color: #ccc; margin-bottom: 0.4rem; display:block; }
.field input {
  width: 100%; padding: 0.7rem 0.9rem;
  border-radius: 10px; border: 1px solid #333;
  background: #0f1117; color: #fff;
}
.actions { display: flex; gap: 1rem; margin-top: 0.5rem; }
.btn-primary, .btn-ghost {
  flex: 1; padding: 0.9rem; font-weight: 600; border-radius: 10px;
  border: none; cursor: pointer; transition: all 0.25s;
}
.btn-primary { background: #ff3366; color: #fff; }
.btn-primary:hover { background: #ff5588; }
.btn-ghost { background: #2a2d38; color: #eee; }
.btn-ghost:hover { background: #44495c; }
.hint { font-size: 0.75rem; color: #999; margin-top: 0.7rem; }

/* Output stack */
.stack { display: flex; flex-direction: column; gap: 1.2rem; }
.stack .day-card {
  background: #242732; padding: 1rem; border-radius: 12px;
  border-left: 4px solid #ff3366; animation: fadeUp 0.5s ease;
}
.stack .day-card h3 { font-weight: 700; margin-bottom: 0.5rem; }

/* Map */
.map { width: 100%; height: 500px; }
.map-status { font-size: 0.8rem; color: #aaa; margin-top: 0.5rem; }

/* Footer */
.footer {
  padding: 1rem; text-align: center; font-size: 0.8rem; color: #888;
  border-top: 1px solid #222;
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 880px) {
  .layout { grid-template-columns: 1fr; }
  .right { order: -1; }
}
