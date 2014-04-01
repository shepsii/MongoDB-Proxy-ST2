MongoDB-Proxy-ST2
=================

A mongo db proxy for Sencha Touch 2.

You'd want to use this if you're running a version of Sencha Touch as a node.js server.

Here's some links that you might want to use if you're looking into heading down that route:
http://www.sencha.com/conference/session/server-side-js-using-node.js-with-sencha-technologies
http://moduscreate.com/leverage-the-sencha-touch-class-system-and-more-in-your-node-js-app/

NB: this proxy uses my Bancha class system (Ban). Just put it in app/ban/data/proxy and make sure you do something like this before starting your server/app:

Ext.Loader.setPath({
    'Ban': 'app/ban'
});
