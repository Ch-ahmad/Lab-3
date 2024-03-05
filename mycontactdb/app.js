const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const methodOverride = require('method-override');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const dbPath = path.join(__dirname, 'data', 'contacts.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the contacts database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    created TEXT,
    lastEdited TEXT
  )`);
});

function readContacts(callback) {
  db.all("SELECT * FROM contacts", [], (err, rows) => {
    if (err) {
      throw err;
    }
    callback(rows.map(formatTimes));
  });
}

function formatTimes(contact) {
  return {
    ...contact,
    createdFormatted: new Date(contact.created).toLocaleString(),
    lastEditedFormatted: new Date(contact.lastEdited).toLocaleString()
  };
}

app.get('/', (req, res) => res.render('index'));

app.get('/contacts', (req, res) => {
  readContacts((contacts) => {
    res.render('contacts', { contacts });
  });
});

app.get('/contacts/new', (req, res) => res.render('new'));

app.get('/contacts/:id', (req, res) => {
  db.get("SELECT * FROM contacts WHERE id = ?", [req.params.id], (err, contact) => {
    if (err) {
      return console.error(err.message);
    }
    if (!contact) {
      res.status(404).send('Contact not found');
    } else {
      res.render('contact', { contact: formatTimes(contact) });
    }
  });
});

app.post('/contacts', (req, res) => {
  const newContact = { id: uuidv4(), ...req.body, created: new Date().toISOString(), lastEdited: new Date().toISOString() };
  db.run("INSERT INTO contacts (id, name, email, phone, created, lastEdited) VALUES (?, ?, ?, ?, ?, ?)", [newContact.id, newContact.name, newContact.email, newContact.phone, newContact.created, newContact.lastEdited], function(err) {
    if (err) {
      return console.log(err.message);
    }
    res.redirect(`/contacts/${newContact.id}`);
  });
});

app.get('/contacts/:id/edit', (req, res) => {
  db.get("SELECT * FROM contacts WHERE id = ?", [req.params.id], (err, contact) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('editContact', { contact: formatTimes(contact) });
  });
});

app.put('/contacts/:id', (req, res) => {
  const { name, email, phone } = req.body;
  const lastEdited = new Date().toISOString();
  db.run("UPDATE contacts SET name = ?, email = ?, phone = ?, lastEdited = ? WHERE id = ?", [name, email, phone, lastEdited, req.params.id], function(err) {
    if (err) {
      return console.error(err.message);
    }
    res.redirect(`/contacts/${req.params.id}`);
  });
});

app.delete('/contacts/:id', (req, res) => {
  db.run("DELETE FROM contacts WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return console.error(err.message);
    }
    res.redirect('/contacts');
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`Something broke! Error: ${err.message}`);
});

app.listen(3000, () => console.log('Server started on port 3000'));
