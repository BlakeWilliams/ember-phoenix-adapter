import Ember from "ember";
import DS from "ember-data";

export default DS.Adapter.extend({
  defaultSerializer: "ams",

  addEvents: ["add"],
  updateEvents: ["update"],
  removeEvents: ["remove"],

  joinParams: {},

  init: function() {
    this.joinedChannels = {};
  },

  find: function(store, type) {
    return this._send(type.typeKey, "show", {});
  },

  findAll: function(store, type) {
    return this._send(type.typeKey, "all", {});
  },

  findQuery: function(store, type, query) {
    return this._send(type.typeKey, "show", query);
  },

  createRecord: function(store, type, snapshot) {
    const data = {};
    const serializer = store.serializerFor(type.typeKey);

    serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

    return this._send(type.typeKey, "create", data);
  },

  updateRecord: function(store, type, snapshot) {
    const data = {};
    const serializer = store.serializerFor(type.typeKey);

    serializer.serializeIntoHash(data, type, snapshot);

    return this._send(type.typeKey, "update", data);
  },

  deleteRecord: function(store, type, snapshot) {
    const id = snapshot.id;

    return this._send(type.typeKey, "delete", { id: id });
  },

  _send: function(type, action, message) {
    const promise = new Ember.RSVP.Promise((resolve, reject) => {
      const channel = this.joinedChannels[channel];
      if (channel) {
        this._resolvePush(channel.push(action, message), resolve, reject);
      } else {
        this._joinChannel(type, action, message, resolve, reject);
      }
    });

    return promise;
  },

  _joinChannel(type, action, message, resolve, reject) {
    const joinParams = this.get("joinParams");

    this.phoenix.join(`${type}:${action}`, joinParams).
      receive("ignore", () => {
        const error = `Could not connect to the ${type} channel`;
        Ember.logger.warn(error);
        reject(error);
      }).
      receive("ok", (channel) => {
        this._listenToEvents(channel, type);
        this.joinedChannels[type] = channel;
        this._resolvePush(channel.push(action, message), resolve, reject);
      });
  },

  _listenToEvents: function(channel, type) {
    const pushEvents = this.addEvents.concat(this.updateEvents);

    pushEvents.forEach((event) => {
      channel.on(event, (response) => {
        this.store.pushPayload(response);
      });
    });

    this.removeEvents.forEach((event) => {
      channel.on(event, (response) => {
        this.store.find(type, response.id).then((model) => {
          this.store.unloadRecord(model);
        });
      });
    });
  },

  _resolvePush: function(channel, resolve, reject) {
    channel.
      receive("error", reasons => reject(reasons)).
      receive("ok", (response) => {
        resolve(response);
      });
  }
});
