/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Wall = (function() {
    var self = {};
    var tagArray = [];

    self.init = function() {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        Sail.modules
            .load('Strophe.AutoConnector', {anonymous: true})
            .load('AuthStatusWidget')
            .thenRun(function () {
                Sail.autobindEvents(Washago.Wall);
                jQuery(Sail.app).trigger('initialized');

                // TODO: add click bindings here

                return true;
            });
    };

    self.authenticate = function () {
        jQuery(self).trigger('authenticated');
    };

    self.events = {
        initialized: function(ev) {
            Washago.Wall.authenticate();
        },
    
        connected: function(ev) {
            console.log("Connected...");
            
            Sail.app.groupchat.addParticipantJoinedHandler(function(who, stanza) {
                console.log(who + " joined...");
            });
        },

        sail: {
            new_contribution: function(sev) {
                contribution = {
                    author:sev.payload.author,
                    text:sev.payload.text,
                    tags:sev.payload.tags,
                    about:sev.payload.about,
                    disourceType:sev.payload.discourse_type,
                    timestamp:sev.timestamp,
                    id:sev.payload.id
                }
                self.createBalloon(contribution)
                self.updateTagList(contribution)
                self.writeToDB(contribution)
            }
        }
    };

    self.createBalloon = function(contribution) {
        // this function creates the balloon, adds the text, positions it on the board

        var balloon = $("<div class='balloon contribution'></div>");

        balloon.attr('id', "contibution-" + contribution.id);
        balloon.addClass('author-' + contribution.author);
        $(contribution.tags).each(function() {
            balloon.addClass(this);
        })

        balloon.hide() // initially hidden, we call show() with an effect later

        // whole mess of stuff goes here (formatting, adding contribution.text, positioning, dragging, etc.)

        $("#board").append(balloon);
        balloon.show('puff', 'fast');

        return balloon;
    };

    self.updateTagList = function(contribution) {
        // this function handles the UI stuff for the list of tags on the sidebar
        // then updates the list of user created tags with newly submitted tags

        none_yet = $('#tags .none-yet');
        if (none_yet.length > 0) {
            none_yet.remove();
        }
        
        list = $('#tags ul');
        _.each(contribution.tags, function (tag) {
            //klass = CommonBoard.keywordToClassName(tag);
            li = list.find('.' + tag);                          // what's going on here?
            if (li.length == 0) {
                li = $('<li></li>');
                li.text(tag);
                li.addClass("tag-" + tag);
                li.click(function() {
                    // TODO set this up for filtering
                    //self.toggleTag(tag);
                })
                list.append(li);
            }
        });


        // _.difference(array, *others) 
        // _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
        // => [1, 3, 4]
        // update the saved list of tags
        cumulativeTagArray = _.difference(contribution.tags, cumulativetagArray);


    }

    return self;
})();