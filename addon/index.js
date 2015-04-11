import Ember from "ember";
import DS from "ember-data";

export default DS.Adapter.extend({
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
        this._joinChannel(type, action, message);
      }
    });

    return promise;
  },

  _joinChannel(type, action, message) {
    this.phoenix.join(`${type}:${action}`, {}).
      receive("ignore", () => {
        const error = `Could not connect to the ${channel} channel`;
        Ember.logger.warn(error);
        reject(error);
      }).
      receive("ok", (channel) => {
        this.joinedChannels[type] = channel;
        this._resolvePush(channel.push(action, message), resolve, reject);
      });
  },

  _resolvePush: function(channel, resolve, reject) {
    channel.
      receive("error", reasons => reject(reasons)).
      receive("ok", (response) => {
        resolve(response.posts);
      });
  }
});
