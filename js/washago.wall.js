/*jshint browser: true, devel: true */
/*globals Sail, Strophe, jQuery, _, MD5 */
var Washago = window.Washago || {};

Washago.Wall = (function() {
    var self = {};

    self.name = "Washago.Wall";

    self.cumulativeTagArray = [];

    // Brings a .ui-draggable element to the front (via z-index).
    // This is meant to be used as a callback for jQuery event bindings,
    // so `this` is assumed to refer to the element you want to bring
    // to the front.
    var bringDraggableToFront = function () {
        var zs = jQuery('.ui-draggable').map(function() {
            var z = jQuery(this).css('z-index'); 
            return z == 'auto' ? 100 : parseInt(z, 10);
        }).toArray();
        var maxZ = Math.max.apply(Math, zs);
        jQuery(this).css('z-index', maxZ + 1);
    }

    var positionBalloon = function (balloon) {
        var left, top;
        
        var contrib = balloon.data('contribution');

        var boardWidth = jQuery("#wall").width();
        var boardHeight = jQuery("#wall").height();
        
        if (contrib.pos && contrib.pos.left)
            left = contrib.pos.left;
        else
            left = Math.random() * (boardWidth - balloon.width());
        
        if (contrib.pos && contrib.pos.top)
            top = contrib.pos.top;
        else
            top = Math.random() * (boardHeight - balloon.height());
        
        balloon.css('left', left + 'px');
        balloon.css('top', top + 'px');
        
        if (contrib.id) {
            //CommonBoard.contribBalloonPositioned(contrib, {left: left, top: top});
        }
    };

    var createBalloon = function (contribution) {
        // this function creates the balloon, adds the text, positions it on the board

        var balloon = jQuery("<div class='balloon contribution'></div>");

        balloon.append("<div class='balloon-shadow'></div>");

        balloon.data('contribution', contribution);
        balloon.attr('id', "contibution-" + contribution.id);
        balloon.addClass('author-' + contribution.author);
/*        jQuery(contribution.tags).each(function() {
            balloon.addClass(this);
        });*/

        balloon.hide(); // initially hidden, we call show() with an effect later

        var about = jQuery("<div class='about author'>");
        about.text(contribution.about + ' - ' + contribution.author);
        balloon.prepend(about);

        var text = jQuery("<div class='text'></div>");
        text.text(contribution.text);
        balloon.append(text);

        tags = jQuery("<div class='tags'></div>");
        if (contribution.tags) {
            tags.text(contribution.tags.join(", "));
            balloon.append(tags);
        }

        balloon.draggable();

        // bring the balloon to the top when clicked
        balloon.mousedown(bringDraggableToFront);

        positionBalloon(balloon);

        jQuery("#wall").append(balloon);
        balloon.show('puff', 'fast');

        return balloon;
    };

    var addTagToList = function(contribution) {
        var none_yet = jQuery('#tags-filter .none-yet');
        if (none_yet.length > 0) {
            none_yet.remove();
        }
        
        var list = jQuery('#tags-filter ul');
        _.each(contribution.tags, function (tag) {
            var li = list.find('.tag-' + MD5.hexdigest(tag));
            if (li.length === 0) {
                li = jQuery('<li />');
                li.text(tag);
                li.addClass("tag-" + MD5.hexdigest(tag));
                li.click(function() {
                    // TODO set this up for filtering
                    //self.toggleTag(tag);
                });
                list.append(li);
            }
        });
        //return cumulativeTagArray;
    };

    var addAboutToList = function(contribution) {
        var none_yet = jQuery('#about-filter .none-yet');
        if (none_yet.length > 0) {
            none_yet.remove();
        }

        var list = jQuery('#about-filter ul');

        var li = list.find('.about-' + MD5.hexdigest(contribution.about));
        var myTemp = 8;
        if (li.length === 0) {
            li = jQuery('<li />');
            li.text(contribution.about);
            li.addClass("about-" + MD5.hexdigest(contribution.about));
            li.click(function() {
                // TODO set this up for filtering
                //self.toggleTag(tag);
            });
            list.append(li);
        }
    };

    var writeToDB = function (contribution, tagList) {
        // we might not need to pass tagList
        console.log("I'm writing to a non-existent DB!");
        // write contribution
        // write new tag list
    };

    var addParticipantToList = function (jid) {
        console.log(jid + " joined...");

        var nickname = Strophe.getResourceFromJid(jid);

        var li = jQuery("<li />");
        li.text(nickname);
        li.addClass("participant-"+MD5.hexdigest(nickname));

        jQuery("#participants-filter .none-yet").remove('.none-yet');
        jQuery("#participants-filter ul").append(li);
    };

    var removeParticipantFromList = function (jid) {
        console.log(jid + " left...");

        var nickname = Strophe.getResourceFromJid(jid);

        jQuery("#participants-filter .participant-"+MD5.hexdigest(nickname))
            .hide('fade', 'fast', function () {jQuery(this).remove();});
    };

    self.init = function() {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        // TODO: move this out to config.json
        Sail.app.username = "roadshow";
        Sail.app.password = "roadshow";

        Sail.modules
            .load('Strophe.AutoConnector', {mode: 'pseudo-anon'})
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
        initialized: function (ev) {
            Washago.Wall.authenticate();
        },
    
        connected: function (ev) {
            console.log("Connected...");
            
            for (var p in Sail.app.groupchat.participants) {
                addParticipantToList(p);
            }

            Sail.app.groupchat.addParticipantJoinedHandler(addParticipantToList);
            Sail.app.groupchat.addParticipantLeftHandler(removeParticipantFromList);
        },

        'ui.initialized': function (ev) {
            jQuery('.toolbar')
                //.draggable({handle: '.titlebar'})
                .mousedown(bringDraggableToFront);
        },

        sail: {
            contribution: function (sev) {
                var new_contribution = {
                    author:sev.payload.author,
                    text:sev.payload.text,
                    tags:sev.payload.tags,
                    about:sev.payload.about,
                    disourceType:sev.payload.discourse_type,
                    timestamp:sev.timestamp,
                    id:sev.payload.id
                };
                createBalloon(new_contribution);
                addTagToList(new_contribution);
                addAboutToList(new_contribution);                
                //writeToDB(new_contribution, culumativeTagArray);
            }
        }
    };

    return self;
})();