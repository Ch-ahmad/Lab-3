const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const methodOverride = require('method-override');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const contactsPath = path.join(__dirname, 'contacts.json');

function readContacts() {
  try {
    return JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT' || err.message.includes('Unexpected end of JSON input')) {
      console.log('Contacts file is empty or does not exist, initializing with an empty array.');
      return [];
    } else {
      throw err;
    }
  }
}

function writeContacts(contacts) {
  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));
}

function formatTimes(contact) {
  return {
    ...contact,
    createdFormatted: new Date(contact.created).toLocaleString(),
    lastEditedFormatted: new Date(contact.lastEdited).toLocaleString()
  };
}

app.get('/', (req, res) => res.render('index'));

app.get('/contacts', (req, res) => res.render('contacts', { contacts: readContacts().map(formatTimes) }));

app.get('/contacts/new', (req, res) => res.render('new'));

app.get('/contacts/:id', (req, res) => {
  const contact = readContacts().map(formatTimes).find(c => c.id === req.params.id);
  if (!contact) res.status(404).send('Contact not found');
  else res.render('contact', { contact });
});

app.post('/contacts', (req, res) => {
  const contacts = readContacts();
  const newContact = { id: uuidv4(), ...req.body, created: new Date().toISOString(), lastEdited: new Date().toISOString() };
  contacts.push(newContact);
  writeContacts(contacts);
  res.redirect(`/contacts/${newContact.id}`);
});

app.get('/contacts/:id/edit', (req, res) => {
  const contact = readContacts().map(formatTimes).find(c => c.id === req.params.id);
  res.render('editContact', { contact });
});

app.put('/contacts/:id', (req, res) => {
  let contacts = readContacts();
  contacts = contacts.map(c => c.id === req.params.id ? { ...c, ...req.body, lastEdited: new Date().toISOString() } : c);
  writeContacts(contacts);
  res.redirect(`/contacts/${req.params.id}`);
});

app.delete('/contacts/:id', (req, res) => {
  writeContacts(readContacts().filter(c => c.id !== req.params.id));
  res.redirect('/contacts');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`Something broke! Error: ${err.message}`);
});

app.listen(3000, () => console.log('Server started on port 3000'));
