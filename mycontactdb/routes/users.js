module.exports = (dependencies) => {
  const express = require('express');
  const router = express.Router();
  const { loadContacts, saveContacts, Contact } = dependencies;

  // GET route for listing all contacts
  router.get('/contacts', function(req, res) {
      const contacts = loadContacts();
      res.render('contacts', { contacts });
  });

  // POST route for adding a new contact
  router.post('/add-contact', function(req, res) {
      const { firstName, lastName, email, notes } = req.body;
      const newContact = new Contact(firstName, lastName, email, notes);
      const contacts = loadContacts();
      contacts.push(newContact);
      saveContacts(contacts);
      res.redirect('/users/contacts');
  });

  // GET route for displaying the edit contact form
  router.get('/edit-contact/:id', function(req, res) {
      const contacts = loadContacts();
      const contact = contacts.find(contact => contact.id === req.params.id);
      if (!contact) {
          return res.status(404).send('Contact not found.');
      }
      res.render('editContact', { contact });
  });

  // POST route for updating a contact
  router.post('/edit-contact/:id', function(req, res) {
      let contacts = loadContacts();
      contacts = contacts.map(contact => {
          if (contact.id === req.params.id) {
              return { ...contact, ...req.body, lastEdited: new Date().toISOString() };
          }
          return contact;
      });
      saveContacts(contacts);
      res.redirect('/users/contacts');
  });

  // POST route for deleting a contact
  router.post('/delete-contact/:id', function(req, res) {
      let contacts = loadContacts();
      contacts = contacts.filter(contact => contact.id !== req.params.id);
      saveContacts(contacts);
      res.redirect('/users/contacts');
  });

  return router;
};
