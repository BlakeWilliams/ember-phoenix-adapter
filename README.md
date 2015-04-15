# Ember-phoenix-adapter

An Ember CLI adapter for using [Phoenix] channels with Ember-Data.

[Phoenix]: http://www.phoenixframework.org/

## Installation

`$ ember install ember-phoenix-adapater`

## Usage

The adapter expects `config/environment.js` to define `SocketURI` for phoenix.js
to connect to.

Adapters are configurable, you can define the joinParams which are sent when
attempting to join a channel as well as the events to listen to for adding,
updating, and removing records.

Here's an example adapter:

```javascript
import PhoenixAdapter from "ember-phoenix-adapter";

export default PhoenixAdapter.extend({
  addEvents: ["add", "create"],

  joinParams: function() {
    return { authToken: token };
  }.property("token"),
});
```

### Joining Channels

Each model using the adapter has to join a Phoenix channel of the same name, but
pluralized.

ex: If you have a "post" model the adapter will attempt to join the `posts`
channel.

You can specify the parameters sent when joining a channel by defining a
`joinParams` property.

### Listening to broadcasts

You can specify what events that the adapter listens to for updating, adding,
and removing records via `addEvents`, `updateEvents`, and `removeEvents`.

* `addEvents` defaults to `["add"]`
* `updateEvents` defaults to `["update"]`
* `removeEvents` defaults to `["remove"]`
