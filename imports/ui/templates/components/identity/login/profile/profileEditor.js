import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

import { validateUsername } from '/imports/startup/both/modules/User';
import { searchJSON } from '/imports/ui/modules/JSON';
import { geo } from '/lib/geo';
import { templetize, getImage } from '/imports/ui/templates/layout/templater';


import '/imports/ui/templates/components/identity/login/profile/profileEditor.html';
import '/imports/ui/templates/components/identity/avatar/avatar.js';
import '/imports/ui/templates/widgets/warning/warning.js';
import '/imports/ui/templates/widgets/suggest/suggest.js';


Template.profileEditor.onCreated(function () {
  Template.instance().imageTemplate = new ReactiveVar();
  templetize(Template.instance());
});

Template.profileEditor.rendered = function rendered() {
  Session.set('showNations', false);
  Session.set('noUsernameFound', false);
};

Template.profileEditor.helpers({
  firstName() {
    return Meteor.user().profile.firstName;
  },
  lastName() {
    return Meteor.user().profile.lastName;
  },
  userName() {
    return Meteor.user().username;
  },
  country() {
    if (Session.get('newCountry') !== undefined) {
      return Session.get('newCountry').name;
    }
    if (Meteor.user().profile.country !== undefined) {
      return Meteor.user().profile.country.name;
    }
    return undefined;
  },
  showNations() {
    return Session.get('showNations');
  },
  noUsernameFound() {
    return Session.get('noUsernameFound');
  },
  usernameAlreadyExists() {
    return (Session.get('queryUsernameStatus') === 'DUPLICATE');
  },
  getImage(pic) {
    return getImage(Template.instance().imageTemplate.get(), pic);
  },
});

Template.profileEditor.events({
  'focus .country-search'() {
    Session.set('showNations', true);
  },
  'focus .login-input-split-right'() {
    Session.set('showNations', false);
  },
  'input .country-search'(event) {
    if (event.target.value !== '') {
      Session.set('filteredCountries', searchJSON(geo.country, event.target.value));
    } else {
      Session.set('filteredCountries', geo.country);
    }
  },
  'blur #editUserName'() {
    const validation = validateUsername(document.getElementById('editUserName').value);
    if (!validation.valid) {
      Session.set('noUsernameFound', true);
      Session.set('queryUsernameStatus', '');
    } else {
      Session.set('noUsernameFound', false);
    }
  },
  'click #skip-step'() {
    const data = Meteor.user().profile;
    Session.set('newCountry', undefined);
    data.configured = true;
    Meteor.users.update(Meteor.userId(), { $set: { profile: data } });
    Session.set('cardNavigation', false);
  },
  'click #save-profile'() {
    const validation = validateUsername(document.getElementById('editUserName').value);
    if (!validation.valid || document.getElementById('editUserName').value === '') {
      Session.set('noUsernameFound', true);
      Session.set('queryUsernameStatus', '');
    } else if (Session.get('queryUsernameStatus') === 'SINGULAR') {
      Session.set('noUsernameFound', false);

      // Save
      const data = Meteor.user().profile;
      const editUsername = document.getElementById('editUserName').value;
      data.firstName = document.getElementById('editFirstName').value;
      data.lastName = document.getElementById('editLastName').value;

      if (Session.get('newCountry') !== undefined) {
        data.country = Session.get('newCountry');
      }
      data.configured = true;
      Meteor.users.update(Meteor.userId(), { $set: { profile: data } });
      Meteor.users.update(Meteor.userId(), { $set: { username: editUsername } });
    }
  },
});
